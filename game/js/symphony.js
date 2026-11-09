// MAP 3 · 고래의 교향곡: 정답 음표를 미리 보여 주지 않는다. 동료가 한 마디 동안 짧은 선율을 부르면, 다음 마디의 같은 자리에서 대답한다
// 샤먼의 북은 정박마다 계속 울린다. 동료들의 선율은 모두 엇박이라, 북에 맞춰 누르면 오히려 샤먼의 합창이 커진다 (명령을 따르지 않는 것이 정답)
// 대답이 닿은 목소리는 다음 마디부터 제 선율을 되풀이하며 함께 부른다. 줄이 하나씩 늘고, 마지막엔 모두가 함께 52Hz에 대답한다
import { lang } from './i18n.js';

const $ = ( id ) => document.getElementById( id );
const BEAT = 60 / 92;
const BAR = 4; // 박
const HIT = 0.19; // 대답 판정 (초): 엇박(반 박 = 0.33초) 사이를 넉넉히, 정박과는 겹치지 않게
const DRUM = 0.1; // 이만큼 정박에 붙어 누르면 '북을 따른' 것
const HAZEL_MIDI = 57; // 헤이즐은 끝까지 52Hz 쪽의 낮은 한 음
const T = () => lang().ui.map3;

// voices: [ { name, actor, phrase: [ 박 ], pitches: [ MIDI ], play( midi ), color } ]
// on: { drum( vel ), drumTap(), join( i ), hazel() } — 장면 쪽 연출
export function symphony( G, voices, on = {} ) {

	return new Promise( ( resolve ) => {

		const box = $( 'sym' ), lanes = $( 'sym-lanes' ), hint = $( 'sym-hint' );
		const now = () => performance.now() / 1000;
		const say = ( text, who = '' ) => hint.textContent = G.ui.dev( text.replace( '{who}', who ) );
		const timers = new Set();
		const later = ( s, fn ) => {

			const id = setTimeout( () => {

				timers.delete( id );
				fn();

			}, Math.max( 0, s ) * 1000 );
			timers.add( id );

		};

		// 줄: 맨 위 샤먼의 북, 그 아래 동료들, 맨 아래 헤이즐
		const row = ( name, cls ) => `<div class="lane ${cls}"><span class="nm">${name}</span><div class="trk"><s style="left:25%"></s><s style="left:50%"></s><s style="left:75%"></s><i class="head"></i></div></div>`;
		lanes.innerHTML = row( T().symDrum, 'drum' ) + voices.map( ( v, i ) => row( v.name, `v v${i}` ) ).join( '' ) + row( G.playerName, 'me' );
		const trk = [ ...lanes.querySelectorAll( '.trk' ) ];
		const drumTrk = trk[ 0 ], meTrk = trk[ trk.length - 1 ];
		const heads = [ ...lanes.querySelectorAll( '.head' ) ];
		const gold = box.querySelector( '.m.gold b' ), red = box.querySelector( '.m.red b' );
		$( 'sym-title' ).textContent = T().symTitle;
		document.body.classList.add( 'singing' );
		G.ui.show( 'sym' );
		G.audio.setMix( { melody: 0.1, piano: 0.5 }, 1 );

		const mark = ( track, beat, cls, color ) => {

			const m = document.createElement( 'em' );
			m.className = cls;
			m.style.left = `${( beat / BAR ) * 100}%`;
			if ( color ) {

				m.style.background = color;
				m.style.boxShadow = `0 0 10px ${color}`;

			}

			track.appendChild( m );
			later( BAR * BEAT * 0.95, () => m.remove() ); // 한 마디 뒤엔 사라진다 (미리 보여 주지 않는다)

		};

		const hex = ( c ) => `#${c.toString( 16 ).padStart( 6, '0' )}`;
		const start = now() + 0.8;
		const beatAt = ( n ) => start + n * BEAT;
		let joined = 0, drumTaps = 0, retries = 0, shamanLevel = 0;
		let phase = 'call', current = 0, bar = 0, tries = 0, hits = new Set(), done = false, raf = 0;

		const meters = () => {

			gold.style.width = `${( joined / voices.length ) * 100}%`;
			red.style.width = `${Math.min( 1, shamanLevel / 6 ) * 100}%`;

		};

		meters();

		// 한 목소리가 한 마디 동안 제 선율을 부른다 (bar번째 마디)
		const sing = ( v, i, b, show ) => v.phrase.forEach( ( p, k ) => later( beatAt( b * BAR + p ) - now(), () => {

			v.play( v.pitches[ k % v.pitches.length ] );
			v.actor.setGlow?.( 0.7, v.color );
			later( 0.15, () => v.actor.setGlow?.( v.rest ?? 0.15, v.restColor ?? v.color ) );
			if ( v.actor.pos ) G.world.ring( v.actor.pos.x, v.actor.pos.z, { color: v.color, to: 12, life: 0.6, width: 0.3 } );
			if ( show ) mark( trk[ i + 1 ], p, 'n', hex( v.color ) );
			else mark( trk[ i + 1 ], p, 'n soft', hex( v.color ) );

		} ) );

		// 마디가 시작될 때마다: 북 네 번, 함께하는 목소리들의 선율, 지금 부를 목소리
		function startBar( b ) {

			for ( let k = 0; k < BAR; k ++ ) later( beatAt( b * BAR + k ) - now(), () => {

				const vel = Math.max( 0.06, 0.32 * ( 1 - joined / voices.length * 0.75 ) + Math.min( 0.2, shamanLevel * 0.04 ) );
				on.drum?.( done ? vel * 0.5 : vel );
				mark( drumTrk, k, 'd' );

			} );
			voices.forEach( ( v, i ) => {

				if ( v.joined ) sing( v, i, b, false );

			} );
			if ( phase === 'call' ) {

				const v = voices[ current ];
				say( tries ? T().symAgain : T().symListen, v.name );
				sing( v, current, b, true );

			} else if ( phase === 'answer' ) {

				hits = new Set();
				say( T().symAnswer, voices[ current ].name );
				box.classList.add( 'turn' );

			} else if ( phase === 'final' ) {

				say( T().symFinal );
				box.classList.add( 'turn' );

			}

			later( beatAt( ( b + 1 ) * BAR ) - now() - 0.02, () => endBar( b ) );

		}

		function endBar( b ) {

			box.classList.remove( 'turn' );
			if ( phase === 'call' ) phase = 'answer';
			else if ( phase === 'answer' ) {

				const v = voices[ current ];
				const need = Math.max( 1, Math.ceil( v.phrase.length * 0.6 ) );
				if ( hits.size >= need || tries >= 2 ) {

					// 대답이 닿았다 (두 번 어긋나면 상대가 먼저 맞춰 준다)
					if ( hits.size < need ) {

						retries ++;
						say( T().symHelp, v.name );

					} else say( T().symJoin, v.name );
					v.joined = true;
					joined ++;
					meters();
					G.audio.play( 'pickup' );
					on.join?.( current, joined / voices.length );
					current ++;
					tries = 0;
					phase = current < voices.length ? 'call' : 'final';

				} else {

					tries ++;
					G.audio.play( 'miss' );
					phase = 'call';

				}

			} else if ( phase === 'final' ) {

				phase = 'end';

			}

			if ( phase === 'end' ) return finish();
			startBar( b + 1 );

		}

		function tap() {

			if ( done ) return;
			const t = now();
			const beat = ( t - start ) / BEAT;
			const inBar = ( ( beat % BAR ) + BAR ) % BAR;
			on.hazel?.( HAZEL_MIDI );
			// 정박에 붙었는지 (샤먼의 북)
			const toDrum = Math.abs( beat - Math.round( beat ) ) * BEAT;
			if ( phase === 'answer' ) {

				const v = voices[ current ];
				let best = - 1, bd = Infinity;
				v.phrase.forEach( ( p, k ) => {

					const d = Math.abs( inBar - p ) * BEAT;
					if ( ! hits.has( k ) && d < bd ) {

						bd = d;
						best = k;

					}

				} );
				if ( best >= 0 && bd <= HIT ) {

					hits.add( best );
					mark( meTrk, inBar, 'n ok' );
					v.play( v.pitches[ best % v.pitches.length ] );
					return;

				}

			} else if ( phase === 'final' ) {

				// 마지막 마디: 헤이즐이 노래하면 모두가 제 음으로 겹쳐 대답한다
				mark( meTrk, inBar, 'n ok' );
				voices.forEach( ( v, i ) => later( 0.05 + i * 0.03, () => v.play( v.pitches[ 0 ] ) ) );
				if ( toDrum > DRUM ) return;

			}

			if ( toDrum <= DRUM ) {

				// 북을 따랐다: 샤먼의 합창이 커진다
				drumTaps ++;
				shamanLevel ++;
				meters();
				mark( meTrk, inBar, 'n bad' );
				on.drumTap?.();
				if ( drumTaps === 1 ) say( T().symDrumWarn );
				return;

			}

			mark( meTrk, inBar, 'n' );

		}

		// 샤먼의 합창은 천천히 잦아든다
		const decay = setInterval( () => {

			shamanLevel = Math.max( 0, shamanLevel - 0.25 );
			meters();

		}, 1000 );

		function move() {

			const x = ( ( ( now() - start ) / BEAT % BAR ) + BAR ) % BAR / BAR * 100;
			for ( const hd of heads ) hd.style.left = `${x}%`;
			raf = requestAnimationFrame( move );

		}

		function finish() {

			done = true;
			say( T().symDone );
			G.audio.play( 'heal' );
			later( 2, () => {

				timers.forEach( clearTimeout );
				clearInterval( decay );
				cancelAnimationFrame( raf );
				G.puzzle = null;
				G.sym = null;
				box.onpointerdown = null;
				G.ui.show( 'sym', false );
				document.body.classList.remove( 'singing' );
				G.audio.setMix( { melody: 1, piano: 1 }, 2 );
				for ( const v of voices ) v.actor.setGlow?.( v.rest ?? 0, v.restColor ?? v.color );
				resolve( { drumTaps, retries } );

			} );

		}

		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};

		G.puzzle = { tap };
		// 지금 상태 (테스트 · 디버그용)
		G.sym = { start, beat: BEAT, get phase() {

			return phase;

		}, get phrase() {

			return voices[ current ]?.phrase ?? null;

		}, get joined() {

			return joined;

		} };
		raf = requestAnimationFrame( move );
		startBar( 0 );

	} );

}
