// 스텔라와 듀엣 점수판: 듀엣이 끝나면 노래 이름을 붙여 모두가 보는 TOP 10에 남긴다
// 서버: netlify/functions/duet-scores.mjs (Netlify Functions + Blobs)
// 서버에 닿지 않으면 (로컬 실행 등) 이 기기에만 남기고 이 기기의 기록을 보여 준다
import { t } from './i18n.js';

const API = '/api/duet-scores';
const LOCAL_KEY = 'fromwhale.duetScores';
const $ = ( id ) => document.getElementById( id );

async function request( init ) {

	const res = await fetch( API, init );
	const type = res.headers.get( 'content-type' ) ?? '';
	if ( ! type.includes( 'application/json' ) ) throw new Error( 'offline' );
	return { status: res.status, data: await res.json() };

}

function loadLocal() {

	try {

		return JSON.parse( localStorage.getItem( LOCAL_KEY ) ) ?? [];

	} catch ( e ) {

		return [];

	}

}

function saveLocal( entry ) {

	const list = [ ...loadLocal(), entry ].sort( ( a, b ) => b.score - a.score || a.at - b.at ).slice( 0, 20 );
	try {

		localStorage.setItem( LOCAL_KEY, JSON.stringify( list ) );

	} catch ( e ) { /* 저장 불가 */ }

	return list;

}

// 순위표: 이름 · 노래 이름은 사용자가 쓴 글이라 textContent로만 넣는다
function render( list, mine ) {

	const ol = $( 'score-list' );
	ol.replaceChildren();
	if ( ! list.length ) {

		const li = document.createElement( 'li' );
		li.className = 'empty';
		li.textContent = t( 'scores.empty' );
		ol.append( li );
		return;

	}

	list.slice( 0, 10 ).forEach( ( e, i ) => {

		const li = document.createElement( 'li' );
		if ( e.id && e.id === mine ) li.className = 'me';
		const place = document.createElement( 'span' );
		place.className = 'place';
		place.textContent = String( i + 1 );
		const song = document.createElement( 'b' );
		song.textContent = `♪ ${e.song}`;
		const meta = document.createElement( 'small' );
		meta.textContent = `${e.name} · ${e.rank} · ${e.score}${Number.isInteger( e.p ) ? ` · Perfect ${e.p}` : ''}`;
		li.append( place, song, meta );
		ol.append( li );

	} );

}

function status( text ) {

	$( 'score-status' ).textContent = text;

}

// 점수판 창을 열고, 닫히면 끝난다. test: 서버에 올리지 않는다 (?stella 테스트)
export function openScores( ui, { name, score, max, rank, counts, test = false } ) {

	const form = $( 'score-form' );
	const input = $( 'song-name' );
	const save = $( 'score-save' );
	$( 'score-mine' ).textContent = t( 'scores.mine', { who: name, r: rank, s: score, max } );
	input.value = '';
	input.placeholder = t( 'scores.placeholder' );
	form.classList.remove( 'hidden' );
	save.disabled = false;
	$( 'score-close' ).classList.add( 'hidden' );
	render( [], null );
	status( test ? t( 'scores.test' ) : t( 'scores.loading' ) );

	let offline = false;
	request( { method: 'GET' } )
		.then( ( { data } ) => {

			// 그새 먼저 남겼으면 그 결과를 그대로 둔다
			if ( ! form.classList.contains( 'hidden' ) ) render( data.top ?? [], null );
			if ( ! test ) status( '' );

		} )
		.catch( () => {

			offline = true;
			if ( ! form.classList.contains( 'hidden' ) ) render( loadLocal(), null );
			if ( ! test ) status( t( 'scores.local' ) );

		} );

	const done = ( list, mine, text ) => {

		form.classList.add( 'hidden' );
		$( 'score-close' ).classList.remove( 'hidden' );
		render( list, mine );
		status( text );

	};

	form.onsubmit = async ( e ) => {

		e.preventDefault();
		input.blur();
		const song = input.value.replace( /\s+/g, ' ' ).replace( /[\u0000-\u001f<>]/g, '' ).trim().slice( 0, 24 ) || input.placeholder;
		const { perfect: p, excellent: e2, good: g } = counts;
		const entry = { id: `local-${Date.now()}`, name, song, score, rank, p, e: e2, g, at: Date.now() };
		if ( test ) return done( [ entry ], entry.id, t( 'scores.test' ) );
		if ( offline ) return done( saveLocal( entry ), entry.id, t( 'scores.offline' ) );

		save.disabled = true;
		status( t( 'scores.saving' ) );
		try {

			const { status: code, data } = await request( {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify( { name, song, score, p, e: e2, g } )
			} );
			if ( code === 422 || code === 429 ) {

				save.disabled = false;
				return status( t( code === 422 ? 'scores.word' : 'scores.slow' ) );

			}

			if ( ! data.ok ) throw new Error( data.error );
			saveLocal( { ...entry, id: data.id } );
			done( data.top, data.id, data.place ? t( 'scores.saved', { p: data.place } ) : t( 'scores.savedOut' ) );

		} catch ( err ) {

			done( saveLocal( entry ), entry.id, t( 'scores.offline' ) );

		}

	};

	ui.show( 'scores' );
	ui.overlay = 'scores';
	setTimeout( () => input.focus( { preventScroll: true } ), 300 );
	return new Promise( ( resolve ) => {

		ui.overlayResolve = resolve;

	} );

}
