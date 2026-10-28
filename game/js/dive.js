// MAP 2 미리보기: 스텔라와 듀엣이 끝나면 열리는 포털, 그리고 바닷속 (잠수)
// 바닷속에서는 하늘과 수면 대신, 위에서 빛이 비치는 물 천장 · 떠다니는 입자 · 빛줄기 · 짙은 안개를 보여 준다
import * as THREE from 'three';

// 헤이즐이 오갈 수 있는 높이. 맵 2는 계속 내려가는 구조, 맨 밑은 박사의 기지
export const DIVE_TOP = - 3;
export const DIVE_BOTTOM = - 322; // 맵 2 기지 문 앞 (map2.js BASE_DEPTH + 4)

// 깊이 층: [ 시작 깊이(m), 안개 · 배경색, 안개 밀도, 입자 색 ]. 내려갈수록 어둡고 짙어진다
export const ZONES = [
	[ 0, 0x0a4a8a, 0.02, 0xbfe8ff ], // 햇빛층
	[ 40, 0x05285c, 0.026, 0x9fd0ff ], // 어스름층
	[ 120, 0x02122e, 0.032, 0xa98cff ], // 한밤층
	[ 250, 0x01060f, 0.04, 0x7fffd4 ] // 해구
].map( ( [ depth, fog, density, mote ] ) => ( { depth, fog: new THREE.Color( fog ).convertSRGBToLinear(), density, mote: new THREE.Color( mote ) } ) );

// 깊이 d(m)의 층 번호와, 다음 층으로 넘어가는 비율 (경계에서 부드럽게 섞는다)
export function zoneAt( d ) {

	let i = 0;
	while ( i < ZONES.length - 1 && d >= ZONES[ i + 1 ].depth ) i ++;
	const next = ZONES[ i + 1 ];
	const k = next ? THREE.MathUtils.smoothstep( d, next.depth - 15, next.depth ) : 0;
	return { i, k };

}

const _c = new THREE.Color();
const PARTICLES = 520;
const SHAFTS = 9;
const SPAN = 70; // 입자 · 빛줄기가 카메라 둘레에 퍼지는 범위

export class Dive {

	constructor( { scene, camera, fog, sky, ocean, world } ) {

		this.scene = scene;
		this.camera = camera;
		this.fog = fog;
		this.sky = sky;
		this.ocean = ocean;
		this.world = world;
		this.active = false;
		this.pulses = [];
		this.portal = null;

		this.group = new THREE.Group();
		this.group.visible = false;
		scene.add( this.group );

		// 물 천장: 아래에서 올려다본 수면. 멀어질수록 안개에 묻힌다
		this.ceiling = new THREE.Mesh(
			new THREE.PlaneGeometry( 1600, 1600 ),
			new THREE.MeshBasicMaterial( { color: 0x58b4f0, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false } )
		);
		this.ceiling.rotation.x = - Math.PI / 2;
		this.ceiling.position.y = - 0.3;
		this.group.add( this.ceiling );

		// 떠다니는 입자
		const pos = new Float32Array( PARTICLES * 3 );
		for ( let i = 0; i < PARTICLES; i ++ ) pos.set( [ ( Math.random() - 0.5 ) * SPAN, ( Math.random() - 0.5 ) * SPAN, ( Math.random() - 0.5 ) * SPAN ], i * 3 );
		const geo = new THREE.BufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
		this.motes = new THREE.Points( geo, new THREE.PointsMaterial( { color: 0xbfe8ff, size: 0.16, transparent: true, opacity: 0.7, depthWrite: false } ) );
		this.motes.frustumCulled = false;
		this.group.add( this.motes );

		// 위에서 내려오는 빛줄기
		this.shafts = [];
		const shaftGeo = new THREE.CylinderGeometry( 1.2, 4.5, 26, 16, 1, true );
		shaftGeo.translate( 0, - 13, 0 );
		for ( let i = 0; i < SHAFTS; i ++ ) {

			const m = new THREE.Mesh( shaftGeo, new THREE.MeshBasicMaterial( {
				color: 0x9fe2ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
			} ) );
			m.userData.off = new THREE.Vector2( ( Math.random() - 0.5 ) * SPAN, ( Math.random() - 0.5 ) * SPAN );
			m.userData.phase = Math.random() * Math.PI * 2;
			m.rotation.z = ( Math.random() - 0.5 ) * 0.25;
			this.shafts.push( m );
			this.group.add( m );

		}

	}

	// 수면 위에 빛나는 소용돌이를 연다
	openPortal( x, z ) {

		this.closePortal();
		const g = new THREE.Group();
		const glow = ( color, opacity ) => new THREE.MeshBasicMaterial( { color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide } );
		const outer = new THREE.Mesh( new THREE.TorusGeometry( 8, 0.45, 10, 64 ), glow( 0xb9a8ff, 0.9 ) );
		const inner = new THREE.Mesh( new THREE.TorusGeometry( 5, 0.3, 10, 48 ), glow( 0x7fe9ff, 0.8 ) );
		const disc = new THREE.Mesh( new THREE.CircleGeometry( 7.6, 48 ), glow( 0x6f5cff, 0.35 ) );
		for ( const m of [ outer, inner, disc ] ) m.rotation.x = - Math.PI / 2;
		const column = new THREE.Mesh( new THREE.CylinderGeometry( 6, 7.5, 60, 32, 1, true ), glow( 0x9d8cff, 0.08 ) );
		column.position.y = 30;
		g.add( outer, inner, disc, column );
		g.position.set( x, 0.6, z );
		this.scene.add( g );
		this.portal = { x, z, group: g, outer, inner };
		return this.portal;

	}

	closePortal() {

		if ( ! this.portal ) return;
		this.scene.remove( this.portal.group );
		this.portal = null;

	}

	// 바닷속으로: 하늘 · 수면을 숨기고 물속 안개와 빛으로 바꾼다
	enter() {

		if ( this.active ) return;
		this.active = true;
		this.saved = { color: this.fog.color.clone(), density: this.fog.density, background: this.scene.background };
		this.fog.color.copy( ZONES[ 0 ].fog );
		this.fog.density = ZONES[ 0 ].density;
		this.scene.background = this.fog.color.clone();
		this.sky.group.visible = false;
		this.ocean.mesh.visible = false;
		this.world.seabed.visible = false; // 맵 1의 얕은 해저는 치우고 계속 내려간다
		this.group.visible = true;
		this.closePortal();

	}

	exit() {

		if ( ! this.active ) return;
		this.active = false;
		this.fog.color.copy( this.saved.color );
		this.fog.density = this.saved.density;
		this.scene.background = this.saved.background;
		this.sky.group.visible = true;
		this.ocean.mesh.visible = true;
		this.world.seabed.visible = true;
		this.group.visible = false;

	}

	// 52Hz 노래: 깊은 곳에선 소나처럼 둘레를 잠깐 밝힌다 (퍼지는 빛의 공)
	pulse( pos ) {

		const m = new THREE.Mesh(
			new THREE.SphereGeometry( 1, 24, 16 ),
			new THREE.MeshBasicMaterial( { color: 0x7fe9ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false } )
		);
		m.position.copy( pos );
		this.scene.add( m );
		this.pulses.push( { m, age: 0 } );
		this.flash = 1;

	}

	update( dt, t, depth = 0 ) {

		if ( this.portal ) {

			this.portal.outer.rotation.z += dt * 0.6;
			this.portal.inner.rotation.z -= dt * 1.1;
			const s = 1 + Math.sin( t * 2.2 ) * 0.04;
			this.portal.group.scale.set( s, 1, s );

		}

		for ( let i = this.pulses.length - 1; i >= 0; i -- ) {

			const p = this.pulses[ i ];
			p.age += dt;
			p.m.scale.setScalar( 2 + p.age * 55 );
			p.m.material.opacity = 0.35 * Math.max( 0, 1 - p.age / 1.4 );
			if ( p.age > 1.4 ) {

				this.scene.remove( p.m );
				p.m.geometry.dispose();
				p.m.material.dispose();
				this.pulses.splice( i, 1 );

			}

		}

		if ( ! this.active ) return;
		const c = this.camera.position;

		// 깊이에 따라 층의 색 · 안개를 섞는다. 노래하면 잠깐 안개가 걷히고 밝아진다
		const { i: zi, k } = zoneAt( depth );
		const a0 = ZONES[ zi ], a1 = ZONES[ Math.min( zi + 1, ZONES.length - 1 ) ];
		this.flash = Math.max( 0, ( this.flash ?? 0 ) - dt * 0.8 );
		this.fog.color.copy( a0.fog ).lerp( a1.fog, k ).lerp( _c.set( 0x2a6fb0 ).convertSRGBToLinear(), this.flash * 0.5 );
		this.fog.density = THREE.MathUtils.lerp( a0.density, a1.density, k ) * ( 1 - this.flash * 0.45 );
		this.scene.background.copy( this.fog.color );
		this.motes.material.color.copy( a0.mote ).lerp( a1.mote, k );
		this.ceiling.visible = depth < 90;
		const shaftFade = THREE.MathUtils.clamp( 1 - depth / 70, 0, 1 ); // 빛줄기는 햇빛층에서만
		this.ceiling.position.x = c.x;
		this.ceiling.position.z = c.z;

		// 입자는 천천히 떠오르고, 카메라 둘레 상자를 벗어나면 반대편으로
		const a = this.motes.geometry.attributes.position;
		const half = SPAN / 2;
		for ( let i = 0; i < PARTICLES; i ++ ) {

			let x = a.getX( i ), y = a.getY( i ) + dt * 0.35, z = a.getZ( i );
			if ( x - c.x > half ) x -= SPAN; else if ( c.x - x > half ) x += SPAN;
			if ( z - c.z > half ) z -= SPAN; else if ( c.z - z > half ) z += SPAN;
			if ( y - c.y > half ) y -= SPAN; else if ( c.y - y > half ) y += SPAN;
			if ( y > - 1 ) y -= SPAN;
			a.setXYZ( i, x, y, z );

		}

		a.needsUpdate = true;

		for ( const m of this.shafts ) {

			m.position.set( c.x + m.userData.off.x, 0, c.z + m.userData.off.y );
			// 카메라가 빛줄기 안에 들어가면 화면이 뿌옇게 덮이니까 가까울수록 흐리게
			const near = Math.min( 1, Math.hypot( m.userData.off.x, m.userData.off.y ) / 25 );
			m.material.opacity = ( 0.02 + 0.02 * Math.sin( t * 0.7 + m.userData.phase ) ** 2 ) * near * shaftFade;

		}

	}

}
