// MAP 3 · 새벽을 부르는 노래: 밤이 새벽으로 바뀌는 수면. 1단계는 '얼어붙은 항로'와 고립된 범고래 12번
// 하늘 · 바다 · 안개 색은 새벽 정도(0 밤 ~ 1 해돋이)를 따라 바뀐다. 얼음 조각은 바위처럼 헤이즐을 막는다
import * as THREE from 'three';
import { sampleOcean, makeSurfaceDecal } from './ocean.js';
import { Whale, steerTo, followSlot } from './actors.js';
import { dawnColor } from './sky.js';

// 자리 (x, z). 북쪽 = -z. 세상의 끝(150, 150 · 반지름 1150) 안쪽
export const DAWN_PLACES = {
	start: { x: 150, z: 300 }, // MAP 2 기지 위 수면: 연합군이 떠오르는 곳
	gather: { x: 150, z: 255 },
	pool: { x: 105, z: - 215 }, // 얼음에 갇힌 웅덩이 (12번)
	coast: { x: 1250, z: 240 }, // 해가 뜨는 쪽, 인간의 해안
	north: { x: 60, z: - 900 },
	fleet: { x: - 430, z: 130 }, // 침몰한 함대 (서쪽)
	storm: { x: 470, z: 700 }, // 폭풍의 바다 (남동쪽)
	deep: { x: 470, z: 1000 }, // 8번이 숨으러 내려가는 쪽
	lighthouse: { x: - 70, z: - 330 }, // 잊힌 등대: 맵 1의 루크 등대, 얼어붙은 항로 끝
	army: { x: 900, z: 240 } // 샤먼의 진군: 해안 도시 앞 (맨 앞줄)
};
const SHORE_X = 1240; // 해안선: 이 동쪽은 인간의 땅
export { SHORE_X };
const BEAT = 60 / 92; // 음악과 같은 박자 (샤먼의 북)
const DRUM_SPEED = 24; // 북소리 고리가 퍼지는 빠르기
const DRUM_R = 170;
const SING_WINDOW = 0.55; // 고리가 닿기 직전 이만큼 안에 노래했으면 버틴다 (초)
const _up = new THREE.Vector3( 0, 1, 0 );
const STORM_R = 270; // 폭풍 반지름
const STORM_EYE = 26; // 가운데 고요한 자리
const WAVE_SPEED = 17; // 큰 파도가 퍼져 나가는 빠르기 (m/s)
const WAVE_EVERY = 3.4;
const STORM_FOG = new THREE.Color( 0x1c2433 ).convertSRGBToLinear();
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
	[ 0.5, 0x343468, 0x0a1f50, 0x2a62b0, 0x9a86d4, 0xf0c6c0 ],
	[ 1, 0x86789a, 0x153a6a, 0x4a8ec8, 0xffc49c, 0xffd09a ]
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
		this.colliders = []; // 얼음 조각 + 가라앉은 배 + 폭풍의 바위 (모두 { x, z, r })
		this.voices = {}; // 만나는 고래들 (12번 · 9번 · 8번)
		this.onLightning = null; // 폭풍의 번개
		this.onWave = null; // 큰 파도에 맞았을 때 ( 바깥쪽 방향 )
		this.alliance = [];
		this.time = 0;
		this.frost = 0;
		this.onSpout = null; // 12번이 숨을 내뿜을 때 ( 위치 )
		this.onSplash = null; // 연합군이 뛰어오르고 떨어질 때 ( 위치, 떨어졌으면 true )
		this.leapers = []; // 함께 뛰어오르는 고래 (샤먼처럼 연합군 목록 밖의 고래도)
		this.buildIce();
		this.buildSnow();
		this.colliders.push( ...this.floes );
		this.buildFleet();
		this.buildStorm();
		this.buildStones();
		this.buildCity();
		this.army = null;
		this.march = null;
		this.onDrum = null; // 북소리 ( 크기, 네 박째인지 )
		this.onDrumHit = null; // 북소리 고리에 밀림 ( 방향 )
		this.onDrumBlock = null; // 52Hz로 버팀 ( 방향 )

	}

	buildIce() {

		const top = new THREE.MeshStandardMaterial( { color: 0xb4c8dc, roughness: 0.8, metalness: 0, emissive: 0x1a2a44, emissiveIntensity: 0.35, flatShading: true } ); // 너무 하얗면 등대 · 새벽 빛에 번져 눈부시다
		const side = new THREE.MeshStandardMaterial( { color: 0x6a9cc8, roughness: 0.5, metalness: 0.05, emissive: 0x0a2a50, emissiveIntensity: 0.5, flatShading: true } );
		this.iceMats = [ top, side ];
		const list = [];
		const fits = ( x, z, r ) => {

			if ( Math.hypot( x - P.x, z - P.z ) < POOL_R + r ) return false;
			if ( Math.hypot( x - DAWN_PLACES.lighthouse.x, z - DAWN_PLACES.lighthouse.z ) < 58 + r ) return false; // 등대 섬과 노래 바위 둘레
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

	// 12번의 웅덩이 둘레, 푸르게 갈라진 얼음의 약한 곳 셋 (곁에서 노래하면 깨진다)
	showCracks() {

		if ( this.cracks ) return this.cracks;
		const tex = snowTexture();
		this.cracks = [ - Math.PI / 2, Math.PI * 0.95, 0.05 ].map( ( a ) => {

			const x = P.x + Math.cos( a ) * ( POOL_R + 5 ), z = P.z + Math.sin( a ) * ( POOL_R + 5 );
			const ring = makeSurfaceDecal( { color: 0x7fe9ff, inner: 0.55, outer: 1, opacity: 0.8, lift: 0.7, fill: 1 } );
			ring.position.set( x, 0, z );
			ring.scale.setScalar( 6 );
			const glow = new THREE.Sprite( new THREE.SpriteMaterial( { map: tex, color: 0x9ff0ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false } ) );
			glow.position.set( x, 2.5, z );
			glow.scale.setScalar( 7 );
			this.group.add( ring, glow );
			return { x, z, pos: { x, z }, ring, glow, done: false };

		} );
		return this.cracks;

	}

	// 약한 곳이 깨진다: 둘레의 얼음이 밀려나고 빛이 사라진다
	breakCrack( c ) {

		c.done = true;
		c.ring.visible = c.glow.visible = false;
		this.crack( c, 34, 7 );

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

		for ( const c of this.colliders ) {

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

	// 한꺼번에 뛰어오른다: 모두 dir(해안) 쪽으로 몸을 돌리고, 뒤에서 앞으로 물결처럼 jumps번씩.
	// extra: 연합군 목록 밖에서 함께 뛰는 고래 (샤먼). 다 끝나는 데 걸리는 시간(초)을 돌려준다
	leap( dir, { jumps = 2, extra = [] } = {} ) {

		const list = [ ...this.alliance.map( ( o ) => o.whale ), ...extra ];
		let lo = Infinity, hi = - Infinity;
		const proj = list.map( ( w ) => w.pos.x * dir.x + w.pos.z * dir.z );
		for ( const p of proj ) {

			lo = Math.min( lo, p );
			hi = Math.max( hi, p );

		}

		this.leapers = list.map( ( w, i ) => ( {
			whale: w,
			dir,
			jumps,
			wait: 1.1 + ( proj[ i ] - lo ) * 0.03 + Math.random() * 0.08, // 맨 뒤부터
			air: false
		} ) );
		return 1.1 + ( hi - lo ) * 0.03 + jumps * 2.3;

	}

	updateLeap( dt ) {

		for ( const l of this.leapers ) {

			const w = l.whale;
			// 해안 쪽으로 몸을 돌리며 천천히 나아간다
			steerTo( w, w.pos.x + l.dir.x * 60, w.pos.z + l.dir.z * 60, 9, dt, 2.4 );
			w.depth += ( 0 - w.depth ) * Math.min( 1, dt * 2 );
			if ( l.air && ! w.airborne ) this.onSplash?.( w.pos, true );
			l.air = w.airborne;
			if ( l.jumps <= 0 || w.airborne ) continue;
			l.wait -= dt;
			if ( l.wait > 0 ) continue;
			w.breach( 19 + Math.random() * 3 );
			l.air = true;
			l.jumps --;
			l.wait = 2.3;
			this.onSplash?.( w.pos, false );

		}

		this.leapers = this.leapers.filter( ( l ) => l.jumps > 0 || l.whale.airborne );

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

	// ---- 침몰한 함대: 별이 떨어지던 밤에 가라앉은 인간의 배들 ----
	buildFleet() {

		const F = DAWN_PLACES.fleet;
		const rust = new THREE.MeshStandardMaterial( { color: 0x5a3a2e, roughness: 0.9, metalness: 0.35, emissive: 0x140806, emissiveIntensity: 0.6, flatShading: true } );
		const steel = new THREE.MeshStandardMaterial( { color: 0x4a5058, roughness: 0.7, metalness: 0.5, emissive: 0x0a0e14, emissiveIntensity: 0.6, flatShading: true } );
		// [ x, z, 길이, 방향, 기울기(옆), 기울기(앞뒤), 잠긴 깊이, 종류 ]
		const SHIPS = [
			[ - 30, - 20, 70, 0.4, 0.42, 0.12, 4.5, 'tank' ], // 수조를 실어 나르던 배
			[ 60, 40, 58, - 0.9, - 0.3, - 0.22, 3.5, 'lab' ], // 연구선
			[ - 40, 95, 86, 1.9, 0.18, 0.3, 5, 'war' ], // 군함
			[ 95, - 70, 44, 2.6, - 0.5, 0.1, 4, 'tank' ],
			[ - 110, 30, 50, - 2.2, 0.35, - 0.28, 5.5, 'war' ]
		];
		this.wrecks = SHIPS.map( ( [ dx, dz, len, yaw, roll, pitch, sink, kind ], i ) => {

			const g = new THREE.Group();
			// 선체: 상자를 뱃머리 쪽으로 좁히고 아래를 오므린다
			const hull = new THREE.BoxGeometry( len, 8, 11, 8, 2, 2 );
			const p = hull.attributes.position;
			for ( let j = 0; j < p.count; j ++ ) {

				const x = p.getX( j ), y = p.getY( j ), z = p.getZ( j );
				const bow = THREE.MathUtils.smoothstep( x / ( len / 2 ), 0.35, 1 );
				p.setZ( j, z * ( 1 - bow * 0.95 ) * ( y < 0 ? 0.62 : 1 ) );
				p.setY( j, y + bow * 1.5 * ( y > 0 ? 1 : 0 ) );

			}

			hull.computeVertexNormals();
			g.add( new THREE.Mesh( hull, rust ) );
			const box = ( w, h, d, x, y, z, m = steel ) => {

				const b = new THREE.Mesh( new THREE.BoxGeometry( w, h, d ), m );
				b.position.set( x, y, z );
				g.add( b );
				return b;

			};

			const cyl = ( r, h, x, y, z, rz = 0, m = steel ) => {

				const c = new THREE.Mesh( new THREE.CylinderGeometry( r, r, h, 8 ), m );
				c.position.set( x, y, z );
				c.rotation.z = rz;
				g.add( c );
				return c;

			};

			box( len * 0.22, 5, 7, - len * 0.1, 6.5, 0 );
			box( len * 0.12, 3.5, 5, - len * 0.12, 10.5, 0 );
			cyl( 0.35, 16, - len * 0.08, 16, 0 ); // 돛대
			box( 0.3, 0.3, 7, - len * 0.08, 20, 0 );
			cyl( 1.6, 6, - len * 0.25, 8, 0, 0, rust ); // 굴뚝
			if ( kind === 'war' ) {

				for ( const tx of [ len * 0.22, - len * 0.36 ] ) {

					cyl( 2.4, 1.8, tx, 5, 0 );
					cyl( 0.32, 9, tx + ( tx > 0 ? 4.5 : - 4.5 ), 5.6, 0, Math.PI / 2 );

				}

			} else if ( kind === 'tank' ) {

				// 갑판 위의 커다란 수조 (유리는 깨졌다)
				const glass = new THREE.MeshStandardMaterial( { color: 0x7fb8d8, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.35, emissive: 0x0a2030, emissiveIntensity: 0.8 } );
				box( len * 0.3, 4.5, 8, len * 0.18, 6.2, 0, glass );

			} else {

				box( len * 0.18, 3, 6, len * 0.2, 5.5, 0 );
				cyl( 0.2, 7, len * 0.2, 10, 0 ); // 안테나

			}

			// 창: 기억이 깨어나면 따뜻하게 켜진다
			const winMat = new THREE.MeshBasicMaterial( { color: 0x1a1410 } );
			for ( let k = 0; k < 5; k ++ ) box( 0.9, 0.9, 0.2, - len * 0.18 + k * 1.8, 7, 3.55, winMat );
			const x = F.x + dx, z = F.z + dz;
			g.position.set( x, - sink, z );
			g.rotation.set( pitch, yaw, roll, 'YXZ' );
			this.group.add( g );
			// 충돌: 선체 길이를 따라 원 여러 개
			const ax = Math.cos( yaw ), az = - Math.sin( yaw );
			for ( let k = - len / 2 + 6; k <= len / 2 - 6; k += 8 ) this.colliders.push( { x: x + ax * k, z: z + az * k, r: 6.5 } );
			return { group: g, x, z, len, kind, winMat, memory: i < 3 ? i : - 1, woke: false };

		} );

		// 군함 돛대의 붉은 경고등
		const war = this.wrecks[ 2 ];
		this.warnLight = new THREE.Sprite( new THREE.SpriteMaterial( { color: 0xff3a3a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false } ) );
		this.warnLight.scale.setScalar( 3 );
		this.warnLight.position.set( - war.len * 0.08, 24, 0 );
		war.group.add( this.warnLight );

	}

	// 기억이 깨어난 배: 창에 불이 켜진다
	wake( wreck ) {

		wreck.woke = true;

	}

	// ---- 폭풍의 바다: 비, 번개, 가운데서 퍼져 나가는 큰 파도 ----
	buildStorm() {

		const S = DAWN_PLACES.storm;
		this.storm = { k: 0, power: 1, waves: [], timer: 1.5, flash: 4 };
		const n = 700;
		const pos = new Float32Array( n * 6 );
		for ( let i = 0; i < n; i ++ ) {

			const x = ( Math.random() - 0.5 ) * 120, y = Math.random() * 45, z = ( Math.random() - 0.5 ) * 120;
			pos.set( [ x, y, z, x - 0.5, y - 2.6, z ], i * 6 );

		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
		this.rainMat = new THREE.LineBasicMaterial( { color: 0xb8c8e0, transparent: true, opacity: 0, depthWrite: false } );
		this.rain = new THREE.LineSegments( geo, this.rainMat );
		this.rain.frustumCulled = false;
		this.group.add( this.rain );
		// 폭풍 가운데의 바위 (8번이 웅크린 곳)
		const rockMat = new THREE.MeshStandardMaterial( { color: 0x2c3038, roughness: 0.95, flatShading: true } );
		for ( let i = 0; i < 4; i ++ ) {

			const a = i / 4 * Math.PI * 2 + 0.4;
			const r = 4 + i % 2 * 2;
			const m = new THREE.Mesh( new THREE.DodecahedronGeometry( r, 0 ), rockMat );
			const x = S.x + Math.cos( a ) * 17, z = S.z + Math.sin( a ) * 17;
			m.position.set( x, - r * 0.4, z );
			m.scale.y = 1.4;
			m.rotation.set( a, a * 2, 0 );
			this.group.add( m );
			this.colliders.push( { x, z, r: r * 0.9 } );

		}

	}

	stormAt( x, z ) {

		const S = DAWN_PLACES.storm;
		return 1 - THREE.MathUtils.smoothstep( Math.hypot( x - S.x, z - S.z ), STORM_R * 0.7, STORM_R + 110 );

	}

	// 용기의 노래: delay초 뒤 헤이즐 자리에 닿는 큰 파도를 하나 보낸다 (판정은 노래 쪽에서 하므로 밀지는 않는다)
	sendWave( hazel, delay ) {

		const S = DAWN_PLACES.storm, st = this.storm;
		const d = Math.hypot( hazel.pos.x - S.x, hazel.pos.z - S.z );
		const r = Math.max( STORM_EYE, d - WAVE_SPEED * delay );
		const mesh = makeSurfaceDecal( { color: 0xe8f6ff, inner: 0.96, outer: 1, opacity: 0.9, lift: 0.6 } );
		mesh.position.set( S.x, 0, S.z );
		mesh.scale.setScalar( r );
		this.group.add( mesh );
		st.waves.push( { r, mesh, hit: true } );

	}

	// 바다가 화난다: 함대 위의 빛을 먹으면 남쪽 하늘로 먹구름이 몰려가고, 어디서든 비가 내리기 시작한다
	angerStorm() {

		this.storm.anger = 1;
		this.onLightning?.( 0.7 );

	}

	// 폭풍이 잦아든다 (8번이 함께 가기로 했을 때)
	calmStorm() {

		this.storm.power = 0.12;

	}

	updateStorm( dt, hazel, cam, active ) {

		const S = DAWN_PLACES.storm, st = this.storm;
		const target = Math.max( this.stormAt( hazel.pos.x, hazel.pos.z ), ( st.anger ?? 0 ) * 0.4 ) * st.power;
		st.k += ( target - st.k ) * Math.min( 1, dt * 0.8 );
		// 비
		this.rainMat.opacity = Math.min( 0.55, st.k * 0.7 );
		this.rain.visible = st.k > 0.02;
		if ( this.rain.visible ) {

			const a = this.rain.geometry.attributes.position;
			for ( let i = 0; i < a.count; i += 2 ) {

				let y = a.getY( i ) - dt * 38;
				let x = a.getX( i ) - dt * 7;
				if ( y < - 2 ) {

					y += 47;
					x += 7 * 47 / 38;

				}

				a.setXYZ( i, x, y, a.getZ( i ) );
				a.setXYZ( i + 1, x - 0.5, y - 2.6, a.getZ( i + 1 ) );

			}

			a.needsUpdate = true;
			this.rain.position.set( Math.round( cam.x / 60 ) * 60, 0, Math.round( cam.z / 60 ) * 60 );

		}

		// 번개
		if ( st.k > 0.55 ) {

			st.flash -= dt;
			if ( st.flash <= 0 ) {

				st.flash = 4 + Math.random() * 6;
				this.onLightning?.( st.k );

			}

		}

		// 큰 파도: 가운데서 둥글게 퍼져 나간다. 헤이즐 자리를 지날 때 공중에 있지 않으면 밀려난다
		const d = Math.hypot( hazel.pos.x - S.x, hazel.pos.z - S.z );
		if ( st.power > 0.5 && ! st.manual && d < STORM_R + 40 ) {

			st.timer -= dt;
			if ( st.timer <= 0 ) {

				st.timer = WAVE_EVERY;
				const mesh = makeSurfaceDecal( { color: 0xe8f6ff, inner: 0.96, outer: 1, opacity: 0.9, lift: 0.6 } );
				mesh.position.set( S.x, 0, S.z );
				mesh.scale.setScalar( STORM_EYE );
				this.group.add( mesh );
				st.waves.push( { r: STORM_EYE, mesh, hit: false } );

			}

		}

		for ( const w of st.waves ) {

			const before = w.r;
			w.r += WAVE_SPEED * dt;
			w.mesh.scale.setScalar( w.r );
			w.mesh.material.uniforms.uOpacity.value = 0.9 * ( 1 - THREE.MathUtils.smoothstep( w.r, STORM_R - 40, STORM_R + 30 ) ) * Math.min( 1, st.power * 1.5 );
			if ( ! w.hit && before < d && w.r >= d ) {

				w.hit = true;
				if ( active && d > STORM_EYE ) {

					if ( hazel.airborne ) this.onWaveClear?.(); // 뛰어넘었다
					else this.onWave?.( { x: ( hazel.pos.x - S.x ) / d, z: ( hazel.pos.z - S.z ) / d } );

				}

			}

			// 함께 가는 고래들은 파도가 닿으면 저절로 뛰어넘는다
			for ( const v of Object.values( this.voices ) ) {

				if ( v.state !== 'follow' ) continue;
				const dv = Math.hypot( v.whale.pos.x - S.x, v.whale.pos.z - S.z );
				if ( before < dv && w.r >= dv && dv > STORM_EYE ) v.whale.breach( 13 );

			}

		}

		for ( const w of st.waves.filter( ( w ) => w.r > STORM_R + 30 ) ) {

			this.group.remove( w.mesh );
			w.mesh.material.dispose();

		}

		st.waves = st.waves.filter( ( w ) => w.r <= STORM_R + 30 );

	}

	// ---- 잊힌 등대: 섬 둘레의 노래 바위 셋 (루크가 뿔로 새긴 옛 고래들의 노래) ----
	buildStones() {

		const L = DAWN_PLACES.lighthouse;
		this.stoneGroup = new THREE.Group();
		this.stoneGroup.visible = false;
		this.group.add( this.stoneGroup );
		this.stones = [ 'hump', 'blue', 'sperm' ].map( ( kind, i ) => {

			const a = - 0.95 + i * 0.95; // 동쪽(헤이즐이 오는 쪽)으로 부채꼴
			const x = L.x + Math.cos( a ) * 40, z = L.z + Math.sin( a ) * 40;
			const mat = new THREE.MeshStandardMaterial( { color: 0x2a3446, roughness: 0.9, flatShading: true, emissive: 0x7fe9ff, emissiveIntensity: 0.3 } );
			const mesh = new THREE.Mesh( new THREE.CylinderGeometry( 1.4, 2.4, 9, 6 ), mat );
			mesh.position.set( x, 1.5, z );
			mesh.rotation.set( ( i - 1 ) * 0.12, a, 0.08 );
			this.stoneGroup.add( mesh );
			// 새긴 선: 바위를 두른 가는 고리 셋
			const ringMat = new THREE.MeshBasicMaterial( { color: 0x7fe9ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false } );
			for ( let k = 0; k < 3; k ++ ) {

				const ring = new THREE.Mesh( new THREE.TorusGeometry( 1.95 - k * 0.2, 0.06, 4, 20 ), ringMat );
				ring.rotation.x = Math.PI / 2;
				ring.position.y = - 1.5 + k * 1.6;
				mesh.add( ring );

			}

			const st = {
				kind, index: i, x, z, pos: { x, z }, mat, ringMat, done: false, glow: 0,
				setGlow( v ) {

					this.glow = v;

				}
			};
			return st;

		} );

	}

	// 노래 바위가 깨어났다: 금빛으로
	restoreStone( st ) {

		st.done = true;
		st.mat.emissive.set( 0xc07830 );
		st.ringMat.color.set( 0xffd36b );

	}

	showStones() {

		if ( this.stoneGroup.visible ) return;
		this.stoneGroup.visible = true;
		for ( const st of this.stones ) this.colliders.push( { x: st.x, z: st.z, r: 3 } );

	}

	// ---- 해안 도시: 해가 뜨는 쪽(동쪽)의 인간 도시. 불 켜진 건물, 방파제, 항구의 배, 바다를 훑는 탐조등 ----
	buildCity() {

		const g = new THREE.Group();
		this.city = g;
		this.group.add( g );
		// 땅: 해안선 동쪽 전부
		const land = new THREE.Mesh( new THREE.BoxGeometry( 600, 6, 2200 ), new THREE.MeshStandardMaterial( { color: 0x1a2030, roughness: 1, flatShading: true } ) );
		land.position.set( SHORE_X + 300, - 1, 240 );
		g.add( land );
		const wall = new THREE.Mesh( new THREE.BoxGeometry( 6, 8, 2200 ), new THREE.MeshStandardMaterial( { color: 0x3a4250, roughness: 0.9 } ) );
		wall.position.set( SHORE_X + 2, 0, 240 );
		g.add( wall );

		// 건물: 창마다 따뜻한 불빛이 있는 상자들 (하나의 InstancedMesh)
		const c = document.createElement( 'canvas' );
		c.width = 64; c.height = 128;
		const x = c.getContext( '2d' );
		x.fillStyle = '#0c1018'; x.fillRect( 0, 0, 64, 128 );
		for ( let row = 0; row < 16; row ++ ) for ( let col = 0; col < 8; col ++ ) {

			const r = Math.random();
			x.fillStyle = r < 0.42 ? '#ffcf7a' : r < 0.5 ? '#9fd4ff' : '#161c28';
			x.fillRect( col * 8 + 2, row * 8 + 2, 4, 4 );

		}

		const tex = new THREE.CanvasTexture( c );
		tex.encoding = THREE.sRGBEncoding;
		tex.magFilter = THREE.NearestFilter;
		const mat = new THREE.MeshStandardMaterial( { map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.8 } );
		const N = 170;
		const blocks = new THREE.InstancedMesh( new THREE.BoxGeometry( 1, 1, 1 ), mat, N );
		const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
		for ( let i = 0; i < N; i ++ ) {

			const z = - 420 + Math.random() * 1320;
			const depth = Math.random();
			const h = ( 10 + Math.pow( Math.random(), 2 ) * 55 ) * ( 0.6 + depth * 0.7 );
			s.set( 10 + Math.random() * 14, h, 10 + Math.random() * 16 );
			p.set( SHORE_X + 26 + depth * 230, h / 2 + 1, z );
			q.setFromAxisAngle( _up, ( Math.random() - 0.5 ) * 0.2 );
			blocks.setMatrixAt( i, m.compose( p, q, s ) );

		}

		g.add( blocks );

		// 항구의 배 둘 (불이 켜져 있다)
		const hull = new THREE.MeshStandardMaterial( { color: 0x6a7380, roughness: 0.6, metalness: 0.4 } );
		const lit = new THREE.MeshBasicMaterial( { color: 0xffd08a } );
		for ( const [ z, len ] of [ [ 120, 60 ], [ 380, 46 ] ] ) {

			const ship = new THREE.Group();
			const b = new THREE.Mesh( new THREE.BoxGeometry( 11, 6, len ), hull );
			ship.add( b );
			const top = new THREE.Mesh( new THREE.BoxGeometry( 7, 5, len * 0.3 ), hull );
			top.position.set( 0, 5, - len * 0.1 );
			ship.add( top );
			for ( let k = 0; k < 5; k ++ ) {

				const w = new THREE.Mesh( new THREE.BoxGeometry( 0.2, 0.9, 0.9 ), lit );
				w.position.set( 3.6, 5.5, - len * 0.2 + k * 1.8 );
				ship.add( w );

			}

			ship.position.set( SHORE_X - 22, 0.5, z );
			g.add( ship );
			this.colliders.push( { x: SHORE_X - 22, z, r: 8 }, { x: SHORE_X - 22, z: z + len * 0.3, r: 8 }, { x: SHORE_X - 22, z: z - len * 0.3, r: 8 } );

		}

		// 바다를 훑는 탐조등 셋 (인간들도 바다를 두려워한다)
		const beamMat = new THREE.MeshBasicMaterial( { color: 0xfff0c8, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide } );
		const beamGeo = new THREE.ConeGeometry( 16, 340, 20, 1, true );
		beamGeo.translate( 0, - 170, 0 );
		beamGeo.rotateZ( Math.PI / 2 - 0.08 );
		this.searchlights = [ - 120, 240, 600 ].map( ( z, i ) => {

			const pivot = new THREE.Group();
			pivot.position.set( SHORE_X + 8, 22, z );
			const tower = new THREE.Mesh( new THREE.CylinderGeometry( 1.2, 2, 22, 8 ), hull );
			tower.position.y = - 11;
			pivot.add( tower );
			const beam = new THREE.Mesh( beamGeo, beamMat );
			beam.rotation.y = Math.PI; // 서쪽(바다)으로
			const arm = new THREE.Group();
			arm.add( beam );
			pivot.add( arm );
			g.add( pivot );
			return { arm, phase: i * 2.1 };

		} );

	}

	// ---- 샤먼의 진군: 해안을 향해 줄지어 선 연합군. 북소리마다 한꺼번에 나아가고, 샤먼에게서 붉은 북소리 고리가 퍼진다 ----
	buildArmy( shaman ) {

		if ( this.army ) return;
		const A = DAWN_PLACES.army;
		this.army = [];
		this.shaman = shaman;
		for ( let row = 0; row < 3; row ++ ) for ( let i = 0; i < 9; i ++ ) {

			const w = new Whale( this.models.orca, { name: 'orca', length: 10, ride: 0.42, freq: 3, amp: 0.05 } );
			const home = { x: A.x - row * 16, z: A.z + ( i - 4 ) * 15 + ( row % 2 ) * 7 };
			w.place( home.x, home.z, Math.PI / 2 ); // 해안(동쪽)을 본다
			this.group.add( w.root );
			this.army.push( { whale: w, home, lunge: 0, row } );
			this.colliders.push( { x: home.x, z: home.z, r: 4.5 } );

		}

		this.march = { on: true, beat: 0, timer: 0.5, rings: [], k: 0 };

	}

	// 교향곡: 목소리가 모일수록 연합군이 하나둘 북에서 풀려난다 (frac 0 ~ 1)
	freeArmy( frac ) {

		const n = Math.round( this.army.length * frac );
		this.army.forEach( ( o, i ) => {

			if ( ! o.free && ( ( i * 7 ) % this.army.length ) < n ) {

				o.free = true;
				this.onFreed?.( o.whale.pos );

			}

		} );

	}

	// 북에 맞춰 누르면 아직 묶인 고래들이 한꺼번에 움찔 나아간다
	armyFlinch() {

		for ( const o of this.army ) if ( ! o.free ) o.lunge = 1;

	}

	// 클로징: 북에서 풀려난 연합군이 헤이즐 뒤에 넓게 퍼져 함께 헤엄친다
	closingSwim() {

		this.closing = true;
		// 이제 누구의 명령도 아니다: 셋 중 둘은 제 자리를 골라 함께 헤엄치고, 나머지는 저마다의 바다로
		( this.army ?? [] ).forEach( ( o, i ) => {

			if ( i % 3 === 2 ) {

				const a = Math.random() * Math.PI * 2;
				o.slot = null;
				o.leaveTo = { x: o.whale.pos.x - Math.abs( Math.cos( a ) ) * 600, z: o.whale.pos.z + Math.sin( a ) * 600 };
				return;

			}

			o.leaveTo = null;
			o.slot = { x: ( Math.random() - 0.5 ) * 130, z: - 40 - Math.random() * 70 };

		} );

	}

		// 새벽: 모두 저마다의 바다로 흩어진다
	scatterArmy() {

		for ( const o of this.army ) {

			const a = Math.random() * Math.PI * 2;
			o.leaveTo = { x: o.home.x - Math.abs( Math.cos( a ) ) * 600, z: o.home.z + Math.sin( a ) * 600 }; // 해안(동쪽) 말고 바다 쪽으로

		}

	}

	// 북 한 번: 네 박마다 모두가 한꺼번에 나아가고 붉은 고리, 열여섯 박마다 다 함께 뛰어오른다
	// silent: 북소리는 음악의 박자에 맞춰 이미 걸어 두었다
	marchBeat( silent = false ) {

		const mc = this.march, sh = this.shaman;
		if ( ! mc ) return;
		mc.beat ++;
		if ( ! silent && mc.k > 0.02 ) this.onDrum?.( mc.k, mc.beat % 4 === 0 );
		if ( mc.beat % 4 === 0 ) {

			for ( const o of this.army ) o.lunge = 1;
			if ( mc.on && mc.k > 0.05 ) {

				const mesh = makeSurfaceDecal( { color: 0xff3355, inner: 0.95, outer: 1, opacity: 0.9, lift: 0.5 } );
				mesh.position.set( sh.pos.x, 0, sh.pos.z );
				mesh.scale.setScalar( 8 );
				this.group.add( mesh );
				mc.rings.push( { r: 8, x: sh.pos.x, z: sh.pos.z, mesh, hit: false } );

			}

		}

		if ( mc.beat % 16 === 0 && mc.k > 0.05 ) for ( const o of this.army ) o.whale.breach( 15 );

	}

	updateMarch( dt, hazel, active, sangAt, time ) {

		const mc = this.march, sh = this.shaman;
		if ( ! mc ) return;
		const d0 = Math.hypot( hazel.pos.x - DAWN_PLACES.army.x, hazel.pos.z - DAWN_PLACES.army.z );
		mc.k = 1 - THREE.MathUtils.smoothstep( d0, 160, 520 ); // 가까울수록 북소리가 크다
		// 북: 박자마다 둥 (marchBeat). 배경 음악의 박자에 맞춰 main이 부른다 (beatSync). 음악이 없을 때만 따로 센다
		if ( ! this.beatSync ) {

			mc.timer -= dt;
			if ( mc.timer <= 0 ) {

				mc.timer += BEAT;
				this.marchBeat();

			}

		}

		for ( const o of this.army ) {

			const w = o.whale;
			if ( this.closing && o.slot ) {

				followSlot( w, hazel, o.slot, dt, 14 );
				w.depth += ( 0 - w.depth ) * Math.min( 1, dt );
				w.update( dt );
				continue;

			}

			if ( o.leaveTo ) {

				// 흩어진다: 저마다의 바다로
				steerTo( w, o.leaveTo.x, o.leaveTo.z, 8, dt, 1.2 );
				if ( Math.hypot( w.pos.x - hazel.pos.x, w.pos.z - hazel.pos.z ) > 420 ) w.root.visible = false;
				w.update( dt );
				continue;

			}

			if ( o.free ) {

				// 북에서 풀려난 고래: 더는 박자에 맞춰 나아가지 않고, 제멋대로 고개를 돌린다
				o.lunge = 0;
				w.yaw += Math.sin( time * 0.3 + o.home.z ) * dt * 0.4;
				w.speed *= 0.95;
				w.update( dt );
				continue;

			}

			o.lunge = Math.max( 0, o.lunge - dt * 1.6 );
			const surge = Math.sin( Math.min( 1, 1 - o.lunge ) * Math.PI ) * 3.5;
			w.pos.x += ( o.home.x + surge - w.pos.x ) * Math.min( 1, dt * 6 );
			w.pos.z += ( o.home.z - w.pos.z ) * Math.min( 1, dt * 6 );
			w.yaw = Math.PI / 2;
			w.speed = o.lunge * 6;
			w.update( dt );

		}

		// 북소리 고리: 헤이즐 자리를 지날 때 막 노래했으면 버티고, 아니면 밀려난다
		for ( const r of mc.rings ) {

			const d = Math.hypot( hazel.pos.x - r.x, hazel.pos.z - r.z );
			const before = r.r;
			r.r += DRUM_SPEED * dt;
			r.mesh.scale.setScalar( r.r );
			r.mesh.material.uniforms.uOpacity.value = 0.9 * ( 1 - THREE.MathUtils.smoothstep( r.r, DRUM_R - 40, DRUM_R ) );
			if ( ! r.hit && before < d && r.r >= d ) {

				r.hit = true;
				const dir = { x: ( hazel.pos.x - r.x ) / Math.max( d, 0.01 ), z: ( hazel.pos.z - r.z ) / Math.max( d, 0.01 ) };
				if ( active && d > 6 ) {

					if ( time - sangAt < SING_WINDOW ) this.onDrumBlock?.( dir );
					else this.onDrumHit?.( dir );

				}

			}

		}

		for ( const r of mc.rings.filter( ( r ) => r.r > DRUM_R ) ) {

			this.group.remove( r.mesh );
			r.mesh.material.dispose();

		}

		mc.rings = mc.rings.filter( ( r ) => r.r <= DRUM_R );

	}

	// ---- 만나는 고래: 12번(얼어붙은 항로) · 9번(침몰한 함대) · 8번(폭풍의 바다) ----
	// state: idle(제자리를 맴돈다) · face(헤이즐을 본다) · follow(따라온다) · leave(제 길로 떠난다)
	makeVoice( key, { home, length = 9, recolor, radius = 9, speed = 4.5, spout = false } ) {

		const w = new Whale( this.models.orca, { name: key, length, ride: 0.42, freq: 3.2, amp: 0.06, recolor, emissive: 0.4 } );
		w.place( home.x + radius, home.z, 0 );
		this.group.add( w.root );
		const v = { key, whale: w, home, radius, speed, state: 'idle', angle: 0, spout: spout ? 3 : - 1 };
		this.voices[ key ] = v;
		return v;

	}

	// 12번(얼음 웅덩이) · 9번(가라앉은 배 사이를 거칠게) · 8번(폭풍 가운데 바위 곁에 웅크린 어린 고래)
	makeVoices() {

		this.makeVoice( 'twelve', { home: P, recolor: [ 0x1c2a3a, 0xdce9f6 ], spout: true } );
		this.makeVoice( 'nine', { home: DAWN_PLACES.fleet, radius: 42, speed: 11, recolor: [ 0x2a1616, 0xd8b4a8 ] } );
		const S = DAWN_PLACES.storm;
		this.makeVoice( 'eight', { home: { x: S.x + 6, z: S.z }, radius: 4, speed: 1.6, length: 6.5, recolor: [ 0x183040, 0xe4f2fa ] } );

	}

	get twelve() {

		return this.voices.twelve;

	}

	updateVoice( v, dt, hazel ) {

		const w = v.whale;
		if ( v.state === 'idle' ) {

			// 제자리를 맴돈다 (12번은 가끔 숨을 내뿜고, 9번은 배 사이를 거칠게, 8번은 바위 곁에 웅크려 떤다)
			v.angle += dt * v.speed / v.radius;
			steerTo( w, v.home.x + Math.cos( v.angle ) * v.radius, v.home.z + Math.sin( v.angle ) * v.radius, v.speed, dt, 2.2 );
			if ( v.spout >= 0 ) {

				v.spout -= dt;
				if ( v.spout <= 0 ) {

					v.spout = 5 + Math.random() * 3;
					this.onSpout?.( w.pos );

				}

			}

			if ( v.key === 'eight' ) w.depth = 0.7 + Math.sin( this.time * 3 ) * 0.4;

		} else if ( v.state === 'come' ) {

			// 헤이즐 앞으로 다가온다
			if ( steerTo( w, hazel.pos.x + hazel.forward.x * 16, hazel.pos.z + hazel.forward.z * 16, 11, dt, 2.5 ) < 4 ) v.state = 'face';
			this.collide( w.pos, 3 );

		} else if ( v.state === 'face' ) {

			w.speed *= 0.9;
			const ty = Math.atan2( hazel.pos.x - w.pos.x, hazel.pos.z - w.pos.z );
			w.yaw += Math.atan2( Math.sin( ty - w.yaw ), Math.cos( ty - w.yaw ) ) * Math.min( 1, dt * 1.5 );

		} else if ( v.state === 'follow' ) {

			// 듣는 노래: 헤이즐 옆에서, 이끄는 노래: 헤이즐 뒤 한 줄로
			w.depth += ( 0 - w.depth ) * Math.min( 1, dt );
			followSlot( w, hazel, v.slot, dt, 50 );
			this.collide( w.pos, 3 );

		} else if ( v.state === 'leave' ) {

			// 혼자의 길: dive면 잠수해서, 아니면 수면으로 멀리
			if ( v.dive ) {

				w.depth += ( 9 - w.depth ) * Math.min( 1, dt * 0.5 );
				w.setOpacity( Math.max( 0, 1 - w.depth / 9 ) );
				if ( w.depth > 8.5 ) w.root.visible = false;

			}

			steerTo( w, v.to.x, v.to.z, 12, dt, 1.2 );
			if ( Math.hypot( w.pos.x - hazel.pos.x, w.pos.z - hazel.pos.z ) > 380 ) w.root.visible = false;

		}

		w.update( dt );

	}

	update( dt, t, { hazel, cam, active = true, sangAt = - 99 } ) {

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
		const leaping = new Set( this.leapers.map( ( l ) => l.whale ) );
		if ( leaping.size ) this.updateLeap( dt );
		for ( const o of this.alliance ) {

			const w = o.whale;
			if ( ! w.root.visible ) continue;
			if ( leaping.has( w ) ) {

				// 뛰어오르는 중: 위치는 updateLeap이 정한다

			} else if ( o.target ) {

				o.delay -= dt;
				if ( o.delay <= 0 ) {

					w.depth += ( 0 - w.depth ) * Math.min( 1, dt );
					if ( steerTo( w, o.target.x, o.target.z, o.speed, dt, 1.4 ) < 20 ) w.root.visible = false;
					if ( Math.hypot( w.pos.x - hazel.pos.x, w.pos.z - hazel.pos.z ) > 420 ) w.root.visible = false;

				}

			} else w.speed *= 0.95;

			w.update( dt );

		}

		// 얼음의 약한 곳: 숨 쉬듯 빛난다
		for ( const c of this.cracks ?? [] ) if ( ! c.done ) {

			const k = 0.6 + Math.sin( t * 3 + c.x ) * 0.3;
			c.ring.material.uniforms.uOpacity.value = k;
			c.glow.material.opacity = k;

		}

		// 함대: 깨어난 배의 창이 따뜻하게 일렁이고, 군함엔 붉은 경고등
		for ( const wr of this.wrecks ) if ( wr.woke ) wr.winMat.color.setRGB( 1, 0.72 + Math.sin( t * 3 + wr.x ) * 0.06, 0.4 ).multiplyScalar( 0.85 + Math.sin( t * 2.1 + wr.z ) * 0.15 );
		this.warnLight.material.opacity = Math.max( 0, Math.sin( t * 2.4 ) ) * 0.9;

		// 노래 바위: 아직이면 숨 쉬듯 희미하게, 노래할 땐 밝게, 깨어나면 금빛
		if ( this.stoneGroup.visible ) for ( const st of this.stones ) {

			const base = st.done ? 0.5 + Math.sin( t * 1.2 + st.index ) * 0.08 : 0.35 + Math.sin( t * 1.8 + st.index ) * 0.2;
			st.mat.emissiveIntensity = base + st.glow * 1.4;
			st.ringMat.opacity = Math.min( 0.85, ( st.done ? 0.6 : 0.4 ) + st.glow * 0.5 );

		}

		// 폭풍
		this.updateStorm( dt, hazel, cam, active );

		// 해안 도시의 탐조등, 샤먼의 진군
		for ( const sl of this.searchlights ) sl.arm.rotation.y = Math.sin( t * 0.25 + sl.phase ) * 0.7;
		this.updateMarch( dt, hazel, active, sangAt, t );

		// 만나는 고래들
		for ( const v of Object.values( this.voices ) ) if ( v.whale.root.visible ) this.updateVoice( v, dt, hazel );

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
// 폭풍 속에선 어둡고 짙어진다
export function frostFog( fog, base, frost, ocean, storm = 0 ) {

	fog.color.copy( base ).lerp( ICE_FOG, frost * 0.25 ).lerp( STORM_FOG, storm * 0.7 );
	fog.density = 0.00105 * ( 1 + frost * 1.6 + storm * 2.2 );
	ocean.uniforms.uFogDensity.value = fog.density; // 바다 셰이더는 값을 따로 들고 있다

}

