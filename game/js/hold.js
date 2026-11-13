// MAP 3 · 노래로 응답하기: 노래 버튼(E · ♪)을 짧게(숏탭) 또는 길게(롱탭) 누르고, 필요하면 놓고 점프(Space · ⤴)
// 세 고래에게서 배운 세 가지 노래. 최종 교향곡에서도 그대로 다시 쓴다
//  echo    (12번 · 메아리): 메아리가 들리는 동안 함께 누르고, 메아리가 끝나면 놓는다
//  answer  (9번 · 결의): 짧은 소리 · 긴 소리를 먼저 듣고, 다음에 같은 자리에서 숏탭 · 롱탭으로
//  courage (8번 · 용기): 길게 눌러 용기를 채우고, 8번이 먼저 뛰어오르면 놓고 점프
// 판정은 넉넉하게. 틀리면 그 구간만 다시 (여러 번 틀리면 상대가 먼저 맞춰 준다)
import { lang } from './i18n.js';
import { holdTone } from './voices.js';

const $ = ( id ) => document.getElementById( id );
export const SHORT = 0.25; // 이보다 짧으면 숏탭
export const LONG = 0.4; // 이보다 길면 롱탭
const TOL = 0.32; // 누르는 순간의 허용 (초)
const LEAD = 1; // 따라 부르기: 막대가 첫 음에 닿기까지
const T = () => lang().ui.map3;

// opts: { kind, who, title, notes: [ { at, len } ] (len 0 = 짧은 소리), call: { actor, color, play( note ) }, host, need, maxTries, onBeat, onStray( t ), jump(), cue( ) }
export function respond( G, opts ) {

	const { kind, who = '', call = {}, maxTries = 3 } = opts;
	// 메아리는 막대 맨 앞에서 바로 시작하지 않게: 적어도 2초 앞서 자리를 보여 주고 박자를 센다
	// 따라 부르기도 첫 음이 막대 맨 앞에 붙지 않게 1초 띄운다 (그 사이 두 번 박자)
	const notes = ( opts.notes ?? [] ).map( ( n ) => kind === 'echo' ? { ...n, at: Math.max( 2, n.at ) } : kind === 'answer' ? { ...n, at: n.at + LEAD } : n );
	const own = ! opts.host; // 따로 받은 자리가 없으면 #hold 창을 연다
	const host = opts.host ?? $( 'hold-body' );
	return new Promise( ( resolve ) => {

		const now = () => performance.now() / 1000;
		const timers = new Set();
		const later = ( s, fn ) => {

			const id = setTimeout( () => {

				timers.delete( id );
				fn();

			}, Math.max( 0, s ) * 1000 );
			timers.add( id );

		};

		const clear = () => {

			timers.forEach( clearTimeout );
			timers.clear();

		};

		host.innerHTML = `<div class="hold-trk"><i class="head"></i></div><div class="hold-ring"><b></b><span>♪</span></div><p class="hold-hint"></p>`;
		const trk = host.querySelector( '.hold-trk' ), head = host.querySelector( '.head' ), ring = host.querySelector( '.hold-ring' ), hint = host.querySelector( '.hold-hint' );
		const fill = ring.querySelector( 'b' );
		if ( kind === 'courage' ) trk.style.display = 'none'; // 용기는 둘레의 빛만 (막대 없이)
		const say = ( text ) => hint.textContent = G.ui.dev( text.replace( /\{who\}/g, who ) );
		if ( own ) {

			$( 'hold-title' ).textContent = opts.title ?? T().holdTitle;
			document.body.classList.add( 'singing' );
			G.ui.show( 'hold' );

		}

		// 막대: 이번 구절의 길이 (+ 여유)
		const span = kind === 'courage' ? 1 : Math.max( 1.6, ...notes.map( ( n ) => n.at + n.len + 0.6 ) );
		const X = ( t ) => `${Math.max( 0, Math.min( 1, t / span ) ) * 100}%`;
		const block = ( t, len, cls ) => {

			const b = document.createElement( 'em' );
			b.className = cls;
			b.style.left = X( t );
			b.style.width = len > 0 ? `calc(${( len / span ) * 100}% )` : '';
			trk.appendChild( b );
			return b;

		};

		let tries = 0, phase = 'idle', t0 = 0, raf = 0, pressAt = null, pressBlock = null, stopTone = null, armed = ! G.singHeld, done = false;
		let results = [], courage = 0, cueAt = null, jumped = false;

		let lastT = now();
		function loop() {

			if ( done ) return;
			const dt = Math.min( 0.25, now() - lastT );
			lastT = now();
			const t = now() - t0;
			if ( phase === 'call' || phase === 'answer' || phase === 'echo' || ( phase === 'wait' && kind === 'echo' ) ) head.style.left = X( t );
			// 누르는 동안: 금빛 막대가 자라고 둘레의 빛이 커진다
			if ( pressAt !== null ) {

				const held = now() - pressAt;
				if ( pressBlock ) pressBlock.style.width = `${( held / span ) * 100}%`;
				ring.style.setProperty( '--k', Math.min( 1, held / 1.6 ) );
				if ( kind === 'courage' && phase === 'charge' ) {

					courage = Math.min( 1, courage + dt / ( opts.need ?? 1.3 ) );
					call.actor?.setGlow?.( 0.2 + courage * 0.6, call.color );

				}

			} else if ( kind === 'courage' && phase === 'charge' ) courage = Math.max( 0, courage - dt / 2.5 );

			if ( kind === 'courage' ) fill.style.height = `${courage * 100}%`;
			if ( kind === 'courage' && phase === 'charge' && courage >= 1 ) ready();
			raf = requestAnimationFrame( loop );

		}

		// ---- 누름 · 뗌 · 점프 ----
		function press() {

			if ( done ) return;
			if ( ! armed ) return; // 장면 전부터 누르고 있던 입력은 무시 (한 번 놓아야 받는다)
			pressAt = now();
			stopTone = holdTone( G, 57 );
			ring.classList.add( 'on' );
			opts.onPress?.();
			// 메아리는 막대가 닿기 조금 전에 눌러도 (폰은 손이 먼저 가기 쉽다) 금빛 막대를 그린다. 판정도 그만큼 봐준다
			if ( phase === 'answer' || phase === 'echo' || ( kind === 'echo' && phase === 'wait' ) ) pressBlock = block( pressAt - t0, 0.001, 'me' );
			else pressBlock = null;

		}

		function release() {

			armed = true;
			if ( pressAt === null ) return;
			const at = pressAt - t0, dur = now() - pressAt;
			pressAt = null;
			stopTone?.();
			stopTone = null;
			ring.classList.remove( 'on' );
			ring.style.setProperty( '--k', 0 );
			if ( phase === 'answer' ) judgeAnswer( at, dur );
			else if ( phase === 'echo' ) judgeEcho( at, dur );
			else if ( pressBlock ) pressBlock.classList.add( 'stray' ); // 메아리가 오기 전에 이미 놓았다
			pressBlock = null;

		}

		function jump() {

			if ( done ) return;
			opts.jump?.();
			if ( kind !== 'courage' || phase !== 'cue' ) return;
			if ( pressAt !== null ) return fail( T().holdLetGo ); // 먼저 놓고 점프
			const d = now() - cueAt;
			if ( d < - 0.2 ) return fail( T().holdEarly );
			jumped = true;
			pass();

		}

		// ---- echo: 메아리가 들리는 동안 함께 ----
		function startEcho() {

			phase = 'wait';
			results = [];
			say( T().holdEchoWait );
			const n = notes[ 0 ];
			t0 = now();
			// 메아리가 올 자리를 미리 흐리게 보여 주고, 막대가 다가가는 동안 두 번 박자를 센다
			const ghost = block( n.at, n.len, 'them ghost' );
			for ( const k of [ 1, 0.5 ] ) later( n.at - k, () => phase === 'wait' && G.audio.play( 'blip' ) );
			later( n.at - 0.05, () => {

				phase = 'echo';
				call.play?.( n );
				call.actor?.setGlow?.( 0.7, call.color );
				ghost.classList.remove( 'ghost' );
				say( T().holdEchoNow );

			} );
			// 끝까지 누르고만 있으면: 너무 길게
			later( n.at + n.len + 0.6, () => {

				if ( phase !== 'echo' ) return;
				if ( pressAt !== null ) {

					stopTone?.();
					pressAt = null;
					ring.classList.remove( 'on' );
					return fail( T().holdTooLong );

				}

				fail( T().holdMissed );

			} );

		}

		function judgeEcho( at, dur ) {

			const n = notes[ 0 ];
			call.actor?.setGlow?.( 0.15, call.color );
			const startOk = Math.abs( at - n.at ) <= TOL + 0.1;
			const endOk = Math.abs( at + dur - ( n.at + n.len ) ) <= 0.45 && dur >= n.len * 0.6;
			if ( startOk && endOk ) return pass();
			fail( ! startOk ? T().holdMissed : dur < n.len * 0.6 ? T().holdTooShort : T().holdTooLong );

		}

		// ---- answer: 먼저 듣고, 같은 자리에서 숏탭 · 롱탭 ----
		function startCall() {

			phase = 'call';
			results = notes.map( () => null );
			trk.querySelectorAll( 'em' ).forEach( ( e ) => e.remove() );
			say( T().holdListen );
			t0 = now() + 0.3;
			for ( const n of notes ) later( 0.3 + n.at, () => {

				call.play?.( n );
				call.actor?.setGlow?.( 0.7, call.color );
				later( Math.max( 0.15, n.len ), () => call.actor?.setGlow?.( 0.15, call.color ) );
				block( n.at, n.len, n.len > 0 ? 'them long' : 'them' );

			} );
			const end = 0.3 + Math.max( ...notes.map( ( n ) => n.at + n.len ) ) + 0.5;
			later( end, startAnswer );

		}

		function startAnswer() {

			phase = 'answer';
			t0 = now();
			trk.querySelectorAll( 'em.them' ).forEach( ( e ) => e.classList.add( 'ghost' ) );
			say( T().holdReady );
			// 막대가 첫 음에 닿기 전에 두 번 박자를 세고 헤이즐 차례
			const first = Math.min( ...notes.map( ( n ) => n.at ) );
			for ( const k of [ 1, 0.5 ] ) later( first - k, () => {

				opts.onBeat?.();
				G.audio.play( 'blip' );

			} );
			later( first - 0.4, () => phase === 'answer' && say( T().holdAnswer ) );
			const end = Math.max( ...notes.map( ( n ) => n.at + n.len ) ) + 0.9;
			later( end, () => {

				if ( phase !== 'answer' ) return;
				if ( pressAt !== null ) release();
				const ok = results.filter( ( r ) => r === true ).length;
				const need = notes.length >= 4 ? notes.length - 1 : notes.length;
				if ( ok >= need ) pass();
				else fail( results.some( ( r ) => r === 'short' ) ? T().holdNeedLong : results.some( ( r ) => r === 'long' ) ? T().holdNeedShort : T().holdMissed );

			} );

		}

		function judgeAnswer( at, dur ) {

			let best = - 1, bd = Infinity;
			notes.forEach( ( n, i ) => {

				const d = Math.abs( at - n.at );
				if ( results[ i ] === null && d < bd ) {

					bd = d;
					best = i;

				}

			} );
			if ( best < 0 || bd > TOL ) {

				opts.onStray?.( pressAt ?? now() );
				if ( pressBlock ) pressBlock.classList.add( 'stray' );
				return;

			}

			const n = notes[ best ];
			let ok;
			if ( n.len > 0 ) ok = dur >= Math.max( LONG, n.len * 0.6 ) ? true : 'short';
			else ok = dur < LONG ? true : 'long';
			results[ best ] = ok;
			if ( pressBlock ) pressBlock.classList.add( ok === true ? 'ok' : 'bad' );
			if ( ok === true ) call.play?.( { ...n, echo: true } );

		}

		// ---- courage: 길게 눌러 용기를 채우고, 8번이 뛰면 놓고 점프 ----
		function startCourage() {

			phase = 'charge';
			courage = 0;
			jumped = false;
			say( T().holdCourage );

		}

		function ready() {

			phase = 'brave';
			say( T().holdBrave );
			const wait = 0.7 + Math.random() * 0.6;
			opts.cueSoon?.( wait );
			later( wait, () => {

				phase = 'cue';
				cueAt = now();
				opts.cue?.(); // 8번이 먼저 뛰어오른다
				say( T().holdJump );
				later( 0.9, () => phase === 'cue' && ! jumped && fail( T().holdLate ) );

			} );

		}

		// ---- 결과 ----
		function pass() {

			phase = 'done';
			clear();
			G.audio.play( 'pickup' );
			say( T().holdOk );
			call.actor?.setGlow?.( 0.15, call.color );
			later( 1.1, () => finish( true ) );

		}

		function fail( text ) {

			if ( phase === 'done' || phase === 'fail' ) return;
			phase = 'fail';
			clear();
			tries ++;
			G.audio.play( 'miss' );
			call.actor?.setGlow?.( 0.15, call.color );
			if ( tries >= maxTries ) {

				// 여러 번 어긋나면 상대가 먼저 맞춰 준다
				say( T().holdHelp );
				return later( 1.4, () => finish( true, true ) );

			}

			say( `${G.ui.dev( text )} — ${T().holdRetry}` );
			later( 1.5, start );

		}

		function finish( ok, helped = false ) {

			done = true;
			G.hold = null;
			clear();
			cancelAnimationFrame( raf );
			stopTone?.();
			if ( G.puzzle === api ) G.puzzle = null;
			if ( own ) {

				G.ui.show( 'hold', false );
				document.body.classList.remove( 'singing' );

			}

			resolve( { ok, helped, tries } );

		}

		function start() {

			trk.querySelectorAll( 'em' ).forEach( ( e ) => e.remove() );
			if ( kind === 'echo' ) startEcho();
			else if ( kind === 'answer' ) startCall();
			else startCourage();

		}

		const api = { press, release, jump, tap: () => {} };
		G.puzzle = api;
		// 개발 · 테스트용: 지금 어떤 노래의 어느 단계인지
		G.hold = { kind, notes, get phase() {

			return phase;

		}, get t() {

			return now() - t0;

		} };
		raf = requestAnimationFrame( loop );
		start();

	} );

}
