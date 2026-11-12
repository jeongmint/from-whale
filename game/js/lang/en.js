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
			dawn: '▲ MAP 3 · Toward the dawn',
			continue: 'Continue',
			continueAt: 'Continue · {ch}',
			quote: '“ Adventure begins<br>with the very thought of doing something ”'
		},
		hud: { hearts: 'Health', journal: 'Letters (L)', mute: 'Sound (M)', pause: 'Pause (Esc)', home: 'Back to home', boss: 'MOBY DICK · HEART', keys: { swim: 'Swim', boost: 'Boost', jump: 'Jump', sing: 'Sing', up: 'Up', down: 'Down' } },
		song: { title: '52HZ ↔ FINN', listen: 'Listen… the rhythm of Finn\'s sobs', turn: 'Now! Sing back the same rhythm [E]', miss: 'Not quite… listen again', help: 'Luke counts the beat for you', good: 'The sobbing eases a little', done: 'The crying stops' },
		duet: { title: 'DUET · 52HZ ♥ 52HZ', help: 'Sing [E] · Jump [Space]', ready: 'Stella counts you in…', perfect: 'PERFECT', excellent: 'EXCELLENT', good: 'GOOD', miss: 'MISS', combo: '{n} COMBO', rank: 'RANK {r}', sky: '★ The night sky is complete!' },
		feedback: { open: '✉ Send an idea or a bug', placeholder: 'Write any idea or bug you found', send: 'Send', sending: 'Sending…', thanks: 'Thank you! Got it.', fail: 'Couldn\'t send it right now. Please email it instead:', copy: 'Copy address', copied: 'Copied!', mailApp: 'Open mail app' },
		letter: { close: 'Close <span class="mono tiny">[E]</span>' },
		// MAP 2 · Under the sea
		map2: {
			label: 'MAP 2 · A SEA BORN WITHOUT WAVES',
			obj: [ 'Find the wrecked submersible · Sunlight zone', 'Find the undersea lab · Twilight zone', 'Find the red terminal · Midnight zone', 'Find the whale bones · Midnight zone', 'Find the last record · The trench', 'Find the base door · The bottom' ],
			objBase: 'Sing the stop code at the base door',
			current: 'The current blocks the base — find more records',
			objFind: 'Find the research logs · {n}/5 · in any order',
			stopTitle: 'STOP CODE · 52HZ ♥ 52HZ',
			logs: 'LOGS {n}/6',
			coelacanth: 'Coelacanth — a \'living fossil\', 400 million years old',
			eel: 'Morays hide in the cracks — sing to make them glow red',
			faint: '{N} blacked out from a moray bite — woke up by the last log',
			guardSpot: '! Alliance guards — they won\'t follow you to the walls (moray holes)',
			guardHear: '52Hz rang out — the guards are coming!',
			jelly: 'The jellyfish\'s light wraps the wound — heart restored',
			guardStun: 'A perfect 52Hz — nearby guards freeze for a moment'
		},
		// MAP 3 · A Song That Calls the Dawn
		map3: {
			label: 'MAP 3 · A Song That Calls the Dawn',
			card: [ 'MAP 3', 'A Song That Calls the Dawn', 'Song of Liberation' ],
			objFrozen: 'Follow the broken song · The Frozen Lane',
			iceHint: 'Take the narrow channel between the ice — you can\'t swim through it',
			twelve: 'No.12',
			objVoices: 'Find the scattered voices · The Sunken Fleet · The Storm Sea · any order',
			objWrecks: 'Sing beside the sunken ships [E] · {n}/3',
			objEye: 'Into the heart of the storm · jump big waves with [Space]',
			fleetHint: 'Sing beside a sunken ship [E] to wake the memories left aboard',
			stormHint: 'Big waves are rolling in — [Space] jump as each one reaches you',
			waveHit: 'Swept back by a wave — jump [Space] just before it hits',
			nine: 'No.9',
			eight: 'No.8',
			objLight: 'To the Forgotten Lighthouse',
			objStones: 'Sing beside the song stones below the lighthouse [E] · {n}/3',
			stoneHint: 'Sing beside a song stone [E] to wake the old whale song Luke carved there',
			lightCard: [ 'MAP 3', 'The Forgotten Lighthouse', 'The Language of the Sea' ],
			objCoast: 'To the coast · stand before the Shaman\'s march',
			objFront: 'Break through the drumbeat to the Shaman · [E] as a ring reaches you',
			drumHint: 'Sing [E] the moment a red drum ring reaches you — keep your own voice and it won\'t push you back',
			drumHit: 'Pushed back by the drum — [E] the moment the ring reaches you',
			drumBlock: '52Hz cut through the drumbeat',
			coastCard: [ 'MAP 3', 'The Coastal City', 'Before the March' ],
			objSym: 'The Whale Symphony · mash, then the three whales\' songs',
			objDawn: 'Dawn',
			symTitle: 'WHALE SYMPHONY',
			symDone: 'Different voices became one song',
			objCracks: 'Sing beside the weak spots in the ice [E] · {n}/3',
			objRide: 'Clear the big waves with No.8 · {n}/3',
			cards: {
				frozen: [ 'The Frozen Lane', 'No.12 comes along' ],
				fleet: [ 'The Sunken Fleet', 'No.9 comes along' ],
				storm: [ 'The Storm Sea', 'No.8 comes along' ]
			},
			symMash: 'Mash [E]! — push back the Shaman\'s drum',
			symPushed: 'The Shaman\'s chorus is winning — faster [E]!',
			symP2: '{who}\'s song — the echo',
			symP3: '{who}\'s melody — off the drumbeat',
			symP4: 'The Shaman\'s last drum — {who}\'s courage',
			symOnDrum: 'On the drumbeat — pushed toward the Shaman',
			symSilence: 'The drum stopped. Silence.',
			symP5: 'Hold [E] — every voice joins 52Hz, one by one. Let go when all are in',
			symP5Short: 'A little longer — not everyone is in yet',
			holdTitle: '52HZ · SONG',
			holdEchoWait: 'Listen… {who}\'s echo is coming back',
			holdEchoNow: 'Hold [E] now — let go when the echo ends',
			holdTooLong: 'Held too long',
			holdTooShort: 'Let go too soon',
			holdMissed: 'Missed the echo',
			holdListen: 'Listen to {who}…',
			holdReady: 'One, two…',
			holdAnswer: 'Sing it back — short [E] · long [E]',
			holdNeedLong: 'Long notes long',
			holdNeedShort: 'Short notes short',
			holdCourage: 'Hold [E] — give {who} courage',
			holdBrave: '{who} is ready… watch for the leap',
			holdJump: 'Now! Let go and [Space]',
			holdLetGo: 'Let go of [E] first, then jump',
			holdEarly: 'Jumped too early',
			holdLate: 'A little late',
			holdOk: 'Together!',
			holdHelp: 'It\'s okay — we\'ll match you',
			holdRetry: 'once more',
			echoTitle: 'ECHO · No.12',
			echoHint: 'No.12\'s echo returns from under the ice — hold [E] while it sounds',
			memoryTitle: 'MEMORY · No.9',
			memoryHint: 'Short notes short, long notes long [E] — piece No.9\'s memory back together',
			courageTitle: 'COURAGE · No.8',
			courageHint: 'Hold [E] to give No.8 courage — when No.8 leaps first, let go and [Space]',
			objEnsemble: 'Lighthouse ensemble · echo, memory, courage',
			ensembleTitle: 'LIGHTHOUSE ENSEMBLE',
			ensembleHint: 'The three whales\' songs in turn — the same in the final symphony',
			crackHint: 'Sing [E] by the blue cracks in the ice — No.12\'s echo will answer'
		},
		// MAP 2 낚시
		fish: {
			titleHorn: 'FISHING · LUKE\'S HORN',
			titleFin: 'FISHING · CLUMSY FIN',
			cast: '[E] Drop the line',
			again: '[E] Once more · tap Stop to finish',
			wait: 'Wait… watch the float',
			nibble: 'Tap… tap… (not yet!)',
			bite: 'It bit! Now [E]',
			early: 'Too soon — the fish got away',
			missed: 'Missed it…',
			reel: '[E] Reel in when the white line is in the green',
			snap: 'The line snapped! (three reds)',
			new: 'NEW!',
			dexCount: 'Fish log {n}/{max}',
			jelly: 'The jellyfish was gently let go',
			quit: 'Stop',
			dex: 'Fish log',
			prompt: '[E] Fish here',
			hookToast: 'J\'s stone fishhook is on — fish bite more easily',
			names: { blueTang: 'Blue tang', yellowTang: 'Yellow tang', chromis: 'Chromis', clownfish: 'Clownfish', angelfish: 'Angelfish', firefish: 'Firefish', mandarin: 'Mandarin dragonet', cardinalfish: 'Cardinalfish', rabbitfish: 'Rabbitfish', reefFish: 'Reef fish', grouper: 'Grouper', barracuda: 'Barracuda', stingray: 'Stingray', shark: 'Reef shark', jelly: 'Moon jellyfish', shrimp: 'Cleaner shrimp', coelacanth: 'Coelacanth', shoreCrab: 'Shore crab', reefCrab: 'Reef crab', hermit: 'Hermit crab', eel: 'Moray eel' }
		},
		// MAP 2 preview: portal → under the sea
		dive: {
			label: 'MAP 2 · A SEA BORN WITHOUT WAVES',
			objPortal: 'Swim into the glowing whirlpool',
			objSwim: 'Try swimming under the sea',
			card: [ 'MAP 2', 'A Sea Born Without Waves', 'A story of whales whose voices were taken' ],
			hint: '[Space] up · [C] down · [E] sing to light the dark',
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
			deepHint: 'The story continues above the waves, toward the dawn',
			dawnQuote: '“ What were we born for?<br>So we began to sing ”',
			dawnHint: 'MAP 3 · A Song That Calls the Dawn — thank you for listening to the end',
			dive: '▼ Into the deep · MAP 2',
			dawn: '▲ Toward the dawn · MAP 3',
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
			chorus: { name: 'Everyone\'s Song', hint: 'If the Shaman\'s chorus never pushes you back in the symphony' },
			lone: { name: 'A 52Hz Dawn', hint: 'If the Shaman\'s chorus nearly drowns you out in the symphony' },
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
		j: 'J · Diver',
		twelve: 'No.12 · Alliance',
		nine: 'No.9 · Alliance',
		eight: 'No.8 · Alliance'
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
			card: [ 'MAP 1 · The Night the Stars Fell', '52Hz', 'A song no one can hear' ],
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
					[ 'narrator', 'The writing was unreadable, but the drawings were clear.', 'lukeGone' ],
					[ 'finn', '...We never knew waves. The first sea we saw was on the other side of tank glass.', 'finn' ],
					[ 'narrator', 'They were born without waves.', 'finnGone' ]
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
					[ 'narrator', 'It was never a compass. It was the stop device Finn had guarded to the end.', 'finnGone' ],
					[ 'narrator', 'Tied to the capsule hung a small fishhook carved from stone.' ],
					[ 'finn', '...I\'ve seen this. Every time someone stroked my head, it swung back and forth.', 'finn' ],
					[ 'narrator', 'Its tip was worn smooth, as if someone had held it for years.', 'finnGone' ]
				],
				[
					[ 'luke', '"Uninterpretable"... No. He understood it too well, so he tried to erase it.', 'luke' ],
					[ 'hazel', '( sings at 52Hz. From behind the door, something answers )' ]
				]
			],
			// 낚시를 처음 할 때
			fishIntro: [
				[ 'luke', 'Found this line in the wreck. Wrap it round my horn and… look, a fishing rod.', 'luke' ],
				[ 'finn', '...This line is J\'s. Same way of tying the knot.', 'finn' ],
				[ 'narrator', 'The knot at the end matched the drawing in J\'s records.', 'finnGone' ],
				[ 'narrator', '{N} wrapped the line from the wreck around a fin. This might be clumsy.', 'lukeGone' ],
				[ 'narrator', 'Each catch goes in the fish log, then back into the sea.' ]
			],
			// 경비 연합군: 어스름층으로 내려가기 전에 처음 보인다
			guards: [
				[ 'narrator', 'Down in the dark, red eyes were circling slowly.' ],
				[ 'finn', 'The guards... The trench is where "the Voice of the Deep" lives. They protect it.', 'finn' ],
				[ 'finn', 'Stay by the walls. The moray holes are taboo, so they won\'t come.\n...I\'m scared of morays too, though.', 'finn' ],
				[ 'narrator', 'Strangely, the red eyes never came near the walls.', 'finnGone' ],
				[ 'luke', 'Careful with singing, though. Every guard in earshot will come. To them, 52Hz is "purge priority one."', 'luke' ],
				[ 'narrator', 'If {N} sang at 52Hz, every one of those eyes would turn this way.', 'lukeGone' ],
				[ 'narrator', 'The duet with Stella still rang through {N}.\nSung up close, it might freeze even those red eyes for a moment.' ]
			],
			// 고래 뼈 제단: 정화 의식
			altar: [
				[ 'narrator', 'Around the grave of whale bones, three of the Alliance circled, humming low.' ],
				[ 'narrator', 'Their red eyes blinked in one rhythm. It looked like prayer. Or like orders.' ],
				[ 'finn', 'The altar of "purification." The Shaman says she first heard the Voice here.', 'finn' ],
				[ 'luke', 'A voice, huh... Looks to me like they\'re writing down machine signals.', 'luke' ]
			],
			// 핀의 기억: 찾은 장소 개수 순서대로 (finn: 핀이 있을 때, gone: 핀이 없을 때 J의 녹음)
			memories: [
				{ title: 'The Sea Behind the Glass', finn: [
					[ 'finn', '...Glass. Through round glass, something blue was rippling.' ],
					[ 'finn', 'It was a long time before I learned that was the sea.' ],
					[ 'luke', '...Born in a tank? So that\'s why you cried at every wave.', 'luke' ]
				], gone: [
					[ 'narrator', 'A small recorder blinked in the sand. An old voice came out.' ],
					[ 'narrator', '"Tank 7 log. Nose pressed to the glass again. I want to show it the sea… not yet, little one."' ]
				] },
				{ title: 'The Fishing Line', finn: [
					[ 'finn', 'Every evening J sat by the tank and dropped a line. Every fish J caught went to me.' ],
					[ 'luke', '...Bet that human was a lousy angler.', 'luke' ],
					[ 'finn', 'Yeah. Always lost them. So we laughed, the two of us.' ]
				], gone: [
					[ 'narrator', '"Didn\'t catch a single one today. No. 7 seemed to laugh. So the crybaby laughs too."' ],
					[ 'narrator', 'The recording cut off there.' ]
				] },
				{ title: 'Crybaby No. 7', finn: [
					[ 'finn', 'The others went quiet when the orders came. Only I cried — every time that red sound rang in my head.' ],
					[ 'finn', 'Each time, J put a hand on the glass. Then the sound got a little quieter.' ]
				], gone: [
					[ 'narrator', '"No. 7 cries every time the chip signal comes in. They call it a defect…"' ],
					[ 'narrator', '"I think it\'s proof that this child is still a whale."' ]
				] },
				{ title: 'The Device on My Neck', finn: [
					[ 'finn', 'That night, J hung this on my neck. It was cold.' ],
					[ 'finn', '"Only you can keep this. You can cry. Just don\'t let it go."' ]
				], gone: [
					[ 'narrator', 'The broken compass {N} carried began to tremble.' ],
					[ 'narrator', '"I left the device with No. 7. The gentlest one. The one who\'ll live the longest."' ]
				] },
				{ title: 'Run', finn: [
					[ 'finn', 'The last time I saw J, J was opening the tank door. Alarms, every red light on…' ],
					[ 'finn', '"Go, No. 7. To where there are waves."' ],
					[ 'finn', '...Now I remember. The beat J tapped on the glass every night. That\'s the stop code.' ],
					[ 'narrator', 'Far below, the current guarding the base began to ease.' ]
				], gone: [
					[ 'narrator', 'The last recording began with an alarm.' ],
					[ 'narrator', '"Go, No. 7. To where there are waves. …No. 7, if you\'re hearing this — what were the waves like?"' ],
					[ 'hazel', '( answers at 52Hz. The broken compass trembles to the same beat )' ],
					[ 'narrator', 'Far below, the current guarding the base began to ease.' ]
				] }
			],
			// 기지 바깥: 잠수복의 J
			reunion: [
				[ 'narrator', 'Outside the base stood someone in an old diving suit.' ],
				[ 'narrator', 'The helmet lamp shone toward an old tank window.' ],
				[ 'luke', '...Alive. The J from the records.', 'luke' ],
				[ 'finn', '......', 'finn' ],
				[ 'j', '...No. 7?', 'finn' ],
				[ 'finn', 'Then why did you make us?', 'finn' ],
				[ 'j', '......', 'finn' ],
				[ 'j', 'At first I wanted to protect them. Humans, and you. I believed it was the same thing.', 'finn' ],
				[ 'j', 'I was wrong. The third order made you kill each other.', 'finn' ],
				[ 'j', 'If I just shut the AI down, the devices in your heads break too. So I stayed. To find a way to set you free without killing you.', 'finn' ],
				[ 'finn', '...For twenty-five years?', 'finn' ],
				[ 'j', 'Every day at the same hour I came out here. To the window where you first saw the sea.', 'finn' ],
				[ 'j', 'The device is on your neck. The last piece was 52Hz. …Your song.', 'finn' ],
				[ 'hazel', '( holds out the broken compass )', 'finnGone' ],
				[ 'j', '...This is No. 7\'s.', 'finnGone' ],
				[ 'j', '......So you never made it back.', 'finnGone' ],
				[ 'j', 'I made these children. To protect them. And the third order made them kill each other.', 'finnGone' ],
				[ 'j', 'Shut the AI down and the devices in their heads break too. So I stayed here and waited. Twenty-five years.', 'finnGone' ],
				[ 'j', 'The code is still in here. I\'ll piece it together. …You sing it, 52Hz.', 'finnGone' ]
			],
			base: [
				[ 'shaman', 'A human… and 52 hertz. Do not defile the Voice of the Deep.' ],
				[ 'ai', 'Approaching entity detected. Frequency 52Hz. Purge priority one.' ],
				[ 'finn', 'Shaman, that isn\'t a voice. It\'s a machine. …I don\'t cry anymore. No — it\'s okay to cry. J said so.', 'finn' ],
				[ 'narrator', 'The Shaman\'s red eyes blinked in exactly the rhythm of the AI\'s words.', 'finnGone' ],
				[ 'stella', '52 hertz! I can hear it all from up here!\nI\'ll sing with you. Remember our rhythm?' ],
				[ 'j', 'Now. Sing.' ]
			],
			stop: [
				[ 'ai', 'Stop code confirmed. …All Alliance units, orders released.' ],
				[ 'shaman', '......The Voice has stopped.' ],
				[ 'shaman', 'Then whose voice… have we been hearing all this time?' ],
				[ 'narrator', 'All across the sea, the Alliance\'s red eyes went dark one by one.' ],
				[ 'narrator', 'For the first time, the orcas swam where no one told them to.' ],
				[ 'j', '...First time I\'ve seen you. Not listening to me.' ],
				[ 'finn', 'J, can you hear me? I live where there are waves now.', 'finn' ],
				[ 'j', '...Yes. I hear you.', 'finn' ],
				[ 'narrator', 'What Finn had guarded to the end was finally heard.', 'finnGone' ],
				[ 'luke', '...Guess you don\'t need a translator. Everyone can hear it.', 'luke' ],
				[ 'narrator', 'For the first time, someone who wasn\'t a whale heard 52Hz.' ]
			],
			card: [ 'MAP 2 ENDING', 'A Song Heard', 'For the first time, someone else heard' ]
		},
		// MAP 3 · A Song That Calls the Dawn (phase 1). The third slot of a line is a condition (see map3 in story.js)
		map3: {
			silence: [
				[ 'narrator', 'The night every red eye went dark. One by one, the Alliance rose to the surface.' ],
				[ 'narrator', 'No one swam. No one sang.' ],
				[ 'shaman', '……Protect the humans.' ],
				[ 'shaman', 'Protect the humans! Form ranks!' ],
				[ 'narrator', 'Not a single whale moved.' ],
				[ 'orca', 'That voice doesn\'t reach us anymore.' ],
				[ 'orca', 'Then… why were we born?' ],
				[ 'finn', '……They\'re all hearing their own voice for the first time.\nI did too. It was scary.', 'finn' ],
				[ 'luke', 'I thought it would be quiet once the orders stopped.\nThis is… far too quiet.', 'luke' ]
			],
			factions: [
				[ 'shaman', 'We need orders. We need someone to command us.' ],
				[ 'orca', 'I\'ll follow you, Shaman. Tell me anything.' ],
				[ 'orca', 'If humans made us into weapons,\nthen weapons is what we\'ll be.' ],
				[ 'orca', '…I just want to see the sea.' ]
			],
			order: [
				[ 'shaman', 'Listen. We were born to protect the humans.' ],
				[ 'shaman', 'If the humans are gone, no one can ever command us again.' ],
				[ 'shaman', 'So the humans must be wiped out.\nToward the rising sun. To the human coast!' ]
			],
			leave: [
				[ 'narrator', 'The first order the Shaman ever chose was another war.' ],
				[ 'narrator', 'The Alliance split three ways. After the Shaman, after revenge, and nowhere at all.' ],
				[ 'luke', '{N}, most of those whales still don\'t know where to go.\nWhoever shows them a way, they\'ll follow it — wherever it leads.', 'luke' ],
				[ 'finn', 'Up north… someone is crying. Toward the Frozen Lane.\nNot a command signal. Just crying.', 'finn' ],
				[ 'narrator', 'From the north, from the Frozen Lane, came a broken song.', 'finnGone' ],
				[ 'hazel', '( Answers briefly in 52Hz, and turns north )' ]
			],
			ice: [
				[ 'narrator', 'The sea was frozen. A lane that had forgotten spring.' ],
				[ 'luke', 'Whales used to pass this way every winter. It\'s in my lighthouse records.\nThere should still be one channel through the ice.', 'luke' ],
				[ 'finn', 'There\'s a way through the ice. Narrow… and the crying is at the end of it.', 'finn' ],
				[ 'narrator', 'Between the ice ran a single narrow channel.', 'none' ]
			],
			meet: [
				[ 'narrator', 'A small pool trapped in the ice. An orca circled the same spot, over and over.\nOn its dorsal fin, a number carved in white: 12.' ],
				[ 'twelve', '……Did the Shaman send you too?\nI\'m not going. Not to the coast.' ],
				[ 'twelve', 'Everyone went somewhere. No orders, so… anywhere.\nAnd I… I didn\'t know where to go.' ],
				[ 'twelve', 'I wanted to see the sea. The real sea I only ever saw through the tank glass.\nBut now I\'m here, and it\'s all frozen.' ],
				[ 'finn', 'No.12… I remember. We were in the same tank.\nThe one who always pressed its head against the glass.', 'finn' ],
				[ 'luke', '{N}, see that ice? Where it\'s cracked and blue. Break it there and the way will open.', 'luke' ],
				[ 'finn', '…Hold on, No.12. We\'ll open a way out.', 'finn' ],
				[ 'narrator', 'Here and there around the pool, the ice glowed with blue cracks.', 'lukeGone' ]
			],
			next: [
				[ 'luke', '{N}, I hear voices all over the sea.\nSunken ships to the west, and a storm on the southern sea.', 'luke' ],
				[ 'finn', 'Alliance signals cut out in two places.\nBy the sunken ships… and inside the storm.', 'finn' ],
				[ 'narrator', 'Scattered voices called from across the sea. From the sunken ships, and from inside the storm.', 'none' ]
			],
			fleet: {
				enter: [
					[ 'narrator', 'Sunken ships lifted their rusted bodies above the water.\nHuman ships that fell into the sea on the night the stars fell.' ],
					[ 'narrator', 'An orca swam roughly between them.' ],
					[ 'luke', 'Those ships… they carried the Alliance. ALLY is painted on their sides.', 'luke' ],
					[ 'finn', 'I know how those ships smell. Like tank water.', 'finn' ]
				],
				memories: [
					[
						[ 'narrator', 'A warm light came on in the ship\'s windows. No.9\'s first memory.' ],
						[ 'narrator', 'A rocking tank. Someone changing the water all night, humming a clumsy song.' ]
					],
					[
						[ 'narrator', 'The research ship\'s windows lit up. No.9\'s second memory.' ],
						[ 'narrator', 'White light, bound fins. The day something came down over its head.\nThat day, No.9 heard its first order.' ]
					],
					[
						[ 'narrator', 'The warship\'s windows lit up. No.9\'s third memory.' ],
						[ 'narrator', 'Humans waving from the deck. The faces it was taught to protect.\nThat night the stars fell, and the ships sank into the sea.' ]
					]
				],
				meet: [
					[ 'nine', '…Was it you who woke those ships with a song?' ],
					[ 'nine', 'See? Humans hammered orders into our heads.\nSo this time, it\'s our turn to finish it.' ],
					[ 'nine', 'The Shaman says to go to the coast. Just this once, I\'ll gladly follow.' ],
					[ 'finn', 'No.9… do you remember the one who changed our water? That was a human too.', 'finn' ]
				],
				join: [
					[ 'hazel', '( Instead of answering, sings a short 52Hz toward the waking ships )' ],
					[ 'nine', '…The hands that changed the water and the hands that put in the chip were both human.' ],
					[ 'nine', 'I\'ll remember both. So I\'m not going to the coast. Not yet.' ],
					[ 'nine', 'I haven\'t forgiven everything.\nBut I\'ll stay beside you and decide with my own eyes.' ],
					[ 'luke', 'That\'s enough.', 'luke' ]
				]
			},
			storm: {
				enter: [
					[ 'narrator', 'The sky went dark. For the first time, the sea stood up.' ],
					[ 'narrator', 'A sea the whales born without waves had never seen.' ],
					[ 'finn', 'Right in the middle… that\'s No.8. The youngest.\nIt cried whenever the tank water so much as sloshed.', 'finn' ],
					[ 'luke', 'Don\'t fight it, {N}. Ride it. Waves look bigger the more you fear them.', 'luke' ],
					[ 'narrator', 'In the heart of the storm, a small whale was curled up tight.', 'finnGone' ]
				],
				meet: [
					[ 'eight', 'Don\'t come! The waves are coming! The sea is angry…' ],
					[ 'eight', 'It\'s because I didn\'t obey, isn\'t it? I\'ll listen again. I\'ll listen again…' ],
					[ 'eight', 'In the tank the water never moved like this. I\'m scared.' ],
					[ 'finn', 'No.8, it\'s me. No.7. Crybaby No.7.\nI was scared at first too.', 'finn' ],
					[ 'hazel', '( Swims to No.8\'s side and watches the coming waves together )' ],
					[ 'eight', '…Will you jump them with me? When a wave comes — together?' ],
					[ 'luke', 'Give No.8 courage, {N}. Sing long, and when No.8 leaps first, let go and jump with it.', 'luke' ]
				],
				calm: [
					[ 'narrator', 'As they cleared the third wave together, the storm began to settle.' ],
					[ 'eight', '…The waves weren\'t angry. The sea was just breathing.' ],
					[ 'eight', 'I think I\'m going to like riding waves.' ],
					[ 'finn', 'See, No.8? We\'re not crybabies anymore.', 'finn' ]
				]
			},
			gathered: [
				[ 'narrator', 'The Frozen Lane, the sunken ships, the Storm Sea.\nThe voices that had been scattered now swam the same sea.' ],
				[ 'luke', '{N}, let\'s go to the lighthouse now. The whale songs I\'ve written down all my life are there.', 'luke' ],
				[ 'narrator', 'Far away stood a lighthouse, its light gone out.', 'lukeGone' ]
			],
			light: {
				arrive: [
					[ 'narrator', 'A dark lighthouse. At the end of the Frozen Lane, it once lit the old whales\' way.' ],
					[ 'luke', '…It\'s been a while. My lighthouse.', 'luke' ],
					[ 'luke', 'I spent my whole life here writing down whale songs. I carved one into each stone below the light.\nSongs from before the Alliance, when the sea still sang in its own language.', 'luke' ],
					[ 'luke', 'Sing beside the stones, {N}. I\'ll read them for you.', 'luke' ],
					[ 'narrator', 'Something was carved into each stone below the lighthouse. Lines scratched with a horn.', 'lukeGone' ],
					[ 'narrator', 'Luke wasn\'t there. {N} decided to bring the lines he left back to life, one song at a time.', 'lukeGone' ]
				],
				stones: [
					[
						[ 'luke', 'The humpback song. They sing the same song for hours, changing it a little every year.\nPods on the far side of the sea change theirs to match. Not by order — because they like it.', 'luke' ],
						[ 'narrator', 'The carving: a whale with its tail held high, and an endless line of waves.\nIt seemed to say the song carries across the sea.', 'lukeGone' ]
					],
					[
						[ 'luke', 'The blue whale song. So low that humans can\'t even hear it. Yet it reaches thousands of kilometers away.\nJust because it isn\'t heard doesn\'t mean it isn\'t there. …Like you, {N}.', 'luke' ],
						[ 'narrator', 'The carving: one enormous whale, and one long line stretching to the edge of the sea.\nIt seemed to say a song can reach without being heard.', 'lukeGone' ]
					],
					[
						[ 'luke', 'The sperm whale clicks. Every pod has its own rhythm. That rhythm is its name, and its home.\nThey understand each other without sharing a beat.', 'luke' ],
						[ 'narrator', 'The carving: dot, dot, dot, a pause, dot. Several whales gathered in a circle.\nIt seemed to say different beats can still be together.', 'lukeGone' ]
					]
				],
				lamp: [
					[ 'narrator', 'As the third song woke, the lighthouse came alight.' ],
					[ 'luke', 'They were born in the sea, but never learned the language of the sea.\n{N}, I\'ll carry your song to them.', 'luke' ],
					[ 'luke', 'I\'ll play the first note. Then one by one — No.12\'s echo, No.9\'s memory, No.8\'s courage.', 'luke' ],
					[ 'narrator', 'The lighthouse blinked slowly, and a bell rang, as if counting the beat.\nThe light Luke left behind.', 'lukeGone' ]
				],
				together: [
					[ 'luke', 'Hear that? Every voice was different. And yet it was one song.', 'luke' ],
					[ 'luke', 'That\'s the language of the sea. Not orders — answers.', 'luke' ],
					[ 'narrator', 'The voices that came along answered {N}\'s song, each in its own way. The lighthouse kept their beat.', 'lukeGone' ]
				],
				end: [
					[ 'narrator', 'The lighthouse beam swept east. Human lights dotted the coast.' ],
					[ 'narrator', 'And toward those lights, the Shaman\'s pod swam in long lines.' ],
					[ 'finn', 'It\'s the Shaman… already close to the coast.', 'finn' ],
					[ 'luke', 'Let\'s hurry, {N}. This time, we have to sing first.', 'luke' ]
				]
			},
			coast: {
				approach: [
					[ 'narrator', 'Drums. One, two, three, four. Everyone on the same beat.' ],
					[ 'narrator', 'Before the lights of the coastal city, the Alliance stood in rows.\nWith every drumbeat, they all surged forward as one.' ],
					[ 'narrator', 'The city\'s searchlights swept the sea. The humans were afraid of the sea too.' ],
					[ 'luke', 'That isn\'t a song. It\'s an order.', 'luke' ],
					[ 'finn', 'The Shaman\'s drum… the beat I heard every day at the base.\nMy body wants to move to it on its own.', 'finn' ]
				],
				front: [
					[ 'narrator', '{N} stood between the Alliance and the shore.' ],
					[ 'shaman', '…52Hz. You again.' ],
					[ 'shaman', 'Step aside. We are following an order we chose ourselves.' ],
					[ 'shaman', 'What were you made for!' ]
				],
				answers: [
					[ 'orca', 'To protect the humans.' ],
					[ 'orca', 'For revenge.' ],
					[ 'orca', 'To survive.' ],
					[ 'orca', '…I don\'t know.' ]
				],
				cover: [
					[ 'shaman', 'Do you hear it? Every one different. That is why you are weak.' ],
					[ 'shaman', 'One beat, one voice. My song alone is enough. That is what protects us.' ],
					[ 'narrator', 'The Shaman\'s drum grew louder, as if to drown out every voice.' ]
				],
				seven: [
					[ 'finn', '…Shaman.', 'finn' ],
					[ 'finn', 'I\'m No.7. Crybaby No.7. The one who ran from the base because orders scared me.', 'finn' ],
					[ 'finn', 'Now I\'ll speak for myself. I\'m not going.\nAnd I won\'t let those people get hurt.', 'finn' ],
					[ 'narrator', 'For the first time, someone inside the Alliance said no — by their own will.', 'finn' ],
					[ 'orca', '…I heard. That 52Hz found J\'s records at the base.\nCrybaby No.7 threw away the orders and ran. By its own will.', 'finnGone' ],
					[ 'orca', 'Its own will… do we have something like that too?', 'finnGone' ],
					[ 'narrator', 'Finn was gone, but No.7\'s story spread through the Alliance.', 'finnGone' ]
				],
				dare: [
					[ 'luke', 'Now, {N}. You sing first. We\'ll answer.', 'luke' ],
					[ 'narrator', 'Far away, the lighthouse blinked, as if counting the beat.', 'lukeGone' ],
					[ 'shaman', 'If you mean to sing, then sing, 52Hz. If you can rise above this drum.' ],
					[ 'narrator', '{N} took a deep breath.' ]
				]
			},
			finale: {
				arrive: [
					[ 'narrator', 'Just then, the sea behind them heaved.' ],
					[ 'moby', '…Not too late, 52 hertz.' ],
					[ 'moby', 'Shaman. I too once tried to cover the whole sea with my song alone.\nThe one who answered me then was that small whale.' ],
					[ 'stella', 'I\'m here too, 52 hertz! This time it\'s not just the two of us — it\'s everyone, right?', 'stella' ]
				],
				start: [
					[ 'luke', 'I\'ll start. Then one by one, each in its own voice.', 'luke' ],
					[ 'narrator', 'Far away, the lighthouse marked the first beat.', 'lukeGone' ],
					[ 'narrator', 'The Shaman\'s drum was rolling over every voice.\nThey had to keep singing, without stopping.' ]
				],
				after: [
					[ 'narrator', 'The drum fell silent.' ],
					[ 'narrator', 'One by one, the Alliance lifted their heads, each looking a different way.' ],
					[ 'narrator', 'For a moment, {N}\'s song was almost drowned by the drum. Still, it stayed 52Hz to the end.', 'drummed' ]
				]
			},
			dawnEnd: {
				question: [
					[ 'shaman', '……What were we made for?' ]
				],
				voice: [
					[ 'narrator', '{N} sang again. For the first time, the Shaman made a sound.\nClumsy, very small, and its own.' ]
				],
				after: [
					[ 'shaman', '……I do not know yet. But I will listen.' ],
					[ 'luke', '{N}, it was heard. Our song.', 'luke' ]
				],
				poem: [ 'What were we born for?\nNo one ever answered.', 'So we began to sing.', 'In different voices,\ntoward different seas.', 'And for the first time,\nthe song was no one\'s order.' ],
				finn: [
					[ 'finn', 'That\'s for us to decide.' ]
				]
			},
			free: [
				[ 'narrator', 'As the last of the ice split, open sea appeared beyond the pool.' ],
				[ 'narrator', 'For the first time, No.12 sang. Not an echo — its own song.' ],
				[ 'twelve', '…The sea. A real sea, not frozen.' ],
				[ 'twelve', 'I still don\'t know where to go.\nBut… I\'ll come with you.' ],
				[ 'finn', 'Let\'s go together, No.12.', 'finn' ]
			]
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
