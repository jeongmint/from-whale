// MAP 2 미리보기: 스텔라와 듀엣이 끝나면 열리는 포털, 그리고 바닷속 (잠수)
// 바닷속에서는 하늘과 수면 대신, 위에서 빛이 비치는 물 천장 · 떠다니는 입자 · 빛줄기 · 짙은 안개를 보여 준다
import * as THREE from 'three';

// 헤이즐이 오갈 수 있는 높이 (해저 바닥은 -26)
export const DIVE_TOP = - 3;
export const DIVE_BOTTOM = - 23;

const WATER = new THREE.Color( 0x06306a ); // 바닷속 안개 · 배경색
const PARTICLES = 520;
const SHAFTS = 9;
const SPAN = 70; // 입자 · 빛줄기가 카메라 둘레에 퍼지는 범위

export class Dive {

	constructor( { scene, camera, fog, sky, ocean } ) {

		this.scene = scene;
		this.camera = camera;
		this.fog = fog;
		this.sky = sky;
		this.ocean = ocean;
		this.active = false;
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
		for ( let i = 0; i < PARTICLES; i ++ ) pos.set( [ ( Math.random() - 0.5 ) * SPAN, - 1 - Math.random() * 24, ( Math.random() - 0.5 ) * SPAN ], i * 3 );
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
		this.fog.color.copy( WATER ).convertSRGBToLinear();
		this.fog.density = 0.024;
		this.scene.background = this.fog.color.clone();
		this.sky.group.visible = false;
		this.ocean.mesh.visible = false;
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
		this.group.visible = false;

	}

	update( dt, t ) {

		if ( this.portal ) {

			this.portal.outer.rotation.z += dt * 0.6;
			this.portal.inner.rotation.z -= dt * 1.1;
			const s = 1 + Math.sin( t * 2.2 ) * 0.04;
			this.portal.group.scale.set( s, 1, s );

		}

		if ( ! this.active ) return;
		const c = this.camera.position;
		this.ceiling.position.x = c.x;
		this.ceiling.position.z = c.z;

		// 입자는 천천히 떠오르고, 카메라 둘레 상자를 벗어나면 반대편으로
		const a = this.motes.geometry.attributes.position;
		const half = SPAN / 2;
		for ( let i = 0; i < PARTICLES; i ++ ) {

			let x = a.getX( i ), y = a.getY( i ) + dt * 0.35, z = a.getZ( i );
			if ( x - c.x > half ) x -= SPAN; else if ( c.x - x > half ) x += SPAN;
			if ( z - c.z > half ) z -= SPAN; else if ( c.z - z > half ) z += SPAN;
			if ( y > - 1 ) y = - 25;
			a.setXYZ( i, x, y, z );

		}

		a.needsUpdate = true;

		for ( const m of this.shafts ) {

			m.position.set( c.x + m.userData.off.x, 0, c.z + m.userData.off.y );
			// 카메라가 빛줄기 안에 들어가면 화면이 뿌옇게 덮이니까 가까울수록 흐리게
			const near = Math.min( 1, Math.hypot( m.userData.off.x, m.userData.off.y ) / 25 );
			m.material.opacity = ( 0.02 + 0.02 * Math.sin( t * 0.7 + m.userData.phase ) ** 2 ) * near;

		}

	}

}
