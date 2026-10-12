// 이야기 대본. 대사만 고치고 싶다면 이 파일만 보면 된다.

export const SPEAKERS = {
	narrator: { name: '', portrait: null },
	hazel: { name: '헤이즐 · 52Hz', portrait: 'hazel', bar: 'linear-gradient(90deg,#0f6e8c,#3fc8ff)' },
	luke: { name: '루크 · 등대지기', portrait: 'luke', bar: 'linear-gradient(90deg,#b5452a,#ff9a6b)' },
	finn: { name: '핀 · 나침반', portrait: 'finn', bar: 'linear-gradient(90deg,#4b3aa8,#9d8cff)' },
	moby: { name: '모비 딕', portrait: 'moby', bar: 'linear-gradient(90deg,#3a4a66,#bcd6ff)' },
	shaman: { name: '연합군 샤먼 · 긴수염고래', portrait: 'shaman', bar: 'linear-gradient(90deg,#5a1030,#ff6b8b)' },
	stella: { name: '스텔라', portrait: 'stella', bar: 'linear-gradient(90deg,#a87a10,#ffd36b)' },
	orca: { name: '연합군 범고래', portrait: 'orca', bar: 'linear-gradient(90deg,#5a1030,#ff6b8b)' },
	kelp: { name: '미역 줄기에 쓰인 글', portrait: null, bar: 'linear-gradient(90deg,#0c6b5a,#6dffe0)' }
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

// 작은 미역 숲: 근처에서 노래하면 스태미나가 가득 찬다
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

export const MOBY_LETTER = {
	head: 'LETTER #00 — 유리병 편지',
	body: '별이 떨어지는 날에는\n무엇이든 할 수 있다.\n\n그날, 나는 오래전 하지 못한 일을 할 것이다.',
	from: '— 깊은 바다에서, M.'
};

export const LETTERS = [
	{ id: 1, head: 'LETTER #01', body: '인간이 줄어든 뒤로 바다는 조용해졌다.\n너무 조용해서, 이제는 우리끼리 싸운다.', from: '— 이름 없는 돌고래' },
	{ id: 2, head: 'LETTER #02', body: '바다는 무정부가 원칙이다.\n누구도 누구를 다스리지 않는다.\n그런데 왜 연합군은 자꾸 ‘질서’를 말할까.', from: '— 어느 혹등고래' },
	{ id: 3, head: 'LETTER #03', body: '연합군 샤먼님은 이상한 헤르츠가 바다를 병들게 한다고 하셨다.\n정말 그럴까?\n내 노래도 조금 이상한데.', from: '— 연합군 교육생 K' },
	{ id: 4, head: 'LETTER #04', body: '고래사냥이 심해지던 해, 흰 향유고래가 배를 부쉈다.\n사람들은 그를 모비 딕이라 불렀다.\n그 뒤로 바다의 균형이 달라졌다.', from: '— 낡은 항해일지 조각' },
	{ id: 5, head: 'LETTER #05', body: '등에 빛의 문양이 있으면 인간에게 보이지 않아.\n대신 다른 고래들의 노래도 조금 멀어지지.\n그래도 안 지우는 데는 다 이유가 있다구!', from: '— S' },
	{ id: 6, head: 'LETTER #06', body: '등대는 바다를 위해 불을 켠다.\n누가 고마워하지 않아도.\n\n오늘도 이상 없음.', from: '— 등대 일지, L' }
];

export const KELPS = {
	kelp1: {
		text: '길을 잃었나요? 축하해요!\n진짜 모험은 지금부터예요.\n해 뜨는 쪽으로 →',
		after: [ [ 'luke', '...누가 이런 걸 바다에 써 놓은 거야. 정신 사납게.' ], [ 'luke', '그래도 방향은 맞아. 동쪽으로 가자.' ], [ 'luke', '아, 미역 근처에서 노래하면 기운이 다시 차. 지치면 아무 미역이나 들러.' ] ]
	},
	kelp2: {
		text: '울고 있는 범고래를 만나도 겁먹지 말아요.\n눈물이 많은 고래는 대개 착하답니다 ✶',
		after: [ [ 'luke', '범고래? 농담이지? 범고래면 연합군이잖아.' ] ]
	},
	kelp3: {
		text: '이 근처 물이 조금 짠 건\n기분 탓이 아니에요.',
		after: [ [ 'luke', '......쉿. 무슨 소리 안 들려?' ], [ 'narrator', '북쪽 어딘가에서 훌쩍이는 소리가 들린다.' ] ]
	},
	kelp4: {
		text: '연합군의 순찰은 언제나 시계 방향!\n반대로 돌면 등 뒤로 지나갈 수 있어요.',
		after: [ [ 'finn', '...맞아. 연합군 안에서도 비밀인데.' ], [ 'finn', '이걸 쓴 고래는 대체 누구지.' ] ]
	},
	kelp5: {
		text: '별이 떨어지는 날엔 무엇이든 할 수 있대요.\n그러니까, 말을 거는 것도요.',
		after: [ [ 'finn', 'S... 이 글씨, 어디서 본 것 같아.' ] ]
	}
};

// 모비가 마음을 열 때마다 하는 말 (보스전)
export const MOBY_RESONANCE = [
	'...왜 그런 눈으로 보는 거냐.',
	'아무도 듣지 못하는 노래를, 왜 계속 부르는 거지.',
	'어미도... 그런 노래를 불렀었다.',
	'인간을 모두 없앤다고, 어미가 돌아오진 않겠지.',
	'......그만. 이제, 들린다.'
];

const hz = ( v ) => `${( v / 60 * 100 ).toFixed( 1 )}%`;
const SPECTRUM = `
	<div class="spectrum" aria-label="고래 노래의 주파수">
		<div class="spec-track">
			<span class="spec-band" style="left:${hz( 10 )};width:${hz( 15 )}"><b>고래들</b>10–25Hz</span>
			<span class="spec-band blue" style="left:${hz( 30 )};width:${hz( 8 )}"><b>대왕고래</b>30Hz대</span>
			<span class="spec-mark" style="left:${hz( 52 )}"><b>헤이즐</b>52Hz</span>
		</div>
		<div class="spec-axis"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60Hz</span></div>
	</div>`;

export function scramble( text ) {

	const glyphs = '∿≋≈⌇⋰⋱∴∵⁂☍⌁⌬';
	return [ ...text ].map( ( c ) => ( c === '\n' || c === ' ' ) ? c : glyphs[ ( c.charCodeAt( 0 ) * 7 ) % glyphs.length ] ).join( '' );

}

const L = ( who, text, extra ) => ( { who, text, ...extra } );
const lines = ( arr ) => arr.map( ( [ who, text, extra ] ) => L( who, text, extra ) );

// ---------------------------------------------------------------
// 프롤로그
// ---------------------------------------------------------------
async function prologue( G ) {

	await G.card( 'PROLOGUE', '52Hz', '아무도 듣지 못하는 노래', { seconds: 6.5, extra: SPECTRUM } );
	await G.say( lines( [
		[ 'narrator', '이세계의 2066년.\n바다에는 소수의 인간과, 그보다 훨씬 많은 고래가 살고 있다.' ],
		[ 'narrator', '고래들은 노래로 이야기한다.\n대부분은 10~25헤르츠의 낮은 소리. 대왕고래는 조금 높은 30헤르츠대.' ],
		[ 'narrator', '낮은 노래는 수백 킬로미터 떨어진 고래에게까지 건너가\n짝을 찾고, 무리를 지키고, 서로가 거기 있다는 걸 알려 준다.' ],
		[ 'narrator', '헤이즐의 노래는 52헤르츠다.\n다른 고래들의 귀에는 노래로 들리지 않을 만큼, 혼자 높다.' ],
		[ 'narrator', '오래전 인간들의 바다 밑 청음기가 처음 이런 소리를 붙잡았을 때,\n사람들은 그 주인을 ‘세상에서 가장 외로운 고래’라고 불렀다.' ],
		[ 'narrator', '헤이즐은 52헤르츠로 노래하는 상괭이다.\n그 노래에 대답해 준 고래는, 아직 없다.' ],
		[ 'narrator', '등 뒤에 새겨진 빛의 문양 덕분에 인간의 눈에는 보이지 않는다.\n...어쩌면 다른 고래들의 눈에도.' ]
	] ) );

	G.objective( 'PROLOGUE · 52Hz', '조금 헤엄쳐 보자  —  W A S D / 방향키' );
	await G.until( () => G.stats.swum > 45 );

	G.objective( 'PROLOGUE · 52Hz', '52Hz로 노래하기  —  [E]' );
	await G.untilEvent( 'sing' );
	await G.wait( 2.2 );
	await G.say( lines( [
		[ 'narrator', '. . . . . .' ],
		[ 'narrator', '역시, 아무도 대답하지 않는다.' ]
	] ) );

	const bottle = G.spawnStoryBottle();
	await G.wait( 0.6 );
	G.objective( 'PROLOGUE · 52Hz', '파도 사이에서 반짝이는 유리병 줍기', bottle );
	await G.untilEvent( 'bottle0' );

	await G.letter( { ...MOBY_LETTER, body: scramble( MOBY_LETTER.body ), from: scramble( MOBY_LETTER.from ), scrambled: true } );
	await G.say( lines( [
		[ 'narrator', '헤르츠로 쓰인 글자들이 웅웅거린다.\n귀가 잘 들리지 않는 헤이즐에게는 읽을 수 없는 편지다.' ],
		[ 'hazel', '( ...누군가 읽어 줄 수 있다면. )' ],
		[ 'narrator', '북쪽 멀리, 등대의 불빛이 돌고 있다.\n등대지기는 바다의 모든 주파수를 듣는다고 했던가.' ]
	] ) );

}

// ---------------------------------------------------------------
// 1장 등대지기
// ---------------------------------------------------------------
async function chapter1( G ) {

	await G.card( 'CHAPTER 01', '등대지기', '불같은 일각고래, 루크' );
	G.objective( 'CHAPTER 01 · 등대지기', '북쪽의 등대 찾아가기', G.actors.luke.pos );
	await G.until( () => G.distTo( G.actors.luke.pos ) < 40 );

	G.cutscene( true );
	G.faceEachOther( G.actors.luke );
	G.camFocus( G.actors.luke, { side: 1 } );
	G.audio.whaleCall( null, 'luke' );
	await G.say( lines( [
		[ 'luke', '야! 거기 꼬맹이! 등대 불빛 가리지 말고 비켜!' ],
		[ 'luke', '...뭐야, 너 등에 그 문양. 인간들 눈에 안 보이게 해 주는 그거잖아.' ],
		[ 'hazel', '( 유리병을 내민다 )  ∿∿ ≋ ∿' ],
		[ 'luke', '...52헤르츠? 하, 별 이상한 주파수를 다 듣겠네.' ],
		[ 'luke', '근데 들리긴 한다. 나는 등대지기니까.' ],
		[ 'luke', '줘 봐. 읽어 줄게. 대신 딱 한 번만이다.' ]
	] ) );

	await G.letter( MOBY_LETTER );
	G.flags.letter0Read = true;

	await G.say( lines( [
		[ 'hazel', '...무엇이든?\n그럼, 나도 다른 고래들과 이야기할 수 있을까.' ],
		[ 'luke', '별이 떨어지는 날이면... 얼마 안 남았는데.' ],
		[ 'luke', '설마 너, 이거 쓴 녀석 찾아가겠다는 거야?' ],
		[ 'hazel', '( 고개를 끄덕인다 )' ],
		[ 'luke', '하아. 혼자 보내면 사흘 안에 연합군한테 잡아먹힐 게 뻔하지.' ],
		[ 'luke', '따라가 줄게. 착각하지 마. 등대가 심심해서 그런 거니까.' ]
	] ) );

	G.join( 'luke', '통역 — 유리병 편지와 미역 줄기를 대신 읽어 준다' );
	await G.wait( 1.2 );

	if ( G.unreadCount() > 0 ) {

		await G.say( lines( [ [ 'luke', '그동안 주운 편지도 내놔. 한꺼번에 읽어 줄게.' ] ] ) );
		G.readAllBottles();
		G.toast( '편지함에서 다시 읽을 수 있다  [L]' );

	}

	await G.say( lines( [
		[ 'luke', '저기, 바다 밑에서 빛나는 미역 보이지?\n누가 줄기마다 길을 써 놨어. 저걸 따라가 보자.' ],
		[ 'luke', '아, 그리고 다른 유리병도 보이면 주워. 다 읽어 줄 테니까.' ]
	] ) );
	G.camRelease();
	G.cutscene( false );

}

// ---------------------------------------------------------------
// 2장 나침반
// ---------------------------------------------------------------
async function chapter2( G ) {

	await G.card( 'CHAPTER 02', '나침반', '눈물이 많은 범고래, 핀' );
	for ( const k of [ 'kelp1', 'kelp2', 'kelp3' ] ) {

		G.objective( 'CHAPTER 02 · 나침반', '빛나는 미역 줄기 앞에서 노래하기  [E]', PLACES[ k ] );
		await G.readKelp( k );

	}

	G.objective( 'CHAPTER 02 · 나침반', '훌쩍이는 소리를 따라가기', G.actors.finn.pos );
	await G.until( () => G.distTo( G.actors.finn.pos ) < 42 );

	G.cutscene( true );
	G.faceEachOther( G.actors.finn );
	G.camFocus( G.actors.finn, { side: - 1 } );
	G.audio.whaleCall( null, 'finn' );
	await G.say( lines( [
		[ 'finn', '...가까이 오지 마. 나한테서 연합군 냄새가 날 거야.' ],
		[ 'luke', '범고래?! 헤이즐, 뒤로 빠져!' ],
		[ 'finn', '진정해, 일각고래. 나는 도망쳐 나왔어.\n연합군 샤먼의 교육생이었지만... 더는 못 하겠더라.' ],
		[ 'finn', '그리고 너. 52헤르츠지?\n연합군이 찾고 있어. 수상한 헤르츠를 내는 고래는 ‘정화’ 대상이거든.' ],
		[ 'hazel', '( 유리병을 보여 준다 )' ],
		[ 'finn', '......이 글씨.' ],
		[ 'finn', '모비 딕이야. 별이 떨어지는 날, 그분은 인간들을 끝장내러 간다고 했어.' ],
		[ 'luke', '야, 너 지금 우는 거냐?' ],
		[ 'finn', '...원래 눈물이 많아. 신경 쓰지 마.' ],
		[ 'finn', '길은 내가 알아. 해류도, 연합군의 순찰로도.\n...나도 그분을 한 번 더 만나야 하거든.' ],
		[ 'luke', '울보 범고래랑 같이 다니라고? ...뭐, 길잡이는 필요하지.' ]
	] ) );

	G.join( 'finn', '예견 — 연합군의 감시 범위가 보인다 · 부스트가 오래 간다' );
	await G.wait( 1.2 );
	G.camRelease();
	G.cutscene( false );

}

// ---------------------------------------------------------------
// 3장 연합군
// ---------------------------------------------------------------
async function chapter3( G ) {

	await G.card( 'CHAPTER 03', '연합군', '바다의 질서를 말하는 자들' );
	await G.say( lines( [
		[ 'finn', '여기서부터 연합군 해역이야.\n붉은 원 안으로 들어가면 들켜.' ],
		[ 'finn', '그리고 노래는 참아. 수상한 헤르츠는 멀리서도 들리니까.' ],
		[ 'luke', '들키면? 그냥 들이받으면 되잖아.' ],
		[ 'finn', '...그래서 일각고래들이 오래 못 사는 거야.' ],
		[ 'narrator', '연합군에게 닿으면 체력이 깎인다.\n[Space] 점프 중에는 부딪혀도 괜찮다.' ]
	] ) );

	G.objective( 'CHAPTER 03 · 연합군', '연합군을 피해 미역 줄기 찾기', PLACES.kelp4 );
	await G.readKelp( 'kelp4' );

	G.objective( 'CHAPTER 03 · 연합군', '연합군 해역을 가로질러 남쪽으로', PLACES.ambush );
	await G.until( () => G.distTo( PLACES.ambush ) < 55 );

	// --- 매복 ---
	G.cutscene( true );
	G.setMusic( { drums: 0, melody: 0, tension: 0.7 } );
	const shaman = G.spawnShaman();
	const ring = G.spawnAmbush( 6, 40 );
	G.camFocus( shaman, { side: 1, dist: 70, height: 26 } );
	await G.wait( 1.5 );
	await G.say( lines( [
		[ 'shaman', '찾았다, 52헤르츠.\n바다의 질서를 어지럽히는 잡음.' ],
		[ 'shaman', '그리고... 배신자 핀. 교육을 끝마치지 못한 아이야.' ],
		[ 'finn', '......' ],
		[ 'finn', '도망쳐야 해. 지금.' ],
		[ 'shaman', '정화하라.' ]
	] ) );

	G.camFocus( G.actors.hazel, { side: - 1, dist: 34, height: 14 } );
	G.ambushCharge( ring );
	await G.wait( 0.9 );
	G.audio.whaleCall( null, 'luke' );
	await G.say( lines( [ [ 'luke', '헤이즐!!' ] ] ) );
	await G.lukeShield( ring );
	await G.wait( 0.8 );
	await G.say( lines( [
		[ 'luke', '...생각은, 나중에 하는 거야.\n늘 그랬잖아.' ],
		[ 'luke', '가. 핀, 헤이즐 데리고 가!' ],
		[ 'luke', '등대 불빛... 꺼뜨리지 말고.' ]
	] ) );

	G.lukeFall();
	G.audio.play( 'sad' );
	await G.wait( 3.2 );
	G.banner( 'LUKE', '루크가 헤이즐을 지켰다', '등대의 불빛이 꺼졌다', 'sad', 4 );
	await G.wait( 2.5 );
	G.scatterLukeLight();
	await G.wait( 2.4 );
	await G.say( lines( [
		[ 'narrator', '루크가 가라앉은 자리에서\n등대 불빛 같은 빛 조각들이 흩어져 떠올랐다.' ],
		[ 'finn', '......루크의 빛이야.' ],
		[ 'finn', '저걸 먹으면 루크처럼 빨라질 수 있어.\n생각은 나중에 하고, 일단 달려.' ]
	] ) );
	G.banner( 'NEW ABILITY', '루크의 빛', '바다에 뜬 빛 조각을 먹으면 잠시 아주 빨라진다 · 그동안은 부딪혀도 괜찮다', 'join', 4.5 );
	await G.wait( 1 );
	await G.say( lines( [
		[ 'finn', '가자. 루크가 만들어 준 길이야. 뒤돌아보지 마.' ]
	] ) );

	G.setMusic( { tension: 0.35, drums: 0.8 } );
	G.camRelease();
	G.cutscene( false );
	G.ambushChase( ring );
	G.objective( 'CHAPTER 03 · 연합군', '도망쳐! 루크의 빛을 따라 남쪽 해류까지', PLACES.kelp5 );
	await G.until( () => G.distTo( PLACES.kelp5 ) < 60 );
	G.ambushRetreat( ring, shaman );
	G.toast( '연합군이 추격을 멈췄다' );
	G.setMusic( { tension: 0, drums: 0.6, melody: 1 } );

	await G.say( lines( [
		[ 'narrator', '등대의 불빛이 꺼졌다.\n이제 편지를 읽어 줄 고래는 없다.' ],
		[ 'finn', '...루크만큼은 못 하겠지만.\n이제부터는 내가 읽어 줄게.' ]
	] ) );
	G.objective( 'CHAPTER 03 · 연합군', '미역 줄기 앞에서 노래하기  [E]', PLACES.kelp5 );
	await G.readKelp( 'kelp5' );

}

// ---------------------------------------------------------------
// 4장 별이 떨어지는 날
// ---------------------------------------------------------------
async function chapter4( G ) {

	await G.card( 'CHAPTER 04', '별이 떨어지는 날', '바다에는 자유가 있다' );
	G.setStarfall( true );
	G.objective( 'CHAPTER 04 · 별이 떨어지는 날', '별이 쏟아지는 남쪽 바다로', PLACES.moby );
	await G.until( () => G.distTo( PLACES.moby ) < 175 );

	G.cutscene( true );
	const moby = G.actors.moby;
	G.mobyRise();
	G.camFocus( moby, { side: 1, dist: 90, height: 30 } );
	G.audio.whaleCall( null, 'moby' );
	await G.wait( 2.5 );
	await G.say( lines( [
		[ 'moby', '...누구냐. 이 밤에, 이 바다에.' ],
		[ 'finn', '모비 딕... 저예요. 핀.' ],
		[ 'moby', '연합군의 아이가 이제 와서.\n오늘은 별이 떨어지는 날이다. 나는 인간들을 끝낼 것이다.' ],
		[ 'hazel', '( 유리병을 내민다 )  이 편지... 당신이 쓴 거죠?' ],
		[ 'moby', '그 소리... 52헤르츠.\n...들린다. 네 노래가.' ],
		[ 'moby', '그래, 내가 썼다. 오래전, 별이 떨어지던 밤에.' ],
		[ 'moby', '그건 별이 아니었다.\n인간의 배에서 쏘아 올린 불꽃이, 우박처럼 쏟아졌지.' ],
		[ 'moby', '어미는 나를 밀어내며 말했다.\n“별이 떨어지는 날에는 무엇이든 할 수 있어. 그러니 도망쳐.”' ],
		[ 'moby', '어미는 돌아오지 않았다.\n...이번엔, 내가 무엇이든 할 차례다.' ],
		[ 'finn', '헤이즐, 저분은 지금 아무것도 듣지 않아.\n하지만 네 노래는... 다를지도 몰라.' ]
	] ) );
	G.camRelease();
	G.cutscene( false );

	await G.boss();

}

// ---------------------------------------------------------------
// 엔딩
// ---------------------------------------------------------------
async function ending( G ) {

	G.cutscene( true );
	G.camFocus( G.actors.moby, { side: - 1, dist: 80, height: 22 } );
	G.setMusic( { tension: 0, drums: 0.3, bass: 0.5, melody: 1, piano: 1 } );
	await G.say( lines( [
		[ 'moby', '52헤르츠.\n너는 다른 고래와 이야기하고 싶다고 했지.' ],
		[ 'moby', '그런데 방금, 너는 나와 이야기했다.' ],
		[ 'moby', '바다에는 자유가 있다.\n누구나 누려야 하는.' ],
		[ 'moby', '인간도, 연합군도, 너도.\n...그리고 나도.' ],
		[ 'moby', '이 바다 어딘가에, 너와 같은 주파수로 노래하는 고래가 있다.' ],
		[ 'moby', '스텔라. 아주 오래된 대왕고래지.\n미역 줄기마다 길을 써 놓은, 괴짜 같은 녀석이다.' ],
		[ 'finn', '......루크도 들었으면 좋았을 텐데.' ],
		[ 'narrator', '별이 떨어지는 밤.\n헤이즐은 처음으로, 누군가와 이야기했다.' ]
	] ) );

	if ( G.bottleCount() >= BOTTLES.length ) {

		await G.card( 'SUB ENDING', '스텔라', '또 하나의 52Hz' );
		G.stellaRise();
		G.camFocus( G.actors.stella, { side: 1, dist: 140, height: 40 } );
		G.audio.whaleCall( null, 'stella' );
		await G.wait( 3 );
		await G.say( lines( [
			[ 'stella', '안녕, 안녕! 드디어 만났네, 52헤르츠!\n내 미역 편지들 재밌었어? 전부 내가 쓴 거야!' ],
			[ 'stella', '등의 문양 지우는 법 알려 줄까? 아니면 새로운 언어?\n...아냐 아냐, 그런 것보다 훨씬 중요한 게 있어.' ],
			[ 'stella', '네 노래는 아무도 못 듣는 게 아니야.\n아직 아무도 안 들어 본 거지. 그건 완전 달라!' ],
			[ 'stella', '그러니까 그 52헤르츠로, 너만 할 수 있는 일을 해 봐.\n혼자 노래하는 고래들한테 대답해 주는 거라든가!' ],
			[ 'stella', '자, 다음 모험은 그거야. 어때, 신나지?!' ]
		] ) );
		G.flags.subEnding = true;

	}

	G.cutscene( false );
	await G.showEnding();

}

export const CHAPTERS = [ prologue, chapter1, chapter2, chapter3, chapter4, ending ];
