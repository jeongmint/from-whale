// 이야기 진행. 대사·편지·안내 문장은 lang/ko.js, lang/en.js, lang/ja.js 에 있다.
import { lang } from './i18n.js';

// 화자 모양 (이름은 언어 파일의 speakers)
export const SPEAKERS = {
	narrator: { portrait: null },
	hazel: { portrait: 'hazel', bar: 'linear-gradient(90deg,#0f6e8c,#3fc8ff)' },
	luke: { portrait: 'luke', bar: 'linear-gradient(90deg,#b5452a,#ff9a6b)' },
	finn: { portrait: 'finn', bar: 'linear-gradient(90deg,#4b3aa8,#9d8cff)' },
	moby: { portrait: 'moby', bar: 'linear-gradient(90deg,#3a4a66,#bcd6ff)' },
	shaman: { portrait: 'shaman', bar: 'linear-gradient(90deg,#5a1030,#ff6b8b)' },
	stella: { portrait: 'stella', bar: 'linear-gradient(90deg,#a87a10,#ffd36b)' },
	orca: { portrait: 'orca', bar: 'linear-gradient(90deg,#5a1030,#ff6b8b)' },
	kelp: { portrait: null, bar: 'linear-gradient(90deg,#0c6b5a,#6dffe0)' }
};

// 지도 (x, z). 북쪽 = -z
export const PLACES = {
	start: { x: 0, z: 0 },
	bottle0: { x: 26, z: - 46 },
	lighthouse: { x: - 70, z: - 330 },
	luke: { x: - 40, z: - 290 },
	kelp1: { x: 60, z: - 440 },
	kelp2: { x: 230, z: - 510 },
	kelp3: { x: 390, z: - 430 },
	finn: { x: 470, z: - 330 },
	kelp4: { x: 440, z: - 70 },
	ambush: { x: 370, z: 190 },
	kelp5: { x: 230, z: 520 },
	moby: { x: 180, z: 770 }
};

export const BOTTLES = [
	{ id: 1, x: - 160, z: - 90 },
	{ id: 2, x: - 270, z: - 430 },
	{ id: 3, x: 150, z: - 230 },
	{ id: 4, x: 620, z: - 520 },
	{ id: 5, x: 560, z: 190 },
	{ id: 6, x: - 120, z: - 380 }
];

// 작은 미역 숲: 근처에서 노래하면 하트가 가득 찬다
export const KELP_GROVES = [
	{ x: - 40, z: - 170 },
	{ x: 150, z: - 400 },
	{ x: 330, z: - 300 },
	{ x: 390, z: 10 },
	{ x: 470, z: 170 },
	{ x: 300, z: 270 },
	{ x: 340, z: 430 },
	{ x: 60, z: 690 },
	{ x: 310, z: 700 }
];

// 연합군 순찰대 (중심, 반경, 마릿수)
export const ORCA_PACKS = [
	{ x: 545, z: 40, r: 50, n: 3 },
	{ x: 300, z: 60, r: 45, n: 2 },
	{ x: 455, z: 310, r: 55, n: 3 },
	{ x: 250, z: 330, r: 40, n: 2 }
];

const hz = ( v ) => `${( v / 60 * 100 ).toFixed( 1 )}%`;
function spectrum() {

	const s = lang().ui.spectrum;
	return `
	<div class="spectrum" aria-label="${s.label}">
		<div class="spec-track">
			<span class="spec-band" style="left:${hz( 10 )};width:${hz( 15 )}"><b>${s.whales}</b>10–25Hz</span>
			<span class="spec-band blue" style="left:${hz( 30 )};width:${hz( 8 )}"><b>${s.blue}</b>${s.blueRange}</span>
			<span class="spec-mark" style="left:${hz( 52 )}"><b>{N}</b>52Hz</span>
		</div>
		<div class="spec-axis"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60Hz</span></div>
	</div>`;

}

export function scramble( text ) {

	const glyphs = '∿≋≈⌇⋰⋱∴∵⁂☍⌁⌬';
	return [ ...text ].map( ( c ) => ( c === '\n' || c === ' ' ) ? c : glyphs[ ( c.charCodeAt( 0 ) * 7 ) % glyphs.length ] ).join( '' );

}

const L = ( who, text, extra ) => ( { who, text, ...extra } );
const lines = ( arr ) => arr.map( ( [ who, text, extra ] ) => L( who, text, extra ) );
const label = ( card ) => `${card[ 0 ]} · ${card[ 1 ]}`;
const card = ( G, c, opts ) => G.card( c[ 0 ], c[ 1 ], c[ 2 ], opts );

// ---------------------------------------------------------------
// 프롤로그
// ---------------------------------------------------------------
async function prologue( G ) {

	const T = lang().story.prologue;
	await card( G, T.card, { seconds: 6.5, extra: spectrum() } );
	await G.say( lines( T.intro ) );

	G.objective( label( T.card ), T.objSwim );
	await G.until( () => G.stats.swum > 45 );

	G.objective( label( T.card ), T.objSing );
	await G.untilEvent( 'sing' );
	await G.wait( 2.2 );
	await G.say( lines( lang().story.prologue.noAnswer ) );

	const bottle = G.spawnStoryBottle();
	await G.wait( 0.6 );
	G.objective( label( T.card ), lang().story.prologue.objBottle, bottle );
	await G.untilEvent( 'bottle0' );

	const letter = lang().mobyLetter;
	await G.letter( { ...letter, body: scramble( letter.body ), from: scramble( letter.from ), scrambled: true } );
	await G.say( lines( lang().story.prologue.afterLetter ) );

}

// ---------------------------------------------------------------
// 1장 등대지기
// ---------------------------------------------------------------
async function chapter1( G ) {

	const T = () => lang().story.ch1;
	await card( G, T().card );
	G.objective( label( T().card ), T().objLighthouse, G.actors.luke.pos );
	await G.until( () => G.distTo( G.actors.luke.pos ) < 40 );

	G.cutscene( true );
	G.faceEachOther( G.actors.luke );
	G.camFocus( G.actors.luke, { side: 1 } );
	G.audio.whaleCall( null, 'luke' );
	await G.say( lines( T().meet ) );

	await G.letter( lang().mobyLetter );
	G.flags.letter0Read = true;

	await G.say( lines( T().afterLetter ) );

	G.join( 'luke', T().ability );
	await G.wait( 1.2 );

	if ( G.unreadCount() > 0 ) {

		await G.say( lines( T().readAll ) );
		G.readAllBottles();
		G.toast( T().journalHint );

	}

	await G.say( lines( T().next ) );
	G.camRelease();
	G.cutscene( false );

}

// ---------------------------------------------------------------
// 2장 나침반
// ---------------------------------------------------------------
async function chapter2( G ) {

	const T = () => lang().story.ch2;
	await card( G, T().card );
	for ( const k of [ 'kelp1', 'kelp2', 'kelp3' ] ) {

		G.objective( label( T().card ), T().objKelp, PLACES[ k ] );
		await G.readKelp( k );

	}

	G.objective( label( T().card ), T().objFinn, G.actors.finn.pos );
	await G.until( () => G.distTo( G.actors.finn.pos ) < 42 );

	G.cutscene( true );
	G.faceEachOther( G.actors.finn );
	G.camFocus( G.actors.finn, { side: - 1 } );
	G.audio.whaleCall( null, 'finn' );
	await G.say( lines( T().meet ) );

	G.join( 'finn', T().ability );
	await G.wait( 1.2 );
	G.camRelease();
	G.cutscene( false );

}

// ---------------------------------------------------------------
// 3장 연합군
// ---------------------------------------------------------------
async function chapter3( G ) {

	const T = () => lang().story.ch3;
	await card( G, T().card );
	await G.say( lines( T().intro ) );

	G.objective( label( T().card ), T().objKelp4, PLACES.kelp4 );
	await G.readKelp( 'kelp4' );

	G.objective( label( T().card ), T().objSouth, PLACES.ambush );
	await G.until( () => G.distTo( PLACES.ambush ) < 55 );

	// --- 매복 ---
	G.cutscene( true );
	G.setMusic( { drums: 0, melody: 0, tension: 0.7 } );
	const shaman = G.spawnShaman();
	const ring = G.spawnAmbush( 6, 40 );
	G.camFocus( shaman, { side: 1, dist: 70, height: 26 } );
	await G.wait( 1.5 );
	await G.say( lines( T().shaman ) );

	G.camFocus( G.actors.hazel, { side: - 1, dist: 34, height: 14 } );
	G.ambushCharge( ring );
	await G.wait( 0.9 );
	G.audio.whaleCall( null, 'luke' );
	await G.say( lines( T().lukeCry ) );
	await G.lukeShield( ring );
	await G.wait( 0.8 );
	await G.say( lines( T().lukeLast ) );

	G.lukeFall();
	G.audio.play( 'sad' );
	await G.wait( 3.2 );
	G.banner( ...T().bannerLuke, 'sad', 4 );
	await G.wait( 2.5 );
	G.scatterLukeLight();
	await G.wait( 2.4 );
	await G.say( lines( T().lightScatter ) );
	G.banner( ...T().bannerAbility, 'join', 4.5 );
	await G.wait( 1 );
	await G.say( lines( T().go ) );

	G.setMusic( { tension: 0.35, drums: 0.8 } );
	G.camRelease();
	G.cutscene( false );
	G.ambushChase( ring );
	G.objective( label( T().card ), T().objEscape, PLACES.kelp5 );
	await G.until( () => G.distTo( PLACES.kelp5 ) < 60 );
	G.ambushRetreat( ring, shaman );
	G.toast( T().toastStop );
	G.setMusic( { tension: 0, drums: 0.6, melody: 1 } );

	await G.say( lines( T().afterEscape ) );
	G.objective( label( T().card ), T().objKelp5, PLACES.kelp5 );
	await G.readKelp( 'kelp5' );

}

// ---------------------------------------------------------------
// 4장 별이 떨어지는 날
// ---------------------------------------------------------------
async function chapter4( G ) {

	const T = () => lang().story.ch4;
	await card( G, T().card );
	G.setStarfall( true );
	G.objective( label( T().card ), T().objMoby, PLACES.moby );
	await G.until( () => G.distTo( PLACES.moby ) < 175 );

	G.cutscene( true );
	const moby = G.actors.moby;
	G.mobyRise();
	G.camFocus( moby, { side: 1, dist: 90, height: 30 } );
	G.audio.whaleCall( null, 'moby' );
	await G.wait( 2.5 );
	await G.say( lines( T().moby ) );
	G.camRelease();
	G.cutscene( false );

	await G.boss( label( T().card ) );

}

// ---------------------------------------------------------------
// 엔딩
// ---------------------------------------------------------------
async function ending( G ) {

	const T = () => lang().story.ending;
	G.cutscene( true );
	G.camFocus( G.actors.moby, { side: - 1, dist: 80, height: 22 } );
	G.setMusic( { tension: 0, drums: 0.3, bass: 0.5, melody: 1, piano: 1 } );
	await G.say( lines( T().lines ) );

	if ( G.bottleCount() >= BOTTLES.length ) await meetStella( G );

	G.cutscene( false );
	await G.showEnding();

}

// 유리병 편지를 모두 모으면 또 하나의 52Hz, 스텔라가 떠오른다
async function meetStella( G ) {

	const T = lang().story.ending;
	await card( G, T.subCard );
	G.stellaRise();
	G.camFocus( G.actors.stella, { side: 1, dist: 140, height: 40 } );
	G.audio.whaleCall( null, 'stella' );
	await G.wait( 3 );
	await G.say( lines( T.stella ) );
	G.flags.subEnding = true;

}

// 엔딩 뒤: 바다를 계속 헤엄치며 남은 유리병을 찾는다. 다 모으면 스텔라를 만난다
export async function epilogue( G ) {

	const T = () => lang().story.epilogue;
	G.setStarfall( false );
	G.setMusic( { tension: 0, drums: 0.5, bass: 0, melody: 1, piano: 1 } );
	await G.say( lines( T().start ) );
	G.objective( label( T().card ), T().objective );
	G.ui.toast( T().hint );

	await G.until( () => G.bottleCount() >= BOTTLES.length && ! G.ui.overlay && ! G.ui.dialogOpen );
	await G.wait( 1.2 );
	G.cutscene( true );
	await meetStella( G );
	G.cutscene( false );
	await G.showEnding();

}

export const CHAPTERS = [ prologue, chapter1, chapter2, chapter3, chapter4, ending ];
