// MAP 2 · 바다 생물: 깊이마다 사는 물고기 떼 · 해파리 · 실러캔스 · 바닥의 게와 성게
// 모델: data/polyfork (Polyfork 무료 로우폴리, Meshopt 압축). 무거워서 포털이 열릴 때 따로 불러온다
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { trenchCenter, trenchRadius, FLOOR_DEPTH } from './map2.js';

const DIR = 'data/polyfork/';

// 종류마다: 파일, 게임 속 길이(헤이즐 = 10), 어디서 어떻게 사는지
// school: 떼 지어 협곡을 돈다 · cruise: 혼자 천천히 돈다 · drift: 둥둥 떠 있다 · floor: 바닥에 산다
const SPECIES = {
	blueTang: { file: 'blue-tang-base.glb', size: 2.5 },
	yellowTang: { file: 'yellow-tang-base.glb', size: 2.4 },
	chromis: { file: 'chromis-base.glb', size: 2 },
	clownfish: { file: 'clownfish-base.glb', size: 2 },
	angelfish: { file: 'angelfish-base.glb', size: 2.5 },
	rabbitfish: { file: 'rabbitfish-base.glb', size: 2.7 },
	firefish: { file: 'firefish-goby-18d0dd.glb', size: 2.2 },
	mandarin: { file: 'mandarin-dragonet-base.glb', size: 2 },
	cardinalfish: { file: 'cardinalfish-base.glb', size: 2.2 },
	reefFish: { file: 'reef-fish-base.glb', size: 3.7 },
	stingray: { file: 'stingray-1ba637.glb', size: 6 },
	grouper: { file: 'grouper-base.glb', size: 5 },
	barracuda: { file: 'barracuda-base.glb', size: 4 },
	shark: { file: 'reef-shark-base.glb', size: 7 },
	jelly: { file: 'moon-jellyfish-0fa43c.glb', size: 4, glow: 1.3 },
	coelacanth: { file: 'coelacanth-base.glb', size: 6, glow: 0.18 },
	shoreCrab: { file: 'shore-crab-base.glb', size: 3.2, glow: 0.15 },
	reefCrab: { file: 'reef-crab-base.glb', size: 4.2, glow: 0.15 },
	hermit: { file: 'blue-leg-hermit-crab-ce7b41.glb', size: 3.5, glow: 0.15 },
	urchin: { file: 'sea-urchin-base.glb', size: 4.2, glow: 0.12 },
	starfish: { file: 'starfish-772749.glb', size: 2.9, glow: 0.15 },
	linckia: { file: 'blue-linckia-starfish-e07dd3.glb', size: 2.6, glow: 0.15 },
	shrimp: { file: 'skunk-cleaner-shrimp-95e351.glb', size: 1.9, glow: 0.2 },
	eel: { file: 'moray-eel-base.glb', size: 5.5, glow: 0.12 } // 위협: 벽 틈에 숨은 곰치
};

// 어디에 몇 마리: [ 종류, 방식, 깊이(m), 마릿수 ]
const PLACES = [
	// 햇빛층: 알록달록한 떼
	[ 'blueTang', 'school', 10, 8 ],
	[ 'yellowTang', 'school', 16, 8 ],
	[ 'chromis', 'school', 24, 10 ],
	[ 'clownfish', 'school', 13, 5 ],
	[ 'angelfish', 'school', 30, 5 ],
	[ 'rabbitfish', 'school', 36, 6 ],
	[ 'firefish', 'school', 20, 5 ],
	[ 'mandarin', 'school', 34, 4 ],
	// 어스름층: 큰 물고기
	[ 'cardinalfish', 'school', 48, 7 ],
	[ 'reefFish', 'school', 58, 5 ],
	[ 'stingray', 'cruise', 50, 1 ],
	[ 'grouper', 'cruise', 75, 1 ],
	[ 'barracuda', 'school', 95, 6 ],
	[ 'shark', 'cruise', 110, 1 ],
	[ 'shark', 'cruise', 130, 1 ],
	// 한밤층: 빛나는 해파리
	[ 'jelly', 'drift', 140, 5 ],
	[ 'jelly', 'drift', 175, 6 ],
	[ 'jelly', 'drift', 225, 5 ],
	// 해구: 살아 있는 화석
	[ 'coelacanth', 'cruise', 255, 1 ],
	[ 'coelacanth', 'cruise', 295, 1 ],
	// 맨 밑 바닥
	[ 'shoreCrab', 'floor', FLOOR_DEPTH, 5 ],
	[ 'reefCrab', 'floor', FLOOR_DEPTH, 2 ],
	[ 'hermit', 'floor', FLOOR_DEPTH, 2 ],
	[ 'urchin', 'floor', FLOOR_DEPTH, 4 ],
	[ 'starfish', 'floor', FLOOR_DEPTH, 4 ],
	[ 'linckia', 'floor', FLOOR_DEPTH, 4 ],
	[ 'shrimp', 'floor', FLOOR_DEPTH, 4 ]
];

// 곰치가 숨어 있는 깊이. 햇빛층은 안전하고, 어스름층부터 벽을 따라 숨어 있다
const EELS = [ 46, 68, 92, 118, 142, 168, 196, 226, 258, 288 ];
const EEL_SENSE = 11; // 헤이즐이 이만큼 다가오면 노린다
const EEL_TELL = 0.55; // 튀어나오기 전 몸을 떠는 시간 (피할 틈)
const EEL_REACH = 8; // 튀어나오는 거리
const EEL_BITE = 4; // 이 안이면 물린다

const JELLY_TOUCH = 5; // 해파리 갓에 이만큼 닿으면 하트 회복
const JELLY_COOL = 30; // 빛을 나눠 준 해파리가 다시 빛나기까지 (초)

const SHOW_RANGE = 55; // 카메라와 높이 차이가 이보다 크면 숨기고 움직이지도 않는다

export function loadSealife( base ) {

	const loader = new GLTFLoader();
	loader.setMeshoptDecoder( MeshoptDecoder );
	return Promise.all( Object.entries( SPECIES ).map( ( [ key, s ] ) =>
		loader.loadAsync( base + DIR + s.file ).then( ( gltf ) => [ key, gltf ] ).catch( () => [ key, null ] )
	) ).then( ( list ) => Object.fromEntries( list ) );

}

const _far = new THREE.Vector3( 1e5, 0, 0 );
const _v = new THREE.Vector3(), _c = new THREE.Vector2(), _box = new THREE.Box3(), _size = new THREE.Vector3();

export class Sealife {

	constructor( models, parent, entry ) {

		this.group = new THREE.Group();
		this.group.name = 'sealife';
		this.entry = entry;
		this.groups = [];
		this.met = new Set();
		this.onMeet = null;
		this.onHeal = null; // 해파리에 닿았을 때 ( 위치 ) → 하트가 찼으면 true
		this.onBite = null; // 곰치에게 물렸을 때 ( 곰치 위치 )
		this.eels = [];

		// 종류마다 크기 · 재질을 한 번만 맞춘다 (복제본은 같은 재질을 같이 쓴다)
		const proto = {};
		for ( const [ key, gltf ] of Object.entries( models ) ) {

			if ( ! gltf ) continue;
			const s = SPECIES[ key ];
			_box.setFromObject( gltf.scene ).getSize( _size );
			const scale = s.size / Math.max( _size.x, _size.y, _size.z );
			const mats = new Set();
			gltf.scene.traverse( ( o ) => {

				if ( ! o.isMesh ) return;
				o.frustumCulled = false; // 뼈로 움직이는 메시는 상자가 맞지 않아 잘려 보일 수 있다
				[ o.material ].flat().forEach( ( m ) => mats.add( m ) );

			} );
			// 깊은 곳은 빛이 거의 없어서, 스스로 조금 빛나야 보인다
			if ( s.glow ) for ( const m of mats ) {

				if ( key !== 'jelly' ) m.emissive?.set( 0x6f8fa8 );
				m.userData.glow = s.glow;
				m.emissiveIntensity = s.glow;

			}

			proto[ key ] = { gltf, scale, mats: [ ...mats ] };

		}

		this.proto = proto;
		for ( const [ key, mode, depth, count ] of PLACES ) if ( proto[ key ] ) this.place( key, mode, depth, count );
		if ( proto.eel ) EELS.forEach( ( d ) => this.placeEel( d ) );
		parent.add( this.group );

	}

	spawn( key ) {

		const { gltf, scale } = this.proto[ key ];
		const root = new THREE.Group();
		const body = cloneSkinned( gltf.scene );
		body.scale.setScalar( scale );
		root.add( body );
		this.group.add( root );
		const mixer = new THREE.AnimationMixer( body );
		const clips = Object.fromEntries( gltf.animations.map( ( a ) => [ a.name, a ] ) );
		const play = ( name, speed = 1 ) => {

			const clip = clips[ name ] ?? clips.Swim ?? clips.Idle ?? gltf.animations[ 0 ];
			if ( ! clip ) return;
			const a = mixer.clipAction( clip );
			a.time = Math.random() * clip.duration;
			a.timeScale = speed;
			a.play();
			return a;

		};

		return { root, body, mixer, play };

	}

	place( key, mode, depth, count ) {

		const R = trenchRadius( depth );
		const g = {
			key, mode, depth, members: [],
			angle: Math.random() * Math.PI * 2,
			radius: R * ( mode === 'school' ? 0.35 + Math.random() * 0.35 : 0.45 + Math.random() * 0.3 ),
			speed: mode === 'school' ? 3 + Math.random() * 2 : 2 + Math.random() * 1.5,
			dir: Math.random() < 0.5 ? 1 : - 1,
			phase: Math.random() * 10,
			scare: 0,
			push: new THREE.Vector3(),
			center: new THREE.Vector3(),
			visible: true
		};

		for ( let i = 0; i < count; i ++ ) {

			const f = this.spawn( key );
			const m = { ...f, phase: Math.random() * 10 };
			if ( mode === 'school' ) {

				m.offset = new THREE.Vector3( ( Math.random() - 0.5 ) * 10, ( Math.random() - 0.5 ) * 4, ( Math.random() - 0.5 ) * 10 );
				m.action = f.play( 'Swim', 0.8 + Math.random() * 0.4 );

			} else if ( mode === 'drift' ) {

				// 해파리: 협곡 여기저기, 위아래로 천천히
				const a = Math.random() * Math.PI * 2, r = Math.sqrt( Math.random() ) * R * 0.8;
				trenchCenter( this.entry, depth, _c );
				m.home = new THREE.Vector3( _c.x + Math.cos( a ) * r, - depth + ( Math.random() - 0.5 ) * 30, _c.y + Math.sin( a ) * r );
				m.root.position.copy( m.home );
				m.root.rotation.y = Math.random() * Math.PI * 2;
				m.action = f.play( 'Swim', 0.5 + Math.random() * 0.3 );
				// 빛을 나눠 준 해파리만 잠깐 흐려지도록 재질을 따로 쓴다
				m.mats = [];
				f.body.traverse( ( o ) => {

					if ( ! o.isMesh ) return;
					o.material = [ o.material ].flat().map( ( mat ) => mat.clone() );
					if ( o.material.length === 1 ) o.material = o.material[ 0 ];
					m.mats.push( ...[ o.material ].flat() );

				} );
				m.cool = 0;

			} else if ( mode === 'floor' ) {

				const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * R * 0.45; // 기지 문 둘레
				trenchCenter( this.entry, depth, _c );
				m.home = new THREE.Vector3( _c.x + Math.cos( a ) * r, - depth, _c.y + Math.sin( a ) * r );
				m.root.position.copy( m.home );
				m.root.rotation.y = Math.random() * Math.PI * 2;
				// 게는 옆으로 종종거리고, 나머지는 제자리에서 꼼지락
				m.walk = key === 'shoreCrab' || key === 'reefCrab' ? 2 + Math.random() * 2 : 0;
				m.action = f.play( m.walk ? ( key === 'shoreCrab' ? 'Walk Sideways' : 'Walk' ) : 'Idle', 0.8 + Math.random() * 0.4 );

			} else {

				m.action = f.play( 'Swim', 0.9 );

			}

			g.members.push( m );

		}

		if ( mode === 'school' || mode === 'cruise' ) this.swim( g, 0, 0, _far ); // 처음 자리에 놓아 둔다
		this.groups.push( g );

	}

	// 매 프레임. cam: 카메라 위치, hazel: 헤이즐 위치, flash: 노래(소나) 직후 1 → 0
	// active: 헤이즐을 움직일 수 있을 때만 곰치가 문다 (대화 · 컷신 · 리듬 중엔 숨어 있다)
	update( dt, t, cam, hazel, flash = 0, active = true ) {

		this.flash = flash;
		this.active = active;

		for ( const e of this.eels ) this.updateEel( e, dt, t, cam, hazel, active );

		// 노래하면 깊은 바다 생물이 잠깐 환하게 빛난다
		for ( const p of Object.values( this.proto ) ) for ( const m of p.mats ) if ( m.userData.glow ) m.emissiveIntensity = m.userData.glow * ( 1 + flash * 2.5 );

		for ( const g of this.groups ) {

			const near = Math.abs( - g.depth - cam.y ) < SHOW_RANGE + 20;
			if ( near !== g.visible ) {

				g.visible = near;
				for ( const m of g.members ) m.root.visible = near;

			}

			if ( ! near ) continue;
			if ( g.mode === 'school' || g.mode === 'cruise' ) this.swim( g, dt, t, hazel );
			else if ( g.mode === 'drift' ) this.drift( g, dt, t, hazel );
			else this.crawl( g, dt, t );
			for ( const m of g.members ) m.mixer.update( dt );

			// 처음 마주친 특별한 생물 (실러캔스 등)
			if ( ! this.met.has( g.key ) && g.mode !== 'floor' && g.members[ 0 ].root.position.distanceTo( hazel ) < 22 ) {

				this.met.add( g.key );
				this.onMeet?.( g.key );

			}

		}

	}

	// 협곡 중심을 둘레로 돈다. 헤이즐이 가까이 오면 떼가 흩어졌다가 다시 모인다
	swim( g, dt, t, hazel ) {

		g.angle += ( g.speed * ( 1 + g.scare * 1.5 ) / g.radius ) * dt * g.dir;
		const y = - g.depth + Math.sin( t * 0.3 + g.phase ) * 3;
		trenchCenter( this.entry, - y, _c );
		g.center.set( _c.x + Math.cos( g.angle ) * g.radius, y, _c.y + Math.sin( g.angle ) * g.radius );

		_v.subVectors( g.center, hazel );
		const d = _v.length();
		if ( d < 14 ) {

			g.scare = Math.min( 1, g.scare + dt * 3 );
			g.push.addScaledVector( _v.normalize(), dt * 12 * ( 1 - d / 14 ) );

		} else g.scare = Math.max( 0, g.scare - dt * 0.5 );

		g.push.multiplyScalar( Math.max( 0, 1 - dt * 0.4 ) );
		g.center.add( g.push );
		const yaw = g.angle + ( g.dir > 0 ? Math.PI / 2 : - Math.PI / 2 ); // 진행 방향
		const spread = 1 + g.scare * 1.6;

		for ( const m of g.members ) {

			const prev = _v.copy( m.root.position );
			if ( g.mode === 'school' ) {

				const ox = m.offset.x * spread, oz = m.offset.z * spread;
				const c = Math.cos( yaw ), s = Math.sin( yaw );
				m.root.position.set(
					g.center.x + ox * c - oz * s + Math.sin( t * 0.9 + m.phase ) * 0.6,
					g.center.y + m.offset.y * spread + Math.sin( t * 1.3 + m.phase ) * 0.4,
					g.center.z + ox * s + oz * c + Math.cos( t * 0.8 + m.phase ) * 0.6
				);

			} else m.root.position.copy( g.center );

			if ( m.action ) m.action.timeScale = 0.9 + g.scare * 1.6;
			// 지나온 길을 따라 머리를 돌린다 (+z가 머리)
			const dx = m.root.position.x - prev.x, dz = m.root.position.z - prev.z;
			if ( dx * dx + dz * dz > 1e-6 ) {

				const want = Math.atan2( dx, dz );
				let diff = want - m.root.rotation.y;
				diff = Math.atan2( Math.sin( diff ), Math.cos( diff ) );
				m.root.rotation.y += diff * Math.min( 1, dt * 5 );

			}

			if ( g.key === 'stingray' ) m.root.rotation.z = Math.sin( t * 1.6 + m.phase ) * 0.12; // 날개처럼 기울이며 활강

		}

	}

	// 해파리: 제자리에서 둥둥. 닿으면 빛을 나눠 하트 하나를 채워 주고, 한동안 흐려진다
	drift( g, dt, t, hazel ) {

		for ( const m of g.members ) {

			m.root.position.set( m.home.x + Math.sin( t * 0.2 + m.phase ) * 2, m.home.y + Math.sin( t * 0.45 + m.phase ) * 2.5, m.home.z + Math.cos( t * 0.17 + m.phase ) * 2 );
			m.root.rotation.y += dt * 0.1;
			m.cool = Math.max( 0, m.cool - dt );
			// 갓의 가운데 (모델의 원점은 촉수 끝)
			_v.copy( m.root.position ).y += 2.6;
			if ( ! m.cool && this.active && _v.distanceTo( hazel ) < JELLY_TOUCH && this.onHeal?.( _v ) ) m.cool = JELLY_COOL;
			const dim = m.cool ? 0.15 + 0.85 * ( 1 - m.cool / JELLY_COOL ) ** 3 : 1;
			for ( const mat of m.mats ) mat.emissiveIntensity = mat.userData.glow * ( 1 + ( this.flash ?? 0 ) * 2.5 ) * dim;

		}

	}

	// 바닥: 게는 옆으로 왔다 갔다
	crawl( g, dt, t ) {

		for ( const m of g.members ) {

			if ( ! m.walk ) continue;
			const k = Math.sin( t * 0.35 + m.phase ) * m.walk;
			const side = g.key === 'shoreCrab' ? m.root.rotation.y + Math.PI / 2 : m.root.rotation.y;
			m.root.position.set( m.home.x + Math.sin( side ) * k, m.home.y, m.home.z + Math.cos( side ) * k );

		}

	}

	// 곰치: 협곡 벽 틈에서 머리만 내밀고 있다
	placeEel( depth ) {

		const f = this.spawn( 'eel' );
		// 곰치마다 따로 빛나야 해서 재질을 복제한다
		const mats = [];
		f.body.traverse( ( o ) => {

			if ( ! o.isMesh ) return;
			o.material = o.material.clone();
			mats.push( o.material );

		} );
		const a = Math.random() * Math.PI * 2;
		trenchCenter( this.entry, depth, _c );
		const R = trenchRadius( depth ) - 1;
		const home = new THREE.Vector3( _c.x + Math.cos( a ) * R, - depth, _c.y + Math.sin( a ) * R );
		const facing = new THREE.Vector3( - Math.cos( a ), 0, - Math.sin( a ) ); // 협곡 안쪽
		f.root.position.copy( home );
		f.root.rotation.y = Math.atan2( facing.x, facing.z );
		const action = f.play( 'Idle', 0.8 );
		this.eels.push( { ...f, mats, home, facing, action, state: 'hide', t: 0, target: new THREE.Vector3(), glow: 0, visible: true } );

	}

	// 노래(소나)가 닿은 곰치는 잠깐 붉게 빛나서 어디 숨었는지 보인다
	reveal( pos, range = 80 ) {

		for ( const e of this.eels ) if ( e.home.distanceTo( pos ) < range ) e.glow = 4;

	}

	updateEel( e, dt, t, cam, hazel, active ) {

		const near = Math.abs( e.home.y - cam.y ) < SHOW_RANGE;
		if ( near !== e.visible ) e.root.visible = e.visible = near;
		if ( ! near ) return;
		e.mixer.update( dt );
		e.t += dt;
		e.glow = Math.max( 0, e.glow - dt );
		const head = _v.copy( e.home ).addScaledVector( e.facing, 2 );
		const dist = head.distanceTo( hazel );

		if ( e.state === 'hide' ) {

			e.root.position.copy( e.home ).addScaledVector( e.facing, Math.sin( t * 0.8 + e.home.x ) * 0.3 );
			if ( active && dist < EEL_SENSE ) {

				e.state = 'tell';
				e.t = 0;
				e.action.timeScale = 3;

			}

		} else if ( e.state === 'tell' ) {

			// 부르르 떨며 몸을 움츠린다: 피할 시간
			e.root.position.copy( e.home ).addScaledVector( e.facing, - 0.8 * ( e.t / EEL_TELL ) );
			e.root.position.x += Math.sin( e.t * 60 ) * 0.15;
			if ( e.t >= EEL_TELL ) {

				e.state = 'lunge';
				e.t = 0;
				// 헤이즐 쪽으로, 벽에서 EEL_REACH 만큼만
				e.target.subVectors( hazel, e.home );
				if ( e.target.length() > EEL_REACH ) e.target.setLength( EEL_REACH );
				e.target.add( e.home );
				e.bit = false;

			}

		} else if ( e.state === 'lunge' ) {

			const k = Math.min( 1, e.t / 0.22 );
			e.root.position.lerpVectors( e.home, e.target, 1 - ( 1 - k ) ** 3 );
			if ( ! e.bit && active && e.root.position.distanceTo( hazel ) < EEL_BITE ) {

				e.bit = true;
				this.onBite?.( e.root.position );

			}

			if ( e.t > 0.5 ) {

				e.state = 'back';
				e.t = 0;

			}

		} else if ( e.state === 'back' ) {

			const k = Math.min( 1, e.t / 1.2 );
			e.root.position.lerpVectors( e.target, e.home, k * k * ( 3 - 2 * k ) );
			if ( k >= 1 ) {

				e.state = 'rest';
				e.t = 0;
				e.action.timeScale = 0.8;

			}

		} else if ( e.state === 'rest' && e.t > 3.5 ) e.state = 'hide';

		// 노리는 중이거나 노래로 드러나면 붉게
		const alarm = e.state === 'tell' || e.state === 'lunge' ? 1 : e.state === 'back' ? Math.max( 0, 1 - e.t / 1.2 ) : 0;
		const glow = Math.max( alarm, Math.min( 1, e.glow ) );
		for ( const m of e.mats ) {

			m.emissive.setRGB( 0.4 + glow * 0.6, 0.45 - glow * 0.25, 0.55 - glow * 0.4 );
			m.emissiveIntensity = 0.12 + glow * 0.9;

		}

	}

}
