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

// 일지가 있는 깊이에선 협곡이 크게 열려 넓은 방이 되고, 그 사이는 좁은 통로가 된다
export function trenchRadius( d ) {

	d = Math.min( d, FLOOR_DEPTH );
	let r = 74 - d * 0.1;
	for ( const l of MAP2_LOGS ) r += 48 * Math.exp( - ( ( ( d - l.depth ) / 20 ) ** 2 ) );
	return r;

}

// 층마다 벽의 색: 햇빛층은 모래 · 산호, 어스름층은 청록, 한밤층은 남보라, 해구는 현무암과 녹슨 붉은빛
const WALL_COLORS = [
	[ 0, [ 0xb89a74, 0xc9786b, 0xd8b98a ] ],
	[ 40, [ 0x2f6a72, 0x3d5c4a, 0x2a5566 ] ],
	[ 120, [ 0x3a3270, 0x4a2f6a, 0x2c2c5a ] ],
	[ 250, [ 0x24222c, 0x4a2420, 0x1c1a22 ] ]
].map( ( [ depth, cols ] ) => ( { depth, cols: cols.map( ( c ) => new THREE.Color( c ) ) } ) );
const _wc = new THREE.Color(), _wc2 = new THREE.Color();

function wallColor( d, out ) {

	let i = 0;
	while ( i < WALL_COLORS.length - 1 && d >= WALL_COLORS[ i + 1 ].depth ) i ++;
	const a = WALL_COLORS[ i ], b = WALL_COLORS[ Math.min( i + 1, WALL_COLORS.length - 1 ) ];
	const k = b === a ? 0 : THREE.MathUtils.smoothstep( d, b.depth - 18, b.depth );
	const pick = Math.random() < 0.7 ? 0 : Math.random() < 0.6 ? 1 : 2;
	return out.copy( a.cols[ pick ] ).lerp( _wc2.copy( b.cols[ pick ] ), k ).multiplyScalar( 0.85 + Math.random() * 0.3 );

}

// 멀리서도 보이는 빛 (둥근 빛 번짐 그림)
let glowTexture = null;
function glowMap() {

	if ( glowTexture ) return glowTexture;
	const cv = document.createElement( 'canvas' );
	cv.width = cv.height = 64;
	const g = cv.getContext( '2d' );
	const grad = g.createRadialGradient( 32, 32, 0, 32, 32, 32 );
	grad.addColorStop( 0, 'rgba(255,255,255,1)' );
	grad.addColorStop( 0.25, 'rgba(255,255,255,0.55)' );
	grad.addColorStop( 1, 'rgba(255,255,255,0)' );
	g.fillStyle = grad;
	g.fillRect( 0, 0, 64, 64 );
	glowTexture = new THREE.CanvasTexture( cv );
	return glowTexture;

}

// 흔적마다의 표지 빛: 색, 크기, 깜빡임 (0 = 계속 켜짐)
const BEACONS = {
	wreck: { color: 0xffa040, size: 16, blink: 1.6, up: 6 },
	lab: { color: 0xbfe8ff, size: 22, blink: 0, up: 8 },
	terminal: { color: 0xff3355, size: 16, blink: 2.2, up: 12 },
	bones: { color: 0x9fffe8, size: 24, blink: 0, up: 6, pulse: true },
	capsule: { color: 0x7fffa0, size: 12, blink: 1.2, up: 4 },
	door: { color: 0xfff0c0, size: 34, blink: 0, up: 10 }
};

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
	const rockMat = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 1, flatShading: true } );
	const spots = [];
	for ( let d = 0; d <= FLOOR_DEPTH; d += 5 ) {

		const R = trenchRadius( d );
		const n = Math.ceil( ( Math.PI * 2 * R ) / 7 );
		trenchCenter( entry, d, c );
		for ( let i = 0; i < n; i ++ ) {

			const a = ( i / n ) * Math.PI * 2 + Math.random() * 0.1;
			const size = 3 + Math.random() ** 2 * 9;
			const rr = R + size * 0.6 + Math.random() * 4;
			spots.push( [ c.x + Math.cos( a ) * rr, - d + ( Math.random() - 0.5 ) * 4, c.y + Math.sin( a ) * rr, size, d ] );

		}

	}

	const rocks = new THREE.InstancedMesh( new THREE.IcosahedronGeometry( 1, 0 ), rockMat, spots.length );
	const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
	spots.forEach( ( [ x, y, z, size, d ], i ) => {

		e.set( Math.random() * 3, Math.random() * 3, Math.random() * 3 );
		q.setFromEuler( e );
		// 가끔은 세로로 긴 바위 기둥
		const tall = Math.random() < 0.08 ? 2.5 + Math.random() * 2 : 0.7 + Math.random() * 0.6;
		if ( tall > 2 ) q.identity();
		s.set( size, size * tall, size );
		rocks.setMatrixAt( i, m.compose( p.set( x, y, z ), q, s ) );
		rocks.setColorAt( i, wallColor( d, _wc ) );

	} );
	group.add( rocks );

	// 해구 벽의 붉은 광맥: 깊은 곳에서 은은하게 빛난다
	const veinSpots = [];
	for ( let i = 0; i < 260; i ++ ) {

		const d = 240 + Math.random() * ( FLOOR_DEPTH - 240 );
		const a = Math.random() * Math.PI * 2;
		const R = trenchRadius( d ) + 0.5 + Math.random() * 1.5;
		trenchCenter( entry, d, c );
		veinSpots.push( [ c.x + Math.cos( a ) * R, - d, c.y + Math.sin( a ) * R ] );

	}

	const veins = new THREE.InstancedMesh( new THREE.OctahedronGeometry( 1, 0 ), new THREE.MeshBasicMaterial( { color: 0xff5a2a } ), veinSpots.length );
	veinSpots.forEach( ( [ x, y, z ], i ) => {

		e.set( Math.random() * 3, Math.random() * 3, Math.random() * 3 );
		q.setFromEuler( e );
		const k = 0.4 + Math.random() * 0.9;
		s.set( k * 0.5, k * 2.2, k * 0.5 );
		veins.setMatrixAt( i, m.compose( p.set( x, y, z ), q, s ) );

	} );
	group.add( veins );

	// 바닥
	trenchCenter( entry, FLOOR_DEPTH, c );
	const floorMat = new THREE.MeshStandardMaterial( { color: 0x2a2630, roughness: 1, flatShading: true } );
	const floor = new THREE.Mesh( new THREE.CircleGeometry( trenchRadius( FLOOR_DEPTH ) + 10, 32 ), floorMat );
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
	const beacons = [];
	let searchlight = null;
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

		// 표지 빛: 안개 너머로 먼저 보이고, 다가가면 정체가 드러난다
		const b = BEACONS[ log.landmark ];
		const beacon = new THREE.Sprite( new THREE.SpriteMaterial( { map: glowMap(), color: b.color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false } ) );
		beacon.position.copy( mark.position ).y += b.up;
		beacon.scale.setScalar( b.size );
		beacon.userData = { ...b, phase: i * 0.7 };
		group.add( beacon );
		beacons.push( beacon );
		if ( log.landmark === 'door' ) {

			// 기지의 탐조등: 천천히 돌며 해구를 쓸고 지나간다
			const pivot = new THREE.Group();
			pivot.position.copy( mark.position ).y += 6;
			const coneGeo = new THREE.CylinderGeometry( 0.6, 11, 80, 24, 1, true );
			coneGeo.translate( 0, 40, 0 );
			const cone = new THREE.Mesh( coneGeo, new THREE.MeshBasicMaterial( { color: 0xfff0c0, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide } ) );
			cone.rotation.x = 1.15; // 비스듬히 위로
			pivot.add( cone );
			group.add( pivot );
			searchlight = pivot;

		}

		const capsule = makeCapsule();
		capsule.position.copy( pos );
		if ( log.landmark === 'door' ) capsule.position.y += 6;
		group.add( capsule );
		return { ...log, index: i, pos: capsule.position.clone(), capsule, read: false };

	} );

	const deco = buildDeco( group, entry, logs );
	scene.add( group );
	return {
		group, logs,
		update( t, cam ) {

			deco.update( t );

			// 표지 빛: 깜빡이거나 숨 쉬듯 밝아졌다 어두워지고, 너무 멀면 사라진다
			for ( const b of beacons ) {

				const u = b.userData;
				let k = 1;
				if ( u.blink ) k = ( ( t + u.phase ) % u.blink ) < u.blink * 0.35 ? 1 : 0.15;
				if ( u.pulse ) k = 0.55 + 0.45 * Math.sin( t * 1.3 );
				if ( cam ) {

					const d = b.position.distanceTo( cam );
					k *= 1 - THREE.MathUtils.smoothstep( d, 120, 230 );
					k *= 0.35 + 0.65 * THREE.MathUtils.smoothstep( d, 8, 40 ); // 바로 옆에선 눈부시지 않게

				}

				b.material.opacity = 0.85 * k;

			}

			if ( searchlight ) searchlight.rotation.y = t * 0.35;

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

// ---------------------------------------------------------------
// 층마다의 볼거리: 햇빛층 산호 정원 · 어스름층 옛 배 · 해구 열수구와 관벌레
// ---------------------------------------------------------------
const CORAL_COLORS = [ 0xff7aa8, 0xff9a4a, 0xb07aff, 0xffd36b, 0x4fe0c0, 0xff5f6d ];
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3( 0, 1, 0 ), _dir = new THREE.Vector3(), _col = new THREE.Color();

function buildDeco( group, entry, logs ) {

	const c = new THREE.Vector2();
	// 벽 위의 한 점과, 벽에서 협곡 안쪽을 향하는 방향
	const onWall = ( d, a, inset ) => {

		trenchCenter( entry, d, c );
		const R = trenchRadius( d ) - inset;
		return { x: c.x + Math.cos( a ) * R, y: - d, z: c.y + Math.sin( a ) * R, nx: - Math.cos( a ), nz: - Math.sin( a ) };

	};

	// 햇빛층 산호 정원: 채찍산호 · 뇌산호 · 관해면이 벽에 무리 지어 붙어 있다
	const coralMat = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0.7, flatShading: true, emissive: 0x2a0e1a } );
	const shapes = [
		[ new THREE.ConeGeometry( 0.35, 3.4, 5 ).translate( 0, 1.7, 0 ), 340 ],
		[ new THREE.SphereGeometry( 1, 7, 5 ).scale( 1, 0.6, 1 ), 180 ],
		[ new THREE.CylinderGeometry( 0.5, 0.32, 2.4, 6 ).translate( 0, 1.2, 0 ), 240 ]
	];
	for ( const [ geo, count ] of shapes ) {

		const mesh = new THREE.InstancedMesh( geo, coralMat, count );
		let i = 0;
		while ( i < count ) {

			// 무리의 가운데
			const d = 4 + Math.random() * 40, a = Math.random() * Math.PI * 2;
			const n = 3 + Math.floor( Math.random() * 5 );
			const base = CORAL_COLORS[ Math.floor( Math.random() * CORAL_COLORS.length ) ];
			for ( let k = 0; k < n && i < count; k ++, i ++ ) {

				const w = onWall( d + ( Math.random() - 0.5 ) * 7, a + ( Math.random() - 0.5 ) * 0.1, 3 + Math.random() * 4 );
				_dir.set( w.nx * 0.7, 1, w.nz * 0.7 ).normalize();
				_q.setFromUnitVectors( _up, _dir );
				_s.setScalar( 2 + Math.random() * 2.6 );
				mesh.setMatrixAt( i, _m.compose( _p.set( w.x, w.y, w.z ), _q, _s ) );
				mesh.setColorAt( i, _col.set( base ).offsetHSL( ( Math.random() - 0.5 ) * 0.05, 0, ( Math.random() - 0.5 ) * 0.15 ) );

			}

		}

		group.add( mesh );

	}

	// 어스름층: 벽에 기대 잠든 커다란 옛 배 (말없는 실루엣)
	const ship = makeLandmark( 'wreck' );
	ship.name = 'oldShip';
	const sw = onWall( 108, ( logs[ 1 ]?.angle ?? 0 ) + Math.PI, 10 );
	ship.position.set( sw.x, sw.y, sw.z );
	ship.scale.setScalar( 3.2 );
	ship.rotation.set( 0.25, Math.atan2( sw.nx, sw.nz ) + 1.2, - 0.35 );
	group.add( ship );

	// 해구 열수구: 검은 굴뚝 꼭대기가 붉게 달아올라 뜨거운 물이 피어오르고, 둘레엔 관벌레
	const rock = new THREE.MeshStandardMaterial( { color: 0x1c1a22, roughness: 1, flatShading: true } );
	const hot = new THREE.MeshBasicMaterial( { color: 0xff6a2a } );
	const VENTS = 7, SMOKE = 40, WORMS = 16;
	const smokeBase = [];
	const worms = new THREE.InstancedMesh( new THREE.CylinderGeometry( 0.12, 0.16, 1, 5 ).translate( 0, 0.5, 0 ), new THREE.MeshStandardMaterial( { color: 0xe8e2d8, roughness: 0.6 } ), VENTS * WORMS );
	const tips = new THREE.InstancedMesh( new THREE.SphereGeometry( 0.28, 6, 4 ), new THREE.MeshBasicMaterial( { color: 0xff3040 } ), VENTS * WORMS );
	let wi = 0;
	for ( let v = 0; v < VENTS; v ++ ) {

		// 맨 밑 바닥에 셋, 해구 벽 아래쪽에 넷
		let x, y, z;
		if ( v < 3 ) {

			trenchCenter( entry, FLOOR_DEPTH, c );
			const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * trenchRadius( FLOOR_DEPTH ) * 0.5;
			x = c.x + Math.cos( a ) * r; y = - FLOOR_DEPTH; z = c.y + Math.sin( a ) * r;

		} else {

			const w = onWall( 280 + Math.random() * 40, Math.random() * Math.PI * 2, 4 );
			x = w.x; y = w.y; z = w.z;

		}

		const vent = new THREE.Group();
		vent.position.set( x, y, z );
		let h = 0;
		for ( const [ rb, rt, hh ] of [ [ 2.6, 1.8, 3.4 ], [ 1.8, 1.1, 2.6 ], [ 1.1, 0.7, 2 ] ] ) {

			const part = new THREE.Mesh( new THREE.CylinderGeometry( rt, rb, hh, 7 ), rock );
			part.position.y = h + hh / 2;
			part.rotation.y = Math.random() * 3;
			vent.add( part );
			h += hh;

		}

		const mouth = new THREE.Mesh( new THREE.CylinderGeometry( 0.75, 0.75, 0.3, 8 ), hot );
		mouth.position.y = h;
		const glow = new THREE.Sprite( new THREE.SpriteMaterial( { map: glowMap(), color: 0xff7a3a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false } ) );
		glow.position.y = h + 0.5;
		glow.scale.setScalar( 9 );
		vent.add( mouth, glow );
		group.add( vent );
		for ( let k = 0; k < SMOKE; k ++ ) smokeBase.push( x, y + h, z, Math.random() );

		for ( let k = 0; k < WORMS; k ++, wi ++ ) {

			const a = Math.random() * Math.PI * 2, r = 2.8 + Math.random() * 2.5;
			const len = 1.2 + Math.random() * 1.8;
			_q.setFromAxisAngle( _dir.set( Math.sin( a ), 0, - Math.cos( a ) ), ( Math.random() - 0.5 ) * 0.5 );
			_p.set( x + Math.cos( a ) * r, y, z + Math.sin( a ) * r );
			worms.setMatrixAt( wi, _m.compose( _p, _q, _s.set( 1, len, 1 ) ) );
			_p.add( _dir.set( 0, len, 0 ).applyQuaternion( _q ) );
			tips.setMatrixAt( wi, _m.compose( _p, _q, _s.set( 1, 1, 1 ) ) );

		}

	}

	group.add( worms, tips );

	// 열수구에서 피어오르는 뜨거운 물 (입자)
	const smokeGeo = new THREE.BufferGeometry();
	const smokePos = new Float32Array( smokeBase.length / 4 * 3 );
	smokeGeo.setAttribute( 'position', new THREE.BufferAttribute( smokePos, 3 ) );
	const smoke = new THREE.Points( smokeGeo, new THREE.PointsMaterial( { color: 0xffb070, map: glowMap(), size: 1.6, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false } ) );
	smoke.frustumCulled = false;
	group.add( smoke );

	return {
		update( t ) {

			for ( let i = 0; i < smokeBase.length / 4; i ++ ) {

				const ph = smokeBase[ i * 4 + 3 ];
				const k = ( t * 0.18 + ph ) % 1; // 0 → 1: 아래에서 위로
				smokePos[ i * 3 ] = smokeBase[ i * 4 ] + Math.sin( t * 1.3 + ph * 20 ) * ( 0.4 + k * 2.5 );
				smokePos[ i * 3 + 1 ] = smokeBase[ i * 4 + 1 ] + k * 22;
				smokePos[ i * 3 + 2 ] = smokeBase[ i * 4 + 2 ] + Math.cos( t * 1.1 + ph * 17 ) * ( 0.4 + k * 2.5 );

			}

			smokeGeo.attributes.position.needsUpdate = true;

		}
	};

}
