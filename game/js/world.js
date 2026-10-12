import * as THREE from 'three';
import { sampleOcean, makeSurfaceDecal } from './ocean.js';

// 시드 고정 난수: 섬 배치가 매번 같도록
export function mulberry32( seed ) {

	return function () {

		seed |= 0; seed = seed + 0x6D2B79F5 | 0;
		let t = Math.imul( seed ^ seed >>> 15, 1 | seed );
		t = t + Math.imul( t ^ t >>> 7, 61 | t ) ^ t;
		return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;

	};

}

const _n = new THREE.Vector3();

export class World {

	constructor( { scene, fog, places, avoid = [], models } ) {

		this.scene = scene;
		this.fog = fog;
		this.places = places;
		this.models = models;
		this.avoid = avoid;
		this.colliders = []; // { x, z, r }
		this.effects = [];
		this.time = 0;

		this.makeSeabed();
		this.makeRocks();
		this.lighthouse = this.makeLighthouse( places.lighthouse );

	}

	makeSeabed() {

		const mat = new THREE.ShaderMaterial( {
			uniforms: {
				uTime: { value: 0 },
				uFogColor: { value: this.fog.color },
				uFogDensity: { value: this.fog.density }
			},
			vertexShader: /* glsl */`
				varying vec3 vWorld;
				void main() {
					vec4 w = modelMatrix * vec4( position, 1.0 );
					vWorld = w.xyz;
					gl_Position = projectionMatrix * viewMatrix * w;
				}
			`,
			fragmentShader: /* glsl */`
				uniform float uTime;
				uniform vec3 uFogColor;
				uniform float uFogDensity;
				varying vec3 vWorld;
				vec2 hash2( vec2 p ) {
					p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) );
					return fract( sin( p ) * 43758.5453 );
				}
				float stars( vec2 p, float cell, float t ) {
					vec2 g = floor( p / cell );
					vec2 f = fract( p / cell );
					float v = 0.0;
					for ( int y = -1; y <= 1; y ++ ) for ( int x = -1; x <= 1; x ++ ) {
						vec2 o = vec2( float( x ), float( y ) );
						vec2 h = hash2( g + o );
						vec2 d = o + h - f;
						float tw = 0.6 + 0.4 * sin( t * ( 0.8 + h.x * 2.0 ) + h.y * 30.0 );
						v += exp( - dot( d, d ) * 140.0 ) * step( 0.55, h.x ) * tw;
					}
					return v;
				}
				void main() {
					vec2 p = vWorld.xz;
					vec3 col = vec3( 0.004, 0.012, 0.04 );
					float s1 = stars( p, 7.0, uTime );
					float s2 = stars( p + 31.0, 19.0, uTime * 0.7 );
					col += vec3( 0.35, 0.8, 1.4 ) * s1 * 1.4;
					col += vec3( 0.9, 0.55, 1.4 ) * s2 * 0.9;
					// 일렁이는 빛 무늬 (caustic 비슷하게)
					float c = sin( p.x * 0.09 + uTime * 0.6 + sin( p.y * 0.07 ) * 2.0 ) * sin( p.y * 0.1 - uTime * 0.5 + sin( p.x * 0.05 ) * 2.0 );
					col += vec3( 0.02, 0.09, 0.2 ) * smoothstep( 0.6, 1.0, c );
					float dist = length( cameraPosition - vWorld );
					float fogF = 1.0 - exp( - uFogDensity * uFogDensity * dist * dist * 1.6 );
					gl_FragColor = vec4( mix( col, uFogColor * 0.6, fogF ), 1.0 );
				}
			`
		} );
		const geo = new THREE.PlaneGeometry( 6000, 6000 );
		geo.rotateX( - Math.PI / 2 );
		this.seabed = new THREE.Mesh( geo, mat );
		this.seabed.position.y = - 26;
		this.scene.add( this.seabed );

	}

	makeRockGeometry( rand, radius, height ) {

		const geo = new THREE.IcosahedronGeometry( 1, 1 );
		const pos = geo.attributes.position;
		const v = new THREE.Vector3();
		const jitter = new Map();
		for ( let i = 0; i < pos.count; i ++ ) {

			v.fromBufferAttribute( pos, i );
			const key = `${v.x.toFixed( 3 )},${v.y.toFixed( 3 )},${v.z.toFixed( 3 )}`;
			if ( ! jitter.has( key ) ) jitter.set( key, 0.75 + rand() * 0.5 );
			v.multiplyScalar( jitter.get( key ) );
			pos.setXYZ( i, v.x * radius, v.y * height, v.z * radius );

		}

		geo.computeVertexNormals();
		return geo;

	}

	makeRocks() {

		const rand = mulberry32( 52 );
		const rockMat = new THREE.MeshStandardMaterial( { color: 0x1a2f5c, roughness: 0.92, metalness: 0.05, flatShading: true } );
		const crystalMat = new THREE.MeshStandardMaterial( { color: 0x6fdcff, emissive: 0x3fc8ff, emissiveIntensity: 2.2, roughness: 0.3, flatShading: true } );
		const crystalGeo = new THREE.OctahedronGeometry( 1, 0 );
		const avoid = this.avoid;
		this.rocks = new THREE.Group();

		let placed = 0, tries = 0;
		while ( placed < 46 && tries < 2000 ) {

			tries ++;
			const x = - 520 + rand() * 1400;
			const z = - 760 + rand() * 1800;
			const r = 4 + Math.pow( rand(), 2 ) * 16;
			if ( avoid.some( ( p ) => Math.hypot( p.x - x, p.z - z ) < ( p.r ?? 70 ) + r ) ) continue;
			if ( this.colliders.some( ( c ) => Math.hypot( c.x - x, c.z - z ) < c.r + r + 30 ) ) continue;

			const h = r * ( 0.7 + rand() * 0.9 );
			const rock = new THREE.Mesh( this.makeRockGeometry( rand, r, h ), rockMat );
			rock.position.set( x, - h * 0.25, z );
			rock.rotation.y = rand() * Math.PI * 2;
			this.rocks.add( rock );

			// 땅에 박힌 빛나는 결정
			if ( rand() > 0.35 ) {

				const n = 2 + Math.floor( rand() * 4 );
				for ( let i = 0; i < n; i ++ ) {

					const c = new THREE.Mesh( crystalGeo, crystalMat );
					const a = rand() * Math.PI * 2;
					const s = 0.6 + rand() * r * 0.12;
					c.scale.set( s * 0.6, s * 2.2, s * 0.6 );
					c.position.set( x + Math.cos( a ) * r * 0.55, h * 0.35 + rand() * h * 0.2, z + Math.sin( a ) * r * 0.55 );
					c.rotation.set( ( rand() - 0.5 ) * 0.9, rand() * 3, ( rand() - 0.5 ) * 0.9 );
					this.rocks.add( c );

				}

			}

			this.colliders.push( { x, z, r: r * 0.9 } );
			placed ++;

		}

		this.scene.add( this.rocks );

	}

	makeLighthouse( at ) {

		const group = new THREE.Group();
		group.position.set( at.x, 0, at.z );
		const rand = mulberry32( 7 );

		const island = new THREE.Mesh(
			this.makeRockGeometry( rand, 26, 14 ),
			new THREE.MeshStandardMaterial( { color: 0x203a6e, roughness: 0.95, flatShading: true } )
		);
		island.position.y = 0;
		group.add( island );

		// 탑: 흰 바탕에 파란 줄무늬
		const canvas = document.createElement( 'canvas' );
		canvas.width = 64; canvas.height = 256;
		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#e8f3ff'; ctx.fillRect( 0, 0, 64, 256 );
		ctx.fillStyle = '#1d4fd8';
		for ( let i = 0; i < 4; i ++ ) ctx.fillRect( 0, 20 + i * 60, 64, 26 );
		const stripe = new THREE.CanvasTexture( canvas );
		stripe.encoding = THREE.sRGBEncoding;

		const tower = new THREE.Mesh(
			new THREE.CylinderGeometry( 2.6, 3.8, 26, 20 ),
			new THREE.MeshStandardMaterial( { map: stripe, roughness: 0.6 } )
		);
		tower.position.y = 13 + 10;
		group.add( tower );

		const gallery = new THREE.Mesh(
			new THREE.CylinderGeometry( 4.2, 4.2, 0.8, 20 ),
			new THREE.MeshStandardMaterial( { color: 0x0b1f4d, roughness: 0.5 } )
		);
		gallery.position.y = 36.4;
		group.add( gallery );

		const lampMat = new THREE.MeshStandardMaterial( { color: 0xfff4d6, emissive: 0xffe9b0, emissiveIntensity: 5 } );
		const lamp = new THREE.Mesh( new THREE.SphereGeometry( 2.2, 20, 12 ), lampMat );
		lamp.position.y = 39;
		group.add( lamp );

		const roof = new THREE.Mesh(
			new THREE.ConeGeometry( 3.6, 4, 20 ),
			new THREE.MeshStandardMaterial( { color: 0x1d4fd8, roughness: 0.5 } )
		);
		roof.position.y = 43;
		group.add( roof );

		// 회전하는 빛줄기
		const beamMat = new THREE.ShaderMaterial( {
			uniforms: { uOn: { value: 1 } },
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			side: THREE.DoubleSide,
			vertexShader: /* glsl */`
				varying float vT;
				void main() { vT = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
			`,
			fragmentShader: /* glsl */`
				uniform float uOn;
				varying float vT;
				void main() {
					// 안티에일리어싱 때문에 가장자리에서 vT가 0보다 살짝 작아질 수 있다. 음수에 pow()를 쓰면 NaN이 나와 점선 고리가 보이므로 먼저 자른다
					float a = pow( clamp( vT, 0.0, 1.0 ), 2.2 ) * 0.5 * uOn;
					gl_FragColor = vec4( vec3( 1.0, 0.93, 0.75 ) * a, 1.0 );
				}
			`
		} );
		const beamGeo = new THREE.ConeGeometry( 14, 180, 24, 1, true );
		beamGeo.translate( 0, - 90, 0 );
		beamGeo.rotateZ( Math.PI / 2 );
		const beams = new THREE.Group();
		const b1 = new THREE.Mesh( beamGeo, beamMat );
		const b2 = b1.clone();
		b2.rotation.y = Math.PI;
		beams.add( b1, b2 );
		beams.position.y = 39;
		group.add( beams );

		const light = new THREE.PointLight( 0xffe2a8, 2.2, 140, 1.4 );
		light.position.y = 39;
		group.add( light );

		this.scene.add( group );
		this.colliders.push( { x: at.x, z: at.z, r: 24 } );

		return {
			group, beams, lampMat, beamMat, light, on: 1, target: 1,
			setOn( v ) {

				this.target = v ? 1 : 0;

			},
			update( dt ) {

				this.on += ( this.target - this.on ) * Math.min( 1, dt * 0.8 );
				this.beams.rotation.y += dt * 0.7;
				this.beamMat.uniforms.uOn.value = this.on;
				this.lampMat.emissiveIntensity = 0.2 + 4.8 * this.on;
				this.light.intensity = 2.2 * this.on;
				this.beams.visible = this.on > 0.02;

			}
		};

	}

	// 미역 줄기 표지판 (스텔라가 써 놓은 길)
	makeKelp( at, small = false ) {

		const group = new THREE.Group();
		group.position.set( at.x, 0, at.z );
		const rand = mulberry32( Math.floor( at.x * 13 + at.z * 7 ) );
		const uniforms = { uTime: { value: 0 }, uRead: { value: 0 }, uPulse: { value: 0 } };
		const mat = new THREE.ShaderMaterial( {
			uniforms,
			vertexShader: /* glsl */`
				uniform float uTime;
				attribute float aPhase;
				varying float vH;
				void main() {
					vec3 p = position;
					float h = clamp( ( p.y + 22.0 ) / 28.0, 0.0, 1.0 );
					p.x += sin( uTime * 1.3 + p.y * 0.25 + aPhase ) * h * h * 2.2;
					p.z += cos( uTime * 1.1 + p.y * 0.2 + aPhase ) * h * h * 1.6;
					vH = h;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
				}
			`,
			fragmentShader: /* glsl */`
				uniform float uRead;
				uniform float uPulse;
				varying float vH;
				void main() {
					vec3 base = mix( vec3( 0.02, 0.25, 0.2 ), vec3( 0.25, 1.4, 1.1 ), vH );
					vec3 read = mix( vec3( 0.05, 0.15, 0.3 ), vec3( 0.9, 0.85, 1.6 ), vH );
					vec3 col = mix( base, read, uRead ) * ( 0.8 + uPulse * 0.9 );
					gl_FragColor = vec4( col, 1.0 );
				}
			`
		} );

		for ( let i = 0; i < ( small ? 6 : 9 ); i ++ ) {

			const a = rand() * Math.PI * 2, d = rand() * ( small ? 4 : 5 );
			const top = small ? 1 + rand() * 3 : 2 + rand() * 6;
			const pts = [];
			for ( let k = 0; k <= 6; k ++ ) {

				const t = k / 6;
				pts.push( new THREE.Vector3( Math.cos( a ) * d + Math.sin( t * 5 + i ) * 0.8, - 22 + t * ( 22 + top ), Math.sin( a ) * d + Math.cos( t * 4 + i ) * 0.8 ) );

			}

			const geo = new THREE.TubeGeometry( new THREE.CatmullRomCurve3( pts ), 24, 0.35 + rand() * 0.25, 5 );
			const phase = new Float32Array( geo.attributes.position.count ).fill( rand() * 6.28 );
			geo.setAttribute( 'aPhase', new THREE.BufferAttribute( phase, 1 ) );
			group.add( new THREE.Mesh( geo, mat ) );

		}

		const glyph = new THREE.Mesh(
			new THREE.OctahedronGeometry( 1.4, 0 ),
			new THREE.MeshStandardMaterial( { color: 0xb8fff0, emissive: 0x6dffe0, emissiveIntensity: 3, flatShading: true } )
		);
		glyph.position.y = 12;
		if ( ! small ) group.add( glyph );

		this.scene.add( group );
		return {
			group, uniforms, glyph, read: false, small, glow: 0, x: at.x, z: at.z,
			update( dt, t ) {

				uniforms.uTime.value = t;
				uniforms.uRead.value += ( ( this.read ? 1 : 0 ) - uniforms.uRead.value ) * Math.min( 1, dt * 2 );
				this.glow = Math.max( 0, this.glow - dt );
				uniforms.uPulse.value = Math.max( this.read || small ? 0.15 : 0.5 + 0.5 * Math.sin( t * 3 ), this.glow );
				glyph.rotation.y += dt * 1.5;
				glyph.position.y = 12 + Math.sin( t * 2 ) * 0.8;
				glyph.material.emissive.setHex( this.read ? 0xb9a8ff : 0x6dffe0 );
				glyph.material.emissiveIntensity = this.read ? 1.2 : 3;

			}
		};

	}

	makeBottle( at, id ) {

		const group = new THREE.Group();
		const model = this.models.bottle.scene.clone( true );
		// 유리 텍스처가 거의 흰색이라 달빛에 하얗게 번진다. 바다색을 살짝 입혀 무늬와 안의 편지가 보이게 한다
		model.traverse( ( o ) => {

			if ( ! o.isMesh || o.material.name !== 'Glass' ) return;
			if ( ! this.bottleGlass ) {

				this.bottleGlass = o.material.clone();
				this.bottleGlass.color.set( 0x7fbfc4 );
				this.bottleGlass.opacity = 0.85;

			}

			o.material = this.bottleGlass;

		} );
		const box = new THREE.Box3().setFromObject( model );
		const size = box.getSize( new THREE.Vector3() );
		const center = box.getCenter( new THREE.Vector3() );
		model.position.sub( center );
		const holder = new THREE.Group();
		holder.add( model );
		holder.scale.setScalar( 3.2 / size.y );
		holder.rotation.z = Math.PI / 2 - 0.25;
		group.add( holder );

		const beamMat = new THREE.ShaderMaterial( {
			uniforms: { uBoost: { value: 0 }, uTime: { value: 0 } },
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			side: THREE.DoubleSide,
			vertexShader: /* glsl */`
				varying float vT;
				void main() { vT = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
			`,
			fragmentShader: /* glsl */`
				uniform float uBoost;
				uniform float uTime;
				varying float vT;
				void main() {
					// 병 둘레(맨 아래)는 비워 둬서 병이 빛에 묻히지 않게 한다
					float a = pow( clamp( 1.0 - vT, 0.0, 1.0 ), 1.6 ) * smoothstep( 0.05, 0.2, vT ) * ( 0.35 + uBoost * 0.9 ) * ( 0.8 + 0.2 * sin( uTime * 4.0 + vT * 12.0 ) );
					gl_FragColor = vec4( vec3( 0.4, 0.9, 1.4 ) * a, 1.0 );
				}
			`
		} );
		const beam = new THREE.Mesh( new THREE.CylinderGeometry( 0.7, 1.4, 36, 12, 1, true ), beamMat );
		beam.geometry.translate( 0, 18, 0 );
		group.add( beam );

		group.position.set( at.x, 0, at.z );
		this.scene.add( group );
		return {
			id, group, holder, beamMat, x: at.x, z: at.z, collected: false, reveal: 0, spin: Math.random() * 6,
			update( dt, t ) {

				if ( this.collected ) return;
				const h = sampleOcean( this.x, this.z, _n );
				group.position.y = h + 0.3;
				holder.rotation.y = this.spin + t * 0.4;
				holder.rotation.x = _n.z * 0.8;
				this.reveal = Math.max( 0, this.reveal - dt );
				beamMat.uniforms.uBoost.value = Math.min( 1, this.reveal );
				beamMat.uniforms.uTime.value = t;

			},
			remove( scene ) {

				this.collected = true;
				scene.remove( group );

			}
		};

	}

	// 루크의 빛 조각: 먹으면 잠시 아주 빨라진다
	makeLightShard( at ) {

		if ( ! this.shardParts ) {

			const c = document.createElement( 'canvas' );
			c.width = c.height = 64;
			const ctx = c.getContext( '2d' );
			const g = ctx.createRadialGradient( 32, 32, 0, 32, 32, 32 );
			g.addColorStop( 0, 'rgba(255,255,255,1)' );
			g.addColorStop( 0.25, 'rgba(255,200,120,0.6)' );
			g.addColorStop( 1, 'rgba(255,160,60,0)' );
			ctx.fillStyle = g;
			ctx.fillRect( 0, 0, 64, 64 );
			this.shardParts = {
				geo: new THREE.OctahedronGeometry( 1.1, 0 ),
				core: new THREE.MeshBasicMaterial( { color: new THREE.Color( 3.4, 2.3, 1.1 ) } ),
				halo: new THREE.SpriteMaterial( { map: new THREE.CanvasTexture( c ), color: 0xffc27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } )
			};

		}

		const P = this.shardParts;
		const group = new THREE.Group();
		const core = new THREE.Mesh( P.geo, P.core );
		core.scale.set( 1, 1.7, 1 );
		const halo = new THREE.Sprite( P.halo );
		halo.scale.set( 10, 10, 1 );
		group.add( core, halo );
		group.position.set( at.x, 0, at.z );
		this.scene.add( group );
		const phase = Math.random() * 6;
		return {
			group, x: at.x, z: at.z, active: true, respawn: 0, delay: at.delay ?? 0,
			get ready() {

				return this.active && this.delay <= 0;

			},
			update( dt, t ) {

				if ( this.delay > 0 ) this.delay -= dt;
				if ( ! this.active ) {

					this.respawn -= dt;
					if ( this.respawn <= 0 ) this.active = true;

				}

				group.visible = this.ready;
				if ( ! group.visible ) return;
				group.position.y = sampleOcean( this.x, this.z ) + 1.6 + Math.sin( t * 2.4 + phase ) * 0.4;
				core.rotation.y = t * 2 + phase;
				halo.material.rotation = t * 0.5;

			}
		};

	}

	// --- 효과 ---

	ring( x, z, { color = 0x7fe9ff, from = 2, to = 60, life = 1.4, width = 0.12, delay = 0 } = {} ) {

		const mesh = makeSurfaceDecal( { color, inner: 1 - width, outer: 1 } );
		mesh.position.set( x, 0, z );
		mesh.scale.setScalar( from );
		mesh.visible = delay <= 0;
		this.scene.add( mesh );
		this.effects.push( {
			age: - delay, update( dt ) {

				this.age += dt;
				if ( this.age < 0 ) return true;
				mesh.visible = true;
				const t = this.age / life;
				const e = 1 - Math.pow( 1 - Math.min( t, 1 ), 3 );
				mesh.scale.setScalar( from + ( to - from ) * e );
				mesh.material.uniforms.uOpacity.value = ( 1 - t ) * 1.15;
				return t < 1;

			}, dispose: () => {

				this.scene.remove( mesh );
				mesh.material.dispose();

			}
		} );

	}

	splash( x, y, z, { count = 60, power = 9, color = 0xbfeaff, size = 0.9 } = {} ) {

		const pos = new Float32Array( count * 3 );
		const vel = [];
		for ( let i = 0; i < count; i ++ ) {

			const a = Math.random() * Math.PI * 2, r = Math.random();
			pos.set( [ x + Math.cos( a ) * r * 2, y, z + Math.sin( a ) * r * 2 ], i * 3 );
			vel.push( new THREE.Vector3( Math.cos( a ) * power * 0.4 * ( 0.4 + r ), power * ( 0.6 + Math.random() * 0.6 ), Math.sin( a ) * power * 0.4 * ( 0.4 + r ) ) );

		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
		const mat = new THREE.PointsMaterial( { color, size, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending } );
		const pts = new THREE.Points( geo, mat );
		pts.frustumCulled = false;
		pts.renderOrder = 4;
		this.scene.add( pts );
		this.effects.push( {
			age: 0, update( dt ) {

				this.age += dt;
				const a = geo.attributes.position;
				for ( let i = 0; i < count; i ++ ) {

					vel[ i ].y -= 22 * dt;
					a.setXYZ( i, a.getX( i ) + vel[ i ].x * dt, a.getY( i ) + vel[ i ].y * dt, a.getZ( i ) + vel[ i ].z * dt );

				}

				a.needsUpdate = true;
				mat.opacity = Math.max( 0, 1 - this.age / 1.3 );
				return this.age < 1.3;

			}, dispose: () => {

				this.scene.remove( pts );
				geo.dispose();
				mat.dispose();

			}
		} );

	}

	update( dt, t ) {

		this.time = t;
		this.seabed.material.uniforms.uTime.value = t;
		this.lighthouse.update( dt );
		for ( let i = this.effects.length - 1; i >= 0; i -- ) {

			if ( ! this.effects[ i ].update( dt ) ) {

				this.effects[ i ].dispose();
				this.effects.splice( i, 1 );

			}

		}

	}

	collide( pos, radius ) {

		for ( const c of this.colliders ) {

			const dx = pos.x - c.x, dz = pos.z - c.z;
			const d = Math.hypot( dx, dz );
			const min = c.r + radius;
			if ( d < min && d > 0.001 ) {

				pos.x = c.x + dx / d * min;
				pos.z = c.z + dz / d * min;

			}

		}

	}

}
