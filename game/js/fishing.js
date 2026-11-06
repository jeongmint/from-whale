// MAP 2 · 낚시: 방마다 있는 낚시 자리에서 줄을 내리고, 찌가 쑥 들어갈 때 맞춰 걸고, 박자를 맞춰 끌어올린다
// 잡은 물고기는 도감에 적고 다시 놓아준다 (이 기기에 기억)
import { lang } from './i18n.js';

const DEX_KEY = 'fromwhale.fishdex';
const $ = ( id ) => document.getElementById( id );

// 층마다 잡히는 것: [ 종류, 크기 범위(cm), 끌어올릴 횟수, 흔함 ]. 흔함이 클수록 자주 문다
export const FISH_BY_LAYER = [
	[ [ 'blueTang', 18, 32, 3, 10 ], [ 'yellowTang', 14, 24, 3, 10 ], [ 'chromis', 7, 14, 2, 12 ], [ 'clownfish', 7, 12, 2, 8 ], [ 'angelfish', 15, 30, 3, 6 ], [ 'firefish', 5, 9, 2, 3 ], [ 'mandarin', 5, 8, 2, 2 ] ],
	[ [ 'cardinalfish', 8, 14, 2, 10 ], [ 'rabbitfish', 20, 40, 3, 8 ], [ 'reefFish', 25, 50, 3, 8 ], [ 'grouper', 60, 140, 5, 4 ], [ 'barracuda', 60, 150, 4, 4 ], [ 'stingray', 80, 180, 5, 2 ], [ 'shark', 120, 220, 6, 1 ] ],
	[ [ 'jelly', 20, 45, 2, 10 ], [ 'shrimp', 4, 7, 2, 8 ], [ 'barracuda', 60, 150, 4, 4 ], [ 'coelacanth', 120, 190, 6, 1 ] ],
	[ [ 'shoreCrab', 6, 12, 2, 8 ], [ 'reefCrab', 10, 22, 3, 6 ], [ 'hermit', 8, 15, 2, 6 ], [ 'eel', 80, 160, 5, 3 ], [ 'coelacanth', 120, 190, 6, 2 ] ]
];
export const DEX_KEYS = [ ...new Set( FISH_BY_LAYER.flat().map( ( f ) => f[ 0 ] ) ) ];

export function loadDex() {

	try {

		return JSON.parse( localStorage.getItem( DEX_KEY ) ) ?? {};

	} catch ( e ) {

		return {};

	}

}

function saveDex( dex ) {

	try {

		localStorage.setItem( DEX_KEY, JSON.stringify( dex ) );

	} catch ( e ) { /* 저장 불가 */ }

}

function pick( list ) {

	let sum = 0;
	for ( const f of list ) sum += f[ 4 ];
	let r = Math.random() * sum;
	for ( const f of list ) if ( ( r -= f[ 4 ] ) <= 0 ) return f;
	return list[ 0 ];

}

// 낚시 한 판 (창이 닫히면 끝난다). gear: { horn: 루크의 뿔이면 true, hook: J의 낚싯바늘이 있으면 true }
// onCatch( key ): 잡은 물고기를 화면에 잠깐 보여 준다. 반환: 이번에 잡은 수
export function startFishing( G, { layer, gear, onCatch } ) {

	return new Promise( ( resolve ) => {

		const box = $( 'fish' ), bob = $( 'fish-bob' ), reel = $( 'fish-reel' ), zone = $( 'fish-zone' ), cursor = $( 'fish-cursor' ), hint = $( 'fish-hint' ), prog = $( 'fish-progress' );
		const T = () => lang().ui.fish;
		const name = ( key ) => T().names[ key ] ?? key;
		// 장비가 좋을수록 문 순간을 넉넉히 기다려 주고, 초록 칸이 넓다
		const biteWindow = ( gear.horn ? 0.62 : 0.4 ) + ( gear.hook ? 0.18 : 0 );
		const zoneWidth = ( gear.horn ? 0.3 : 0.2 ) + ( gear.hook ? 0.06 : 0 );
		let state = 'cast', timers = [], fish = null, got = 0, strain = 0, pull = 0, cur = 0, dir = 1, speed = 0.9, zoneAt = 0.4, raf = 0, last = 0, caughtCount = 0;

		const later = ( s, fn ) => timers.push( setTimeout( fn, s * 1000 ) );
		const clearTimers = () => {

			timers.forEach( clearTimeout );
			timers = [];

		};
		const say = ( text ) => hint.textContent = G.ui.dev( text );
		const setBob = ( cls ) => bob.className = cls;
		const showReel = ( on ) => {

			reel.classList.toggle( 'hidden', ! on );
			prog.classList.toggle( 'hidden', ! on );

		};

		$( 'fish-title' ).textContent = gear.horn ? T().titleHorn : T().titleFin;
		$( 'fish-quit' ).textContent = T().quit;
		$( 'fish-dex' ).textContent = T().dex;
		$( 'fish-list' ).classList.add( 'hidden' );
		document.body.classList.add( 'fishing' );
		G.ui.show( 'fish' );

		function cast() {

			state = 'cast';
			setBob( '' );
			showReel( false );
			say( caughtCount ? T().again : T().cast );

		}

		function drop() {

			state = 'wait';
			G.audio.play( 'splash' );
			say( T().wait );
			setBob( 'float' );
			// 톡톡 건드리다가 (0~2번), 쑥 문다
			const nibbles = Math.floor( Math.random() * 3 );
			let at = 1.2 + Math.random() * 1.2;
			for ( let i = 0; i < nibbles; i ++ ) {

				later( at, () => {

					if ( state !== 'wait' ) return;
					setBob( 'float nibble' );
					say( T().nibble );
					G.audio.play( 'blip' );
					later( 0.3, () => state === 'wait' && setBob( 'float' ) );

				} );
				at += 0.8 + Math.random() * 1.1;

			}

			later( at + 0.4, () => {

				if ( state !== 'wait' ) return;
				state = 'bite';
				fish = pick( FISH_BY_LAYER[ layer ] );
				setBob( 'bite' );
				say( T().bite );
				G.audio.play( 'warn' );
				later( biteWindow, () => {

					if ( state !== 'bite' ) return;
					fail( T().missed );

				} );

			} );

		}

		function hook() {

			clearTimers();
			state = 'reel';
			got = 0;
			strain = 0;
			pull = fish[ 3 ];
			speed = 0.7 + pull * 0.12;
			cur = 0;
			dir = 1;
			moveZone();
			showReel( true );
			setBob( 'reel' );
			say( T().reel );
			drawProgress();
			last = performance.now();
			raf = requestAnimationFrame( tick );

		}

		function moveZone() {

			zoneAt = Math.random() * ( 1 - zoneWidth );
			zone.style.left = `${zoneAt * 100}%`;
			zone.style.width = `${zoneWidth * 100}%`;

		}

		function drawProgress() {

			prog.querySelector( 'span' ).style.width = `${( got / pull ) * 100}%`;
			prog.dataset.strain = strain;

		}

		// 커서가 막대 위를 오간다
		function tick( now ) {

			if ( state !== 'reel' ) return;
			const dt = Math.min( 0.05, ( now - last ) / 1000 );
			last = now;
			cur += dir * speed * dt;
			if ( cur > 1 ) {

				cur = 1;
				dir = - 1;

			} else if ( cur < 0 ) {

				cur = 0;
				dir = 1;

			}

			cursor.style.left = `${cur * 100}%`;
			raf = requestAnimationFrame( tick );

		}

		function reelTap() {

			if ( cur >= zoneAt && cur <= zoneAt + zoneWidth ) {

				got ++;
				G.audio.play( 'pickup' );
				reel.classList.remove( 'ok' );
				void reel.offsetWidth;
				reel.classList.add( 'ok' );
				if ( got >= pull ) return catchIt();
				moveZone();
				speed *= 1.08;

			} else {

				strain ++;
				G.audio.play( 'miss' );
				reel.classList.remove( 'bad' );
				void reel.offsetWidth;
				reel.classList.add( 'bad' );
				if ( strain >= 3 ) return fail( T().snap );

			}

			drawProgress();

		}

		function catchIt() {

			cancelAnimationFrame( raf );
			state = 'caught';
			showReel( false );
			setBob( '' );
			const [ key, lo, hi ] = fish;
			const size = Math.round( lo + ( hi - lo ) * Math.random() ** 1.6 );
			const dex = loadDex();
			const isNew = ! dex[ key ];
			dex[ key ] = { n: ( dex[ key ]?.n ?? 0 ) + 1, best: Math.max( dex[ key ]?.best ?? 0, size ) };
			saveDex( dex );
			caughtCount ++;
			G.audio.play( 'heal' );
			const n = DEX_KEYS.filter( ( k ) => dex[ k ] ).length;
			const line = `${name( key )} · ${size}cm${isNew ? `  ${T().new}` : ''}\n${T().dexCount.replace( '{n}', n ).replace( '{max}', DEX_KEYS.length )}${key === 'jelly' ? `\n${T().jelly}` : ''}`;
			say( line );
			onCatch?.( key );
			later( 1.2, () => state === 'caught' && ( state = 'cast-ready' ) );

		}

		function fail( text ) {

			clearTimers();
			cancelAnimationFrame( raf );
			state = 'failed';
			showReel( false );
			setBob( '' );
			say( text );
			G.audio.play( 'miss' );
			later( 1, () => state === 'failed' && ( state = 'cast-ready' ) );

		}

		function tap() {

			if ( state === 'cast' ) return drop();
			if ( state === 'wait' ) return fail( T().early );
			if ( state === 'bite' ) return hook();
			if ( state === 'reel' ) return reelTap();
			if ( state === 'cast-ready' ) return cast();

		}

		function showDex() {

			const list = $( 'fish-list' );
			const dex = loadDex();
			list.replaceChildren( ...DEX_KEYS.map( ( k ) => {

				const li = document.createElement( 'li' );
				li.textContent = dex[ k ] ? `${name( k )} · ${dex[ k ].best}cm` : '???';
				if ( dex[ k ] ) li.className = 'got';
				return li;

			} ) );
			list.classList.toggle( 'hidden' );

		}

		function quit() {

			clearTimers();
			cancelAnimationFrame( raf );
			G.puzzle = null;
			G.fishing = null;
			box.onpointerdown = null;
			$( 'fish-quit' ).onpointerdown = null;
			$( 'fish-dex' ).onpointerdown = null;
			G.ui.show( 'fish', false );
			document.body.classList.remove( 'fishing' );
			resolve( caughtCount );

		}

		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};
		$( 'fish-quit' ).onpointerdown = ( e ) => {

			e.stopPropagation();
			quit();

		};
		$( 'fish-dex' ).onpointerdown = ( e ) => {

			e.stopPropagation();
			showDex();

		};

		G.puzzle = { tap };
		G.fishing = { quit };
		cast();

	} );

}

// 도감에 적힌 종류 수
export function dexCount() {

	const dex = loadDex();
	return DEX_KEYS.filter( ( k ) => dex[ k ] ).length;

}

