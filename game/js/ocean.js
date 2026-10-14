import * as THREE from 'three';

// Gerstner 파도. [방향 x, 방향 z, 가파름, 파장]
// 셰이더(GPU)와 heightAt(CPU)이 같은 값을 써야 고래와 유리병이 물결을 탄다.
export const WAVES = [
	[ 1.0, 0.35, 0.15, 128 ],
	[ 0.55, 1.0, 0.13, 78 ],
	[ - 0.45, 0.9, 0.11, 47 ],
	[ 0.9, - 0.55, 0.09, 31 ],
	[ - 0.8, - 0.25, 0.07, 21 ]
];

const TIME_SCALE = 0.8;

export const WAVES_GLSL = /* glsl */`
	uniform float uTime;
	uniform float uWaveScale;
	uniform vec4 uWaves[ 5 ];
	uniform vec2 uWaveCenter;

	vec3 gerstner( vec2 p, out vec3 tangent, out vec3 binormal ) {
		vec3 disp = vec3( 0.0 );
		tangent = vec3( 1.0, 0.0, 0.0 );
		binormal = vec3( 0.0, 0.0, 1.0 );
		float dist = distance( p, uWaveCenter );
		for ( int i = 0; i < 5; i ++ ) {
			vec4 w = uWaves[ i ];
			float fadeEnd = 240.0 + w.w * 3.0;
			float fade = 1.0 - smoothstep( fadeEnd * 0.6, fadeEnd, dist );
			float steep = w.z * uWaveScale * fade;
			float k = 6.2831853 / w.w;
			float c = sqrt( 9.8 / k ) * ${ TIME_SCALE.toFixed( 2 ) };
			vec2 d = normalize( w.xy );
			float f = k * ( dot( d, p ) - c * uTime );
			float a = steep / k;
			float s = sin( f );
			float co = cos( f );
			disp += vec3( d.x * a * co, a * s, d.y * a * co );
			tangent += vec3( - d.x * d.x * steep * s, d.x * steep * co, - d.x * d.y * steep * s );
			binormal += vec3( - d.x * d.y * steep * s, d.y * steep * co, - d.y * d.y * steep * s );
		}
		return disp;
	}
`;

const _waveDirs = WAVES.map( ( w ) => {

	const l = Math.hypot( w[ 0 ], w[ 1 ] );
	return [ w[ 0 ] / l, w[ 1 ] / l ];

} );

// 공유 uniform: 바다와 수면 데칼이 같은 객체를 참조한다
export const waveUniforms = {
	uTime: { value: 0 },
	uWaveScale: { value: 0.65 },
	uWaves: { value: WAVES.map( ( w ) => new THREE.Vector4( w[ 0 ], w[ 1 ], w[ 2 ], w[ 3 ] ) ) },
	uWaveCenter: { value: new THREE.Vector2() }
};

function displacement( x, z, out ) {

	const t = waveUniforms.uTime.value;
	const scale = waveUniforms.uWaveScale.value;
	const c = waveUniforms.uWaveCenter.value;
	const dist = Math.hypot( x - c.x, z - c.y );
	let dx = 0, dy = 0, dz = 0;
	let tx = 1, ty = 0, tz = 0, bx = 0, by = 0, bz = 1;

	for ( let i = 0; i < WAVES.length; i ++ ) {

		const w = WAVES[ i ];
		const fadeEnd = 240 + w[ 3 ] * 3;
		const fade = 1 - THREE.MathUtils.smoothstep( dist, fadeEnd * 0.6, fadeEnd );
		const steep = w[ 2 ] * scale * fade;
		const k = 6.2831853 / w[ 3 ];
		const cc = Math.sqrt( 9.8 / k ) * TIME_SCALE;
		const d = _waveDirs[ i ];
		const f = k * ( d[ 0 ] * x + d[ 1 ] * z - cc * t );
		const a = steep / k;
		const s = Math.sin( f ), co = Math.cos( f );
		dx += d[ 0 ] * a * co; dy += a * s; dz += d[ 1 ] * a * co;
		tx += - d[ 0 ] * d[ 0 ] * steep * s; ty += d[ 0 ] * steep * co; tz += - d[ 0 ] * d[ 1 ] * steep * s;
		bx += - d[ 0 ] * d[ 1 ] * steep * s; by += d[ 1 ] * steep * co; bz += - d[ 1 ] * d[ 1 ] * steep * s;

	}

	out.dx = dx; out.dy = dy; out.dz = dz;
	// normal = cross(binormal, tangent)
	out.nx = by * tz - bz * ty;
	out.ny = bz * tx - bx * tz;
	out.nz = bx * ty - by * tx;
	return out;

}

const _s = {};

// 수평 변위를 역으로 따라가서 (x, z) 바로 위의 수면 높이와 법선을 구한다
export function sampleOcean( x, z, outNormal ) {

	let px = x, pz = z;
	for ( let i = 0; i < 3; i ++ ) {

		displacement( px, pz, _s );
		px = x - _s.dx;
		pz = z - _s.dz;

	}

	displacement( px, pz, _s );
	if ( outNormal ) outNormal.set( _s.nx, _s.ny, _s.nz ).normalize();
	return _s.dy;

}

function buildGeometry( gridStep ) {

	// 가운데는 촘촘하게, 멀어질수록 간격이 커지는 격자
	const coords = [ 0 ];
	let x = 0, step = gridStep;
	const growth = gridStep > 3 ? 1.1 : 1.06;
	while ( x < 3200 ) {

		if ( x >= 240 ) step *= growth;
		x += step;
		coords.push( x );

	}

	const axis = [ ...coords.slice( 1 ).reverse().map( ( v ) => - v ), ...coords ];
	const n = axis.length;
	const positions = new Float32Array( n * n * 3 );
	let p = 0;
	for ( let j = 0; j < n; j ++ ) {

		for ( let i = 0; i < n; i ++ ) {

			positions[ p ++ ] = axis[ i ];
			positions[ p ++ ] = 0;
			positions[ p ++ ] = axis[ j ];

		}

	}

	const indices = new Uint32Array( ( n - 1 ) * ( n - 1 ) * 6 );
	let q = 0;
	for ( let j = 0; j < n - 1; j ++ ) {

		for ( let i = 0; i < n - 1; i ++ ) {

			const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
			indices[ q ++ ] = a; indices[ q ++ ] = c; indices[ q ++ ] = b;
			indices[ q ++ ] = b; indices[ q ++ ] = c; indices[ q ++ ] = d;

		}

	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geo.setIndex( new THREE.BufferAttribute( indices, 1 ) );
	geo.boundingSphere = new THREE.Sphere( new THREE.Vector3(), 1e5 );
	return geo;

}

export class Ocean {

	constructor( { envMap, normalMap, fog, moonDir, gridStep = 2.5 } ) {

		this.gridStep = gridStep;

		normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

		this.uniforms = {
			...waveUniforms,
			uEnv: { value: envMap },
			uNormalMap: { value: normalMap },
			uMoonDir: { value: moonDir.clone().normalize() },
			uMoonColor: { value: new THREE.Color( 0xdcecff ).convertSRGBToLinear() },
			// 약하게 흩어진 윤슬의 색. 평소엔 uMoonColor와 같고, 엔딩 6개 보상에선 금빛 → 하늘색으로 번진다
			uMoonEdge: { value: new THREE.Color( 0xdcecff ).convertSRGBToLinear() },
			uDeep: { value: new THREE.Color( 0x041a4a ).convertSRGBToLinear() },
			uShallow: { value: new THREE.Color( 0x1170c4 ).convertSRGBToLinear() },
			uFoam: { value: new THREE.Color( 0xbff0ff ).convertSRGBToLinear() },
			uGlow: { value: 0.0 },
			uFogColor: { value: fog.color },
			uFogDensity: { value: fog.density }
		};

		const material = new THREE.ShaderMaterial( {
			uniforms: this.uniforms,
			transparent: true,
			depthWrite: true,
			vertexShader: /* glsl */`
				${ WAVES_GLSL }
				varying vec3 vWorld;
				varying vec2 vXZ;
				void main() {
					vec4 world = modelMatrix * vec4( position, 1.0 );
					vec3 t, b;
					vec3 disp = gerstner( world.xz, t, b );
					vXZ = world.xz;
					world.xyz += disp;
					vWorld = world.xyz;
					gl_Position = projectionMatrix * viewMatrix * world;
				}
			`,
			fragmentShader: /* glsl */`
				${ WAVES_GLSL }
				uniform samplerCube uEnv;
				uniform sampler2D uNormalMap;
				uniform vec3 uMoonDir;
				uniform vec3 uMoonColor;
				uniform vec3 uMoonEdge;
				uniform vec3 uDeep;
				uniform vec3 uShallow;
				uniform vec3 uFoam;
				uniform float uGlow;
				uniform vec3 uFogColor;
				uniform float uFogDensity;
				varying vec3 vWorld;
				varying vec2 vXZ;

				void main() {
					vec3 T, B;
					gerstner( vXZ, T, B );
					vec3 N = normalize( cross( B, T ) );
					float dist = length( cameraPosition - vWorld );

					vec2 uv1 = vWorld.xz * 0.031 + vec2( uTime * 0.021, uTime * 0.013 );
					vec2 uv2 = vWorld.xz * 0.0093 - vec2( uTime * 0.008, - uTime * 0.014 );
					vec3 n1 = texture2D( uNormalMap, uv1 ).rgb * 2.0 - 1.0;
					vec3 n2 = texture2D( uNormalMap, uv2 ).rgb * 2.0 - 1.0;
					vec2 dn = n1.xy + n2.xy;
					float detail = mix( 0.34, 0.06, smoothstep( 40.0, 900.0, dist ) );
					N = normalize( N + vec3( dn.x, 0.0, dn.y ) * detail );

					vec3 V = normalize( cameraPosition - vWorld );
					float NdV = max( dot( N, V ), 0.0 );
					float fres = 0.02 + 0.98 * pow( 1.0 - NdV, 5.0 );
					vec3 R = reflect( - V, N );
					R.y = abs( R.y );
					vec3 refl = textureCube( uEnv, R ).rgb;

					float crest = clamp( vWorld.y * 0.22 + 0.35, 0.0, 1.0 );
					vec3 water = mix( uDeep, uShallow, crest * 0.55 );
					// 파도 뒤로 비치는 달빛 (subsurface 느낌)
					float sss = pow( max( dot( V, - uMoonDir ) * 0.5 + 0.5, 0.0 ), 3.0 ) * crest;
					water += uShallow * sss * 0.6;

					vec3 col = mix( water, refl, fres );

					float spec = pow( max( dot( R, uMoonDir ), 0.0 ), 420.0 );
					vec3 glint = mix( uMoonEdge, uMoonColor, smoothstep( 0.008, 0.1, spec ) ); // 아주 희미한 반짝임만 가장자리 색
					col += glint * spec * 5.0;

					// 파도 마루의 포말: 수면이 압축되는 곳(Jacobian < 1)
					float J = T.x * B.z - T.z * B.x;
					float foamNoise = texture2D( uNormalMap, vWorld.xz * 0.06 + uTime * 0.01 ).b;
					float foam = smoothstep( 0.78, 0.42, J ) * smoothstep( 0.35, 0.75, foamNoise );
					foam *= 1.0 - smoothstep( 300.0, 700.0, dist );
					col = mix( col, uFoam * ( 0.9 + uGlow ), foam * 0.85 );

					float alpha = mix( 0.7, 1.0, fres );
					alpha = max( alpha, foam );

					float fogF = 1.0 - exp( - uFogDensity * uFogDensity * dist * dist );
					col = mix( col, uFogColor, fogF );
					alpha = mix( alpha, 1.0, fogF );

					gl_FragColor = vec4( col, alpha );
				}
			`
		} );

		this.mesh = new THREE.Mesh( buildGeometry( gridStep ), material );
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = 1;

	}

	update( time, center ) {

		waveUniforms.uTime.value = time;
		waveUniforms.uWaveCenter.value.set( center.x, center.z );
		const g = this.gridStep;
		this.mesh.position.x = Math.round( center.x / g ) * g;
		this.mesh.position.z = Math.round( center.z / g ) * g;

	}

	set intensity( v ) {

		waveUniforms.uWaveScale.value = v;

	}

	get intensity() {

		return waveUniforms.uWaveScale.value;

	}

}

// 수면을 따라 휘는 고리/원 표시 (노래 파동, 경고 원, 감시 범위 등)
const decalGeometry = new THREE.RingGeometry( 0.0, 1.0, 72, 10 );

export function makeSurfaceDecal( { color = 0x7fe9ff, inner = 0.82, outer = 1.0, opacity = 1, lift = 0.35, fill = 0 } = {} ) {

	const material = new THREE.ShaderMaterial( {
		uniforms: {
			...waveUniforms,
			uColor: { value: new THREE.Color( color ) },
			uInner: { value: inner },
			uOuter: { value: outer },
			uOpacity: { value: opacity },
			uFill: { value: fill },
			uLift: { value: lift }
		},
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexShader: /* glsl */`
			${ WAVES_GLSL }
			uniform float uLift;
			varying float vR;
			void main() {
				vR = length( position.xy );
				vec4 world = modelMatrix * vec4( position, 1.0 );
				vec3 t, b;
				vec3 disp = gerstner( world.xz, t, b );
				world.xyz = vec3( world.x + disp.x, disp.y + uLift, world.z + disp.z );
				gl_Position = projectionMatrix * viewMatrix * world;
			}
		`,
		fragmentShader: /* glsl */`
			uniform vec3 uColor;
			uniform float uInner;
			uniform float uOuter;
			uniform float uOpacity;
			uniform float uFill;
			varying float vR;
			void main() {
				float w = ( uOuter - uInner ) * 0.5;
				float mid = ( uOuter + uInner ) * 0.5;
				float ring = 1.0 - smoothstep( w * 0.4, w, abs( vR - mid ) );
				float a = max( ring, uFill * step( vR, uOuter ) * 0.35 );
				gl_FragColor = vec4( uColor * a * uOpacity, 1.0 );
			}
		`
	} );

	const mesh = new THREE.Mesh( decalGeometry, material );
	mesh.rotation.x = - Math.PI / 2;
	mesh.renderOrder = 3;
	mesh.frustumCulled = false;
	return mesh;

}
