// MAP 2 · 경비 연합군: 해구를 '신이 사는 곳'으로 믿고 지키는 범고래들
// 협곡 가운데를 순찰하다 헤이즐을 보면 쫓아온다. 52Hz 노래를 들으면 멀리서도 몰려온다.
// 곰치가 사는 벽 쪽은 금기라 다가가지 않는다 (벽을 타면 순찰은 피하지만 곰치가 문다)
import * as THREE from 'three';
import { Whale, steerTo } from './actors.js';
import { trenchCenter, trenchRadius } from './map2.js';

// 순찰하는 깊이 (m). 고래 뼈(205m) 둘레는 제단이라 셋이 원을 그리며 의식을 치른다
const PATROLS = [ 70, 140, 245, 290 ];
const ALTAR = { depth: 205, count: 2, radius: 18 };

const SEE = 18; // 이 안에서 헤이즐을 보면 쫓는다
const HEAR = 60; // 노래가 들리는 거리
const HEAR_DEPTH = 30; // 노래는 위아래로는 이만큼만 들린다
const SPOT_TIME = 1; // 들킨 뒤 멈춰서 노려보는 시간 (피할 틈)
const BITE = 5;
// 스텔라와 부른 '완벽한 노래': 가까운 경비는 잠시 멈춘다 (멀리 있는 경비는 여전히 몰려온다)
const STUN_RANGE = 24;
const STUN_DEPTH = 14;
const SONG_STUN = 3.5;
const CHASE_SPEED = 13; // 헤이즐 보통 속도(17)보다 느리다. 그냥 헤엄쳐도 조금씩 멀어진다
const TABOO = 0.5; // 협곡 반지름의 이 비율 밖(벽 쪽)으로는 들어가지 않는다
const SHOW_RANGE = 90;

const _c = new THREE.Vector2();

export class Guards {

	constructor( { scene, model, entry, altar } ) {

		this.scene = scene;
		this.entry = entry;
		this.list = [];
		this.onSpot = null; // 들켰을 때 ( 이 경비 )
		this.onHit = null; // 부딪혔을 때 ( 위치 ) → 맞았으면 true
		this.onHear = null; // 노래를 듣고 몰려올 때 ( 몇 마리 )
		this.onStun = null; // 노래로 멈췄을 때 ( 몇 마리 )

		for ( const depth of PATROLS ) this.add( model, { depth, angle: Math.random() * Math.PI * 2 } );
		for ( let i = 0; i < ALTAR.count; i ++ ) this.add( model, { depth: ALTAR.depth, angle: ( i / ALTAR.count ) * Math.PI * 2, altar } );

	}

	add( model, { depth, angle, altar = null } ) {

		const w = new Whale( model, { name: 'guard', length: 10, ride: 0.42, freq: 3, amp: 0.06 } );
		w.setGlow( 0.12, 0xff2050 ); // 붉은 눈: 기지의 명령을 받는 칩
		const g = { whale: w, home: depth, angle, altar, state: 'patrol', t: 0, y: - depth, dir: Math.random() < 0.5 ? 1 : - 1 };
		this.place( g );
		this.scene.add( w.root );
		this.list.push( g );

	}

	// 순찰 자리 (깊이 · 둘레)
	patrolPoint( g ) {

		if ( g.altar ) return { x: g.altar.x + Math.cos( g.angle ) * ALTAR.radius, z: g.altar.z + Math.sin( g.angle ) * ALTAR.radius };
		trenchCenter( this.entry, g.home, _c );
		const r = trenchRadius( g.home ) * 0.32;
		return { x: _c.x + Math.cos( g.angle ) * r, z: _c.y + Math.sin( g.angle ) * r };

	}

	place( g ) {

		const p = this.patrolPoint( g );
		g.whale.place( p.x, p.z );
		g.y = - g.home;
		g.whale.depth = g.home;

	}

	// 금기: 벽 쪽(협곡 반지름의 TABOO 밖)으로는 들어가지 않게 목표를 당긴다
	clampTaboo( x, z, y ) {

		trenchCenter( this.entry, - y, _c );
		const R = trenchRadius( - y ) * TABOO;
		const dx = x - _c.x, dz = z - _c.y, d = Math.hypot( dx, dz );
		if ( d <= R ) return { x, z, inside: true };
		return { x: _c.x + dx / d * R, z: _c.y + dz / d * R, inside: false };

	}

	// 52Hz 노래: 가까운 경비는 멈추고, 들리는 곳의 나머지는 몰려온다. 몰려온 수를 돌려준다
	hear( pos ) {

		let n = 0, stunned = 0;
		for ( const g of this.list ) {

			if ( g.state === 'calm' ) continue;
			const d = Math.hypot( g.whale.pos.x - pos.x, g.y - pos.y, g.whale.pos.z - pos.z );
			if ( d < STUN_RANGE && Math.abs( g.y - pos.y ) < STUN_DEPTH ) {

				g.state = 'stun';
				g.sung = true;
				g.t = 0;
				g.whale.setGlow( 0, 0x000000 ); // 붉은 눈이 잠시 꺼진다
				stunned ++;
				continue;

			}

			if ( g.state === 'stun' ) continue;
			if ( d > HEAR || Math.abs( g.y - pos.y ) > HEAR_DEPTH ) continue;
			if ( g.state === 'chase' || g.state === 'spot' ) continue;
			n ++;
			g.state = 'spot';
			g.t = 0;

		}

		if ( stunned ) this.onStun?.( stunned );
		if ( n ) this.onHear?.( n );
		return n;

	}

	// active: 헤이즐을 움직일 수 있을 때만 쫓고 문다 (대화 · 컷신 · 리듬 중엔 제자리)
	update( dt, hazel, active ) {

		for ( const g of this.list ) {

			const w = g.whale;
			const near = Math.abs( g.y - hazel.y ) < SHOW_RANGE;
			w.root.visible = near;
			if ( ! near && g.state === 'patrol' ) continue;
			g.t += dt;
			const dx = hazel.x - w.pos.x, dz = hazel.z - w.pos.z, dy = hazel.y - g.y;
			const dist = Math.hypot( dx, dy, dz );
			let wantY = - g.home;

			if ( g.state === 'calm' ) {

				// 명령이 끊긴 뒤: 제자리에서 천천히 떠 있다
				w.speed *= 0.97;
				wantY = g.y;

			} else if ( ! active ) {

				w.speed *= 0.9;

			} else if ( g.state === 'patrol' ) {

				g.angle += dt * ( g.altar ? 0.35 : 9 / ( trenchRadius( g.home ) * 0.32 ) ) * g.dir;
				const p = this.patrolPoint( g );
				steerTo( w, p.x, p.z, g.altar ? 6 : 9, dt, 2.2 );
				wantY = - g.home + Math.sin( g.t * 0.4 + g.angle ) * 3;
				// 벽 쪽에 붙은 헤이즐은 보지 않는다 (금기의 땅)
				if ( dist < SEE && this.clampTaboo( hazel.x, hazel.z, hazel.y ).inside ) {

					g.state = 'spot';
					g.t = 0;
					this.onSpot?.( g );

				}

			} else if ( g.state === 'spot' ) {

				// 멈춰서 헤이즐 쪽으로 돌아본다. 이때 벽으로 피하면 쫓지 않는다
				w.speed *= 0.85;
				steerTo( w, hazel.x, hazel.z, 0, dt, 3 );
				wantY = g.y;
				if ( g.t > SPOT_TIME ) {

					g.state = this.clampTaboo( hazel.x, hazel.z, hazel.y ).inside && dist < SEE * 2.5 ? 'chase' : 'return';
					g.t = 0;

				}

			} else if ( g.state === 'chase' ) {

				const p = this.clampTaboo( hazel.x, hazel.z, g.y );
				steerTo( w, p.x, p.z, CHASE_SPEED, dt, 2.6 );
				wantY = hazel.y;
				// 벽으로 숨거나 멀리 따돌리면 잠시 노려보다 돌아간다
				if ( ! p.inside ) g.glare = ( g.glare ?? 0 ) + dt;
				else g.glare = 0;
				if ( dist > 45 || g.glare > 2 || g.t > 8 ) {

					g.state = 'return';
					g.glare = 0;

				}

			} else if ( g.state === 'return' ) {

				const p = this.patrolPoint( g );
				if ( steerTo( w, p.x, p.z, 12, dt, 2.2 ) < 6 && Math.abs( g.y + g.home ) < 3 ) g.state = 'patrol';

			} else if ( g.state === 'stun' && g.sung ) {

				// 노래에 멈춤: 제자리에서 비틀거리다 정신을 차리면 돌아간다
				w.speed *= 0.9;
				w.bank = Math.sin( g.t * 7 ) * 0.5;
				wantY = g.y;
				if ( g.t > SONG_STUN ) {

					g.state = 'return';
					g.sung = false;
					w.setGlow( 0.12, 0xff2050 );

				}

			} else if ( g.state === 'stun' ) {

				steerTo( w, w.pos.x - dx, w.pos.z - dz, 12, dt, 3 );
				wantY = g.y;
				if ( g.t > 2.5 ) {

					g.state = 'return'; // 한 번 물고 나면 돌아간다
					g.t = 0;

				}

			}

			// 위아래는 천천히 따라간다
			g.y += THREE.MathUtils.clamp( wantY - g.y, - 7 * dt, 7 * dt );
			w.depth = w.surfaceY - g.y;
			w.update( dt );

			if ( active && dist < BITE && g.state === 'chase' && this.onHit?.( w.pos ) ) {

				g.state = 'stun';
				g.t = 0;

			}

		}

		// 서로 겹치지 않게
		for ( let i = 0; i < this.list.length; i ++ ) for ( let j = i + 1; j < this.list.length; j ++ ) {

			const a = this.list[ i ], b = this.list[ j ];
			if ( Math.abs( a.y - b.y ) > 6 ) continue;
			const pa = a.whale.pos, pb = b.whale.pos;
			const dx = pb.x - pa.x, dz = pb.z - pa.z, d = Math.hypot( dx, dz );
			if ( d < 7 && d > 0.01 ) {

				const push = ( 7 - d ) * 0.5;
				pa.x -= dx / d * push; pa.z -= dz / d * push;
				pb.x += dx / d * push; pb.z += dz / d * push;

			}

		}

	}

	// 정지 코드가 통하면: 붉은 눈이 꺼지고 순찰도 멈춘다
	calm() {

		for ( const g of this.list ) {

			g.state = 'calm';
			g.whale.setGlow( 0, 0x000000 );

		}

	}

}
