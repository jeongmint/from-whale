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
	kelp: { portrait: null, bar: 'linear-gradient(90deg,#0c6b5a,#6dffe0)' },
	ai: { portrait: null, bar: 'linear-gradient(90deg,#5a1020,#ff3355)' } // MAP 2: 박사의 AI
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

// 프롤로그에서 줍는 모비의 편지(0)도 한 통으로 센다. 그래서 바다에 흩어진 병은 다섯 개
// 1·3번은 이야기 길 위(시작 → 등대, 미역 2 → 3), 4·6번은 길에서 조금 벗어난 곳, 5번만 연합군 근처에 숨겨 둔다
export const BOTTLES = [
	{ id: 1, x: - 26, z: - 200 },
	{ id: 3, x: 310, z: - 472 },
	{ id: 4, x: 560, z: - 480 },
	{ id: 5, x: 560, z: 190 },
	{ id: 6, x: - 120, z: - 380 }
];
export const LETTER_TOTAL = BOTTLES.length + 1; // 모비의 편지 포함 6통

// 스텔라와 듀엣: 12마디 블루스 한 바퀴. [ 박, 줄('S' 노래 · 'J' 점프), 음(MIDI) ]. 2/3박은 셔플의 엇박
const T3 = 2 / 3;
export const DUET_CHART = [
	// 1~2마디 Am
	[ 0, 'S', 69 ], [ 1, 'S', 72 ], [ 2, 'S', 74 ], [ 3, 'S', 72 ], [ 4, 'S', 69 ], [ 6, 'J' ],
	// 3~4마디 Dm → Am
	[ 8, 'S', 74 ], [ 9, 'S', 76 ], [ 9 + T3, 'S', 74 ], [ 10, 'S', 72 ], [ 12, 'J' ], [ 14, 'S', 69 ], [ 15, 'S', 67 ],
	// 5~6마디 Dm
	[ 16, 'S', 74 ], [ 16 + T3, 'S', 76 ], [ 17, 'S', 77 ], [ 18, 'S', 76 ], [ 19, 'S', 74 ], [ 20, 'S', 72 ], [ 21, 'J' ], [ 22 + T3, 'S', 69 ], [ 23, 'S', 72 ],
	// 7~8마디 Am
	[ 24, 'J' ], [ 25, 'S', 76 ], [ 26, 'S', 79 ], [ 26 + T3, 'S', 76 ], [ 28, 'J' ], [ 29, 'S', 74 ], [ 30, 'S', 72 ], [ 31, 'S', 69 ],
	// 9~10마디 F7 → E7
	[ 32, 'S', 72 ], [ 33, 'S', 75 ], [ 34, 'S', 77 ], [ 35, 'S', 75 ], [ 36, 'S', 76 ], [ 36 + T3, 'S', 74 ], [ 37, 'S', 71 ], [ 38, 'J' ],
	// 11~12마디 Am → E7
	[ 40, 'S', 69 ], [ 41, 'S', 72 ], [ 42, 'J' ], [ 44, 'S', 76 ], [ 45, 'S', 79 ], [ 46, 'S', 81 ], [ 47, 'J' ]
];

// MAP 2 정지 코드: 헤이즐과 스텔라의 52Hz 리듬 (듀엣보다 짧은 4마디). 52 → 5박 · 2박 묶음이 되풀이된다
export const STOP_CHART = [
	[ 0, 'S', 69 ], [ 1, 'S', 69 ], [ 2, 'S', 72 ], [ 3, 'S', 74 ], [ 4, 'S', 76 ], [ 5, 'J' ], [ 6, 'J' ],
	[ 8, 'S', 76 ], [ 9, 'S', 74 ], [ 10, 'S', 72 ], [ 11, 'S', 74 ], [ 12, 'S', 76 ], [ 13, 'J' ], [ 14, 'J' ],
	[ 16, 'S', 81 ], [ 17, 'S', 79 ], [ 18, 'S', 76 ], [ 19, 'S', 74 ], [ 20, 'S', 72 ], [ 21, 'J' ], [ 22, 'J' ],
	[ 24, 'S', 69 ], [ 25, 'S', 72 ], [ 26, 'S', 76 ], [ 27, 'S', 81 ], [ 28, 'S', 84 ], [ 29, 'J' ], [ 30, 'J' ]
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
	{ x: 415, z: 40, r: 40, n: 3 }, // 미역 4 → 매복 지점 길목
	{ x: 455, z: 310, r: 55, n: 3 },
	{ x: 200, z: 340, r: 40, n: 2 } // 탈출로(매복 → 미역 5) 바로 위는 피해서
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
	// 폰: 가로 모드에서는 기울기로도 헤엄칠 수 있다고 알려 준다 (일시정지 → 실험실)
	if ( G.touch ) G.toast( lang().ui.toast.tiltTip );
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
// 핀의 울음 리듬 (박 단위). 갈수록 조금씩 길어진다
const FINN_SOBS = [ [ 0, 1, 2 ], [ 0, 0.5, 1.5, 2 ], [ 0, 1, 1.5, 2, 3 ] ];

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
	// 울음을 안 그치는 핀에게, 같은 박자로 노래해 대답한다
	await G.songPuzzle( G.actors.finn, FINN_SOBS );
	await G.say( lines( T().calm ) );

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

	// 갈림길: 여기까지 연합군에게 두 번 맞지 않았으면 (LUKE_MAX_HITS), 루크와 함께 뛰어올라 피한다
	const saved = G.lukeCanLive();
	if ( saved ) {

		await G.say( lines( T().lukeJump ) );
		await G.jumpCue();
		await G.lukeDodge( ring );
		await G.say( lines( T().lukeSaved ) );
		G.banner( ...T().bannerSaved, 'join', 4 );
		await G.wait( 1 );

	} else {

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

	}

	G.setMusic( { tension: 0.35, drums: 0.8 } );
	G.camRelease();
	G.cutscene( false );
	G.ambushChase( ring );
	G.objective( label( T().card ), saved ? T().objEscapeSaved : T().objEscape, PLACES.kelp5 );
	G.flags.escaping = true;
	await G.until( () => G.distTo( PLACES.kelp5 ) < 60 && ! G.lukeFalling );
	G.flags.escaping = false;
	G.ambushRetreat( ring, shaman );
	G.toast( T().toastStop );
	G.setMusic( { tension: 0, drums: 0.6, melody: 1 } );

	// 도망치는 동안 맞아서 루크가 떠났을 수도 있다
	await G.say( lines( G.party.luke === 'on' ? T().afterEscapeSaved : T().afterEscape ) );
	G.objective( label( T().card ), T().objKelp5, PLACES.kelp5 );
	await G.readKelp( 'kelp5' );

}

// 매복을 함께 넘긴 뒤 모비 딕에게 닿기 전에 연합군에게 맞으면, 루크가 대신 들이받고 떠난다
export async function lukeLateFall( G, orca ) {

	const T = () => lang().story.ch3;
	G.lukeFalling = true;
	G.cutscene( true );
	G.camFocus( G.actors.hazel, { side: - 1, dist: 34, height: 14 } );
	await G.say( lines( T().lukeCry ) );
	await G.lukeBlock( orca );
	await G.wait( 0.8 );
	await G.say( lines( [ ...T().lukeLate, ...T().lukeLast ] ) );

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
	if ( G.flags.escaping ) G.objective( label( T().card ), T().objEscape, PLACES.kelp5 );

	G.camRelease();
	G.cutscene( false );
	G.lukeFalling = false;

}

// ---------------------------------------------------------------
// 4장 별이 떨어지는 날
// ---------------------------------------------------------------
async function chapter4( G ) {

	const T = () => lang().story.ch4;
	await card( G, T().card );
	G.setStarfall( true );
	G.objective( label( T().card ), T().objMoby, PLACES.moby );
	await G.until( () => G.distTo( PLACES.moby ) < 175 && ! G.lukeFalling );
	G.flags.mobyMet = true; // 여기부터는 맞아도 루크가 대신 들이받지 않는다

	// 모비 딕을 만나기 전에 편지를 다 모았으면 지각한 고래 엔딩으로 간다. 모비는 한참 기다렸다
	if ( G.bottleCount() >= LETTER_TOTAL ) G.route.late = true;

	G.cutscene( true );
	const moby = G.actors.moby;
	G.mobyRise();
	G.camFocus( moby, { side: 1, dist: 115, height: 36 } );
	G.audio.whaleCall( null, 'moby' );
	await G.wait( 2.5 );
	await G.say( lines( G.route.late ? [ ...T().lateMoby, ...T().moby.slice( 1 ) ] : T().moby ) );
	// 루크가 살아 있으면 등불로 모비를 비춰 준다 (노래가 닿는 원이 넓어진다)
	if ( G.party.luke === 'on' ) {

		await G.say( lines( T().lukeLantern ) );
		G.banner( ...T().bannerLantern, 'join', 4 );

	}

	G.camRelease();
	G.cutscene( false );

	await G.boss( label( T().card ) );

}

// ---------------------------------------------------------------
// 엔딩
// ---------------------------------------------------------------
async function ending( G ) {

	const T = () => lang().story.ending;
	// 루크·핀이 살았는지에 따라 엔딩이 갈린다: 꺼지지 않는 빛 / 동료의 힘 / 부서진 나침반 / 희생
	// 모비 딕을 만나기 전에 편지를 다 모았으면 지각한 고래 (스텔라도 늦게 온다)
	const key = G.endingKey();
	G.cutscene( true );
	G.camFocus( G.actors.moby, { side: - 1, dist: 100, height: 27 } );
	// 루크의 베이스는 희생 엔딩에서만 돌아오지 않고, 핀의 드럼은 핀이 있을 때만
	G.setMusic( { tension: 0, drums: G.route.finn ? 0.3 : 0, bass: key === 'sacrifice' ? 0 : 0.5, melody: 1, piano: 1 } );
	await G.say( lines( [ ...T().lines, ...T().routes[ key ] ] ) );
	await card( G, T().cards[ key ] );

	if ( G.bottleCount() >= LETTER_TOTAL ) await meetStella( G );

	G.cutscene( false );
	await G.showEnding();

}

// 유리병 편지를 모두 모으면 또 하나의 52Hz, 스텔라가 떠오른다
async function meetStella( G ) {

	const T = () => lang().story.ending;
	await card( G, T().subCard );
	G.stellaRise();
	G.camFocus( G.actors.stella, { side: 1, dist: 185, height: 52 } );
	G.audio.whaleCall( null, 'stella' );
	await G.wait( 3 );
	await G.say( lines( G.route.late ? [ ...T().stellaLate, ...T().stella ] : T().stella ) );
	// 또 하나의 52Hz와 함께 부르는 듀엣 (리듬 게임). 실패는 없고 등급에 따라 스텔라의 반응이 달라진다
	const rank = await G.duet( DUET_CHART );
	await G.say( lines( [ ...T().duetEnd[ rank ], ...T().nameSong ] ) );
	// 노래 이름을 붙여 점수판에 남긴다
	await G.scores();
	await G.say( lines( T().outro ) );
	G.flags.subEnding = true;

}

// 듀엣 다시 부르기: 스텔라를 만난 적 있으면 타이틀 · 엔딩 화면에서 바로 스텔라와 듀엣만 (점수는 점수판에 정식으로)
export async function duetAgain( G ) {

	const T = () => lang().story.ending;
	G.cutscene( true );
	if ( ! G.actors.stella.root.visible ) {

		G.stellaRise();
		G.audio.whaleCall( null, 'stella' );

	}

	G.camFocus( G.actors.stella, { side: 1, dist: 185, height: 52 } );
	await G.wait( 2.5 );
	await G.say( lines( T().again ) );
	const rank = await G.duet( DUET_CHART );
	await G.say( lines( [ ...T().duetEnd[ rank ], ...T().nameSong ] ) );
	await G.scores();
	await G.say( lines( T().againBye ) );
	G.cutscene( false );

}

// 엔딩 뒤: 바다를 계속 헤엄치며 남은 유리병을 찾는다. 다 모으면 스텔라를 만난다
export async function epilogue( G ) {

	const T = () => lang().story.epilogue;
	G.setStarfall( false );
	// 핀의 드럼은 핀이 있을 때만 (보스전에서 떠났으면 에필로그에서도 다시 나오지 않는다)
	G.setMusic( { tension: 0, drums: G.party.finn === 'on' ? 0.5 : 0, bass: 0, melody: 1, piano: 1, sax: 0.9 } );
	const who = G.party.finn === 'on' ? 'finn' : G.party.luke === 'on' ? 'luke' : 'none';
	await G.say( lines( T().start[ who ] ) );
	G.objective( label( T().card ), T().objective );
	G.ui.toast( T().hint );

	await G.until( () => G.bottleCount() >= LETTER_TOTAL && ! G.ui.overlay && ! G.ui.dialogOpen );
	await G.wait( 1.2 );
	G.cutscene( true );
	await meetStella( G );
	G.cutscene( false );
	await G.showEnding();

}

// ---------------------------------------------------------------
// MAP 2 · 바닷속: 층마다 연구 일지를 찾으며 내려가 연합군의 진실을 알고, 기지 문 앞에서 정지 코드를 부른다
// 대사의 세 번째 칸은 조건: 'luke' · 'lukeGone' · 'finn' · 'finnGone' · 'none'(둘 다 없음). 없으면 언제나
// ---------------------------------------------------------------
export async function map2( G ) {

	const T = () => lang().story.map2;
	const U = () => lang().ui.map2;
	const on = {
		luke: G.party.luke === 'on', lukeGone: G.party.luke !== 'on',
		finn: G.party.finn === 'on', finnGone: G.party.finn !== 'on',
		none: G.party.luke !== 'on' && G.party.finn !== 'on'
	};
	const pick = ( arr ) => lines( ( arr ?? [] ).filter( ( [ , , c ] ) => ! c || on[ c ] ).map( ( [ who, text ] ) => [ who, text ] ) );

	await G.say( pick( T().intro ) );
	for ( const log of G.map2.logs ) {

		// 이 층의 기록을 읽기 전엔 물살이 더 아래를 막는다
		G.setDiveFloor( log.depth + 14 );
		G.objective( U().label, U().obj[ log.index ], log.pos );
		await G.until( () => G.nearLog( log ) && ! G.ui.dialogOpen && ! G.ui.overlay );
		log.read = true;
		G.logRead( log );
		G.cutscene( true );
		const L = T().logs[ log.index ];
		// 인간의 글자는 루크가 읽어 준다. 루크가 없으면 그림과 숫자만
		await G.letter( { head: L.head, body: on.luke ? L.body : L.short, from: L.from } );
		await G.say( pick( T().react[ log.index ] ) );
		G.ui.toast( U().logs.replace( '{n}', log.index + 1 ) );
		G.cutscene( false );

	}

	// 기지 문 앞: 박사의 AI, 그리고 정지 코드
	G.setDiveFloor( null );
	G.cutscene( true );
	await G.say( pick( T().base ) );
	G.objective( U().label, U().objBase );
	await G.duet( STOP_CHART, U().stopTitle );
	G.openBase();
	await G.say( pick( T().stop ) );
	await card( G, T().card );
	G.cutscene( false );
	await G.showEnding( 'deep' );

}

export const CHAPTERS = [ prologue, chapter1, chapter2, chapter3, chapter4, ending ];
