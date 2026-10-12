import * as THREE from 'three';

// 하늘 오브젝트는 레이어 1에도 올려서 CubeCamera(반사용)가 하늘만 찍게 한다
const SKY_LAYER = 1;

function onSkyLayer( obj ) {

	obj.traverse( ( o ) => o.layers.enable( SKY_LAYER ) );
	return obj;

}

export class Sky {

	constructor( { moonDir } ) {

		this.group = new THREE.Group();
		this.moonDir = moonDir.clone().normalize();
		this.time = 0;
		this.shooting = [];
		this.shootTimer = 2;
		this.meteorShower = 0; // 0..1, 별이 떨어지는 날

		this.uniforms = {
			uTime: { value: 0 },
			uZenith: { value: new THREE.Color( 0x030a1e ).convertSRGBToLinear() },
			uHorizon: { value: new THREE.Color( 0x16408f ).convertSRGBToLinear() },
			uGlow: { value: new THREE.Color( 0x3a7dff ).convertSRGBToLinear() }
		};

		this.dome = this.makeDome();
		this.stars = this.makeStars();
		this.moon = this.makeMoon();
		this.planet = this.makePlanet();

		this.group.add( this.dome, this.stars, this.moon, this.planet );
		onSkyLayer( this.group );

		// 별똥별: 머리(원점)에서 꼬리(+y)로 가늘어지는 원뿔
		this.streakGeo = new THREE.ConeGeometry( 1, 1, 8, 1, true );
		this.streakGeo.translate( 0, 0.5, 0 );
		this.streakMat = new THREE.MeshBasicMaterial( { color: new THREE.Color( 2.4, 2.8, 3.4 ), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false } );

		this.cubeTarget = new THREE.WebGLCubeRenderTarget( 256, { type: THREE.HalfFloatType } );
		this.cubeCamera = new THREE.CubeCamera( 1, 4000, this.cubeTarget );
		this.cubeCamera.traverse( ( c ) => c.layers.set( SKY_LAYER ) );

	}

	makeDome() {

		const mat = new THREE.ShaderMaterial( {
			uniforms: this.uniforms,
			side: THREE.BackSide,
			depthWrite: false,
			vertexShader: /* glsl */`
				varying vec3 vDir;
				void main() {
					vDir = normalize( position );
					vec4 p = modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * p;
				}
			`,
			fragmentShader: /* glsl */`
				uniform vec3 uZenith;
				uniform vec3 uHorizon;
				uniform vec3 uGlow;
				varying vec3 vDir;
				float hash( vec3 p ) {
					p = fract( p * 0.3183099 + 0.1 );
					p *= 17.0;
					return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
				}
				float noise( vec3 x ) {
					vec3 i = floor( x );
					vec3 f = fract( x );
					f = f * f * ( 3.0 - 2.0 * f );
					return mix( mix( mix( hash( i ), hash( i + vec3( 1, 0, 0 ) ), f.x ),
						mix( hash( i + vec3( 0, 1, 0 ) ), hash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
						mix( mix( hash( i + vec3( 0, 0, 1 ) ), hash( i + vec3( 1, 0, 1 ) ), f.x ),
						mix( hash( i + vec3( 0, 1, 1 ) ), hash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
				}
				float fbm( vec3 p ) {
					float v = 0.0, a = 0.5;
					for ( int i = 0; i < 5; i ++ ) { v += a * noise( p ); p *= 2.03; a *= 0.5; }
					return v;
				}
				void main() {
					vec3 d = normalize( vDir );
					float h = d.y;
					vec3 col = mix( uHorizon, uZenith, pow( clamp( h, 0.0, 1.0 ), 0.42 ) );
					if ( h < 0.0 ) col = mix( uHorizon, uHorizon * 0.25, clamp( - h * 5.0, 0.0, 1.0 ) );
					// 은하수
					vec3 bandN = normalize( vec3( 0.35, 0.55, 0.75 ) );
					float band = exp( - pow( dot( d, bandN ) * 4.2, 2.0 ) );
					float n = fbm( d * 5.0 );
					float dust = fbm( d * 14.0 + 3.0 );
					col += vec3( 0.06, 0.1, 0.26 ) * band * smoothstep( 0.25, 0.85, n ) * 1.6;
					col += vec3( 0.16, 0.08, 0.28 ) * band * smoothstep( 0.55, 0.9, dust ) * 0.5;
					col *= 1.0 - band * smoothstep( 0.55, 0.75, fbm( d * 9.0 + 7.0 ) ) * 0.4;
					col += uGlow * exp( - abs( h ) * 9.0 ) * 0.45;
					gl_FragColor = vec4( col, 1.0 );
				}
			`
		} );
		const dome = new THREE.Mesh( new THREE.SphereGeometry( 1800, 48, 24 ), mat );
		dome.frustumCulled = false;
		dome.renderOrder = - 10;
		return dome;

	}

	makeStars() {

		const count = 4200;
		const pos = new Float32Array( count * 3 );
		const size = new Float32Array( count );
		const phase = new Float32Array( count );
		const color = new Float32Array( count * 3 );
		const tints = [ [ 0.8, 0.9, 1.0 ], [ 0.6, 0.8, 1.0 ], [ 1.0, 0.95, 0.85 ], [ 0.75, 1.0, 1.0 ], [ 1.0, 0.75, 0.9 ] ];
		const v = new THREE.Vector3();
		for ( let i = 0; i < count; i ++ ) {

			do {

				v.set( Math.random() * 2 - 1, Math.random() * 1.05 - 0.05, Math.random() * 2 - 1 );

			} while ( v.lengthSq() > 1 || v.lengthSq() < 0.01 );

			v.normalize().multiplyScalar( 1600 );
			pos.set( [ v.x, v.y, v.z ], i * 3 );
			const r = Math.random();
			size[ i ] = r > 0.985 ? 4.5 + Math.random() * 3 : r > 0.9 ? 2.6 + Math.random() * 1.4 : 1.2 + Math.random() * 1.2;
			phase[ i ] = Math.random() * 100;
			const t = tints[ Math.floor( Math.random() * tints.length ) ];
			color.set( t, i * 3 );

		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
		geo.setAttribute( 'size', new THREE.BufferAttribute( size, 1 ) );
		geo.setAttribute( 'phase', new THREE.BufferAttribute( phase, 1 ) );
		geo.setAttribute( 'color', new THREE.BufferAttribute( color, 3 ) );

		const mat = new THREE.ShaderMaterial( {
			uniforms: { uTime: this.uniforms.uTime, uPixelRatio: { value: Math.min( window.devicePixelRatio, 1.5 ) } },
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			vertexShader: /* glsl */`
				attribute float size;
				attribute float phase;
				attribute vec3 color;
				uniform float uTime;
				uniform float uPixelRatio;
				varying vec3 vColor;
				varying float vTw;
				void main() {
					vColor = color;
					vTw = 0.65 + 0.35 * sin( uTime * ( 1.2 + fract( phase ) * 2.5 ) + phase );
					float horizon = smoothstep( -0.02, 0.12, normalize( position ).y );
					vTw *= horizon;
					vec4 mv = modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mv;
					gl_PointSize = size * uPixelRatio * ( 0.8 + 0.4 * vTw );
				}
			`,
			fragmentShader: /* glsl */`
				varying vec3 vColor;
				varying float vTw;
				void main() {
					vec2 c = gl_PointCoord - 0.5;
					float d = length( c );
					float a = smoothstep( 0.5, 0.0, d );
					a = pow( a, 1.6 );
					gl_FragColor = vec4( vColor * a * vTw * 2.2, 1.0 );
				}
			`
		} );

		const pts = new THREE.Points( geo, mat );
		pts.frustumCulled = false;
		pts.renderOrder = - 9;
		return pts;

	}

	makeMoon() {

		const mat = new THREE.ShaderMaterial( {
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			vertexShader: /* glsl */`
				varying vec2 vUv;
				void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
			`,
			fragmentShader: /* glsl */`
				varying vec2 vUv;
				void main() {
					vec2 c = vUv - 0.5;
					float d = length( c ) * 2.0;
					float disc = smoothstep( 0.25, 0.235, d );
					float crater = 0.85 + 0.15 * sin( c.x * 40.0 + 1.3 ) * sin( c.y * 37.0 );
					float halo = exp( - d * 6.0 ) * 0.22 + exp( - d * 14.0 ) * 0.5;
					vec3 col = vec3( 0.82, 0.9, 1.0 ) * disc * crater * 2.4 + vec3( 0.3, 0.55, 1.0 ) * halo;
					gl_FragColor = vec4( col, 1.0 );
				}
			`
		} );
		const moon = new THREE.Mesh( new THREE.PlaneGeometry( 520, 520 ), mat );
		moon.position.copy( this.moonDir ).multiplyScalar( 1500 );
		moon.lookAt( 0, 0, 0 );
		moon.renderOrder = - 8;
		return moon;

	}

	makePlanet() {

		const group = new THREE.Group();
		const light = new THREE.Vector3( 0.75, 0.35, 0.55 ).normalize();

		const planetMat = new THREE.ShaderMaterial( {
			uniforms: { uLight: { value: light } },
			vertexShader: /* glsl */`
				varying vec3 vN;
				varying vec3 vP;
				varying vec3 vW;
				void main() {
					vN = normalize( mat3( modelMatrix ) * normal );
					vP = position;
					vW = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,
			fragmentShader: /* glsl */`
				uniform vec3 uLight;
				varying vec3 vN;
				varying vec3 vP;
				varying vec3 vW;
				void main() {
					float lat = normalize( vP ).y;
					float bands = sin( lat * 22.0 ) * 0.5 + 0.5;
					bands = mix( bands, sin( lat * 57.0 + 1.7 ) * 0.5 + 0.5, 0.35 );
					vec3 a = vec3( 0.05, 0.16, 0.42 );
					vec3 b = vec3( 0.25, 0.55, 0.95 );
					vec3 col = mix( a, b, bands );
					float l = max( dot( vN, normalize( uLight ) ), 0.0 );
					float rim = pow( 1.0 - max( dot( vN, normalize( cameraPosition - vW ) ), 0.0 ), 3.0 );
					col = col * ( 0.08 + 1.3 * l ) + vec3( 0.25, 0.55, 1.0 ) * rim * 0.5 * ( 0.3 + l );
					gl_FragColor = vec4( col, 1.0 );
				}
			`
		} );
		const planet = new THREE.Mesh( new THREE.SphereGeometry( 150, 48, 32 ), planetMat );
		planet.rotation.z = 0.35;

		const ringMat = new THREE.ShaderMaterial( {
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false,
			vertexShader: /* glsl */`
				varying vec3 vP;
				void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
			`,
			fragmentShader: /* glsl */`
				varying vec3 vP;
				void main() {
					float r = length( vP.xy );
					float t = ( r - 200.0 ) / 140.0;
					float bands = 0.55 + 0.45 * sin( t * 60.0 ) * sin( t * 13.0 + 1.0 );
					float edge = smoothstep( 0.0, 0.08, t ) * smoothstep( 1.0, 0.85, t );
					float gap = smoothstep( 0.02, 0.0, abs( t - 0.62 ) - 0.02 );
					float a = edge * bands * ( 1.0 - gap ) * 0.7;
					gl_FragColor = vec4( vec3( 0.55, 0.75, 1.0 ) * 0.8, a );
				}
			`
		} );
		const ring = new THREE.Mesh( new THREE.RingGeometry( 200, 340, 128, 1 ), ringMat );
		ring.rotation.x = Math.PI * 0.5 - 0.32;
		ring.rotation.y = 0.18;

		group.add( planet, ring );
		group.position.set( - 760, 300, - 1260 );
		group.lookAt( 0, 0, 0 );
		group.renderOrder = - 8;
		return group;

	}

	spawnShootingStar( big = false ) {

		const dir = new THREE.Vector3( Math.random() * 2 - 1, 0.18 + Math.random() * 0.6, Math.random() * 2 - 1 ).normalize();
		const start = dir.clone().multiplyScalar( 1250 );
		const vel = new THREE.Vector3( Math.random() * 2 - 1, - 0.5 - Math.random() * 0.6, Math.random() * 2 - 1 ).normalize().multiplyScalar( big ? 480 : 620 );
		const len = big ? 150 : 90;
		const mesh = new THREE.Mesh( this.streakGeo, this.streakMat.clone() );
		mesh.scale.set( big ? 2.2 : 1.3, len, big ? 2.2 : 1.3 );
		mesh.quaternion.setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), vel.clone().normalize().negate() );
		mesh.position.copy( start );
		mesh.frustumCulled = false;
		this.group.add( mesh );
		this.shooting.push( { mesh, pos: start, vel, life: big ? 1.8 : 1.0, age: 0 } );

	}

	update( dt, cameraPos ) {

		this.time += dt;
		this.uniforms.uTime.value = this.time;
		this.group.position.set( cameraPos.x, 0, cameraPos.z );

		this.shootTimer -= dt;
		if ( this.shootTimer <= 0 ) {

			this.spawnShootingStar( this.meteorShower > 0.3 && Math.random() < 0.4 );
			const rate = THREE.MathUtils.lerp( 4.5, 0.22, this.meteorShower );
			this.shootTimer = rate * ( 0.4 + Math.random() );

		}

		for ( let i = this.shooting.length - 1; i >= 0; i -- ) {

			const s = this.shooting[ i ];
			s.age += dt;
			s.pos.addScaledVector( s.vel, dt );
			s.mesh.position.copy( s.pos );
			s.mesh.material.opacity = Math.sin( Math.min( s.age / s.life, 1 ) * Math.PI );
			if ( s.age >= s.life ) {

				this.group.remove( s.mesh );
				s.mesh.material.dispose();
				this.shooting.splice( i, 1 );

			}

		}

	}

	// 반사용 큐브맵을 다시 찍는다 (하늘이 바뀔 때만)
	capture( renderer ) {

		const saved = this.group.position.clone();
		this.group.position.set( 0, 0, 0 );
		this.cubeCamera.position.set( 0, 0, 0 );
		this.cubeCamera.update( renderer, this.group );
		this.group.position.copy( saved );

	}

}
