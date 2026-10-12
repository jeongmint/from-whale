// 첫 화면: 언어 고르기와 ABOUT / CONTACT 창. 언어 설정은 게임과 같이 쓴다 (fromwhale.lang)

const TEXT = {
	ko: {
		tagline: '이세계의 2066년. 아무도 듣지 못하는 52Hz로 노래하는 고래 헤이즐의 바다 모험.',
		close: '닫기',
		pitch: `
			<p><b>From. Whale</b>은 싸우지 않는 바다 모험 게임이에요.</p>
			<p>플레이어는 아무도 듣지 못하는 52Hz로 노래하는 고래 헤이즐이 되어, 유리병 편지 한 통을 따라 밤바다를 헤엄쳐요.</p>
			<p>공격 버튼은 없어요. 할 수 있는 건 노래하는 것뿐이에요. 동료를 만날 때마다 음악에 악기가 하나씩 더해지고, 마지막에는 별이 떨어지는 날 인간을 끝내려는 모비 딕을 노래로 설득해요.</p>
			<p>설치 없이 브라우저에서 바로, PC와 휴대폰 모두에서 플레이할 수 있어요. 한국어 · English · 日本語</p>
			<a class="play" href="game/">▶ PLAY</a>`,
		concept: `
			<h3>World</h3>
			<p>이세계의 2066년, 소수의 인간만이 살아남은 바다. 바다는 누구도 누구를 다스리지 않는 것이 원칙이지만, 인간에게 우호적인 종파로 변한 ‘연합군’이 수상한 헤르츠를 내는 고래를 ‘정화’하고 있어요.</p>
			<h3>52Hz</h3>
			<p>대부분의 고래는 10~25Hz, 대왕고래는 30Hz대로 노래해요. 52Hz로 노래하는 헤이즐의 목소리는 다른 고래에게 노래로 들리지 않아요. 실제로 관측된 ‘세상에서 가장 외로운 고래’ 이야기에서 출발했어요.</p>
			<h3>Characters</h3>
			<ul>
				<li><b>헤이즐</b> 52Hz로 노래하는 상괭이. 등에 새겨진 빛의 문양 덕분에 인간에게 보이지 않아요.</li>
				<li><b>루크</b> 불같은 일각고래 등대지기. 헤이즐 대신 편지를 읽어 주는 통역사.</li>
				<li><b>핀</b> 눈물 많은 범고래. 연합군 샤먼의 교육생이었다가 도망친 길잡이.</li>
				<li><b>모비 딕</b> 별이 떨어지는 날에 대한 편지를 쓴 향유고래.</li>
				<li><b>스텔라</b> 미역 줄기마다 길을 써 놓은 괴짜 대왕고래. 또 하나의 52Hz.</li>
			</ul>
			<h3>Look and Sound</h3>
			<p>우주와 바다가 만나는 밤, 빛나는 해저와 고리 행성, 레트로한 파란 UI. 음악은 음원 파일 없이 브라우저에서 합성해요. 셔플 리듬에 52Hz 허밍을 섞었고, 동료가 생길 때마다 악기가 늘어나요.</p>
			<blockquote>무언가를 한다는 생각 자체부터<br>모험은 시작된다</blockquote>`,
		bgm: `
			<p>밤바다에서 혼자 치는 블루스 피아노에, 동료를 만날 때마다 악기가 하나씩 붙어요. 1950년대 R&amp;B 곡 ‘One Mint Julep’의 느긋한 셔플에서 출발했어요.</p>
			<h3>No Audio Files</h3>
			<p>음원 파일이 하나도 없어요. 모든 소리를 브라우저의 Web Audio로 그 자리에서 합성해요. 멜로디는 블루스 음계 안에서 매번 새로 즉흥 연주해서, 같은 곡이 똑같이 반복되지 않아요.</p>
			<h3>Groove</h3>
			<ul>
				<li><b>템포</b> 92 BPM 셔플. 한 박을 셋으로 나눈 통통 튀는 리듬이에요.</li>
				<li><b>코드</b> A단조 12마디 블루스. 마지막에 F7 → E7로 쓸쓸하게 돌아와요.</li>
				<li><b>52Hz</b> 내내 깔리는 헤이즐의 허밍. 휴대폰 스피커로도 들리도록 104&nbsp;·&nbsp;156&nbsp;·&nbsp;208Hz 배음을 섞었어요.</li>
			</ul>
			<h3>Layers</h3>
			<ul>
				<li><b>헤이즐 혼자</b> 일렉 피아노 + 멜로디 + 52Hz</li>
				<li><b>+ 루크</b> 베이스 기타</li>
				<li><b>+ 핀</b> 브러시 드럼</li>
				<li><b>모비 딕</b> 낮게 깔리는 긴장의 소리와, 매 박자 울리는 킥 드럼</li>
			</ul>
			<p>모든 악기가 같은 박자 위에서 돌아서, 중간에 들어와도 박이 어긋나지 않아요. 그리고 누군가 떠나면, 그 악기도 함께 사라져요.</p>
			<a class="play" href="game/">▶ PLAY</a>`,
		contact: '함께 이야기하고 싶다면 언제든 연락 주세요.<br>버그 제보나 의견은 어떤 방법이든 환영해요. 메일로 보내 주셔도 돼요!',
		bugs: '✉ 버그 제보나 의견은 어떤 방법이든 환영해요.',
		sound: '♪ 소리를 켜고 플레이하면 더 재밌어요',
		copy: '주소 복사',
		copied: '복사했어요!',
		mailApp: '메일 앱으로 보내기'
	},
	en: {
		tagline: 'Another world, the year 2066. A sea adventure of Hazel, a whale who sings at 52Hz, a song no one can hear.',
		close: 'Close',
		pitch: `
			<p><b>From. Whale</b> is a sea adventure where you never fight.</p>
			<p>You are Hazel, a whale who sings at 52Hz, a frequency no other whale can hear. Following a single message in a bottle, you swim through a sea at night.</p>
			<p>There is no attack button. All you can do is sing. Each companion you meet adds an instrument to the music, and in the end you sing to Moby Dick, who has vowed to end the humans on the day the stars fall.</p>
			<p>It runs right in the browser on PC and phone, with nothing to install. 한국어 · English · 日本語</p>
			<a class="play" href="game/">▶ PLAY</a>`,
		concept: `
			<h3>World</h3>
			<p>Another world, the year 2066: a sea where only a few humans remain. The sea has no rulers, but the “Alliance”, a sect that turned friendly to humans, now “purifies” any whale with a suspicious hertz.</p>
			<h3>52Hz</h3>
			<p>Most whales sing at 10 to 25Hz, and blue whales in the 30s. Hazel sings at 52Hz, so other whales don't hear it as a song at all. The story starts from the real-life “loneliest whale in the world.”</p>
			<h3>Characters</h3>
			<ul>
				<li><b>Hazel</b> A finless porpoise who sings at 52Hz. A pattern of light on Hazel's back hides Hazel from human eyes.</li>
				<li><b>Luke</b> A fiery narwhal and lighthouse keeper, who reads letters aloud for Hazel.</li>
				<li><b>Finn</b> An orca who cries easily, once a trainee of the Alliance Shaman, now a runaway and guide.</li>
				<li><b>Moby Dick</b> The sperm whale who wrote the letter about the day the stars fall.</li>
				<li><b>Stella</b> An odd old blue whale who wrote directions on every stalk of kelp. Another 52Hz.</li>
			</ul>
			<h3>Look and Sound</h3>
			<p>A night where space meets the sea: a glowing seabed, a ringed planet, a retro blue interface. The music is synthesized in the browser with no audio files, a shuffle rhythm mixed with a 52Hz hum, and it gains an instrument with every companion.</p>
			<blockquote>Adventure begins<br>with the very thought of doing something</blockquote>`,
		bgm: `
			<p>A blues piano playing alone on a night sea, gaining an instrument with every companion you meet. It started from the easygoing shuffle of the 1950s R&amp;B tune “One Mint Julep.”</p>
			<h3>No Audio Files</h3>
			<p>There isn't a single audio file. Every sound is synthesized on the spot in the browser with Web Audio. The melody is improvised fresh each time on a blues scale, so the song never repeats exactly.</p>
			<h3>Groove</h3>
			<ul>
				<li><b>Tempo</b> A 92 BPM shuffle, each beat split in three for a bouncy swing.</li>
				<li><b>Chords</b> A 12-bar blues in A minor, coming home on a lonely F7 → E7.</li>
				<li><b>52Hz</b> Hazel's hum, always underneath. Overtones at 104, 156 and 208Hz let you hear it even on phone speakers.</li>
			</ul>
			<h3>Layers</h3>
			<ul>
				<li><b>Hazel alone</b> Electric piano + melody + 52Hz</li>
				<li><b>+ Luke</b> Bass guitar</li>
				<li><b>+ Finn</b> Brush drums</li>
				<li><b>Moby Dick</b> A low, tense drone and a kick drum on every beat</li>
			</ul>
			<p>Every instrument runs on the same beat grid, so whoever joins comes in right on time. And when someone leaves, their instrument leaves too.</p>
			<a class="play" href="game/">▶ PLAY</a>`,
		contact: 'If you\'d like to talk, feel free to reach out anytime.<br>Bug reports and feedback are welcome in any form. An email is perfectly fine!',
		bugs: '✉ Bug reports and feedback are welcome in any form.',
		sound: '♪ It\'s more fun with the sound on',
		copy: 'Copy address',
		copied: 'Copied!',
		mailApp: 'Open in mail app'
	},
	ja: {
		tagline: '異世界の2066年。誰にも聞こえない52Hzで歌うクジラ、ヘイゼルの海の冒険。',
		close: '閉じる',
		pitch: `
			<p><b>From. Whale</b> は、戦わない海の冒険ゲームです。</p>
			<p>プレイヤーは、誰にも聞こえない52Hzで歌うクジラ、ヘイゼルになり、一通のボトルレターをたどって夜の海を泳ぎます。</p>
			<p>攻撃ボタンはありません。できるのは歌うことだけ。仲間に出会うたびに音楽に楽器がひとつずつ加わり、最後には、星が降る日に人間を終わらせようとするモビー・ディックを歌で説得します。</p>
			<p>インストール不要、ブラウザですぐに。PCでもスマホでも遊べます。한국어 · English · 日本語</p>
			<a class="play" href="game/">▶ PLAY</a>`,
		concept: `
			<h3>World</h3>
			<p>異世界の2066年、わずかな人間だけが生き残った海。海は誰も誰かを支配しないのが原則ですが、人間に友好的な宗派へと変わった「連合軍」が、怪しいヘルツを出すクジラを「浄化」しています。</p>
			<h3>52Hz</h3>
			<p>ほとんどのクジラは10〜25Hz、シロナガスクジラは30Hz台で歌います。52Hzで歌うヘイゼルの声は、ほかのクジラには歌として聞こえません。実際に観測された「世界でいちばん孤独なクジラ」の話から生まれた物語です。</p>
			<h3>Characters</h3>
			<ul>
				<li><b>ヘイゼル</b> 52Hzで歌うスナメリ。背中に刻まれた光の紋様のおかげで、人間には見えません。</li>
				<li><b>ルーク</b> 炎のようなイッカクの灯台守。ヘイゼルの代わりに手紙を読んでくれる通訳。</li>
				<li><b>フィン</b> 涙もろいシャチ。連合軍のシャーマンの訓練生だったが逃げ出した道案内。</li>
				<li><b>モビー・ディック</b> 星が降る日についての手紙を書いたマッコウクジラ。</li>
				<li><b>ステラ</b> 海藻の一本一本に道しるべを書いた、変わり者のシロナガスクジラ。もうひとつの52Hz。</li>
			</ul>
			<h3>Look and Sound</h3>
			<p>宇宙と海が出会う夜、光る海底と環のある惑星、レトロな青いUI。音楽は音源ファイルなしでブラウザが合成します。シャッフルのリズムに52Hzのハミングを重ね、仲間が増えるたびに楽器が増えていきます。</p>
			<blockquote>何かをしようと思った、その瞬間から<br>冒険は始まる</blockquote>`,
		bgm: `
			<p>夜の海でひとり弾くブルースピアノに、仲間に出会うたびに楽器がひとつずつ加わります。1950年代のR&amp;B「One Mint Julep」のゆったりしたシャッフルから生まれました。</p>
			<h3>No Audio Files</h3>
			<p>音源ファイルはひとつもありません。すべての音を、ブラウザのWeb Audioでその場で合成しています。メロディはブルーススケールの中で毎回新しく即興演奏するので、同じ曲がまったく同じに繰り返されることはありません。</p>
			<h3>Groove</h3>
			<ul>
				<li><b>テンポ</b> 92 BPMのシャッフル。1拍を3つに分けた、弾むようなリズムです。</li>
				<li><b>コード</b> Aマイナーの12小節ブルース。最後はF7 → E7でさみしげに戻ってきます。</li>
				<li><b>52Hz</b> ずっと流れているヘイゼルのハミング。スマホのスピーカーでも聞こえるよう、104&nbsp;·&nbsp;156&nbsp;·&nbsp;208Hzの倍音を混ぜています。</li>
			</ul>
			<h3>Layers</h3>
			<ul>
				<li><b>ヘイゼルひとり</b> エレピ + メロディ + 52Hz</li>
				<li><b>+ ルーク</b> ベースギター</li>
				<li><b>+ フィン</b> ブラシドラム</li>
				<li><b>モビー・ディック</b> 低く響く緊張の音と、毎拍鳴るキックドラム</li>
			</ul>
			<p>すべての楽器が同じ拍の上で動いているので、途中から加わってもリズムがずれません。そして誰かが去ると、その楽器も一緒に消えていきます。</p>
			<a class="play" href="game/">▶ PLAY</a>`,
		contact: 'お話ししたいことがあれば、いつでもご連絡ください。<br>バグ報告やご意見は、どんな方法でも大歓迎です。メールでもお気軽にどうぞ!',
		bugs: '✉ バグ報告やご意見は、どんな方法でも大歓迎です。',
		sound: '♪ サウンドをオンにすると、もっと楽しく遊べます',
		copy: 'アドレスをコピー',
		copied: 'コピーしました!',
		mailApp: 'メールアプリで送る'
	}
};

const KEY = 'fromwhale.lang';

function detect() {

	try {

		const saved = localStorage.getItem( KEY );
		if ( TEXT[ saved ] ) return saved;

	} catch ( e ) { /* 저장소 없음 */ }

	for ( const l of navigator.languages ?? [ navigator.language ] ) {

		const code = String( l ).slice( 0, 2 ).toLowerCase();
		if ( TEXT[ code ] ) return code;

	}

	return 'en';

}

function apply( code ) {

	const T = TEXT[ code ];
	document.documentElement.lang = code;
	document.querySelectorAll( '[data-t]' ).forEach( ( el ) => el.innerHTML = T[ el.dataset.t ] );
	document.querySelectorAll( '[data-t-aria]' ).forEach( ( el ) => el.setAttribute( 'aria-label', T[ el.dataset.tAria ] ) );
	document.querySelectorAll( '[data-lang]' ).forEach( ( el ) => el.classList.toggle( 'on', el.dataset.lang === code ) );

}

let current = detect();
apply( current );

document.querySelectorAll( '[data-lang]' ).forEach( ( btn ) => btn.addEventListener( 'click', () => {

	current = btn.dataset.lang;
	try {

		localStorage.setItem( KEY, current );

	} catch ( e ) { /* 저장 불가 */ }

	apply( current );

} ) );

// ABOUT / CONTACT 창. ABOUT 안에는 PITCH | CONCEPT | BGM 탭이 있다
const panels = [ ...document.querySelectorAll( '.panel' ) ];
const tabs = [ ...document.querySelectorAll( '[data-tab]' ) ];
const TAB_IDS = tabs.map( ( t ) => t.dataset.tab );

function selectTab( id, focusTab = false ) {

	for ( const t of tabs ) {

		const on = t.dataset.tab === id;
		t.setAttribute( 'aria-selected', on );
		t.tabIndex = on ? 0 : - 1;
		document.getElementById( t.dataset.tab ).hidden = ! on;
		if ( on && focusTab ) t.focus();

	}

	document.getElementById( id ).scrollTop = 0;

}

// id: 'pitch' | 'concept' | 'bgm' | 'contact'
function open( id, focus = true ) {

	const tab = TAB_IDS.includes( id ) ? id : null;
	const panelId = tab ? 'about' : id;
	for ( const p of panels ) p.hidden = p.id !== panelId;
	if ( tab ) selectTab( tab );
	const panel = document.getElementById( panelId );
	if ( ! panel || ! focus ) return;
	( tab ? panel.querySelector( `[data-tab="${tab}"]` ) : panel.querySelector( '.close' ) ).focus( { preventScroll: true } );

}

tabs.forEach( ( t ) => {

	t.addEventListener( 'click', () => {

		history.replaceState( null, '', '#' + t.dataset.tab );
		selectTab( t.dataset.tab );

	} );
	// ←/→ 로 탭 이동
	t.addEventListener( 'keydown', ( e ) => {

		if ( e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' ) return;
		e.preventDefault();
		const i = TAB_IDS.indexOf( t.dataset.tab );
		const next = TAB_IDS[ ( i + ( e.key === 'ArrowRight' ? 1 : TAB_IDS.length - 1 ) ) % TAB_IDS.length ];
		history.replaceState( null, '', '#' + next );
		selectTab( next, true );

	} );

} );

function closeAll() {

	for ( const p of panels ) p.hidden = true;
	if ( location.hash ) history.replaceState( null, '', location.pathname );

}

document.querySelectorAll( '[data-open]' ).forEach( ( a ) => a.addEventListener( 'click', ( e ) => {

	e.preventDefault();
	history.replaceState( null, '', '#' + a.dataset.open );
	open( a.dataset.open );

} ) );
document.querySelectorAll( '[data-close]' ).forEach( ( b ) => b.addEventListener( 'click', closeAll ) );
document.addEventListener( 'keydown', ( e ) => e.key === 'Escape' && closeAll() );

// 메일 주소 복사 (클립보드가 막혀 있으면 주소를 선택해 둔다)
const copyBtn = document.getElementById( 'copy-mail' );
copyBtn.addEventListener( 'click', async () => {

	const address = document.getElementById( 'mail-address' );
	let ok = false;
	try {

		await navigator.clipboard.writeText( address.textContent.trim() );
		ok = true;

	} catch ( e ) {

		const range = document.createRange();
		range.selectNodeContents( address );
		const sel = getSelection();
		sel.removeAllRanges();
		sel.addRange( range );
		ok = document.execCommand?.( 'copy' ) ?? false;

	}

	if ( ! ok ) return;
	copyBtn.textContent = TEXT[ current ].copied;
	copyBtn.classList.add( 'done' );
	setTimeout( () => {

		copyBtn.textContent = TEXT[ current ].copy;
		copyBtn.classList.remove( 'done' );

	}, 1600 );

} );

// 주소에 #pitch 처럼 붙어 오면 그 창을 연다
const fromHash = location.hash.slice( 1 );
if ( TAB_IDS.includes( fromHash ) || fromHash === 'contact' ) open( fromHash, false );
