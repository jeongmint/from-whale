// MAP 3 · 고래의 교향곡: 샤먼의 북과 헤이즐의 52Hz가 줄다리기를 한다
// 연타(E · ♪)할수록 금빛(헤이즐과 동료들) 쪽으로 밀고, 샤먼의 북은 쉬지 않고 붉은 쪽으로 밀어붙인다 (박자마다 한 번 더 세게)
// 막대가 정해 둔 자리를 넘을 때마다 동료가 하나씩 합류해 함께 민다 (소리도 하나씩 겹친다). 끝까지 밀어내면 모두가 함께 노래한다
import { lang } from './i18n.js';

const $ = ( id ) => document.getElementById( id );
const BEAT = 60 / 92;
const START = 0.35; // 막대의 처음 자리 (0 샤먼 ~ 1 헤이즐)
const TAP = 0.014; // 한 번 누를 때 미는 만큼 (초당 6~7번이면 15초 남짓)
const SHAMAN = 0.042; // 샤먼이 1초에 미는 만큼 (동료가 모일수록 조금씩 세진다)
const DRUM = 0.01; // 북이 박자마다 한 번 더 미는 만큼
const HELP = 0.011; // 합류한 동료 하나가 1초에 함께 미는 만큼
const LOW = 0.18; // 이보다 밀리면 '샤먼의 합창에 거의 묻혔다' (붉은 쪽 깊이)
const HAZEL_MIDI = 57; // 헤이즐은 끝까지 52Hz 쪽의 낮은 한 음
const T = () => lang().ui.map3;

// voices: [ { name, actor, pitches: [ MIDI ], play( midi ), color } ]
// on: { drum( vel ), drumTap(), join( i, frac ), hazel( midi ) } — 장면 쪽 연출
export function symphony( G, voices, on = {} ) {

	return new Promise( ( resolve ) => {

		const box = $( 'sym' ), lanes = $( 'sym-lanes' ), hint = $( 'sym-hint' );
		const n = voices.length;
		// 동료가 합류하는 자리: 처음 자리 조금 위부터 0.9까지 고르게
		const marks = voices.map( ( v, i ) => 0.44 + ( 0.9 - 0.44 ) * ( n > 1 ? i / ( n - 1 ) : 1 ) );
		lanes.innerHTML = `<div class="tug"><b class="red"></b><b class="gold"></b>${marks.map( ( m ) => `<s style="left:${m * 100}%"></s>` ).join( '' )}<i class="mark"></i></div>
			<div class="chips">${voices.map( ( v ) => `<span>${v.name}</span>` ).join( '' )}</div>`;
		const red = lanes.querySelector( '.red' ), gold = lanes.querySelector( '.gold' ), mark = lanes.querySelector( '.mark' );
		const chips = [ ...lanes.querySelectorAll( '.chips span' ) ];
		const say = ( text, who = '' ) => hint.textContent = G.ui.dev( text.replace( '{who}', who ) );
		$( 'sym-title' ).textContent = T().symTitle;
		document.body.classList.add( 'singing' );
		G.ui.show( 'sym' );
		G.audio.setMix( { melody: 0.1, piano: 0.5 }, 1 );
		say( T().symMash );

		let p = START, low = START, joined = 0, taps = 0, beat = 0, beatT = BEAT, last = performance.now(), raf = 0, done = false, lastNote = 0, warned = false;
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

		// 동료가 합류한다: 이름이 켜지고, 그 고래가 빛나며 소리가 하나 더 겹친다
		function join() {

			const v = voices[ joined ];
			chips[ joined ].classList.add( 'on' );
			joined ++;
			v.play( v.pitches[ 0 ] );
			v.actor.setGlow?.( 0.8, v.color );
			later( 0.4, () => v.actor.setGlow?.( v.rest ?? 0.2, v.restColor ?? v.color ) );
			if ( v.actor.pos ) G.world.ring( v.actor.pos.x, v.actor.pos.z, { color: v.color, to: 26, life: 1.2 } );
			G.audio.play( 'pickup' );
			say( T().symJoin, v.name );
			on.join?.( joined - 1, joined / n );

		}

		function tick( now ) {

			if ( done ) return;
			const dt = Math.min( 0.25, ( now - last ) / 1000 ); // 느린 화면에서도 실제 시간대로
			last = now;
			// 거의 다 밀렸을 땐 샤먼도 덜 민다 (연타가 느려도 끝까지 갈 수 있게)
			const ease = p < 0.15 ? 0.4 : 1;
			p += ( - ( SHAMAN + joined * 0.005 ) * ease + joined * HELP ) * dt;
			// 샤먼의 북: 박자마다 한 번 더 세게. 합류한 동료들은 엇박에 제 음을 하나씩 낸다
			beatT -= dt;
			if ( beatT <= 0 ) {

				beatT += BEAT;
				beat ++;
				p -= DRUM * ( p < 0.15 ? 0.4 : 1 );
				on.drum?.( 0.12 + 0.2 * ( 1 - p ) );
				on.drumTap?.();
				box.classList.remove( 'thump' );
				void box.offsetWidth;
				box.classList.add( 'thump' );
				voices.slice( 0, joined ).forEach( ( v, i ) => later( BEAT / 2 + i * 0.02, () => v.play( v.pitches[ ( beat + i ) % v.pitches.length ] ) ) );

			}

			p = Math.max( 0.03, p );
			low = Math.min( low, p );
			if ( p < 0.2 && ! warned ) {

				warned = true;
				say( T().symPushed );

			}

			while ( joined < n && p >= marks[ joined ] ) join();
			draw();
			if ( p >= 1 ) return finish();
			raf = requestAnimationFrame( tick );

		}

		function tap() {

			if ( done ) return;
			taps ++;
			p += TAP;
			const t = performance.now();
			if ( t - lastNote > 90 ) {

				lastNote = t;
				on.hazel?.( HAZEL_MIDI );

			}

			if ( taps % 4 === 0 ) {

				const h = G.actors.hazel;
				G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 14, life: 0.6, width: 0.3 } );

			}

		}

		// 끝까지 밀어냈다: 모두가 한꺼번에 제 음으로
		function finish() {

			done = true;
			p = 1;
			draw();
			cancelAnimationFrame( raf );
			say( T().symDone );
			G.audio.play( 'heal' );
			voices.forEach( ( v, i ) => later( 0.05 + i * 0.04, () => v.play( v.pitches[ 0 ] ) ) );
			on.hazel?.( HAZEL_MIDI );
			const h = G.actors.hazel;
			G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 90, life: 2.2 } );
			later( 2.2, () => {

				timers.forEach( clearTimeout );
				G.puzzle = null;
				G.sym = null;
				box.onpointerdown = null;
				box.classList.remove( 'thump' );
				G.ui.show( 'sym', false );
				document.body.classList.remove( 'singing' );
				G.audio.setMix( { melody: 1, piano: 1 }, 2 );
				for ( const v of voices ) v.actor.setGlow?.( v.rest ?? 0, v.restColor ?? v.color );
				resolve( { taps, low, overpowered: low < LOW } );

			} );

		}

		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};

		G.puzzle = { tap };
		G.sym = { get p() {

			return p;

		}, get joined() {

			return joined;

		} };
		draw();
		raf = requestAnimationFrame( tick );

	} );

}
