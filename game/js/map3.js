// MAP 3 · 새벽을 부르는 노래: 밤이 새벽으로 바뀌는 수면. 1단계는 '얼어붙은 항로'와 고립된 범고래 12번
// 하늘 · 바다 · 안개 색은 새벽 정도(0 밤 ~ 1 해돋이)를 따라 바뀐다. 얼음 조각은 바위처럼 헤이즐을 막는다
import * as THREE from 'three';
import { sampleOcean } from './ocean.js';
import { Whale, steerTo, followSlot } from './actors.js';
import { dawnColor } from './sky.js';

// 자리 (x, z). 북쪽 = -z. 세상의 끝(150, 150 · 반지름 1150) 안쪽
export const DAWN_PLACES = {
	start: { x: 150, z: 300 }, // MAP 2 기지 위 수면: 연합군이 떠오르는 곳
	gather: { x: 150, z: 255 },
	pool: { x: 105, z: - 215 }, // 얼음에 갇힌 웅덩이 (12번)
	coast: { x: 1250, z: 240 }, // 해가 뜨는 쪽, 인간의 해안
	north: { x: 60, z: - 900 }
};
const FIELD_R = 210; // 얼음 벌판 반지름
const POOL_R = 24;
const CHANNEL_HALF = 10; // 얼음 사이 물길 폭의 절반

// 물길: 남쪽 벌판 끝에서 웅덩이까지 굽이진 길
const P = DAWN_PLACES.pool;
const CHANNEL = [
	[ P.x + 30, P.z + FIELD_R + 20 ], [ P.x + 38, P.z + 150 ], [ P.x - 22, P.z + 105 ], [ P.x + 14, P.z + 55 ], [ P.x, P.z ]
];

// 새벽 정도에 따른 바다 · 안개 · 빛 색 [ k, 안개, 깊은 물, 얕은 물, 하늘빛(반구광), 달빛 ]
const DAWN_SEA = [
	[ 0, 0x123572, 0x041a4a, 0x1170c4, 0x5f8dff, 0xc4dcff ],
	[ 0.5, 0x2c3672, 0x0a1f50, 0x2a62b0, 0x8f88f0, 0xe6c4e6 ],
	[ 1, 0x7c78a6, 0x153a6a, 0x4a8ec8, 0xffc4ac, 0xffd2a8 ]
];
const ICE_FOG = new THREE.Color( 0xa8bcd8 ).convertSRGBToLinear();

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

function segDist( x, z, a, b ) {

	const dx = b[ 0 ] - a[ 0 ], dz = b[ 1 ] - a[ 1 ];
	const t = THREE.MathUtils.clamp( ( ( x - a[ 0 ] ) * dx + ( z - a[ 1 ] ) * dz ) / ( dx * dx + dz * dz ), 0, 1 );
	return Math.hypot( x - a[ 0 ] - dx * t, z - a[ 1 ] - dz * t );

}

function channelDist( x, z ) {

	let d = Infinity;
	for ( let i = 0; i < CHANNEL.length - 1; i ++ ) d = Math.min( d, segDist( x, z, CHANNEL[ i ], CHANNEL[ i + 1 ] ) );
	return d;

}

// 울퉁불퉁한 얼음판 (반지름 1). 윗면은 눈처럼 하얗고 옆면은 푸르다
function floeGeometry( seed ) {

	const shape = new THREE.Shape();
	const n = 7 + ( seed % 4 );
	for ( let i = 0; i < n; i ++ ) {

		const a = ( i / n ) * Math.PI * 2;
		const r = 0.72 + 0.28 * Math.abs( Math.sin( seed * 12.9 + i * 3.7 ) );
		const x = Math.cos( a ) * r, y = Math.sin( a ) * r;
		if ( i === 0 ) shape.moveTo( x, y );
		else shape.lineTo( x, y );

	}

	shape.closePath();
	const geo = new THREE.ExtrudeGeometry( shape, { depth: 1, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.06, bevelSegments: 1 } );
	geo.rotateX( - Math.PI / 2 ); // 두께가 위(+y)로
	geo.translate( 0, - 0.62, 0 ); // 물 위로는 0.4 남짓
	geo.computeVertexNormals();
	return geo;

}

function snowTexture() {

	const c = document.createElement( 'canvas' );
	c.width = c.height = 32;
	const g = c.getContext( '2d' );
	const grad = g.createRadialGradient( 16, 16, 0, 16, 16, 16 );
	grad.addColorStop( 0, 'rgba(255,255,255,1)' );
	grad.addColorStop( 0.4, 'rgba(255,255,255,0.6)' );
	grad.addColorStop( 1, 'rgba(255,255,255,0)' );
	g.fillStyle = grad;
	g.fillRect( 0, 0, 32, 32 );
	return new THREE.CanvasTexture( c );

}

export class DawnSea {

	constructor( { scene, models } ) {

		this.scene = scene;
		this.models = models;
		this.group = new THREE.Group();
		this.group.name = 'map3';
		scene.add( this.group );
		this.floes = []; // { x, z, r, ... } 그대로 충돌 원으로도 쓴다
		this.colliders = this.floes;
		this.alliance = [];
		this.time = 0;
		this.frost = 0;
		this.onSpout = null; // 12번이 숨을 내뿜을 때 ( 위치 )
		this.buildIce();
		this.buildSnow();

	}

	buildIce() {

		const top = new THREE.MeshStandardMaterial( { color: 0xeaf4ff, roughness: 0.55, metalness: 0, emissive: 0x1a2a44, emissiveIntensity: 0.6, flatShading: true } );
		const side = new THREE.MeshStandardMaterial( { color: 0x7fb2e0, roughness: 0.25, metalness: 0.1, emissive: 0x0a2a50, emissiveIntensity: 0.8, flatShading: true } );
		this.iceMats = [ top, side ];
		const list = [];
		const fits = ( x, z, r ) => {

			if ( Math.hypot( x - P.x, z - P.z ) < POOL_R + r ) return false;
			if ( channelDist( x, z ) < CHANNEL_HALF + r ) return false;
			for ( const f of list ) if ( Math.hypot( f.x - x, f.z - z ) < f.r + r + 1.2 ) return false;
			return true;

		};

		// 웅덩이 둘레는 촘촘하게, 바깥으로 갈수록 크고 듬성듬성
		let tries = 0;
		while ( list.length < 190 && tries < 6000 ) {

			tries ++;
			const a = Math.random() * Math.PI * 2;
			const d = POOL_R + Math.sqrt( Math.random() ) * ( FIELD_R - POOL_R );
			const x = P.x + Math.cos( a ) * d, z = P.z + Math.sin( a ) * d * 0.85;
			const r = THREE.MathUtils.lerp( 3.5, 15, Math.pow( Math.random(), 1.6 ) ) * ( 0.7 + 0.5 * d / FIELD_R );
			if ( fits( x, z, r ) ) list.push( { x, z, r } );

		}

		// 벌판까지 가는 길에 떠다니는 작은 얼음
		for ( let i = 0; i < 34; i ++ ) {

			const x = P.x + ( Math.random() - 0.3 ) * 260, z = P.z + FIELD_R + 20 + Math.random() * 230;
			const r = 1.6 + Math.random() * 3.5;
			if ( Math.hypot( x - DAWN_PLACES.start.x, z - DAWN_PLACES.start.z ) < 90 ) continue;
			if ( fits( x, z, r ) ) list.push( { x, z, r } );

		}

		const SHAPES = 6;
		const geos = Array.from( { length: SHAPES }, ( _, i ) => floeGeometry( i + 1 ) );
		const counts = new Array( SHAPES ).fill( 0 );
		list.forEach( ( f, i ) => {

			f.shape = i % SHAPES;
			f.index = counts[ f.shape ] ++;
			f.yaw = Math.random() * Math.PI * 2;
			f.th = 0.8 + Math.random() * 0.9; // 두께
			f.phase = Math.random() * 10;
			f.vx = 0;
			f.vz = 0;
			f.home = { x: f.x, z: f.z };

		} );
		this.iceMeshes = geos.map( ( g, s ) => {

			const mesh = new THREE.InstancedMesh( g, this.iceMats, Math.max( 1, counts[ s ] ) );
			mesh.count = counts[ s ];
			mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			mesh.frustumCulled = false;
			this.group.add( mesh );
			return mesh;

		} );
		this.floes.push( ...list );
		this.updateIce( 0, true );

	}

	// 흩날리는 눈: 카메라 둘레 상자 안에서 내리고, 얼음 벌판에 가까울수록 짙다
	buildSnow() {

		const n = 900;
		const pos = new Float32Array( n * 3 );
		for ( let i = 0; i < n; i ++ ) pos.set( [ ( Math.random() - 0.5 ) * 140, Math.random() * 50, ( Math.random() - 0.5 ) * 140 ], i * 3 );
		const geo = new THREE.BufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
		this.snowMat = new THREE.PointsMaterial( { size: 0.55, map: snowTexture(), transparent: true, opacity: 0, depthWrite: false, color: 0xf2f8ff } );
		this.snow = new THREE.Points( geo, this.snowMat );
		this.snow.frustumCulled = false;
		this.group.add( this.snow );

	}

	updateIce( dt, all = false, cam = null ) {

		const counts = this.iceMeshes.map( () => 0 );
		for ( const f of this.floes ) {

			// 갈라진 얼음은 천천히 밀려난다
			if ( f.vx || f.vz ) {

				f.x += f.vx * dt;
				f.z += f.vz * dt;
				const k = Math.exp( - dt * 0.35 );
				f.vx *= k;
				f.vz *= k;
				if ( Math.abs( f.vx ) + Math.abs( f.vz ) < 0.02 ) f.vx = f.vz = 0;

			}

			if ( ! all && cam && Math.hypot( f.x - cam.x, f.z - cam.z ) > 330 && ! f.vx ) continue;
			const y = sampleOcean( f.x, f.z ) + Math.sin( this.time * 0.9 + f.phase ) * 0.06;
			_e.set( Math.sin( this.time * 0.7 + f.phase ) * 0.02, f.yaw, Math.cos( this.time * 0.6 + f.phase ) * 0.02 );
			_q.setFromEuler( _e );
			_s.set( f.r, f.th, f.r );
			_p.set( f.x, y, f.z );
			_m.compose( _p, _q, _s );
			this.iceMeshes[ f.shape ].setMatrixAt( f.index, _m );
			counts[ f.shape ] ++;

		}

		for ( const m of this.iceMeshes ) m.instanceMatrix.needsUpdate = true;

	}

	// 노래가 얼음을 가른다: center 둘레 radius 안의 얼음이 바깥(그리고 북쪽)으로 밀려난다
	crack( center, radius, push = 6 ) {

		let n = 0;
		for ( const f of this.floes ) {

			const dx = f.x - center.x, dz = f.z - center.z, d = Math.hypot( dx, dz );
			if ( d > radius || d < 0.01 ) continue;
			const k = ( 1 - d / radius ) * push + 1.5;
			f.vx += dx / d * k;
			f.vz += dz / d * k - ( dz < 0 ? k * 0.6 : 0 );
			n ++;

		}

		return n;

	}

	// 얼음 조각에 막힌다 (World.collide와 같은 방식)
	collide( pos, radius ) {

		for ( const c of this.floes ) {

			const dx = pos.x - c.x, dz = pos.z - c.z;
			const d = Math.hypot( dx, dz ), min = c.r + radius;
			if ( d < min && d > 0.001 ) {

				pos.x = c.x + dx / d * min;
				pos.z = c.z + dz / d * min;

			}

		}

	}

	// 얼음 벌판 가까이 왔는지 (0 ~ 1)
	frostAt( x, z ) {

		const d = Math.hypot( x - P.x, ( z - P.z ) / 0.85 );
		return 1 - THREE.MathUtils.smoothstep( d, FIELD_R * 0.6, FIELD_R + 120 );

	}

	// ---- 침묵한 연합군: 붉은 눈이 꺼진 범고래들이 수면에 떠 있다 ----
	gatherAlliance( center, n = 11 ) {

		for ( let i = 0; i < n; i ++ ) {

			const w = new Whale( this.models.orca, { name: 'orca', length: 10, ride: 0.42, freq: 3, amp: 0.05 } );
			const a = ( i / n ) * Math.PI * 2 + Math.random() * 0.2;
			const r = 22 + ( i % 3 ) * 6 + Math.random() * 3;
			const x = center.x + Math.cos( a ) * r, z = center.z + Math.sin( a ) * r;
			w.place( x, z, Math.atan2( center.x - x, center.z - z ) + ( Math.random() - 0.5 ) * 0.6 );
			w.depth = 0.4 + Math.random() * 0.5;
			w.baseAmp = 0.02;
			this.group.add( w.root );
			// 무리: 0 샤먼을 따르는 고래 · 1 복수를 원하는 고래 · 2 전쟁을 거부하는 고래
			this.alliance.push( { whale: w, side: i % 3, target: null, speed: 0, delay: 0 } );

		}

	}

	// 세 갈래로 흩어진다: 따르는 고래 · 복수하는 고래는 해안(동쪽)으로, 거부하는 고래는 저마다 아무 데로나
	scatter() {

		const C = DAWN_PLACES.coast;
		for ( const o of this.alliance ) {

			const p = o.whale.pos;
			if ( o.side === 2 ) {

				const a = Math.random() * Math.PI * 2;
				o.target = { x: p.x + Math.cos( a ) * 500, z: p.z - Math.abs( Math.sin( a ) ) * 500 };
				o.speed = 6 + Math.random() * 3;
				o.delay = 1.5 + Math.random() * 3;

			} else {

				o.target = { x: C.x + ( Math.random() - 0.5 ) * 160, z: C.z + ( Math.random() - 0.5 ) * 160 };
				o.speed = o.side === 1 ? 15 : 11;
				o.delay = Math.random() * 1.2;

			}

		}

	}

	// ---- 12번: 얼음 웅덩이를 맴도는 범고래 ----
	makeTwelve() {

		const w = new Whale( this.models.orca, { name: 'twelve', length: 9, ride: 0.42, freq: 3.2, amp: 0.06, recolor: [ 0x1c2a3a, 0xdce9f6 ], emissive: 0.4 } );
		w.place( P.x + 9, P.z, 0 );
		this.group.add( w.root );
		this.twelve = { whale: w, state: 'pool', angle: 0, spout: 3 };
		return w;

	}

	update( dt, t, { hazel, cam } ) {

		this.time = t;
		this.updateIce( dt, false, cam );
		this.frost = this.frostAt( hazel.pos.x, hazel.pos.z );

		// 눈
		this.snowMat.opacity = this.frost * 0.85;
		this.snow.visible = this.frost > 0.01;
		if ( this.snow.visible ) {

			const a = this.snow.geometry.attributes.position;
			for ( let i = 0; i < a.count; i ++ ) {

				let x = a.getX( i ), y = a.getY( i ) - dt * ( 1.2 + ( i % 5 ) * 0.35 ), z = a.getZ( i );
				x += Math.sin( t * 0.5 + i ) * dt * 0.6;
				if ( y < - 2 ) y += 50;
				a.setXYZ( i, x, y, z );

			}

			a.needsUpdate = true;
			// 카메라를 따라 상자를 옮긴다 (70m 격자로 끊어서 눈이 같이 미끄러지지 않게)
			this.snow.position.set( Math.round( cam.x / 70 ) * 70, 0, Math.round( cam.z / 70 ) * 70 );

		}

		// 연합군
		for ( const o of this.alliance ) {

			const w = o.whale;
			if ( ! w.root.visible ) continue;
			if ( o.target ) {

				o.delay -= dt;
				if ( o.delay <= 0 ) {

					w.depth += ( 0 - w.depth ) * Math.min( 1, dt );
					if ( steerTo( w, o.target.x, o.target.z, o.speed, dt, 1.4 ) < 20 ) w.root.visible = false;
					if ( Math.hypot( w.pos.x - hazel.pos.x, w.pos.z - hazel.pos.z ) > 420 ) w.root.visible = false;

				}

			} else w.speed *= 0.95;

			w.update( dt );

		}

		// 12번
		const tw = this.twelve;
		if ( tw && tw.whale.root.visible ) {

			const w = tw.whale;
			if ( tw.state === 'pool' ) {

				// 웅덩이를 맴돌며 가끔 숨을 내뿜는다 (얼음 위로 하얀 물보라)
				tw.angle += dt * 0.42;
				steerTo( w, P.x + Math.cos( tw.angle ) * 9, P.z + Math.sin( tw.angle ) * 9, 4.5, dt, 2.2 );
				tw.spout -= dt;
				if ( tw.spout <= 0 ) {

					tw.spout = 5 + Math.random() * 3;
					this.onSpout?.( w.pos );

				}

			} else if ( tw.state === 'face' ) {

				w.speed *= 0.9;
				const ty = Math.atan2( hazel.pos.x - w.pos.x, hazel.pos.z - w.pos.z );
				w.yaw += Math.atan2( Math.sin( ty - w.yaw ), Math.cos( ty - w.yaw ) ) * Math.min( 1, dt * 1.5 );

			} else if ( tw.state === 'follow' ) {

				// 듣는 노래: 헤이즐 옆에서, 이끄는 노래: 헤이즐 바로 뒤에서
				followSlot( w, hazel, tw.slot, dt, 50 );
				this.collide( w.pos, 3 );

			} else if ( tw.state === 'leave' ) {

				// 혼자의 길: 얼음 밑으로 잠수해 북쪽으로
				w.depth += ( 9 - w.depth ) * Math.min( 1, dt * 0.5 );
				steerTo( w, DAWN_PLACES.north.x, DAWN_PLACES.north.z, 12, dt, 1.2 );
				w.setOpacity( Math.max( 0, 1 - w.depth / 9 ) );
				if ( w.depth > 8.5 ) w.root.visible = false;

			}

			w.update( dt );

		}

	}

}

// 새벽 정도에 따른 바다 · 빛 색을 정한다 (하늘은 Sky.setDawn)
export function applyDawnSea( k, { fog, ocean, hemi, moon } ) {

	dawnColor( DAWN_SEA, 1, k, fog.color );
	dawnColor( DAWN_SEA, 2, k, ocean.uniforms.uDeep.value );
	dawnColor( DAWN_SEA, 3, k, ocean.uniforms.uShallow.value );
	dawnColor( DAWN_SEA, 4, k, hemi.color );
	dawnColor( DAWN_SEA, 5, k, moon.color );
	return fog.color.clone();

}

// 얼음 벌판에선 안개가 희고 짙어진다
export function frostFog( fog, base, frost, ocean ) {

	fog.color.copy( base ).lerp( ICE_FOG, frost * 0.25 );
	fog.density = 0.00105 * ( 1 + frost * 1.6 );
	ocean.uniforms.uFogDensity.value = fog.density; // 바다 셰이더는 값을 따로 들고 있다

}

