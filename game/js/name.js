// 플레이어 닉네임. 비워 두면 '헤이즐'.
// 대본에는 {N}, {N을}, {N이}처럼 쓰고, 화면에 보일 때 이름과 알맞은 조사로 바꾼다.

export const DEFAULT_NAME = '헤이즐';
const KEY = 'fromwhale.name';

export function cleanName( raw ) {

	return String( raw ?? '' ).replace( /[\u0000-\u001f<>]/g, '' ).replace( /\s+/g, ' ' ).trim().slice( 0, 10 );

}

export function loadName() {

	try {

		return cleanName( localStorage.getItem( KEY ) ) || DEFAULT_NAME;

	} catch ( e ) {

		return DEFAULT_NAME;

	}

}

export function saveName( name ) {

	try {

		if ( name === DEFAULT_NAME ) localStorage.removeItem( KEY );
		else localStorage.setItem( KEY, name );

	} catch ( e ) { /* 저장 불가 */ }

}

// 마지막 글자에 받침이 있는지 (한글이 아니면 읽는 소리로 대충 짐작)
function hasBatchim( word ) {

	const c = word.trim().slice( - 1 );
	if ( ! c ) return false;
	const code = c.charCodeAt( 0 );
	if ( code >= 0xAC00 && code <= 0xD7A3 ) return ( code - 0xAC00 ) % 28 !== 0;
	if ( /[0-9]/.test( c ) ) return '013678'.includes( c ); // 영 일 삼 육 칠 팔
	const tail = word.trim().toLowerCase();
	if ( /ng$/.test( tail ) ) return true;
	return /[lmnk]$/.test( tail );

}

const PAIRS = [ [ '은', '는' ], [ '이', '가' ], [ '을', '를' ], [ '과', '와' ], [ '아', '야' ] ];

function josa( name, j ) {

	const pair = PAIRS.find( ( p ) => p.includes( j ) );
	if ( ! pair ) return j;
	return hasBatchim( name ) ? pair[ 0 ] : pair[ 1 ];

}

const escapeHTML = ( s ) => s.replace( /[&<>"']/g, ( ch ) => ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' } )[ ch ] );

export function fillName( text, name, html = false ) {

	if ( ! text || ! text.includes( '{N' ) ) return text;
	const shown = html ? escapeHTML( name ) : name;
	return text.replace( /\{N(은|는|이|가|을|를|과|와|아|야|의|에게)?\}/g, ( _, j ) => j ? shown + josa( name, j ) : shown );

}
