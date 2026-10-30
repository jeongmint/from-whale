// MAP 2 · 바닷속: 계속 내려가는 협곡(해구)과, 층마다 놓인 인간의 흔적 · 연구 일지
// 협곡은 포털이 열린 자리(entry)에서 아래로 구불구불 이어지고, 맨 밑에 박사의 기지가 있다.
import * as THREE from 'three';

export const BASE_DEPTH = 318; // 기지 문 앞 깊이 (m)
export const FLOOR_DEPTH = 335; // 협곡 바닥

// 연구 일지 6개: 깊이(m), 협곡 중심에서 어느 쪽(각도)으로 조금 비켜 있는지, 둘레에 놓인 것
// 순서대로 읽어야 더 내려갈 수 있다 (물살이 막는다)
export const MAP2_LOGS = [
	{ depth: 30, angle: 0.6, landmark: 'wreck' }, // 햇빛층: 부서진 연구 잠수정
	{ depth: 80, angle: 2.4, landmark: 'lab' }, // 어스름층: 해저 연구소 1동
	{ depth: 150, angle: 4.1, landmark: 'terminal' }, // 한밤층: 붉은 단말기
	{ depth: 205, angle: 5.6, landmark: 'bones' }, // 한밤층: 고래 뼈 (정화 작전의 흔적)
	{ depth: 270, angle: 1.4, landmark: 'capsule' }, // 해구: 대학원생의 마지막 기록
	{ depth: 312, angle: 3.3, landmark: 'door' } // 맨 밑: 기지 출입문의 메모
];

// 깊이 d에서 협곡의 중심 (entry 기준)과 반지름
export function trenchCenter( entry, d, out = new THREE.Vector2() ) {

	return out.set( entry.x + Math.sin( d / 60 ) * 28, entry.z + ( Math.cos( d / 75 ) - 1 ) * 26 );

}

export function trenchRadius( d ) {

	return 92 - Math.min( d, FLOOR_DEPTH ) * 0.12;

}

// 일지 · 기지의 실제 위치 (x, y, z)
export function logPosition( entry, log ) {

	const c = trenchCenter( entry, log.depth );
	const r = log.landmark === 'door' ? 0 : trenchRadius( log.depth ) * 0.35;
	return new THREE.Vector3( c.x + Math.cos( log.angle ) * r, - log.depth, c.y + Math.sin( log.angle ) * r );

}

// 협곡 벽 · 바닥 · 층마다의 흔적 · 일지 캡슐 · 기지를 만든다
export function buildTrench( scene, entry ) {

	const group = new THREE.Group();
	group.name = 'map2';
	const c = new THREE.Vector2();

	// 협곡 벽: 낮은 다각형 바위 수천 개를 한 번에 그린다
	const rockMat = new THREE.MeshStandardMaterial( { color: 0x2c3a58, roughness: 1, flatShading: true } );
	const spots = [];
	for ( let d = 0; d <= FLOOR_DEPTH; d += 5 ) {

		const R = trenchRadius( d );
		const n = Math.ceil( ( Math.PI * 2 * R ) / 7 );
		trenchCenter( entry, d, c );
		for ( let i = 0; i < n; i ++ ) {

			const a = ( i / n ) * Math.PI * 2 + Math.random() * 0.1;
			const rr = R + 3 + Math.random() * 6;
			spots.push( [ c.x + Math.cos( a ) * rr, - d + ( Math.random() - 0.5 ) * 4, c.y + Math.sin( a ) * rr, 4 + Math.random() * 5 ] );

		}

	}

	const rocks = new THREE.InstancedMesh( new THREE.IcosahedronGeometry( 1, 0 ), rockMat, spots.length );
	const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
	spots.forEach( ( [ x, y, z, size ], i ) => {

		e.set( Math.random() * 3, Math.random() * 3, Math.random() * 3 );
		q.setFromEuler( e );
		s.set( size, size * ( 0.7 + Math.random() * 0.6 ), size );
		rocks.setMatrixAt( i, m.compose( p.set( x, y, z ), q, s ) );

	} );
	group.add( rocks );

	// 바닥
	trenchCenter( entry, FLOOR_DEPTH, c );
	const floor = new THREE.Mesh( new THREE.CircleGeometry( trenchRadius( FLOOR_DEPTH ) + 10, 32 ), rockMat );
	floor.rotation.x = - Math.PI / 2;
	floor.position.set( c.x, - FLOOR_DEPTH, c.y );
	group.add( floor );

	// 깊은 곳 벽에 붙은 심해 생물의 빛 (어둠 속에서도 보인다)
	const glowPos = [], glowCol = [];
	const col = new THREE.Color();
	for ( let i = 0; i < 420; i ++ ) {

		const d = 50 + Math.random() * ( FLOOR_DEPTH - 50 );
		const a = Math.random() * Math.PI * 2;
		const R = trenchRadius( d ) + 1 + Math.random() * 2;
		trenchCenter( entry, d, c );
		glowPos.push( c.x + Math.cos( a ) * R, - d, c.y + Math.sin( a ) * R );
		col.set( d < 120 ? 0x6fd8ff : d < 250 ? 0xa98cff : 0x7fffd4 );
		glowCol.push( col.r, col.g, col.b );

	}

	const glowGeo = new THREE.BufferGeometry();
	glowGeo.setAttribute( 'position', new THREE.Float32BufferAttribute( glowPos, 3 ) );
	glowGeo.setAttribute( 'color', new THREE.Float32BufferAttribute( glowCol, 3 ) );
	const glows = new THREE.Points( glowGeo, new THREE.PointsMaterial( { size: 0.9, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false } ) );
	group.add( glows );

	// 층마다 놓인 인간의 흔적과 일지 캡슐
	const logs = MAP2_LOGS.map( ( log, i ) => {

		const pos = logPosition( entry, log );
		const mark = makeLandmark( log.landmark );
		// 흔적은 일지보다 벽 쪽으로 조금 물러나 있다
		trenchCenter( entry, log.depth, c );
		const out = new THREE.Vector2( pos.x - c.x, pos.z - c.y );
		if ( out.lengthSq() < 1 ) out.set( Math.cos( log.angle ), Math.sin( log.angle ) );
		out.normalize();
		const back = log.landmark === 'door' ? 0 : 10;
		mark.position.set( pos.x + out.x * back, pos.y - 2, pos.z + out.y * back );
		mark.rotation.y = Math.atan2( out.x, out.y );
		group.add( mark );

		const capsule = makeCapsule();
		capsule.position.copy( pos );
		if ( log.landmark === 'door' ) capsule.position.y += 6;
		group.add( capsule );
		return { ...log, index: i, pos: capsule.position.clone(), capsule, read: false };

	} );

	scene.add( group );
	return {
		group, logs,
		update( t ) {

			for ( const l of logs ) {

				if ( l.read ) {

					l.capsule.userData.glow.material.opacity *= 0.95;
					continue;

				}

				const k = 0.6 + 0.4 * Math.sin( t * 2.5 + l.index );
				l.capsule.userData.glow.material.opacity = 0.35 * k;
				l.capsule.userData.glow.scale.setScalar( 2.6 + k );
				l.capsule.rotation.y += 0.01;

			}

		}
	};

}

// 일지 캡슐: 빛나는 작은 기록 장치
function makeCapsule() {

	const g = new THREE.Group();
	const body = new THREE.Mesh( new THREE.CylinderGeometry( 0.5, 0.5, 1.6, 12 ), new THREE.MeshStandardMaterial( { color: 0xdfe8ff, emissive: 0x7fe9ff, emissiveIntensity: 1.6 } ) );
	body.rotation.z = Math.PI / 2;
	const glow = new THREE.Mesh( new THREE.SphereGeometry( 1, 16, 12 ), new THREE.MeshBasicMaterial( { color: 0x7fe9ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false } ) );
	g.add( body, glow );
	g.userData.glow = glow;
	return g;

}

// 층마다의 흔적. 어둠 속에서도 실루엣이 보이도록 약하게 빛난다
function makeLandmark( kind ) {

	const g = new THREE.Group();
	const metal = new THREE.MeshStandardMaterial( { color: 0x5a6478, roughness: 0.8, metalness: 0.3, emissive: 0x0b1424, flatShading: true } );
	const lit = ( color, k = 1.4 ) => new THREE.MeshStandardMaterial( { color, emissive: color, emissiveIntensity: k } );

	if ( kind === 'wreck' ) {

		// 옆으로 쓰러진 연구 잠수정
		const hull = new THREE.Mesh( new THREE.CylinderGeometry( 2.6, 2.6, 16, 14 ), metal );
		hull.rotation.z = Math.PI / 2 - 0.25;
		const nose = new THREE.Mesh( new THREE.SphereGeometry( 2.6, 14, 10 ), metal );
		nose.position.set( - 7.8, - 1.9, 0 );
		const tower = new THREE.Mesh( new THREE.BoxGeometry( 3, 2.4, 2 ), metal );
		tower.position.set( 1, 2.6, 0 );
		tower.rotation.z = - 0.25;
		const win = new THREE.Mesh( new THREE.CircleGeometry( 0.6, 12 ), lit( 0xffd36b, 0.8 ) );
		win.position.set( - 3, 0.6, 2.62 );
		g.add( hull, nose, tower, win );

	} else if ( kind === 'lab' || kind === 'terminal' ) {

		// 벽에 붙은 연구소 모듈. 1동은 노란 창, 단말기는 붉은 화면
		const red = kind === 'terminal';
		for ( let i = 0; i < ( red ? 2 : 3 ); i ++ ) {

			const box = new THREE.Mesh( new THREE.BoxGeometry( 9, 5.5, 7 ), metal );
			box.position.set( ( i - 1 ) * 10, i % 2 ? 3 : 0, 0 );
			g.add( box );
			for ( let w = 0; w < 3; w ++ ) {

				const win = new THREE.Mesh( new THREE.PlaneGeometry( 1.6, 0.8 ), lit( red ? 0xff3355 : 0xffd36b, red ? 2 : 1 ) );
				win.position.set( box.position.x + ( w - 1 ) * 2.6, box.position.y + 0.8, 3.52 );
				g.add( win );

			}

		}

		if ( red ) {

			const screen = new THREE.Mesh( new THREE.PlaneGeometry( 6, 3.6 ), lit( 0xff3355, 2.4 ) );
			screen.position.set( 0, 9, 3.6 );
			g.add( screen );

		}

	} else if ( kind === 'bones' ) {

		// 바닥에 가라앉은 고래 뼈: 등뼈와 갈비뼈
		const bone = new THREE.MeshStandardMaterial( { color: 0xd8d2c0, roughness: 1, emissive: 0x1d2433 } );
		const spine = new THREE.Mesh( new THREE.CylinderGeometry( 0.6, 0.3, 26, 8 ), bone );
		spine.rotation.z = Math.PI / 2;
		g.add( spine );
		for ( let i = 0; i < 8; i ++ ) {

			const rib = new THREE.Mesh( new THREE.TorusGeometry( 4.5 - Math.abs( i - 3.5 ) * 0.4, 0.28, 6, 16, Math.PI ), bone );
			rib.position.x = - 9 + i * 2.6;
			rib.rotation.y = Math.PI / 2;
			g.add( rib );

		}

		const skull = new THREE.Mesh( new THREE.SphereGeometry( 3, 10, 8 ), bone );
		skull.scale.set( 1.6, 0.9, 1 );
		skull.position.x = - 15;
		g.add( skull );

	} else if ( kind === 'door' ) {

		// 박사의 기지: 반구 돔과 붉은 빛의 출입문
		const dome = new THREE.Mesh( new THREE.SphereGeometry( 20, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2 ), metal );
		dome.position.y = - 14;
		const frame = new THREE.Mesh( new THREE.TorusGeometry( 5, 0.6, 10, 32 ), lit( 0xff3355, 2 ) );
		frame.position.set( 0, - 6, 18.5 );
		const door = new THREE.Mesh( new THREE.CircleGeometry( 4.6, 32 ), new THREE.MeshStandardMaterial( { color: 0x1a2030, emissive: 0x220810 } ) );
		door.position.set( 0, - 6, 18.4 );
		g.add( dome, frame, door );
		for ( let i = 0; i < 6; i ++ ) {

			const a = ( i / 6 ) * Math.PI * 2 + 0.4;
			const win = new THREE.Mesh( new THREE.CircleGeometry( 0.9, 12 ), lit( 0xffd36b, 0.9 ) );
			win.position.set( Math.sin( a ) * 19.2, - 8, Math.cos( a ) * 19.2 );
			win.lookAt( win.position.x * 2, - 8, win.position.z * 2 );
			g.add( win );

		}

		g.userData.windows = g.children.slice( 3 );

	}

	return g;

}
