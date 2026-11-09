// MAP 3 · 노래가 곧 선택지: 고래를 만날 때마다 어떻게 노래할지 고른다
// 듣는 노래: 상대의 선율을 먼저 듣고 같은 박자로 이어 부른다 (헤이즐은 제 목소리 그대로, 한 옥타브 아래)
// 이끄는 노래: 헤이즐이 박자를 정하면 상대가 그대로 따라 부른다
// 혼자 부르는 노래: 헤이즐의 노래만 부르고 지나간다
import { lang } from './i18n.js';

const $ = ( id ) => document.getElementById( id );
const BEAT = 60 / 92; // 음악과 같은 박자
const TOL = 0.24; // 듣는 노래: 넉넉하게 (초)
const LEAD_BEATS = 4; // 이끄는 노래: 한 번에 4박
const HAZEL_SCALE = [ 57, 60, 62, 64, 67, 69, 72, 69, 67, 64 ]; // 누를 때마다 오르내리는 A 마이너 펜타토닉
export const SONG_KEYS = [ 'listen', 'lead', 'alone' ];

const mtof = ( m ) => 440 * Math.pow( 2, ( m - 69 ) / 12 );

// {who}를 이름으로. 한국어 '{who}이'는 받침에 맞게 '이' / '가' (12번이, 혹등고래의 노래가)
function fillWho( text, who ) {

	const last = who.charCodeAt( who.length - 1 );
	const batchim = last >= 0xac00 && last <= 0xd7a3 ? ( last - 0xac00 ) % 28 > 0 : /[0-9]$/.test( who ) ? ! /[2459]$/.test( who ) : true;
	return text.replace( /\{who\}이/g, who + ( batchim ? '이' : '가' ) ).replace( /\{who\}/g, who );

}
const T = () => lang().ui.map3;

// 범고래의 휘파람 같은 소리. shaky가 클수록 떨리고 끝이 처진다 (울먹임)
export function orcaNote( G, midi, shaky = 0 ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.93 ], [ 0.07, f ], [ 0.4, f * ( 1 - shaky * 0.07 ) ] ], { vel: 0.08, vibrato: 6 + shaky * 6, depth: 0.01 + shaky * 0.03, reverb: 0.9 } );
	a.noiseHit( t, { freq: 3200, q: 7, vel: 0.03, dur: 0.03, bus: a.sfx } );

}

// 헤이즐: 52Hz의 낮은 울림이 깔린 노래
export function hazelNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.97 ], [ 0.05, f ], [ 0.44, f ] ], { vel: 0.13, vibrato: 6, reverb: 0.7 } );
	a.voice( t + 0.02, [ [ 0, f * 0.485 ], [ 0.06, f / 2 ], [ 0.5, f / 2 ] ], { vel: 0.07, vibrato: 4.5, reverb: 1 } );

}

function timers() {

	const set = new Set();
	const later = ( s, fn ) => {

		const id = setTimeout( () => {

			set.delete( id );
			fn();

		}, s * 1000 );
		set.add( id );

	};

	later.clear = () => {

		set.forEach( clearTimeout );
		set.clear();

	};

	return later;

}

// 어떻게 노래할까: 세 갈래 중 하나를 고른다. 1 · 2 · 3 / 방향키 + E / 눌러서
export function chooseSong( G, who ) {

	return new Promise( ( resolve ) => {

		const box = $( 'choice' ), list = $( 'choice-list' );
		let sel = 0;
		$( 'choice-title' ).textContent = T().choiceTitle;
		$( 'choice-hint' ).textContent = G.ui.dev( fillWho( T().choiceHint, who ) );
		list.replaceChildren( ...SONG_KEYS.map( ( k, i ) => {

			const b = document.createElement( 'button' );
			b.type = 'button';
			b.className = 'choice';
			b.dataset.k = k;
			b.innerHTML = `<b><span class="mono">${i + 1}</span> ${T().songs[ k ].name}</b><small>${G.ui.dev( fillWho( T().songs[ k ].desc, who ) )}</small>`;
			b.onpointerdown = ( e ) => {

				e.stopPropagation();
				sel = i;
				draw();

			};

			b.onclick = ( e ) => {

				e.stopPropagation();
				done( i );

			};

			return b;

		} ) );

		const draw = () => [ ...list.children ].forEach( ( b, i ) => b.classList.toggle( 'on', i === sel ) );
		const done = ( i ) => {

			G.puzzle = null;
			G.audio.play( 'objective' );
			G.ui.show( 'choice', false );
			document.body.classList.remove( 'choosing' );
			resolve( SONG_KEYS[ i ] );

		};

		G.puzzle = {
			tap: () => done( sel ),
			key: ( code ) => {

				const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[ code ];
				if ( n !== undefined ) return done( n );
				if ( code === 'ArrowUp' || code === 'ArrowLeft' || code === 'KeyW' || code === 'KeyA' ) sel = ( sel + 2 ) % 3;
				else if ( code === 'ArrowDown' || code === 'ArrowRight' || code === 'KeyS' || code === 'KeyD' ) sel = ( sel + 1 ) % 3;
				else return false;
				G.audio.play( 'blip' );
				draw();
				return true;

			}
		};
		box.onpointerdown = ( e ) => e.stopPropagation();
		document.body.classList.add( 'choosing' );
		draw();
		G.ui.show( 'choice' );

	} );

}

function openSong( G, title ) {

	$( 'song-title' ).textContent = title;
	document.body.classList.add( 'singing' );
	G.ui.show( 'song' );

}

function closeSong( G, actor ) {

	G.puzzle = null;
	$( 'song' ).onpointerdown = null;
	$( 'song' ).classList.remove( 'turn', 'lead' );
	G.ui.show( 'song', false );
	document.body.classList.remove( 'singing' );
	G.audio.setMix( { melody: 1 }, 2 );
	actor.setGlow( 0.08, 0x7fe9ff );

}

// 듣는 노래. phrases: [ [ 박, 음(MIDI) ], ... ] 묶음. 처음엔 떨리던 상대의 소리가 구절마다 또렷해진다
export function listenSong( G, actor, phrases, who ) {

	return new Promise( ( resolve ) => {

		const box = $( 'song' ), beatsEl = $( 'song-beats' ), hint = $( 'song-hint' );
		const later = timers();
		const now = () => performance.now() / 1000;
		const say = ( text ) => hint.textContent = G.ui.dev( fillWho( text, who ) );
		let round = 0, fails = 0, dots = [];
		const state = { turn: false, taps: [], tap };
		G.puzzle = state;
		openSong( G, fillWho( T().listenTitle, who ) );
		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};

		G.audio.setMix( { melody: 0.15 }, 1 );
		actor.setGlow( 0.2, 0x7fe9ff );
		const shaky = () => phrases.length > 1 ? 1 - round / ( phrases.length - 1 ) : 0;

		function listen() {

			const p = phrases[ round ];
			state.turn = false;
			state.taps = [];
			box.classList.remove( 'turn' );
			beatsEl.innerHTML = '<span></span>'.repeat( p.length );
			dots = [ ...beatsEl.children ];
			say( T().listen );
			p.forEach( ( [ b, midi ], i ) => later( 0.5 + b * BEAT, () => {

				orcaNote( G, midi, shaky() );
				actor.setGlow( 0.75, 0x7fe9ff );
				later( 0.16, () => actor.setGlow( 0.2 ) );
				G.world.ring( actor.pos.x, actor.pos.z, { color: 0x7fe9ff, to: 14, life: 0.6, width: 0.3 } );
				dots[ i ].classList.add( 'them' );
				later( 0.24, () => dots[ i ].classList.remove( 'them' ) );

			} ) );
			later( 0.5 + p[ p.length - 1 ][ 0 ] * BEAT + BEAT * 1.2, () => {

				state.turn = true;
				box.classList.add( 'turn' );
				say( T().turn );

			} );

		}

		function tap() {

			if ( ! state.turn ) return;
			const p = phrases[ round ];
			const at = now();
			const taps = state.taps;
			if ( taps.length && at - taps[ taps.length - 1 ] < 0.08 ) return;
			taps.push( at );
			const i = taps.length - 1;
			const h = G.actors.hazel;
			hazelNote( G, p[ Math.min( i, p.length - 1 ) ][ 1 ] - 12 ); // 같은 박자, 헤이즐의 목소리
			G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 12, life: 0.6, width: 0.3 } );
			const off = ( at - taps[ 0 ] ) - ( p[ i ][ 0 ] - p[ 0 ][ 0 ] ) * BEAT;
			if ( Math.abs( off ) > TOL ) return miss( i );
			dots[ i ].classList.add( 'ok' );
			if ( taps.length === p.length ) return pass();
			const wait = ( p[ i + 1 ][ 0 ] - p[ i ][ 0 ] ) * BEAT + TOL + 0.05;
			const count = taps.length;
			later( wait, () => state.turn && state.taps.length === count && miss( count ) );

		}

		function miss( i ) {

			state.turn = false;
			box.classList.remove( 'turn' );
			if ( dots[ i ] ) dots[ i ].classList.add( 'bad' );
			G.audio.play( 'miss' );
			fails ++;
			if ( fails >= 3 ) {

				// 세 번 어긋나면 상대가 먼저 헤이즐의 박자에 맞춰 준다
				say( T().help );
				dots.forEach( ( d ) => d.className = 'ok' );
				return later( 1.6, next );

			}

			say( T().miss );
			later( 1.3, listen );

		}

		function pass() {

			state.turn = false;
			box.classList.remove( 'turn' );
			G.audio.play( 'pickup' );
			say( T().good );
			// 대답이 끝나면 둘의 소리가 한 번 겹친다
			later( 0.35, () => {

				orcaNote( G, phrases[ round ][ phrases[ round ].length - 1 ][ 1 ], shaky() * 0.5 );
				hazelNote( G, phrases[ round ][ phrases[ round ].length - 1 ][ 1 ] - 12 );

			} );
			later( 1.4, next );

		}

		function next() {

			round ++;
			fails = 0;
			if ( round < phrases.length ) return listen();
			say( T().listenDone );
			G.audio.play( 'heal' );
			G.world.ring( actor.pos.x, actor.pos.z, { color: 0x7fe9ff, to: 40, life: 1.4 } );
			later( 1.6, () => {

				later.clear();
				closeSong( G, actor );
				resolve();

			} );

		}

		listen();

	} );

}

// 이끄는 노래: 4박 동안 헤이즐이 마음대로 노래하면, 상대가 그 박자 그대로 따라 부른다 (rounds번)
export function leadSong( G, actor, who, rounds = 3 ) {

	return new Promise( ( resolve ) => {

		const box = $( 'song' ), beatsEl = $( 'song-beats' ), hint = $( 'song-hint' );
		const later = timers();
		const now = () => performance.now() / 1000;
		const say = ( text ) => hint.textContent = G.ui.dev( fillWho( text, who ) );
		let round = 0, start = 0, taps = [], open = false, raf = 0, bar, cursor;
		G.puzzle = { tap };
		openSong( G, fillWho( T().leadTitle, who ) );
		box.classList.add( 'lead' );
		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};

		G.audio.setMix( { melody: 0.15 }, 1 );
		actor.setGlow( 0.2, 0xffd36b );
		const span = LEAD_BEATS * BEAT;

		function draw() {

			beatsEl.innerHTML = `<div class="lead-bar">${'<s></s>'.repeat( LEAD_BEATS - 1 )}<i></i></div>`;
			bar = beatsEl.firstChild;
			cursor = bar.querySelector( 'i' );
			[ ...bar.querySelectorAll( 's' ) ].forEach( ( s, i ) => s.style.left = `${( i + 1 ) / LEAD_BEATS * 100}%` );

		}

		function mark( at, cls ) {

			const m = document.createElement( 'em' );
			m.className = cls;
			m.style.left = `${Math.min( 0.98, at / span ) * 100}%`;
			bar.appendChild( m );

		}

		// 한 박 쉬고 (박자 소리 하나), 4박 동안 헤이즐 차례
		function ready() {

			taps = [];
			draw();
			say( round ? T().leadAgain : T().leadReady );
			box.classList.remove( 'turn' );
			later( 0.4, () => G.audio.play( 'blip' ) );
			later( 0.4 + BEAT, () => {

				open = true;
				start = now();
				box.classList.add( 'turn' );
				say( T().leadTurn );
				for ( let b = 0; b < LEAD_BEATS; b ++ ) later( b * BEAT, () => G.audio.play( 'blip' ) );
				later( span, close );
				raf = requestAnimationFrame( move );

			} );

		}

		function move() {

			if ( ! open ) return;
			cursor.style.left = `${Math.min( 1, ( now() - start ) / span ) * 100}%`;
			raf = requestAnimationFrame( move );

		}

		function tap() {

			if ( ! open || taps.length >= 8 ) return;
			const at = now() - start;
			if ( taps.length && at - taps[ taps.length - 1 ].at < 0.1 ) return;
			const midi = HAZEL_SCALE[ taps.length % HAZEL_SCALE.length ];
			taps.push( { at, midi } );
			hazelNote( G, midi );
			const h = G.actors.hazel;
			G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 12, life: 0.6, width: 0.3 } );
			mark( at, 'me' );

		}

		function close() {

			open = false;
			cancelAnimationFrame( raf );
			box.classList.remove( 'turn' );
			if ( taps.length < 2 ) {

				say( T().leadEmpty );
				return later( 1.2, ready );

			}

			// 상대가 그대로 따라 부른다 (한 옥타브 위, 구절마다 덜 떨린다)
			say( T().leadEcho );
			const shaky = 0.6 * ( 1 - round / Math.max( 1, rounds - 1 ) );
			const lag = 0.5;
			for ( const tp of taps ) later( lag + tp.at, () => {

				orcaNote( G, tp.midi + 12, shaky );
				actor.setGlow( 0.75, 0xffd36b );
				later( 0.16, () => actor.setGlow( 0.2 ) );
				G.world.ring( actor.pos.x, actor.pos.z, { color: 0xffd36b, to: 14, life: 0.6, width: 0.3 } );
				mark( tp.at, 'them' );

			} );
			later( lag + taps[ taps.length - 1 ].at + 1.1, () => {

				G.audio.play( 'pickup' );
				round ++;
				if ( round < rounds ) return ready();
				say( T().leadDone );
				G.audio.play( 'heal' );
				G.world.ring( actor.pos.x, actor.pos.z, { color: 0xffd36b, to: 40, life: 1.4 } );
				later( 1.6, () => {

					later.clear();
					closeSong( G, actor );
					resolve();

				} );

			} );

		}

		ready();

	} );

}

// 혼자 부르는 노래: 헤이즐의 52Hz만 세 번 울린다 (맞출 박자는 없다)
export function soloSong( G ) {

	return new Promise( ( resolve ) => {

		const h = G.actors.hazel;
		const later = timers();
		for ( let i = 0; i < 3; i ++ ) later( i * 1.5, () => {

			G.audio.play( 'sing' );
			h.setGlow( 0.6, 0x7fe9ff );
			later( 0.4, () => h.setGlow( 0 ) );
			for ( let j = 0; j < 2; j ++ ) G.world.ring( h.pos.x, h.pos.z, { color: 0x7fe9ff, to: 50 + i * 12, life: 1.5, delay: j * 0.25 } );

		} );
		later( 4.6, resolve );

	} );

}

// 루크의 뿔피리 같은 소리 (삼각파, 한 옥타브 아래가 받쳐 준다)
export function hornNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.96 ], [ 0.08, f ], [ 0.55, f ] ], { vel: 0.08, vibrato: 5, type: 'triangle', reverb: 0.9 } );
	a.voice( t, [ [ 0, f / 2 ], [ 0.6, f / 2 ] ], { vel: 0.05, vibrato: 4, reverb: 1 } );

}

// 등대의 종소리 (대답하는 고래가 아무도 없을 때)
export function bellNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	a.ep( ctx.currentTime + 0.01, midi, 0.16, 1.4, a.sfx, 0.9 );

}

// 옛 고래들의 노래 (노래 바위). 루크가 있으면 뿔로 들려준다
export function playOldSong( G, kind ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const t = ctx.currentTime + 0.05;
	if ( kind === 'hump' ) {

		// 혹등고래: 길게 오르내리는 노래가 되풀이된다
		[ [ 0, 260, 470, 330 ], [ 1.6, 300, 560, 360 ], [ 3.2, 240, 420, 280 ] ].forEach( ( [ d, f0, f1, f2 ] ) => a.voice( t + d, [ [ 0, f0 ], [ 0.6, f1 ], [ 1.4, f2 ] ], { vel: 0.1, vibrato: 4, reverb: 1.4 } ) );

	} else if ( kind === 'blue' ) {

		// 대왕고래: 아주 낮고 긴 소리
		a.voice( t, [ [ 0, 92 ], [ 2.2, 84 ], [ 4.2, 70 ] ], { vel: 0.26, type: 'triangle', vibrato: 1.5, reverb: 1.6 } );
		a.voice( t + 0.3, [ [ 0, 184 ], [ 2.2, 168 ], [ 4, 140 ] ], { vel: 0.05, vibrato: 1.5, reverb: 1.6 } );

	} else {

		// 향유고래: 무리마다 다른 딸깍 박자 (점 점 점 쉬고 점)
		[ 0, 0.22, 0.44, 0.9, 1.6, 1.82, 2.04, 2.5 ].forEach( ( d ) => a.noiseHit( t + d, { freq: 2600, q: 5, vel: 0.14, dur: 0.035, bus: a.sfx } ) );

	}

}

// 대답하는 노래 (등대의 첫 합주): 헤이즐이 4박 동안 노래하면, 함께 온 목소리들이 하나씩 제 소리로 대답한다
// responders: [ { actor, play( midi ), color, rest?, restColor? } ] (rest: 끝나고 돌아갈 빛). onBeat: 헤이즐 차례의 박자마다 (루크가 없으면 등대 불빛이 깜빡인다)
export function answerSong( G, { responders, rounds = 2, onBeat = null } ) {

	return new Promise( ( resolve ) => {

		const box = $( 'song' ), beatsEl = $( 'song-beats' ), hint = $( 'song-hint' );
		const later = timers();
		const now = () => performance.now() / 1000;
		const say = ( text ) => hint.textContent = G.ui.dev( text );
		const span = LEAD_BEATS * BEAT;
		let round = 0, start = 0, taps = [], open = false, raf = 0, bar, cursor;
		G.puzzle = { tap };
		openSong( G, T().answerTitle );
		box.classList.add( 'lead' );
		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};

		G.audio.setMix( { melody: 0.15 }, 1 );

		function draw() {

			beatsEl.innerHTML = `<div class="lead-bar" style="height:${26 + responders.length * 9}px">${'<s></s>'.repeat( LEAD_BEATS - 1 )}<i></i></div>`;
			bar = beatsEl.firstChild;
			cursor = bar.querySelector( 'i' );
			[ ...bar.querySelectorAll( 's' ) ].forEach( ( s, i ) => s.style.left = `${( i + 1 ) / LEAD_BEATS * 100}%` );

		}

		function mark( at, row, color ) {

			const m = document.createElement( 'em' );
			m.className = row < 0 ? 'me' : 'them';
			m.style.left = `${Math.min( 0.98, at / span ) * 100}%`;
			if ( row >= 0 ) {

				m.style.top = `${12 + row * 9}px`;
				m.style.bottom = 'auto';
				const c = `#${color.toString( 16 ).padStart( 6, '0' )}`;
				m.style.background = c;
				m.style.boxShadow = `0 0 10px ${c}`;

			}

			bar.appendChild( m );

		}

		function ready() {

			taps = [];
			draw();
			say( round ? T().answerAgain : T().answerReady );
			box.classList.remove( 'turn' );
			later( 0.4, () => G.audio.play( 'blip' ) );
			later( 0.4 + BEAT, () => {

				open = true;
				start = now();
				box.classList.add( 'turn' );
				say( T().leadTurn );
				for ( let b = 0; b < LEAD_BEATS; b ++ ) later( b * BEAT, () => {

					G.audio.play( 'blip' );
					onBeat?.();

				} );
				later( span, close );
				raf = requestAnimationFrame( move );

			} );

		}

		function move() {

			if ( ! open ) return;
			cursor.style.left = `${Math.min( 1, ( now() - start ) / span ) * 100}%`;
			raf = requestAnimationFrame( move );

		}

		function tap() {

			if ( ! open || taps.length >= 8 ) return;
			const at = now() - start;
			if ( taps.length && at - taps[ taps.length - 1 ].at < 0.1 ) return;
			const midi = HAZEL_SCALE[ taps.length % HAZEL_SCALE.length ];
			taps.push( { at, midi } );
			hazelNote( G, midi );
			const h = G.actors.hazel;
			G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 12, life: 0.6, width: 0.3 } );
			mark( at, - 1 );

		}

		// 한 명씩 차례로, 같은 박자를 제 소리로 (조금씩 어긋나도 괜찮다)
		function close() {

			open = false;
			cancelAnimationFrame( raf );
			box.classList.remove( 'turn' );
			if ( taps.length < 2 ) {

				say( T().leadEmpty );
				return later( 1.2, ready );

			}

			say( T().answerEcho );
			const len = taps[ taps.length - 1 ].at;
			let at = 0.5;
			responders.forEach( ( r, row ) => {

				for ( const tp of taps ) later( at + tp.at + ( Math.random() - 0.5 ) * 0.08, () => {

					r.play( tp.midi );
					r.actor.setGlow?.( 0.75, r.color );
					later( 0.16, () => r.actor.setGlow?.( r.rest ?? 0.15, r.restColor ?? r.color ) );
					G.world.ring( r.actor.pos.x, r.actor.pos.z, { color: r.color, to: 14, life: 0.6, width: 0.3 } );
					mark( tp.at, row, r.color );

				} );
				at += len + 0.6;

			} );
			later( at + 0.6, () => {

				G.audio.play( 'pickup' );
				round ++;
				if ( round < rounds ) return ready();
				say( T().answerDone );
				G.audio.play( 'heal' );
				const h = G.actors.hazel;
				G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 60, life: 1.6 } );
				later( 1.8, () => {

					later.clear();
					G.puzzle = null;
					box.onpointerdown = null;
					box.classList.remove( 'turn', 'lead' );
					G.ui.show( 'song', false );
					document.body.classList.remove( 'singing' );
					G.audio.setMix( { melody: 1 }, 2 );
					for ( const r of responders ) r.actor.setGlow?.( r.rest ?? 0, r.restColor ?? r.color ); // 루크의 등불처럼 원래 빛으로
					resolve();

				} );

			} );

		}

		ready();

	} );

}

// 모비 딕: 아주 낮고 굵은 소리
export function mobyNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.95 ], [ 0.15, f ], [ 0.9, f * 0.97 ] ], { vel: 0.22, type: 'triangle', vibrato: 2.5, reverb: 1.3 } );

}

// 스텔라: 또 하나의 52Hz (맑은 소리 + 한 옥타브 아래)
export function stellaNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.98 ], [ 0.06, f ], [ 0.5, f ] ], { vel: 0.09, vibrato: 5.5, reverb: 1.2 } );
	a.voice( t + 0.02, [ [ 0, f / 2 ], [ 0.55, f / 2 ] ], { vel: 0.06, vibrato: 4, reverb: 1.4 } );

}
