// 스텔라와 듀엣 점수판: 노래 이름을 붙여 모두가 보는 TOP에 남긴다 (Netlify Functions + Netlify Blobs)
// GET  /api/duet-scores                    → { top: [ { id, name, song, score, rank, at } ] }
// POST /api/duet-scores { name, song, score } → { ok, id, place, top }
// 지우고 싶은 기록은 Netlify 대시보드 → Blobs → duet-scores → top 에서 고친다
import { getStore } from '@netlify/blobs';

const MAX_SCORE = 90; // game/js/story.js 의 DUET_CHART 45노트 × 퍼펙트 2점
const KEEP = 50; // 저장해 두는 기록 수
const SHOW = 10; // 보여 주는 순위 수
const NAME_MAX = 10; // 닉네임 칸과 같은 길이
const SONG_MAX = 24;
const COOLDOWN = 20 * 1000; // 같은 곳에서 연달아 올리지 못하게 (ms)

// 이름 · 노래 이름에 들어가면 받지 않는 말 (공백 · 기호를 빼고 소문자로 비교)
const BANNED = [
	'시발', '씨발', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '좆', '지랄', '개새', '썅', '느금', '니미',
	'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'retard',
	'死ね', 'しね', 'くそ', 'クソ', 'ちんこ', 'まんこ'
];

const clean = ( s, max ) => String( s ?? '' ).normalize( 'NFC' ).replace( /\s+/g, ' ' ).replace( /[\u0000-\u001f\u007f<>]/g, '' ).trim().slice( 0, max );
const banned = ( s ) => {

	const flat = s.toLowerCase().replace( /[\s._\-*~!@#$%^&()+=]/g, '' );
	return BANNED.some( ( w ) => flat.includes( w ) );

};

const rankOf = ( score ) => {

	const r = score / MAX_SCORE;
	return r >= 0.85 ? 'S' : r >= 0.6 ? 'A' : 'B';

};

const json = ( body, status = 200 ) => new Response( JSON.stringify( body ), {
	status,
	headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
} );

async function hash( text ) {

	const buf = await crypto.subtle.digest( 'SHA-256', new TextEncoder().encode( text ) );
	return [ ...new Uint8Array( buf ) ].slice( 0, 8 ).map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );

}

export default async ( req, context ) => {

	const store = getStore( { name: 'duet-scores', consistency: 'strong' } );

	if ( req.method === 'GET' ) {

		const top = ( await store.get( 'top', { type: 'json' } ) ) ?? [];
		return json( { top: top.slice( 0, SHOW ) } );

	}

	if ( req.method !== 'POST' ) return json( { error: 'method' }, 405 );

	let body;
	try {

		body = await req.json();

	} catch ( e ) {

		return json( { error: 'bad' }, 400 );

	}

	const name = clean( body.name, NAME_MAX );
	const song = clean( body.song, SONG_MAX );
	const score = Number( body.score );
	if ( ! name || ! song || ! Number.isInteger( score ) || score < 0 || score > MAX_SCORE ) return json( { error: 'bad' }, 400 );
	if ( banned( name ) || banned( song ) ) return json( { error: 'word' }, 422 );

	// IP는 그대로 남기지 않고 해시 앞부분만 쓴다
	const who = `rl/${await hash( context.ip ?? 'unknown' )}`;
	const last = await store.get( who, { type: 'json' } );
	if ( last && Date.now() - last.at < COOLDOWN ) return json( { error: 'slow' }, 429 );
	await store.setJSON( who, { at: Date.now() } );

	const entry = { id: crypto.randomUUID().slice( 0, 8 ), name, song, score, rank: rankOf( score ), at: Date.now() };

	// 동시에 여러 명이 올려도 기록이 사라지지 않게, 읽은 그대로일 때만 쓴다 (아니면 다시 읽고 다시)
	for ( let i = 0; i < 12; i ++ ) {

		if ( i ) await new Promise( ( r ) => setTimeout( r, 20 + Math.random() * 60 * i ) );
		const cur = await store.getWithMetadata( 'top', { type: 'json' } );
		const list = [ ...( cur?.data ?? [] ), entry ]
			.sort( ( a, b ) => b.score - a.score || a.at - b.at )
			.slice( 0, KEEP );
		const res = cur
			? await store.setJSON( 'top', list, { onlyIfMatch: cur.etag } )
			: await store.setJSON( 'top', list, { onlyIfNew: true } );
		if ( res.modified ) {

			const place = list.findIndex( ( e ) => e.id === entry.id );
			return json( { ok: true, id: entry.id, place: place < 0 ? null : place + 1, top: list.slice( 0, SHOW ) } );

		}

	}

	return json( { error: 'busy' }, 503 );

};

export const config = { path: '/api/duet-scores' };
