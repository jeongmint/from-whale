// 언어 전환. 문장은 lang/ko.js, lang/en.js, lang/ja.js 에 있다.
import ko from './lang/ko.js';
import en from './lang/en.js';
import ja from './lang/ja.js';

export const LANGS = { ko, en, ja };
export const LANG_ORDER = [ 'ko', 'en', 'ja' ];
const KEY = 'fromwhale.lang';

function detect() {

	try {

		const saved = localStorage.getItem( KEY );
		if ( LANGS[ saved ] ) return saved;

	} catch ( e ) { /* 저장소 없음 */ }

	for ( const l of navigator.languages ?? [ navigator.language ] ) {

		const code = String( l ).slice( 0, 2 ).toLowerCase();
		if ( code === 'ko' || code === 'ja' ) return code;
		if ( code === 'en' ) return 'en';

	}

	return 'en';

}

// 지금 언어의 문장 묶음 (다른 모듈은 lang() 으로 읽는다)
let current = LANGS[ detect() ];

export const lang = () => current;

export function setLang( code ) {

	if ( ! LANGS[ code ] ) return;
	current = LANGS[ code ];
	try {

		localStorage.setItem( KEY, code );

	} catch ( e ) { /* 저장 불가 */ }

	applyStatic();

}

// 'toast.faint' 같은 경로로 UI 문장을 찾는다. {n} 처럼 넘긴 값만 채우고 {N}(이름)은 그대로 둔다.
export function t( path, vars ) {

	const v = path.split( '.' ).reduce( ( o, k ) => o?.[ k ], current.ui );
	if ( typeof v !== 'string' ) return v ?? path;
	return vars ? v.replace( /\{(\w+)\}/g, ( m, k ) => ( k in vars ? vars[ k ] : m ) ) : v;

}

// HTML에 data-i18n 으로 표시해 둔 고정 문구를 바꾼다
export function applyStatic() {

	document.documentElement.lang = current.code;
	document.querySelectorAll( '[data-i18n]' ).forEach( ( el ) => el.innerHTML = t( el.dataset.i18n ) );
	document.querySelectorAll( '[data-i18n-title]' ).forEach( ( el ) => el.title = t( el.dataset.i18nTitle ) );
	document.querySelectorAll( '[data-i18n-aria]' ).forEach( ( el ) => el.setAttribute( 'aria-label', t( el.dataset.i18nAria ) ) );
	document.querySelectorAll( '[data-name-placeholder]' ).forEach( ( el ) => el.placeholder = current.defaultName );
	document.querySelectorAll( '[data-lang]' ).forEach( ( el ) => el.classList.toggle( 'on', el.dataset.lang === current.code ) );

}
