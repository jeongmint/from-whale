// MAP 3 · 고래의 교향곡: 샤먼의 강제 합창 VS 헤이즐과 동료들의 자유로운 합주 (다섯 단계)
//  1. 샤먼의 북소리 — 연타로 막대를 금빛 쪽으로 (북은 박자마다 붉은 쪽으로 민다)
//  2. 12번의 메아리 — 메아리가 들리는 동안 롱탭, 끝나면 놓기
//  3. 9번의 결의 — 짧은 소리는 숏탭, 긴 소리는 롱탭 (북에 맞춰 누르면 붉은 쪽으로 밀린다)
//  4. 8번의 용기 — 샤먼의 마지막 북. 롱탭으로 용기를 주고, 8번이 뛰면 놓고 점프
//  5. 모두의 노래 — 막대가 사라지고 정적. 노래 버튼을 길게 누르는 동안 동료들의 목소리가 하나씩 합쳐지고, 놓으면 모두가 대답한다
// 2 ~ 4단계는 세 고래의 미션에서 배운 노래 그대로 (hold.js). 틀리면 그 단계만 다시
import { lang } from './i18n.js';
import { respond } from './hold.js';
import { holdTone } from './voices.js';

const $ = ( id ) => document.getElementById( id );
const BEAT = 60 / 92;
const START = 0.3; // 막대의 처음 자리 (0 샤먼 ~ 1 헤이즐)
const MASH_TO = 0.58; // 1단계: 여기까지 밀면 12번의 노래가 들린다
const TAP = 0.013; // 한 번 누를 때 미는 만큼
const SHAMAN = 0.035; // 1단계에서 샤먼이 1초에 미는 만큼
const DRUM = 0.01; // 북이 박자마다 한 번 더 미는 만큼
const STEP = 0.16; // 고래 하나가 합류할 때 금빛 쪽으로
const LOW = 0.18; // 이보다 밀리면 '샤먼의 합창에 거의 묻혔다'
const T = () => lang().ui.map3;

// voices: [ { key, name, actor, pitches, play( midi ), tone?( midi, dur ), color, rest?, restColor? } ]  (key: luke · finn · twelve · nine · eight · moby · stella)
// on: { drum( vel ), drumTap(), join( i, frac ), hazel( midi ) }
export function symphony( G, voices, on = {} ) {

	return new Promise( ( resolve ) => {

		const box = $( 'sym' ), lanes = $( 'sym-lanes' ), hint = $( 'sym-hint' );
		lanes.innerHTML = `<div class="tug"><b class="red"></b><b class="gold"></b><s style="left:${MASH_TO * 100}%"></s><i class="mark"></i></div>
			<div class="chips">${voices.map( ( v ) => `<span data-k="${v.key}">${v.name}</span>` ).join( '' )}</div>
			<div class="sym-hold"></div>`;
		const tug = lanes.querySelector( '.tug' ), red = lanes.querySelector( '.red' ), gold = lanes.querySelector( '.gold' ), mark = lanes.querySelector( '.mark' );
		const host = lanes.querySelector( '.sym-hold' );
		const chip = ( k ) => lanes.querySelector( `.chips [data-k="${k}"]` );
		const say = ( text, who = '' ) => hint.textContent = G.ui.dev( text.replace( /\{who\}/g, who ) );
		const byKey = ( k ) => voices.find( ( v ) => v.key === k );
		$( 'sym-title' ).textContent = T().symTitle;
		document.body.classList.add( 'singing' );
		G.ui.show( 'sym' );
		G.audio.setMix( { melody: 0.1, piano: 0.5 }, 1 );

		let p = START, low = START, taps = 0, phase = 'mash', beat = 0, beatT = BEAT, lastBeatAt = 0, last = performance.now(), raf = 0, finished = false;
		let drumVel = 1, silent = false, warned = false, lastNote = 0;
		const joined = []; // 합류해서 엇박마다 제 음을 내는 고래들
		const timers = new Set();
		const later = ( s, fn ) => {

			const id = setTimeout( () => {

				timers.delete( id );
				fn();

			}, s * 1000 );
			timers.add( id );

		};

		function draw() {

			const x = Math.max( 0, Math.min( 1, p ) ) * 100;
			gold.style.width = `${x}%`;
			red.style.left = `${x}%`;
			mark.style.left = `${x}%`;

		}

		function push( d ) {

			p = Math.max( 0.03, Math.min( 1, p + d ) );
			low = Math.min( low, p );
			draw();

		}

		function join( v, step = STEP ) {

			if ( ! v || joined.includes( v ) ) return;
			joined.push( v );
			chip( v.key )?.classList.add( 'on' );
			v.play( v.pitches[ 0 ] );
			v.actor.setGlow?.( 0.8, v.color );
			later( 0.5, () => v.actor.setGlow?.( v.rest ?? 0.2, v.restColor ?? v.color ) );
			if ( v.actor.pos ) G.world.ring( v.actor.pos.x, v.actor.pos.z, { color: v.color, to: 26, life: 1.2 } );
			push( step );
			on.join?.( joined.length - 1, joined.length / 3 );

		}

		// 배경: 샤먼의 북 (박자마다), 1단계엔 샤먼이 계속 밀고, 합류한 고래들은 엇박마다 제 음
		function tick( now ) {

			if ( finished ) return;
			const dt = Math.min( 0.25, ( now - last ) / 1000 );
			last = now;
			if ( phase === 'mash' ) push( - ( p < 0.15 ? 0.4 : 1 ) * SHAMAN * dt );
			beatT -= dt;
			if ( beatT <= 0 ) {

				beatT += BEAT;
				beat ++;
				lastBeatAt = performance.now() / 1000;
				if ( ! silent ) {

					on.drum?.( ( 0.12 + 0.2 * ( 1 - p ) ) * drumVel );
					on.drumTap?.();
					if ( phase === 'mash' ) push( - DRUM * ( p < 0.15 ? 0.4 : 1 ) );
					tug.classList.remove( 'thump' );
					void tug.offsetWidth;
					tug.classList.add( 'thump' );

				}

				joined.forEach( ( v, i ) => later( BEAT / 2 + i * 0.02, () => ! finished && v.play( v.pitches[ ( beat + i ) % v.pitches.length ] ) ) );

			}

			if ( phase === 'mash' && p < 0.2 && ! warned ) {

				warned = true;
				say( T().symPushed );

			}

			raf = requestAnimationFrame( tick );

		}

		// 1단계: 연타
		function mash() {

			return new Promise( ( done ) => {

				say( T().symMash );
				G.puzzle = { tap() {

					taps ++;
					push( TAP );
					const t = performance.now();
					if ( t - lastNote > 90 ) {

						lastNote = t;
						on.hazel?.( 57 );

					}

					if ( taps % 4 === 0 ) {

						const h = G.actors.hazel;
						G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 14, life: 0.6, width: 0.3 } );

					}

					if ( p >= MASH_TO ) {

						G.puzzle = null;
						done();

					}

				} };

			} );

		}

		// 3단계: 북에 맞춰 누르면 붉은 쪽으로
		function onStray( t ) {

			const off = ( ( t - lastBeatAt ) % BEAT + BEAT ) % BEAT;
			if ( Math.min( off, BEAT - off ) < 0.12 ) {

				push( - 0.05 );
				on.drumTap?.();
				say( T().symOnDrum );

			}

		}

		const call = ( v ) => ( {
			actor: v.actor, color: v.color,
			play: ( n ) => n.len > 0 && v.tone ? v.tone( v.pitches[ 0 ], n.len ) : v.play( v.pitches[ n.echo ? 1 % v.pitches.length : 0 ] )
		} );

		async function run() {

			draw();
			raf = requestAnimationFrame( tick );
			// 1. 샤먼의 북소리
			await mash();

			// 2. 12번의 메아리
			phase = 'twelve';
			const v12 = byKey( 'twelve' );
			say( T().symP2, v12.name );
			await respond( G, { kind: 'echo', host, who: v12.name, notes: [ { at: 1.2, len: 1.8 } ], call: call( v12 ) } );
			join( v12 );

			// 3. 9번의 결의 (북과 다른 박자)
			phase = 'nine';
			const v9 = byKey( 'nine' );
			say( T().symP3, v9.name );
			await respond( G, { kind: 'answer', host, who: v9.name, notes: [ { at: 0, len: 0 }, { at: 0.75, len: 1.0 }, { at: 2.2, len: 0 } ], call: call( v9 ), onStray } );
			join( v9 );

			// 4. 8번의 용기: 샤먼의 마지막 강한 북
			phase = 'eight';
			const v8 = byKey( 'eight' );
			G.audio.play( 'boom' );
			on.drum?.( 0.6 );
			push( - 0.08 );
			say( T().symP4, v8.name );
			await respond( G, { kind: 'courage', host, who: v8.name, need: 1.3, call: call( v8 ), cue: () => v8.actor.breach?.( 14 ), jump: () => G.doJump() } );
			join( v8 );
			drumVel = 0.35; // 샤먼의 북이 약해진다

			// 5. 모두의 노래: 막대가 사라지고 북이 멎는다
			phase = 'final';
			silent = true;
			box.classList.add( 'final' );
			say( T().symSilence );
			await new Promise( ( r ) => later( 1.8, r ) );
			await finale();
			finish();

		}

		// 5단계: 길게 누르는 동안 동료들이 하나씩 합쳐지고, 놓으면 모두가 대답한다
		function finale() {

			return new Promise( ( done ) => {

				host.innerHTML = `<div class="sym-final"><b>♪</b></div>`;
				const btn = host.querySelector( '.sym-final' );
				say( T().symP5 );
				let stop = null, adding = null, count = 0, armed = ! G.singHeld;
				const need = Math.min( 3, voices.length );
				const press = () => {

					if ( ! armed ) return;
					stop = holdTone( G, 57 );
					btn.classList.add( 'on' );
					count = 0;
					const add = () => {

						if ( count >= voices.length ) return;
						const v = voices[ count ++ ];
						chip( v.key )?.classList.add( 'on' );
						v.tone ? v.tone( v.pitches[ 0 ], 2.5 ) : v.play( v.pitches[ 0 ] );
						v.actor.setGlow?.( 0.8, v.color );
						if ( v.actor.pos ) G.world.ring( v.actor.pos.x, v.actor.pos.z, { color: v.color, to: 20, life: 1.2 } );
						btn.style.setProperty( '--k', count / voices.length );
						adding = setTimeout( add, 700 );

					};

					adding = setTimeout( add, 500 );

				};

				const release = () => {

					armed = true;
					if ( ! stop ) return;
					stop();
					stop = null;
					clearTimeout( adding );
					btn.classList.remove( 'on' );
					if ( count < need ) {

						say( T().symP5Short );
						return;

					}

					// 놓는 순간: 모두가 각자의 목소리로 대답한다
					G.puzzle = null;
					voices.forEach( ( v, i ) => later( 0.05 + i * 0.07, () => {

						v.play( v.pitches[ ( i + 1 ) % v.pitches.length ] );
						v.actor.setGlow?.( 0.9, v.color );

					} ) );
					on.hazel?.( 57 );
					const h = G.actors.hazel;
					for ( let i = 0; i < 3; i ++ ) G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 90, life: 2.2, delay: i * 0.3 } );
					G.audio.play( 'heal' );
					say( T().symDone );
					later( 2.6, done );

				};

				G.puzzle = { press, release, tap: () => {} };

			} );

		}

		function finish() {

			finished = true;
			timers.forEach( clearTimeout );
			cancelAnimationFrame( raf );
			G.puzzle = null;
			G.sym = null;
			box.classList.remove( 'final' );
			G.ui.show( 'sym', false );
			document.body.classList.remove( 'singing' );
			G.audio.setMix( { melody: 1, piano: 1 }, 2 );
			for ( const v of voices ) v.actor.setGlow?.( v.rest ?? 0, v.restColor ?? v.color );
			resolve( { taps, low, overpowered: low < LOW } );

		}

		G.sym = { get p() {

			return p;

		}, get phase() {

			return phase;

		}, get joined() {

			return joined.length;

		} };
		run();

	} );

}
