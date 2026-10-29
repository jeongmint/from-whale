// English. {N} is the player's name.
export default {
	code: 'en',
	label: 'English',
	defaultName: 'Hazel',

	ui: {
		error: 'Something went wrong :(',
		retry: 'Reload',
		title: {
			tagline: 'Another world, the year 2066. A sea where only a few humans remain.<br>There was a whale who sang at 52Hz, a song no one could hear.',
			start: '▶ Begin the journey',
			duet: '♪ Duet with Stella',
			continue: 'Continue',
			continueAt: 'Continue · {ch}',
			quote: '“ Adventure begins<br>with the very thought of doing something ”'
		},
		hud: { hearts: 'Health', journal: 'Letters (L)', mute: 'Sound (M)', pause: 'Pause (Esc)', home: 'Back to home', boss: 'MOBY DICK · HEART', keys: { swim: 'Swim', boost: 'Boost', jump: 'Jump', sing: 'Sing' } },
		song: { title: '52HZ ↔ FINN', listen: 'Listen… the rhythm of Finn\'s sobs', turn: 'Now! Sing back the same rhythm [E]', miss: 'Not quite… listen again', help: 'Luke counts the beat for you', good: 'The sobbing eases a little', done: 'The crying stops' },
		duet: { title: 'DUET · 52HZ ♥ 52HZ', help: 'Sing [E] · Jump [Space]', ready: 'Stella counts you in…', perfect: 'PERFECT', excellent: 'EXCELLENT', good: 'GOOD', miss: 'MISS', combo: '{n} COMBO', rank: 'RANK {r}', sky: '★ The night sky is complete!' },
		feedback: { open: '✉ Send an idea or a bug', placeholder: 'Write any idea or bug you found', send: 'Send', sending: 'Sending…', thanks: 'Thank you! Got it.', fail: 'Couldn\'t send it right now. Please email it instead:', copy: 'Copy address', copied: 'Copied!', mailApp: 'Open mail app' },
		letter: { close: 'Close <span class="mono tiny">[E]</span>' },
		// MAP 2 · Under the sea
		map2: {
			label: 'MAP 2 · THE DEEP',
			obj: [ 'Find the wrecked submersible · Sunlight zone', 'Find the undersea lab · Twilight zone', 'Find the red terminal · Midnight zone', 'Find the whale bones · Midnight zone', 'Find the last record · The trench', 'Find the base door · The bottom' ],
			objBase: 'Sing the stop code at the base door',
			current: 'The current holds you back — find this layer\'s record first',
			stopTitle: 'STOP CODE · 52HZ ♥ 52HZ',
			logs: 'LOGS {n}/6',
			coelacanth: "Coelacanth — a 'living fossil', 400 million years old"
		},
		// MAP 2 preview: portal → under the sea
		dive: {
			label: 'MAP 2 · THE DEEP',
			objPortal: 'Swim into the glowing whirlpool',
			objSwim: 'Try swimming under the sea',
			card: [ 'MAP 2', 'Into the Deep', 'Preview · in development' ],
			hint: '[Space] up · [C] down · [E] sing to light the dark — MAP 2 is still in development from here',
			zones: [ 'Sunlight zone', 'Twilight zone', 'Midnight zone', 'The trench' ],
			zoneSub: [ 'Where the light shafts reach', 'The light fades — the glow on your back lights the way', 'Pitch dark — sing and the dark lights up like sonar', 'The end of a narrow canyon — something waits below' ]
		},
		// Sing the duet again (from the title or ending screen once you've met Stella)
		duetAgain: { thanks: 'Thanks for singing with me again!', more: '♪ One more song', title: 'Back to title' },
		// Duet scoreboard (name the song and leave it in the TOP 10)
		scores: {
			song: 'SONG',
			placeholder: 'Blues of the Falling Stars',
			save: 'Leave it in the sea',
			skip: 'Not this time',
			close: 'Continue',
			mine: '{who} · {r} · {s}/{max}',
			loading: 'Listening to the sea\'s records…',
			saving: 'Sending it out to sea…',
			saved: 'Left in the sea! #{p}',
			savedOut: 'Left in the sea! (not in the TOP 50 yet)',
			local: 'Can\'t reach the sea right now — records on this device',
			offline: 'Can\'t reach the sea right now — saved on this device only',
			test: 'Test mode — not sent to the sea',
			empty: 'No one has left a song yet',
			word: 'That name can\'t be left. Try another!',
			slow: 'Please try again in a moment'
		},
		journal: {
			title: 'MAILBOX — Bottle letters',
			close: 'Close <span class="mono tiny">[L]</span>',
			empty: '· · · a letter not yet found · · ·',
			mobyHead: 'LETTER #00 — Moby\'s letter'
		},
		pause: {
			helpTouch: '<div><kbd>Stick</kbd> Swim — push further to go faster</div><div><kbd>»</kbd> Hold to go fast (stamina)</div><div><kbd>⤴</kbd> Jump — nothing can hit you in the air</div><div><kbd>♪</kbd> Sing at 52Hz · talk · sonar · next line</div><div><kbd>Drag</kbd> Look around &nbsp; <kbd>✉</kbd> Letters</div>',
			helpKeys: '<div><kbd>W A S D</kbd> / <kbd>Arrows</kbd> Swim relative to the screen (A·D sideways)</div><div><kbd>Shift</kbd> Go fast (stamina)</div><div><kbd>Space</kbd> Jump — nothing can hit you in the air</div><div><kbd>E</kbd> Sing at 52Hz · talk · sonar</div><div><kbd>L</kbd> Letters &nbsp; <kbd>M</kbd> Sound &nbsp; <kbd>Drag</kbd> Look around</div>',
			resume: 'Resume',
			restart: 'Start over'
		},
		lab: {
			title: 'LAB',
			tilt: 'Tilt to steer',
			on: 'ON',
			off: 'OFF',
			note: 'In landscape, tilt the phone instead of using the stick. Tip it forward to swim, back to reverse, left or right to turn. However you hold it when you switch this on or press Resume counts as neutral.',
			denied: 'Can\'t read the tilt sensor. Check that motion access is allowed.'
		},
		ending: {
			search: 'Find the rest of the letters · {n}/{total}',
			again: 'Play again',
			deepHint: 'MAP 2 is still being built — the controls and the story will keep getting better',
			dive: '▼ Into the deep (MAP 2 preview)',
			allEndings: '★ All 6 endings found — the sea now glitters gold',
			duet: '♪ Sing the duet again',
			quote: '“ The sea holds a freedom<br>that everyone deserves ”',
			sub: 'You met another 52Hz',
			hint: 'Find every bottle… and you might meet another 52Hz',
			retry: 'Retry this chapter',
			heartHint: 'Press Continue to swim this chapter again from the start'
		},
		endings: {
			light: { name: 'The Light That Never Fades', hint: 'Get hit by the Alliance twice, but never fall before Moby Dick' },
			friends: { name: 'The Strength of Friends', hint: 'Never get hit by the Alliance twice, and never fall before Moby Dick' },
			compass: { name: 'The Broken Compass', hint: 'Keep Luke safe, then fall before Moby Dick' },
			sacrifice: { name: 'Sacrifice', hint: 'If both Luke and Finn take the blow for {N}' },
			late: { name: 'The Late Whale', hint: 'If you gather every letter in a bottle before meeting Moby Dick' },
			heart: { name: 'A Whale\'s Stopped Heart', hint: 'If you fall twice in one chapter…' },
			deep: { name: 'A Song Heard', hint: 'If you sing the stop code at the very bottom of the sea' },
			stella: 'Another 52Hz'
		},
		toast: {
			spotted: '! The Alliance spotted you — Shift to flee, Space to jump!',
			spottedLight: '! The Alliance spotted you — grab a shard of light and flee!',
			dash: 'Luke\'s light — a burst of speed!',
			faint: '{N} is exhausted and sinks…',
			again: 'Let\'s sing again',
			recharge: 'The kelp answered your song — hearts full!',
			kelpHeal: 'Health and stamina restored · checkpoint saved',
			unreadBottle: 'Found a letter you can\'t read ({n}/{total})',
			tapAudio: '♪ Tap the screen once to bring the music back',
			rotate: 'Turn your phone sideways to see more of the sea',
			fog: 'Beyond here there is only fog…',
			compassWeak: 'The compass is fading… sing beside some kelp',
			compassOff: 'The compass went dark — sing beside kelp to bring it back',
			compassOn: 'The kelp set the broken compass right again',
			lukeWarn: 'Luke: ...Get hit once more, and I\'m ramming in.',
			lastHeart: 'Your heart is weak — fall once more in this chapter and it stops',
			tiltTip: 'In landscape you can also swim by tilting the phone — Pause ❚❚ → LAB'
		},
		banner: {
			objective: 'NEW OBJECTIVE',
			companion: 'NEW COMPANION',
			ability: 'ABILITY · {text}',
			joinLuke: 'Luke joined your pod!',
			joinFinn: 'Finn joined your pod!',
			allLetters: [ 'ALL LETTERS', 'You found every bottle letter', 'Somewhere in the sea, someone is smiling' ],
			mobyDone: [ 'MOBY DICK', 'Your song reached Moby Dick', 'The stars fall quietly now' ]
		},
		prompt: {
			kelp: '<kbd>E</kbd> Sing to the kelp at 52Hz',
			moby: '<kbd>E</kbd> Sing to Moby Dick',
			recharge: '<kbd>E</kbd> Sing beside the kelp — refill hearts',
			compass: '<kbd>E</kbd> Sing beside the kelp — fix the compass',
			jump: '<kbd>Space</kbd> Jump now!',
			tears: '<kbd>E</kbd> Finn\'s tears — rain away the dizziness'
		},
		kelpReader: { luke: 'Kelp · read by Luke', finn: 'Kelp · read by Finn', none: 'Kelp' },
		bottleReact: { luke: 'Hmph. Nothing special. ...Go find the next one.', finn: '...Every one of these was somebody\'s song.' },
		boss: {
			objective: 'Let your 52Hz song reach Moby Dick\'s heart',
			hintListen: '♪ Now! Get inside the blue ring and press [E]',
			hintCharge: '! Moby Dick is charging — dodge or jump',
			hintRage: 'Dodge the falling stars'
		},
		touchKeys: [ [ 'W A S D / arrow keys', 'the left stick' ] ],
		spectrum: { label: 'Frequencies of whale song', whales: 'Whales', blue: 'Blue whale', blueRange: '30s Hz' }
	},

	speakers: {
		narrator: '',
		hazel: '{N} · 52Hz',
		luke: 'Luke · Lighthouse keeper',
		finn: 'Finn · The compass',
		moby: 'Moby Dick',
		shaman: 'Alliance Leader · Shaman',
		stella: 'Stella',
		orca: 'Alliance orca',
		kelp: 'Written on the kelp',
		ai: 'The Doctor\'s AI',
	},

	mobyLetter: {
		head: 'LETTER #00 — Message in a bottle',
		body: 'On the day the stars fall,\nanything is possible.\n\nOn that day, I will do what I could not do long ago.',
		from: '— From the deep sea, M.'
	},

	letters: [
		{ id: 1, head: 'LETTER #01', body: 'Since the humans dwindled, the sea has gone quiet.\nSo quiet that now we fight among ourselves.', from: '— A nameless dolphin' },
		{ id: 2, head: 'LETTER #02', body: 'The sea has no rulers. That is its first law.\nNo one governs anyone.\nSo why does the Alliance keep talking about “order”?', from: '— A humpback whale' },
		{ id: 3, head: 'LETTER #03', body: 'The Alliance Shaman says strange hertz make the sea sick.\nIs that really true?\nMy song is a little strange, too.', from: '— K, Alliance trainee' },
		{ id: 4, head: 'LETTER #04', body: 'In the years the whaling grew worst, a white sperm whale wrecked the ships.\nPeople named that whale Moby Dick.\nAfter that, the balance of the sea was never the same.', from: '— A scrap of an old ship\'s log' },
		{ id: 5, head: 'LETTER #05', body: 'With a pattern of light on your back, humans can\'t see you.\nThe trade-off: other whales\' songs sound a little farther away.\nBut I keep mine for a very good reason!', from: '— S' },
		{ id: 6, head: 'LETTER #06', body: 'A lighthouse keeps its light on for the sea,\neven when no one says thank you.\n\nAll clear tonight.', from: '— Lighthouse log, L' }
	],

	kelps: {
		kelp1: {
			text: 'Lost? Congratulations!\nThe real adventure starts now.\nHead toward the sunrise →',
			after: [ [ 'luke', '...Who goes around writing on the sea? Gives me a headache.' ], [ 'luke', 'Still, the direction\'s right. East it is.' ], [ 'luke', 'Oh, and singing near kelp heals you up. If you get hurt, swing by any kelp.' ] ]
		},
		kelp2: {
			text: 'If you meet a crying orca, don\'t be scared.\nWhales who cry a lot are usually kind ✶',
			after: [ [ 'luke', 'An orca? You\'re kidding. Orcas mean the Alliance.' ] ]
		},
		kelp3: {
			text: 'If the water here tastes a little salty,\nit\'s not your imagination.',
			after: [ [ 'luke', '......Shh. Hear that?' ], [ 'narrator', 'Somewhere to the north, someone is sniffling.' ] ]
		},
		kelp4: {
			text: 'Alliance patrols always swim clockwise!\nGo the other way and you can slip right behind them.',
			after: [ [ 'finn', '...That\'s right. It\'s a secret even inside the Alliance.' ], [ 'finn', 'Who on earth wrote this?' ] ]
		},
		kelp5: {
			text: 'They say anything is possible on the day the stars fall.\nEven just saying hello.',
			after: [ [ 'finn', 'S... I feel like I\'ve seen this handwriting before.' ] ]
		}
	},

	mobyResonance: [
		'...Why do you look at me like that?',
		'Why keep singing a song that no one can hear?',
		'My mother... sang a song like that, too.',
		'Even if I end every human, she will not come back. Will she.',
		'That night, the last song my mother sang... sounded like this.',
		'......Enough. I hear you now.'
	],

	story: {
		prologue: {
			card: [ 'PROLOGUE', '52Hz', 'A song no one can hear' ],
			intro: [
				[ 'narrator', 'Another world, the year 2066.\nThe sea is home to a few humans, and far more whales.' ],
				[ 'narrator', 'Whales talk in song.\nMost sing low, at 10 to 25 hertz. Blue whales sing a little higher, in the 30s.' ],
				[ 'narrator', 'Low songs travel hundreds of kilometers to other whales.\nThey find mates, hold pods together, and say: I am here.' ],
				[ 'narrator', '{N}\'s song is 52 hertz.\nSo high, and so alone, that other whales don\'t hear it as a song at all.' ],
				[ 'narrator', 'Long ago, when human hydrophones first caught a sound like this,\npeople called its singer “the loneliest whale in the world.”' ],
				[ 'narrator', '{N} is a finless porpoise who sings at 52 hertz.\nNo whale has ever answered.' ],
				[ 'narrator', 'A pattern of light etched on {N}\'s back keeps humans from seeing {N}.\n...Maybe other whales can\'t see {N} either.' ]
			],
			objSwim: 'Swim around a little  —  W A S D / arrow keys',
			objSing: 'Sing at 52Hz  —  [E]',
			noAnswer: [
				[ 'narrator', '. . . . . .' ],
				[ 'narrator', 'As always, no one answers.' ]
			],
			objBottle: 'Pick up the bottle glinting between the waves',
			afterLetter: [
				[ 'narrator', 'The letters, written in hertz, just hum.\n{N} can barely hear, and cannot read a letter like this.' ],
				[ 'hazel', '( ...If only someone could read it to me. )' ],
				[ 'narrator', 'Far to the north, a lighthouse beam turns.\nThey say a lighthouse keeper hears every frequency in the sea.' ]
			]
		},

		ch1: {
			card: [ 'CHAPTER 01', 'The Lighthouse Keeper', 'Luke, the fiery narwhal' ],
			objLighthouse: 'Find the lighthouse to the north',
			meet: [
				[ 'luke', 'Hey! You there, shrimp! Quit blocking my lighthouse beam!' ],
				[ 'luke', '...Huh. That pattern on your back. That\'s the thing that hides you from humans.' ],
				[ 'hazel', '( holds out the bottle )  ∿∿ ≋ ∿' ],
				[ 'luke', '...52 hertz? Ha. Now I\'ve heard every weird frequency there is.' ],
				[ 'luke', 'But I can hear it. I\'m a lighthouse keeper, after all.' ],
				[ 'luke', 'Give it here. I\'ll read it. Just this once.' ]
			],
			afterLetter: [
				[ 'hazel', '...Anything?\nThen maybe I could talk with other whales, too.' ],
				[ 'luke', 'The day the stars fall... that\'s not far off.' ],
				[ 'luke', 'Don\'t tell me you\'re going to find whoever wrote this.' ],
				[ 'hazel', '( nods )' ],
				[ 'luke', 'Ugh. Send you alone and the Alliance eats you in three days. Guaranteed.' ],
				[ 'luke', 'Fine, I\'m coming. Don\'t get the wrong idea. The lighthouse is just boring.' ]
			],
			ability: 'Interpreter — reads bottle letters and kelp for you',
			readAll: [ [ 'luke', 'Hand over the other letters you picked up. I\'ll read them all at once.' ] ],
			journalHint: 'You can reread them in your letters  [L]',
			next: [
				[ 'luke', 'See that kelp glowing down there?\nSomeone wrote directions on every stalk. Let\'s follow it.' ],
				[ 'luke', 'Oh, and grab any other bottles you see. I\'ll read them all.' ]
			]
		},

		ch2: {
			card: [ 'CHAPTER 02', 'The Compass', 'Finn, the orca who cries easily' ],
			objKelp: 'Sing in front of the glowing kelp  [E]',
			objFinn: 'Follow the sound of sniffling',
			meet: [
				[ 'finn', '...Don\'t come closer. I probably still smell like the Alliance.' ],
				[ 'luke', 'An orca?! {N}, get back!' ],
				[ 'finn', 'Calm down, narwhal. I ran away.\nI was training under the Alliance Shaman... I couldn\'t do it anymore.' ],
				[ 'finn', 'And you. You\'re the 52 hertz, aren\'t you?\nThe Alliance is hunting you. Any whale with a suspicious hertz gets “purified.”' ],
				[ 'hazel', '( shows the bottle )' ],
				[ 'finn', '......This handwriting.' ],
				[ 'finn', 'It\'s Moby Dick\'s. On the day the stars fall, Moby Dick swore to finish the humans.' ],
				[ 'luke', 'Hey. Are you crying right now?' ],
				[ 'finn', '...I cry easily. Don\'t mind it.\n*sniff*... *sob*...' ],
				[ 'luke', '...It\'s not stopping. {N}, hear the rhythm of those sobs?\nSing it right back, beat for beat. That\'s how whales comfort each other.' ]
			],
			calm: [
				[ 'finn', '......' ],
				[ 'finn', 'That\'s strange. They say nobody can hear 52 hertz.\n...But I heard you.' ],
				[ 'finn', 'I know the way. The currents, and the Alliance patrol routes.\n...I need to see Moby Dick one more time, too.' ],
				[ 'luke', 'Travel with a crybaby orca? ...Well, we do need a guide.' ]
			],
			ability: 'Foresight — shows how far Alliance patrols can see · boost lasts longer'
		},

		ch3: {
			card: [ 'CHAPTER 03', 'The Alliance', 'Those who speak of order in the sea' ],
			intro: [
				[ 'finn', 'From here on, these are Alliance waters.\nIf you enter a red circle, they\'ll spot you.' ],
				[ 'finn', 'And don\'t sing. A suspicious hertz carries a long way.' ],
				[ 'luke', 'And if they spot us? We just ram them.' ],
				[ 'finn', '...That\'s why narwhals don\'t live very long.' ],
				[ 'luke', 'Hmph. If you two don\'t get hit, I won\'t have to ram anyone.' ],
				[ 'narrator', 'Touching the Alliance costs health.\nWhile jumping with [Space], nothing can hit you.' ]
			],
			objKelp4: 'Find the kelp while avoiding the Alliance',
			objSouth: 'Cross the Alliance waters to the south',
			shaman: [
				[ 'shaman', 'Found you, 52 hertz.\nThe noise that disturbs the order of the sea.' ],
				[ 'shaman', 'And... Finn, the traitor. The child who never finished training.' ],
				[ 'finn', '......' ],
				[ 'finn', 'We have to run. Now.' ],
				[ 'shaman', 'Purify them.' ]
			],
			lukeCry: [ [ 'luke', '{N}!!' ] ],
			// After the ambush, hit before reaching Moby Dick (comes before lukeLast)
			lukeLate: [ [ 'luke', '...I told you not to get hit.\nWell, ramming things was always my job.' ] ],
			lukeLast: [
				[ 'luke', '...Thinking comes later.\nIt always did.' ],
				[ 'luke', 'Go. Finn, take {N} and go!' ],
				[ 'luke', 'The lighthouse light... don\'t let it go out.' ]
			],
			bannerLuke: [ 'LUKE', 'Luke protected {N}', 'The lighthouse light went out' ],
			lightScatter: [
				[ 'narrator', 'Where Luke sank, shards of light,\nlike a lighthouse beam, scattered and rose to the surface.' ],
				[ 'finn', '......It\'s Luke\'s light.' ],
				[ 'finn', 'Eat one and you\'ll be fast, like Luke.\nThink later. Run first.' ]
			],
			bannerAbility: [ 'NEW ABILITY', 'Luke\'s Light', 'Eat a shard of light floating on the sea for a burst of speed · nothing can hit you while it lasts' ],
			go: [ [ 'finn', 'Let\'s go. Luke made this path for us. Don\'t look back.' ] ],
			objEscape: 'Run! Follow Luke\'s light to the southern current',
			toastStop: 'The Alliance gave up the chase',
			afterEscape: [
				[ 'narrator', 'The lighthouse light has gone out.\nNo one is left to read the letters.' ],
				[ 'finn', '...I won\'t be as good as Luke.\nBut from now on, I\'ll read them for you.' ]
			],
			objKelp5: 'Sing in front of the kelp  [E]',
			lukeJump: [ [ 'luke', '{N}! JUMP!!' ] ],
			lukeSaved: [
				[ 'narrator', '{N} and Luke leapt out of the sea at the same moment.\nThe charging Alliance crashed into each other right in the middle.' ],
				[ 'luke', '...Ha! See that? Thinking comes later.' ],
				[ 'finn', 'You\'re both okay...? Thank goodness... *sniff*' ],
				[ 'luke', 'No time to cry! I\'ll keep my horn lit. Stay close!' ]
			],
			bannerSaved: [ 'LUKE', '{N} and Luke leapt together', 'The lighthouse light is still on' ],
			objEscapeSaved: 'Run! Follow Luke to the southern current',
			afterEscapeSaved: [
				[ 'luke', 'Phew... we made it. Pretty fast for a crybaby, Finn.' ],
				[ 'finn', '...And you\'re still alive, for a narwhal.' ],
				[ 'luke', 'Ha! And I plan to stay that way.' ]
			]
		},

		ch4: {
			card: [ 'CHAPTER 04', 'The Day the Stars Fall', 'The sea holds freedom' ],
			objMoby: 'Head for the southern sea where the stars are falling',
			moby: [
				[ 'moby', '...Who are you. On this night, in this sea.' ],
				[ 'finn', 'Moby Dick... It\'s me. Finn.' ],
				[ 'moby', 'A child of the Alliance, come at last.\nTonight is the day the stars fall. Tonight I end the humans.' ],
				[ 'hazel', '( holds out the bottle )  This letter... you wrote it, didn\'t you?' ],
				[ 'moby', 'That sound... 52 hertz.\n...I hear it. Your song.' ],
				[ 'moby', 'Yes. I wrote it. Long ago, on a night when the stars were falling.' ],
				[ 'moby', 'They were not stars.\nThey were flares fired from human ships, pouring down like hail.' ],
				[ 'moby', 'My mother pushed me away and said,\n“On the day the stars fall, you can do anything. So run.”' ],
				[ 'moby', 'She never came back.\n...This time, it is my turn to do anything.' ],
				[ 'finn', '{N}, Moby Dick isn\'t listening to anyone right now.\nBut your song... might be different.' ]
			],
			// When every letter is gathered before meeting Moby Dick: replaces the first moby line
			lateMoby: [
				[ 'moby', '...So you finally show up. Half the stars have fallen already.' ],
				[ 'moby', 'I hear you swam the whole sea. Picking up every bottle along the way.' ],
				[ 'hazel', '( quietly hides five bottles behind a flipper )' ]
			],
			lukeLantern: [
				[ 'luke', '{N}, I\'ll keep my light on Moby Dick until your song gets through.' ],
				[ 'luke', 'Once Moby Dick listens, your song will carry as far as my light reaches.' ]
			],
			bannerLantern: [ 'ABILITY', 'Luke\'s Lantern', 'When Moby Dick listens, the blue circle your song reaches gets wider' ],
			finnLast: [
				[ 'finn', '......Not crying this time.' ],
				[ 'finn', '{N}. You know the way now.\nIf you don\'t... ask the kelp.' ],
				[ 'finn', '...Thank you for the song.' ]
			],
			bannerFinn: [ 'FINN', 'Finn protected {N}', 'The compass broke' ],
			compass: [
				[ 'narrator', 'Where Finn sank, pieces of a broken compass glittered.' ],
				[ 'narrator', 'From now on, the guidance slowly fades.\nSing beside some kelp to set it right again.' ]
			],
			// Ability after Finn leaves: sing while dizzy (stunned) and rain clears it at once
			tears: [
				[ 'narrator', 'Then a violet rain began to fall over the sea.' ],
				[ 'narrator', 'Finn\'s tears, after promising not to cry.\nSing when you\'re dizzy, and the rain will fall again.' ]
			],
			bannerTears: [ 'NEW ABILITY', 'Finn\'s Tears', 'Sing while stars spin over your head and the rain snaps you out of it' ]
		},

		// MAP 2 · Under the sea. The third slot of a line is its condition (see map2 in story.js)
		map2: {
			intro: [
				[ 'narrator', 'Down past where the light could reach, the sea was far deeper than it looked.' ],
				[ 'luke', 'Down there... things humans made have sunk. Metal, glass, writing.', 'luke' ],
				[ 'luke', 'Writing\'s my department. Let\'s go down, {N}.', 'luke' ],
				[ 'finn', 'I think... I\'ve been here before.\nI don\'t remember, but the water tastes familiar.', 'finn' ],
				[ 'hazel', '( sings a short 52Hz note and tilts downward )', 'none' ]
			],
			logs: [
				{ head: 'Research sub ALLY-3 · Logbook', body: 'March 2041. Subjects 7 through 12 delivered to the trench base.\nThe Doctor calls them "the Alliance."\nAn army to protect the whales, he says. I wonder.', short: '… ALLY-3 … 2041 … 7 → 12 …\n( six drawings of orcas and an arrow pointing down )', from: '— from the wrecked sub' },
				{ head: 'Undersea Lab 1 · Research notes', body: 'Alliance project, year three. AI chips implanted in the orcas\' heads.\nThe Doctor says that if war comes, humans will need an army in the sea.\nI just wish these kids could live as whales.', short: '… AI … chip …\n( a small square over an orca\'s head; a human and an orca side by side )', from: '— Grad student J' },
				{ head: 'Alliance core commands · Terminal screen', body: '1. Whales are friendly to humans.\n2. Whales do not kill humans.\n3. Whales that are not friendly to humans are killed.', short: '1. whale ♡ human\n2. whale ✕ human\n3. whale ✕ whale', from: '— a terminal blinking red' },
				{ head: 'Alliance patrol record · Purification', body: 'Targets: 41 individuals not friendly to humans. Purified.\nWitness: 1 white sperm whale. Escaped, shielded by its mother.\nEnd of record.', short: '( forty-one whale drawings, crossed out.\nAt the very end, one white whale, not crossed out )', from: '— a recorder buried among whale bones' },
				{ head: 'Grad student J · Last record', body: 'The Doctor won\'t stop. So I built a stop device.\nThe signal that stops the Alliance is a rhythm centered on 52Hz. No whale makes that sound, so it can never trigger by accident.\nI hung the device on the gentlest one, Crybaby No. 7. May that child get away.', short: '( a little crying orca; a round device on its neck.\nNext to it, a big number 52 )', from: '— Grad student J' },
				{ head: 'Base door · The Doctor\'s memo', body: '52Hz individuals are designated top-priority purification targets.\nStated reason: uninterpretable signal.\nActual reason: not recorded.', short: '( the number 52 above the door, with a large ✕ )', from: '— The Doctor' }
			],
			react: [
				[
					[ 'narrator', 'The Alliance was something humans made.' ],
					[ 'luke', '"An army to protect the whales"... Nothing like the Alliance we know.', 'luke' ],
					[ 'finn', 'Subject... No. 7...', 'finn' ]
				],
				[
					[ 'luke', 'This J was on the whales\' side, I think. Let\'s read it all.', 'luke' ],
					[ 'narrator', 'The writing was unreadable, but the drawings were clear.', 'lukeGone' ]
				],
				[
					[ 'narrator', 'The third command blinked red.' ],
					[ 'luke', 'Built to protect humans... and it ended up with whales killing whales.', 'luke' ],
					[ 'finn', '...I\'ve heard this. It\'s the sound that kept ringing in my head.', 'finn' ]
				],
				[
					[ 'narrator', 'Among the whale bones, an old song still drifted.' ],
					[ 'moby', '...My mother pushed me away and said, "Run."' ],
					[ 'narrator', 'On the night the stars fell, this is what Moby Dick saw.' ]
				],
				[
					[ 'finn', '......Crybaby No. 7.', 'finn' ],
					[ 'finn', 'This... it\'s on my neck. I thought it was a compass.', 'finn' ],
					[ 'finn', 'So that\'s why. That\'s how someone from the Alliance could follow you.', 'finn' ],
					[ 'narrator', '{N} remembered the broken compass Finn left behind.', 'finnGone' ],
					[ 'narrator', 'It was never a compass. It was the stop device Finn had guarded to the end.', 'finnGone' ]
				],
				[
					[ 'luke', '"Uninterpretable"... No. He understood it too well, so he tried to erase it.', 'luke' ],
					[ 'hazel', '( sings at 52Hz. From behind the door, something answers )' ]
				]
			],
			base: [
				[ 'ai', 'Approaching individual detected. Frequency 52Hz. Purification priority one.' ],
				[ 'ai', 'Warning. This door will not open. Warning. Warning.' ],
				[ 'stella', '52Hz! I can hear everything from up here!\nI\'ll sing with you. You remember our rhythm, right?' ],
				[ 'finn', 'My device will catch your song. This time... I won\'t cry.', 'finn' ],
				[ 'narrator', 'The broken compass began to tremble faintly.', 'finnGone' ],
				[ 'luke', 'Thinking comes later. Sing, {N}!', 'luke' ]
			],
			stop: [
				[ 'ai', 'Stop code confirmed. ...All Alliance units, commands released.' ],
				[ 'narrator', 'All across the sea, the Alliance\'s red eyes went dark, one by one.' ],
				[ 'narrator', 'Behind the base windows, a small light came on. Humans.' ],
				[ 'narrator', 'A child holding a hydrophone pressed a hand to the glass and said something.' ],
				[ 'luke', '...Want me to translate? "I can hear the whale\'s song."', 'luke' ],
				[ 'narrator', '{N} couldn\'t hear it, but knew all the same.', 'lukeGone' ],
				[ 'narrator', 'For the first time, someone who was not a whale heard 52Hz.' ]
			],
			card: [ 'MAP 2 ENDING', 'A Song Heard', 'For the first time, someone else heard' ]
		},
		epilogue: {
			card: [ 'EPILOGUE', 'Looking for Stella' ],
			start: {
				finn: [ [ 'finn', 'Stella... the whale Moby Dick told us about.\nIf we gather all the scattered letters, maybe we\'ll find the way.' ] ],
				luke: [ [ 'luke', 'Stella... some odd old blue whale who doodles on kelp?\nGather every scattered letter and we\'ll track that whale down. Let\'s go.' ] ],
				none: [ [ 'narrator', 'Stella. The other 52Hz Moby Dick spoke of.\nGather every scattered letter, and the way might appear.' ] ]
			},
			objective: 'Find the rest of the letters in bottles',
			hint: '♪ Sing 52Hz with [E] and nearby bottles show up on the sonar'
		},
		heart: {
			lines: [
				[ 'narrator', '{N}\'s heartbeat slows, and slows.' ],
				[ 'narrator', 'Thump…      thump……' ],
				[ 'narrator', 'The 52Hz song no one ever heard\nsank into the deep.' ]
			],
			card: [ 'ENDING', 'A Whale\'s Stopped Heart', 'Again, from the start of this chapter' ]
		},
		ending: {
			lines: [
				[ 'moby', '52 hertz.\nYou said you wanted to talk with other whales.' ],
				[ 'moby', 'And just now, you talked with me.' ],
				[ 'moby', 'The sea holds a freedom\nthat everyone deserves.' ],
				[ 'moby', 'The humans, the Alliance, you.\n...And me.' ],
				[ 'moby', 'Somewhere in this sea, there is a whale who sings at your frequency.' ],
				[ 'moby', 'Stella. A very old blue whale.\nAn odd one, who wrote directions on every stalk of kelp.' ]
			],
			routes: {
				light: [
					[ 'finn', '......I wish Luke could have heard this.' ],
					[ 'narrator', 'Far to the north, the dark lighthouse blinked, just once.' ],
					[ 'narrator', 'On the night the stars fell,\n{N} talked with someone for the very first time.' ]
				],
				friends: [
					[ 'luke', '...Huh? That\'s it? Easier than I thought.' ],
					[ 'finn', '*sniff*... I\'m so glad... so, so glad...' ],
					[ 'luke', 'Crying again. ...Hey, {N}. When we get back to the lighthouse, sing me another one.' ],
					[ 'narrator', 'On the night the stars fell,\n{N} sang with friends for the very first time.' ]
				],
				compass: [
					[ 'luke', '...That crybaby. Didn\'t cry at the end.' ],
					[ 'luke', 'We\'ll have to find our own way now. The way Finn taught us.' ],
					[ 'narrator', 'The broken compass no longer points anywhere.\nStill, {N} knew where to go.' ]
				],
				sacrifice: [
					[ 'moby', '...Two of them sank into the sea to protect you.' ],
					[ 'hazel', '( sings at 52Hz instead of answering )' ],
					[ 'narrator', 'On the night the stars fell,\n{N} talked with someone for the very first time,\nand left two friends behind in the sea.' ]
				],
				late: [
					[ 'moby', '...That one is always late. Just like you.' ],
					[ 'narrator', 'On the night the stars fell,\n{N} arrived a little late,\nbut having read every last letter in the sea.' ]
				]
			},
			cards: {
				light: [ 'ENDING', 'The Light That Never Fades', 'Luke\'s light still floats on the sea' ],
				friends: [ 'ENDING', 'The Strength of Friends', 'A song for three' ],
				compass: [ 'ENDING', 'The Broken Compass', 'Now we find our own way' ],
				sacrifice: [ 'ENDING', 'Sacrifice', 'A 52Hz left alone' ],
				late: [ 'ENDING', 'The Late Whale', 'Late, but every letter read' ]
			},
			subCard: [ 'SUB ENDING', 'Stella', 'Another 52Hz' ],
			// Comes before stella in the Late Whale ending
			stellaLate: [
				[ 'stella', 'Huff, huff... Sorry, sorry, I\'m late! I just got here too!' ],
				[ 'moby', '...Of course.' ]
			],
			stella: [
				[ 'stella', 'Hi, hi! We finally meet, 52 hertz!\nDid you like my kelp letters? I wrote every single one!' ],
				[ 'stella', 'Want me to teach you how to wipe off the pattern on your back? Or a new language?\n...Nope, nope, there\'s something way more important.' ],
				[ 'stella', 'It\'s not that no one can hear your song.\nIt\'s that no one has heard it yet. Totally different!' ],
				[ 'stella', 'So right now, let\'s sing together!\nTwo 52-hertz voices and the whole sea will hear us. Don\'t miss the beat!' ]
			],
			duetEnd: {
				S: [ [ 'stella', '...Wow. The whole sea just went quiet.\nI think everyone was listening to us!' ] ],
				A: [ [ 'stella', 'Yes, yes! That was amazing for a first try!' ] ],
				B: [ [ 'stella', 'Hehe, the beat was all over the place,\nbut that was the most fun song I\'ve ever heard!' ] ]
			},
			// MAP 2 preview: the portal that opens after the duet
			portal: [ [ 'stella', '...Huh? Something down there is answering my song.\n52Hz, want to go down and see?' ] ],
			portalNone: [ [ 'narrator', 'Beneath the surface, light swirled as if answering 52Hz.' ] ],
			// Sing the duet again
			again: [ [ 'stella', 'You came back, 52Hz!\nAlright, one more song! Let\'s make the whole sea go quiet this time!' ] ],
			againBye: [ [ 'stella', 'Come back anytime! I\'ll always be singing right here.' ] ],
			nameSong: [ [ 'stella', 'Hey, give that song a name!\nI\'ll leave it in the sea so other whales can hear it too!' ] ],
			outro: [
				[ 'stella', 'So use that 52 hertz to do something only you can do.\nLike answering the whales who sing alone!' ],
				[ 'stella', 'There. That\'s your next adventure. Exciting, right?!' ]
			]
		}
	}
};
