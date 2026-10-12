// 모든 소리는 WebAudio로 합성한다 (음원 파일 없음)
// 음악: 셔플 리듬의 마이너 블루스 + 일렉 피아노 + 베이스 기타 + 브러시 드럼 + 52Hz 고래 허밍 (+ 에필로그 색소폰)

const BPM = 92;
const BEAT = 60 / BPM;
const STEP = BEAT / 3; // 셋잇단(셔플) 격자, 한 마디 = 12 스텝

const CHORDS = {
	Am: { bass: 33, voicing: [ 60, 64, 67, 71 ], scale: [ 0, 7, 10, 7 ] },
	Dm: { bass: 38, voicing: [ 53, 57, 60, 64 ], scale: [ 0, 7, 10, 7 ] },
	F7: { bass: 41, voicing: [ 57, 63, 67, 72 ], scale: [ 0, 7, 10, 7 ] },
	E7: { bass: 40, voicing: [ 56, 62, 65, 71 ], scale: [ 0, 4, 7, 10 ] }
};
const PROGRESSION = [ 'Am', 'Am', 'Dm', 'Am', 'Dm', 'Dm', 'Am', 'Am', 'F7', 'E7', 'Am', 'E7' ];
const MELODY_SCALE = [ 69, 72, 74, 75, 76, 79, 81, 84, 86 ];
const COMP_PATTERNS = [
	[ [ 3, 0.5 ], [ 9, 0.5 ], [ 11, 0.25 ] ],
	[ [ 2, 0.4 ], [ 5, 0.6 ], [ 9, 0.5 ] ],
	[ [ 0, 1.6 ], [ 8, 1.2 ] ]
];

// 색소폰 블루스 구절: [ 스텝(2마디 = 24스텝), 음(MIDI), 길이(스텝) ]. A 마이너 펜타토닉 + 블루 노트(E♭)
const SAX_LICKS = [
	[ [ 0, 64, 5 ], [ 6, 67, 2 ], [ 8, 69, 4 ], [ 12, 72, 2 ], [ 14, 69, 1 ], [ 15, 67, 2 ], [ 18, 64, 6 ] ],
	[ [ 0, 69, 5 ], [ 6, 72, 2 ], [ 8, 74, 2 ], [ 11, 75, 1 ], [ 12, 76, 5 ], [ 18, 74, 2 ], [ 20, 72, 4 ] ],
	[ [ 3, 57, 2 ], [ 5, 60, 1 ], [ 6, 62, 2 ], [ 8, 63, 1 ], [ 9, 64, 5 ], [ 15, 67, 2 ], [ 17, 64, 1 ], [ 18, 62, 2 ], [ 20, 60, 4 ] ],
	[ [ 0, 72, 3 ], [ 3, 69, 2 ], [ 5, 67, 1 ], [ 6, 69, 8 ], [ 18, 67, 2 ], [ 20, 64, 4 ] ]
];
// 9~10마디(F7 → E7)에서 돌아오는 구절
const SAX_TURNAROUND = [
	[ [ 0, 72, 2 ], [ 2, 69, 1 ], [ 3, 63, 5 ], [ 9, 60, 3 ], [ 12, 68, 4 ], [ 18, 64, 6 ] ],
	[ [ 0, 75, 2 ], [ 2, 72, 1 ], [ 3, 69, 3 ], [ 6, 67, 5 ], [ 12, 64, 3 ], [ 15, 62, 2 ], [ 18, 59, 6 ] ]
];
// 색소폰의 거친 숨결: 부드럽게 찌그러뜨리는 곡선
const SAX_CURVE = ( () => {

	const n = 1024, c = new Float32Array( n );
	for ( let i = 0; i < n; i ++ ) c[ i ] = Math.tanh( ( i / ( n - 1 ) * 2 - 1 ) * 2.4 );
	return c;

} )();

// 색소폰 배음 (2~5배음이 강하다)
const SAX_HARMONICS = [ 0, 1, 0.85, 0.9, 0.6, 0.55, 0.38, 0.3, 0.22, 0.18, 0.14, 0.11, 0.09, 0.07, 0.06, 0.05, 0.04 ];
const saxWaves = new WeakMap();
function saxWave( ctx ) {

	if ( ! saxWaves.has( ctx ) ) {

		const imag = new Float32Array( SAX_HARMONICS );
		saxWaves.set( ctx, ctx.createPeriodicWave( new Float32Array( imag.length ), imag ) );

	}

	return saxWaves.get( ctx );

}

// 한 옥타브 아래에서 같은 구절을 작게 받쳐 주는 테너 (-13dB)
const TENOR_LEVEL = Math.pow( 10, - 13 / 20 );

const mtof = ( m ) => 440 * Math.pow( 2, ( m - 69 ) / 12 );

// iPhone/iPad Safari (iPadOS는 맥처럼 보이지만 터치가 된다)
const IS_IOS = /iP(hone|od|ad)/.test( navigator.platform ) || ( /Mac/.test( navigator.userAgent ) && navigator.maxTouchPoints > 1 );

export class AudioEngine {

	constructor() {

		this.ctx = null;
		this.muted = false;
		try {

			this.muted = localStorage.getItem( 'fromwhale.muted' ) === '1';

		} catch ( e ) { /* 저장소 없음 */ }

		this.mix = { piano: 1, melody: 1, bass: 0, drums: 0, hum: 1, tension: 0, sax: 0 };
		this.bar = 0;
		this.stepIndex = 0;
		this.melodyIdx = 3;

	}

	init() {

		if ( this.ctx ) {

			if ( this.ctx.state === 'suspended' ) this.ctx.resume();
			return;

		}

		const AC = window.AudioContext || window.webkitAudioContext;
		if ( ! AC ) return;
		const ctx = this.ctx = new AC();

		this.master = ctx.createGain();
		this.master.gain.value = this.muted ? 0 : 0.85;
		const comp = ctx.createDynamicsCompressor();
		comp.threshold.value = - 16;
		comp.ratio.value = 3.5;
		this.master.connect( comp ).connect( ctx.destination );

		this.reverb = ctx.createConvolver();
		this.reverb.buffer = this.makeImpulse( 3.2, 2.6 );
		const revGain = ctx.createGain();
		revGain.gain.value = 0.55;
		this.reverb.connect( revGain ).connect( this.master );

		this.music = ctx.createGain();
		this.music.gain.value = 0.5;
		this.music.connect( this.master );
		this.sfx = ctx.createGain();
		this.sfx.gain.value = 0.9;
		this.sfx.connect( this.master );

		this.buses = {};
		for ( const k of Object.keys( this.mix ) ) {

			const g = ctx.createGain();
			g.gain.value = this.mix[ k ];
			g.connect( this.music );
			this.buses[ k ] = g;

		}

		this.noise = this.makeNoise();
		this.startHum();
		this.startTension();

		this.nextTime = ctx.currentTime + 0.1;
		this.timer = setInterval( () => this.schedule(), 25 );

		// 전화·Siri 등으로 중간에 끊기면 다음 터치 때 새로 만든다
		ctx.onstatechange = () => {

			if ( ctx === this.ctx && ctx.state !== 'running' && ! document.hidden ) this.stale = true;

		};

		this.listen();

	}

	// 폰을 잠그거나 다른 앱에 다녀오면 브라우저가 소리를 멈춘다.
	// iOS Safari는 돌아와서 resume()을 해도 '켜짐'이라고만 하고 소리가 안 나는 경우가 있어서,
	// 돌아온 뒤 첫 터치(사용자 동작) 때 소리 엔진을 새로 만든다. 곡 진행 위치와 악기 구성은 이어진다.
	listen() {

		if ( this.listening ) return;
		this.listening = true;

		document.addEventListener( 'visibilitychange', () => {

			if ( ! this.ctx ) return;
			if ( document.hidden ) {

				this.stale = true;
				this.ctx.suspend().catch( () => {} );

			} else {

				this.ctx.resume().catch( () => {} );
				// 데스크톱·안드로이드는 보통 여기서 바로 돌아온다. 아니면 터치하라고 알린다.
				setTimeout( () => {

					if ( this.stale && ( IS_IOS || this.ctx.state !== 'running' ) && ! this.muted ) this.onNeedsTap?.();
					else if ( this.ctx.state === 'running' && ! IS_IOS ) this.stale = false;

				}, 600 );

			}

		} );
		window.addEventListener( 'pageshow', () => this.ctx?.resume().catch( () => {} ) );

		// 대화창처럼 이벤트 전파를 막는 요소가 있어도 받도록 capture 단계에서 듣는다
		const gesture = () => this.onGesture();
		for ( const ev of [ 'touchend', 'pointerup', 'click', 'keydown' ] ) window.addEventListener( ev, gesture, { capture: true, passive: true } );

	}

	onGesture() {

		if ( ! this.ctx || document.hidden ) return;
		if ( this.stale && ( IS_IOS || this.ctx.state !== 'running' ) ) {

			this.rebuild();
			return;

		}

		this.stale = false;
		if ( this.ctx.state !== 'running' ) this.ctx.resume().catch( () => {} );

	}

	// 소리 엔진을 버리고 새로 만든다 (사용자 동작 안에서 불러야 iOS가 허락한다)
	rebuild() {

		const old = this.ctx;
		clearInterval( this.timer );
		this.ctx = null;
		this.stale = false;
		if ( old ) {

			old.onstatechange = null;
			old.close().catch( () => {} );

		}

		this.init();
		this.onRebuilt?.();

	}

	makeImpulse( seconds, decay ) {

		const ctx = this.ctx;
		const len = Math.floor( ctx.sampleRate * seconds );
		const buf = ctx.createBuffer( 2, len, ctx.sampleRate );
		for ( let c = 0; c < 2; c ++ ) {

			const d = buf.getChannelData( c );
			for ( let i = 0; i < len; i ++ ) d[ i ] = ( Math.random() * 2 - 1 ) * Math.pow( 1 - i / len, decay );

		}

		return buf;

	}

	makeNoise() {

		const ctx = this.ctx;
		const buf = ctx.createBuffer( 1, ctx.sampleRate * 2, ctx.sampleRate );
		const d = buf.getChannelData( 0 );
		for ( let i = 0; i < d.length; i ++ ) d[ i ] = Math.random() * 2 - 1;
		return buf;

	}

	// 52Hz: 대부분의 스피커에서 들리도록 배음을 살짝 섞는다
	startHum() {

		const ctx = this.ctx;
		const out = ctx.createGain();
		out.gain.value = 0;
		const lfo = ctx.createOscillator();
		lfo.frequency.value = 1 / 11;
		const lfoGain = ctx.createGain();
		lfoGain.gain.value = 0.11;
		lfo.connect( lfoGain ).connect( out.gain );
		out.gain.setValueAtTime( 0.14, ctx.currentTime );
		[ [ 52, 1 ], [ 104, 0.45 ], [ 156, 0.18 ], [ 208, 0.06 ] ].forEach( ( [ f, g ] ) => {

			const o = ctx.createOscillator();
			o.frequency.value = f;
			const gg = ctx.createGain();
			gg.gain.value = g;
			o.connect( gg ).connect( out );
			o.start();

		} );
		lfo.start();
		out.connect( this.buses.hum );
		const send = ctx.createGain();
		send.gain.value = 0.3;
		out.connect( send ).connect( this.reverb );

	}

	startTension() {

		const ctx = this.ctx;
		const out = ctx.createGain();
		out.gain.value = 0.12;
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 420;
		[ 45, 45.4, 52 ].forEach( ( m ) => {

			const o = ctx.createOscillator();
			o.type = 'sawtooth';
			o.frequency.value = mtof( m ) / 2;
			o.connect( filter );
			o.start();

		} );
		filter.connect( out ).connect( this.buses.tension );

	}

	setMix( partial, seconds = 2.5 ) {

		Object.assign( this.mix, partial );
		if ( ! this.ctx ) return;
		const t = this.ctx.currentTime;
		for ( const [ k, v ] of Object.entries( partial ) ) {

			const g = this.buses[ k ].gain;
			g.cancelScheduledValues( t );
			g.setValueAtTime( g.value, t );
			g.linearRampToValueAtTime( v, t + seconds );

		}

	}

	toggleMute() {

		this.muted = ! this.muted;
		try {

			localStorage.setItem( 'fromwhale.muted', this.muted ? '1' : '0' );

		} catch ( e ) { /* 저장소 없음 */ }

		if ( this.ctx ) this.master.gain.setTargetAtTime( this.muted ? 0 : 0.85, this.ctx.currentTime, 0.1 );
		return this.muted;

	}

	// --- 시퀀서 ---

	schedule() {

		const ctx = this.ctx;
		if ( ctx.state !== 'running' ) return;
		// 오래 멈췄다 돌아오면 밀린 음을 한꺼번에 치지 않고 지금부터 다시
		if ( this.nextTime < ctx.currentTime - 0.25 ) this.nextTime = ctx.currentTime + 0.05;
		while ( this.nextTime < ctx.currentTime + 0.12 ) {

			this.playStep( this.stepIndex, this.nextTime );
			this.nextTime += STEP;
			this.stepIndex ++;
			if ( this.stepIndex >= 12 ) {

				this.stepIndex = 0;
				this.bar ++;

			}

		}

	}

	playStep( s, t ) {

		const chord = CHORDS[ PROGRESSION[ this.bar % 12 ] ];
		const next = CHORDS[ PROGRESSION[ ( this.bar + 1 ) % 12 ] ];
		const groove = this.mix.drums > 0.05 || this.mix.bass > 0.05;

		// 피아노 컴핑
		const pattern = groove ? COMP_PATTERNS[ ( this.bar % 4 === 3 ) ? 1 : 0 ] : COMP_PATTERNS[ 2 ];
		for ( const [ step, len ] of pattern ) {

			if ( step === s ) chord.voicing.forEach( ( m, i ) => this.ep( t + i * 0.008, m, 0.16, len * BEAT, this.buses.piano ) );

		}

		// 색소폰 (에필로그): 4마디마다 앞 2마디에 한 구절, 뒤 2마디는 피아노 차례. 한 옥타브 아래 테너가 작게 겹친다
		const saxOn = this.mix.sax > 0.05;
		if ( saxOn && s === 0 && this.bar % 4 === 0 ) {

			this.saxPlan = this.planSax();
			if ( this.saxPlan ) this.saxPhrase( t, this.saxPlan.map( ( [ step, midi, len ] ) => [ step, midi - 12, len ] ), 0.24 * TENOR_LEVEL );

		}
		const saxTurn = saxOn && this.saxPlan && this.bar % 4 < 2;
		if ( saxTurn ) {

			const local = ( this.bar % 4 ) * 12 + s;
			for ( const [ step, midi, len ] of this.saxPlan ) if ( step === local ) this.sax( t, midi, 0.2, len * STEP );

		}

		// 즉흥 멜로디 (펜타토닉 랜덤 워크)
		if ( s === 0 ) this.melodyPlan = saxTurn ? null : this.planMelody();
		if ( this.melodyPlan && this.melodyPlan.includes( s ) ) {

			this.melodyIdx = Math.max( 0, Math.min( MELODY_SCALE.length - 1, this.melodyIdx + Math.floor( Math.random() * 5 ) - 2 ) );
			this.ep( t, MELODY_SCALE[ this.melodyIdx ], 0.2, BEAT * 0.9, this.buses.melody, 0.45 );

		}

		// 베이스 기타
		if ( s % 3 === 0 ) {

			const beat = s / 3;
			this.bass( t, chord.bass + chord.scale[ beat ], 0.55, BEAT * 0.85 );

		} else if ( s === 11 && Math.random() < 0.7 ) {

			this.bass( t, next.bass - 1, 0.35, STEP * 0.9 );

		}

		// 드럼
		const boss = this.mix.tension > 0.3;
		if ( s === 0 || s === 6 || ( boss && s % 3 === 0 ) ) this.kick( t );
		if ( s === 3 || s === 9 ) this.snare( t );
		if ( s % 3 !== 1 ) this.hat( t, s % 3 === 0 ? 0.08 : 0.045 );

		// 가끔 들려오는 고래 울음
		if ( s === 0 && this.bar % 8 === 4 && Math.random() < 0.6 ) this.whaleCall( t + Math.random() * BEAT, 'far' );

	}

	planSax() {

		if ( Math.random() < 0.15 ) return null;
		const pool = this.bar % 12 === 8 ? SAX_TURNAROUND : SAX_LICKS;
		return pool[ Math.floor( Math.random() * pool.length ) ];

	}

	planMelody() {

		const r = Math.random();
		const busy = this.mix.drums > 0.05 ? 0.35 : 0.55;
		if ( r < busy ) return null;
		const motifs = [ [ 0, 2, 3 ], [ 3, 5, 6, 8 ], [ 6, 9, 11 ], [ 2, 3, 5 ], [ 0, 3, 6, 9 ] ];
		return motifs[ Math.floor( Math.random() * motifs.length ) ];

	}

	// --- 악기 ---

	ep( t, midi, vel, dur, bus, reverb = 0.25 ) {

		const ctx = this.ctx;
		const f = mtof( midi );
		const car = ctx.createOscillator();
		const mod = ctx.createOscillator();
		const modGain = ctx.createGain();
		car.frequency.value = f;
		mod.frequency.value = f;
		modGain.gain.setValueAtTime( f * 2.2, t );
		modGain.gain.exponentialRampToValueAtTime( f * 0.25, t + 0.9 );
		mod.connect( modGain ).connect( car.frequency );

		const amp = ctx.createGain();
		amp.gain.setValueAtTime( 0.0001, t );
		amp.gain.exponentialRampToValueAtTime( vel, t + 0.006 );
		amp.gain.exponentialRampToValueAtTime( vel * 0.35, t + 0.45 );
		amp.gain.exponentialRampToValueAtTime( 0.0001, t + dur + 0.9 );
		car.connect( amp ).connect( bus );
		if ( reverb > 0 ) {

			const send = ctx.createGain();
			send.gain.value = reverb;
			amp.connect( send ).connect( this.reverb );

		}

		const end = t + dur + 1;
		car.start( t ); mod.start( t );
		car.stop( end ); mod.stop( end );

	}

	// 색소폰 느낌: 톱니파 두 개 + 숨소리, 반음 아래에서 미끄러져 올라오고 길게 끌면 비브라토
	sax( t, midi, vel, dur ) {

		const ctx = this.ctx;
		const f = mtof( midi );
		const end = t + dur + 0.3;

		const vib = ctx.createOscillator();
		vib.frequency.value = 5.3;
		const vibDepth = ctx.createGain();
		vibDepth.gain.setValueAtTime( 0, t );
		vibDepth.gain.linearRampToValueAtTime( 0, t + 0.22 );
		vibDepth.gain.linearRampToValueAtTime( f * 0.012, t + 0.6 );
		vib.connect( vibDepth );

		const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
		o1.type = o2.type = 'sawtooth';
		o2.detune.value = 7;
		for ( const o of [ o1, o2 ] ) {

			o.frequency.setValueAtTime( f * 0.944, t );
			o.frequency.exponentialRampToValueAtTime( f, t + 0.07 );
			vibDepth.connect( o.frequency );

		}

		const pre = ctx.createGain();
		pre.gain.value = 0.5;
		const drive = ctx.createWaveShaper();
		drive.curve = SAX_CURVE;
		const tone = ctx.createBiquadFilter();
		tone.type = 'lowpass';
		tone.Q.value = 1.2;
		tone.frequency.setValueAtTime( f * 2, t );
		tone.frequency.exponentialRampToValueAtTime( Math.min( f * 7, 4200 ), t + 0.08 );
		tone.frequency.exponentialRampToValueAtTime( Math.min( f * 4.5, 3000 ), t + 0.35 );
		const formant = ctx.createBiquadFilter();
		formant.type = 'peaking';
		formant.frequency.value = 1150;
		formant.Q.value = 1.4;
		formant.gain.value = 7;

		const amp = ctx.createGain();
		amp.gain.setValueAtTime( 0.0001, t );
		amp.gain.exponentialRampToValueAtTime( vel, t + 0.045 );
		amp.gain.setTargetAtTime( vel * 0.8, t + 0.08, 0.2 );
		amp.gain.setTargetAtTime( 0.0001, t + dur, 0.06 );
		o1.connect( pre );
		o2.connect( pre );
		pre.connect( drive ).connect( tone ).connect( formant ).connect( amp ).connect( this.buses.sax );

		// 숨소리
		const breath = ctx.createBufferSource();
		breath.buffer = this.noise;
		const bf = ctx.createBiquadFilter();
		bf.type = 'bandpass';
		bf.frequency.value = Math.min( f * 3, 3500 );
		bf.Q.value = 1.2;
		const bg = ctx.createGain();
		bg.gain.setValueAtTime( 0.0001, t );
		bg.gain.exponentialRampToValueAtTime( vel * 0.12, t + 0.03 );
		bg.gain.setTargetAtTime( vel * 0.035, t + 0.06, 0.08 );
		bg.gain.setTargetAtTime( 0.0001, t + dur, 0.05 );
		breath.connect( bf ).connect( bg ).connect( this.buses.sax );

		const send = ctx.createGain();
		send.gain.value = 0.3;
		amp.connect( send ).connect( this.reverb );

		for ( const n of [ vib, o1, o2 ] ) {

			n.start( t );
			n.stop( end );

		}

		breath.start( t, Math.random() * 1.5 );
		breath.stop( end );

	}

	// 테너 색소폰: 한 구절을 한 숨에 분다. 음과 음 사이는 미끄러지듯 잇고(레가토), 쉬었다 시작하는 음은 반음 아래에서 올라온다.
	// 긴 음은 점점 커지며 비브라토, 구절 끝은 가끔 음이 떨어지며 사라진다.
	saxPhrase( t0, notes, vel = 0.24 ) {

		const ctx = this.ctx;
		const osc = ctx.createOscillator();
		osc.setPeriodicWave( saxWave( ctx ) );
		const vib = ctx.createOscillator();
		vib.frequency.value = 5.2;
		const vibDepth = ctx.createGain();
		vibDepth.gain.value = 0;
		vib.connect( vibDepth ).connect( osc.frequency );

		const pre = ctx.createGain();
		pre.gain.value = 0.6;
		const drive = ctx.createWaveShaper();
		drive.curve = SAX_CURVE;
		const tone = ctx.createBiquadFilter();
		tone.type = 'lowpass';
		tone.Q.value = 0.9;
		const low = ctx.createBiquadFilter();
		low.type = 'peaking'; low.frequency.value = 550; low.Q.value = 1.2; low.gain.value = 4;
		const mid = ctx.createBiquadFilter();
		mid.type = 'peaking'; mid.frequency.value = 1500; mid.Q.value = 1.6; mid.gain.value = 6;
		const amp = ctx.createGain();
		amp.gain.value = 0;
		osc.connect( pre ).connect( drive ).connect( tone ).connect( low ).connect( mid ).connect( amp ).connect( this.buses.sax );
		const send = ctx.createGain();
		send.gain.value = 0.32;
		amp.connect( send ).connect( this.reverb );

		const breath = ctx.createBufferSource();
		breath.buffer = this.noise;
		breath.loop = true;
		const bf = ctx.createBiquadFilter();
		bf.type = 'bandpass'; bf.frequency.value = 1900; bf.Q.value = 0.9;
		const bg = ctx.createGain();
		bg.gain.value = 0;
		breath.connect( bf ).connect( bg ).connect( this.buses.sax );

		let prevEnd = - 1, prevF = 0, first = 0;
		notes.forEach( ( [ step, midi, len ], i ) => {

			const tn = t0 + step * STEP, te = tn + len * STEP, f = mtof( midi );
			const fresh = i === 0 || tn - prevEnd > 0.02;
			if ( i === 0 ) first = tn;
			if ( fresh ) {

				if ( i > 0 ) amp.gain.setTargetAtTime( 0, prevEnd, 0.03 );
				osc.frequency.setValueAtTime( f * 0.944, tn );
				osc.frequency.exponentialRampToValueAtTime( f, tn + 0.08 );
				amp.gain.setValueAtTime( 0.0001, tn );
				amp.gain.exponentialRampToValueAtTime( vel, tn + 0.05 );

			} else {

				osc.frequency.setValueAtTime( prevF, tn );
				osc.frequency.exponentialRampToValueAtTime( f, tn + 0.05 );
				amp.gain.setValueAtTime( vel * 0.95, tn );
				amp.gain.linearRampToValueAtTime( vel * 0.62, tn + 0.025 );
				amp.gain.linearRampToValueAtTime( vel, tn + 0.08 );

			}

			if ( len >= 4 ) amp.gain.linearRampToValueAtTime( vel * 1.15, te - 0.04 );

			vibDepth.gain.setValueAtTime( 0, tn );
			if ( len >= 4 ) {

				vibDepth.gain.linearRampToValueAtTime( 0, tn + 0.25 );
				vibDepth.gain.linearRampToValueAtTime( f * 0.012, te - 0.02 );

			}

			tone.frequency.setValueAtTime( 900 + f, tn );
			tone.frequency.exponentialRampToValueAtTime( 3000, tn + 0.06 );
			tone.frequency.exponentialRampToValueAtTime( 2000, Math.min( tn + 0.3, te - 0.01 ) );

			bg.gain.setValueAtTime( vel * 0.03, tn );
			bg.gain.linearRampToValueAtTime( vel * ( fresh ? 0.16 : 0.08 ), tn + 0.02 );
			bg.gain.setTargetAtTime( vel * 0.03, tn + 0.04, 0.06 );

			prevEnd = te;
			prevF = f;

		} );

		const last = notes[ notes.length - 1 ];
		if ( last[ 2 ] >= 3 && Math.random() < 0.5 ) {

			const fl = mtof( last[ 1 ] );
			osc.frequency.setValueAtTime( fl, prevEnd - 0.12 );
			osc.frequency.exponentialRampToValueAtTime( fl * 0.8, prevEnd + 0.22 );

		}

		amp.gain.setTargetAtTime( 0, prevEnd, 0.07 );
		bg.gain.setTargetAtTime( 0, prevEnd, 0.05 );

		const stop = prevEnd + 0.8;
		for ( const n of [ osc, vib ] ) {

			n.start( first );
			n.stop( stop );

		}

		breath.start( first, Math.random() * 1.5 );
		breath.stop( stop );

	}

	bass( t, midi, vel, dur ) {

		if ( this.mix.bass < 0.02 ) return;
		const ctx = this.ctx;
		const f = mtof( midi );
		const o1 = ctx.createOscillator();
		const o2 = ctx.createOscillator();
		o1.type = 'sawtooth'; o1.frequency.value = f;
		o2.type = 'square'; o2.frequency.value = f / 2;
		const sub = ctx.createGain(); sub.gain.value = 0.35;
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.Q.value = 3;
		filter.frequency.setValueAtTime( 1100, t );
		filter.frequency.exponentialRampToValueAtTime( 190, t + 0.22 );
		const amp = ctx.createGain();
		amp.gain.setValueAtTime( 0.0001, t );
		amp.gain.exponentialRampToValueAtTime( vel, t + 0.008 );
		amp.gain.exponentialRampToValueAtTime( vel * 0.5, t + 0.12 );
		amp.gain.exponentialRampToValueAtTime( 0.0001, t + dur );
		o1.connect( filter );
		o2.connect( sub ).connect( filter );
		filter.connect( amp ).connect( this.buses.bass );
		o1.start( t ); o2.start( t );
		o1.stop( t + dur + 0.05 ); o2.stop( t + dur + 0.05 );

	}

	kick( t ) {

		if ( this.mix.drums < 0.02 ) return;
		const ctx = this.ctx;
		const o = ctx.createOscillator();
		o.frequency.setValueAtTime( 115, t );
		o.frequency.exponentialRampToValueAtTime( 42, t + 0.13 );
		const g = ctx.createGain();
		g.gain.setValueAtTime( 0.7, t );
		g.gain.exponentialRampToValueAtTime( 0.0001, t + 0.38 );
		o.connect( g ).connect( this.buses.drums );
		o.start( t ); o.stop( t + 0.4 );

	}

	noiseHit( t, { type = 'bandpass', freq = 1800, q = 0.7, vel = 0.2, dur = 0.15, bus } ) {

		const ctx = this.ctx;
		const src = ctx.createBufferSource();
		src.buffer = this.noise;
		const f = ctx.createBiquadFilter();
		f.type = type; f.frequency.value = freq; f.Q.value = q;
		const g = ctx.createGain();
		g.gain.setValueAtTime( vel, t );
		g.gain.exponentialRampToValueAtTime( 0.0001, t + dur );
		src.connect( f ).connect( g ).connect( bus );
		src.start( t, Math.random() * 1.5 );
		src.stop( t + dur + 0.02 );
		return g;

	}

	snare( t ) {

		if ( this.mix.drums < 0.02 ) return;
		this.noiseHit( t, { freq: 2200, q: 0.6, vel: 0.16, dur: 0.2, bus: this.buses.drums } );

	}

	hat( t, vel ) {

		if ( this.mix.drums < 0.02 ) return;
		this.noiseHit( t, { type: 'highpass', freq: 7500, q: 0.5, vel, dur: 0.045, bus: this.buses.drums } );

	}

	// --- 효과음 ---

	voice( t, points, { vel = 0.25, vibrato = 5, depth = 0.012, bus = this.sfx, reverb = 0.8, type = 'sine' } = {} ) {

		const ctx = this.ctx;
		const o = ctx.createOscillator();
		o.type = type;
		o.frequency.setValueAtTime( points[ 0 ][ 1 ], t );
		for ( const [ dt, f ] of points.slice( 1 ) ) o.frequency.exponentialRampToValueAtTime( f, t + dt );
		const lfo = ctx.createOscillator();
		lfo.frequency.value = vibrato;
		const lg = ctx.createGain();
		lg.gain.value = points[ 0 ][ 1 ] * depth;
		lfo.connect( lg ).connect( o.frequency );
		const dur = points[ points.length - 1 ][ 0 ];
		const g = ctx.createGain();
		g.gain.setValueAtTime( 0.0001, t );
		g.gain.exponentialRampToValueAtTime( vel, t + Math.min( 0.25, dur * 0.3 ) );
		g.gain.setValueAtTime( vel, t + dur * 0.65 );
		g.gain.exponentialRampToValueAtTime( 0.0001, t + dur );
		o.connect( g ).connect( bus );
		const send = ctx.createGain();
		send.gain.value = reverb;
		g.connect( send ).connect( this.reverb );
		o.start( t ); lfo.start( t );
		o.stop( t + dur + 0.05 ); lfo.stop( t + dur + 0.05 );

	}

	whaleCall( t, kind ) {

		if ( ! this.ctx ) return;
		t = t ?? this.ctx.currentTime;
		switch ( kind ) {

			case 'far':
				this.voice( t, [ [ 0, 260 ], [ 1.2, 390 ], [ 2.6, 300 ] ], { vel: 0.05, bus: this.buses.hum, reverb: 1.4 } );
				break;
			case 'luke':
				this.voice( t, [ [ 0, 520 ], [ 0.35, 760 ], [ 0.9, 620 ] ], { vel: 0.14, vibrato: 7 } );
				break;
			case 'finn':
				for ( let i = 0; i < 5; i ++ ) this.noiseHit( t + i * 0.07, { freq: 3000, q: 8, vel: 0.12, dur: 0.03, bus: this.sfx } );
				this.voice( t + 0.4, [ [ 0, 980 ], [ 0.5, 1400 ], [ 1.1, 1100 ] ], { vel: 0.08, vibrato: 9 } );
				break;
			case 'moby':
				this.voice( t, [ [ 0, 70 ], [ 1.5, 95 ], [ 3.2, 58 ] ], { vel: 0.4, type: 'triangle', reverb: 1.2 } );
				break;
			case 'stella':
				this.voice( t, [ [ 0, 104 ], [ 1.2, 156 ], [ 2.4, 208 ], [ 3.6, 156 ] ], { vel: 0.22, reverb: 1.6 } );
				this.voice( t + 0.6, [ [ 0, 624 ], [ 1.5, 832 ], [ 3, 728 ] ], { vel: 0.06, reverb: 1.6 } );
				break;

		}

	}

	play( name, opt = {} ) {

		if ( ! this.ctx ) return;
		const t = this.ctx.currentTime + 0.01;
		switch ( name ) {

			case 'sing': {

				const ctx = this.ctx;
				const o = ctx.createOscillator();
				o.frequency.value = 52;
				const g = ctx.createGain();
				g.gain.setValueAtTime( 0.0001, t );
				g.gain.exponentialRampToValueAtTime( 0.55, t + 0.2 );
				g.gain.exponentialRampToValueAtTime( 0.0001, t + 1.8 );
				o.connect( g ).connect( this.sfx );
				o.start( t ); o.stop( t + 1.9 );
				this.voice( t, [ [ 0, 312 ], [ 0.5, 468 ], [ 1.6, 364 ] ], { vel: 0.16 } );
				this.voice( t, [ [ 0, 156 ], [ 0.5, 208 ], [ 1.6, 182 ] ], { vel: 0.1 } );
				break;

			}

			case 'splash':
				this.noiseHit( t, { type: 'lowpass', freq: 1800, q: 0.5, vel: opt.vel ?? 0.35, dur: 0.7, bus: this.sfx } );
				break;
			case 'pickup':
				[ 81, 88, 93, 100 ].forEach( ( m, i ) => this.ep( t + i * 0.07, m, 0.18, 0.4, this.sfx, 0.5 ) );
				break;
			case 'objective':
				[ 76, 83, 88 ].forEach( ( m, i ) => this.ep( t + i * 0.11, m, 0.2, 0.8, this.sfx, 0.6 ) );
				break;
			case 'join':
				[ 69, 73, 76, 81, 85, 88 ].forEach( ( m, i ) => this.ep( t + i * 0.09, m, 0.17, 1.2, this.sfx, 0.7 ) );
				break;
			case 'hit': {

				const ctx = this.ctx;
				const o = ctx.createOscillator();
				o.frequency.setValueAtTime( 140, t );
				o.frequency.exponentialRampToValueAtTime( 40, t + 0.25 );
				const g = ctx.createGain();
				g.gain.setValueAtTime( 0.6, t );
				g.gain.exponentialRampToValueAtTime( 0.0001, t + 0.4 );
				o.connect( g ).connect( this.sfx );
				o.start( t ); o.stop( t + 0.45 );
				this.noiseHit( t, { type: 'lowpass', freq: 900, q: 1, vel: 0.4, dur: 0.3, bus: this.sfx } );
				break;

			}

			case 'blip':
				this.ep( t, 88, 0.06, 0.05, this.sfx, 0 );
				break;
			case 'sonar':
				this.voice( t, [ [ 0, 1320 ], [ 0.9, 1250 ] ], { vel: 0.06, vibrato: 0.1, reverb: 1.2 } );
				break;
			case 'warn':
				this.voice( t, [ [ 0, 1800 ], [ 1.2, 500 ] ], { vel: 0.05, vibrato: 0.1, reverb: 0.4, type: 'triangle' } );
				break;
			case 'boom': {

				const ctx = this.ctx;
				const o = ctx.createOscillator();
				o.frequency.setValueAtTime( 90, t );
				o.frequency.exponentialRampToValueAtTime( 30, t + 0.6 );
				const g = ctx.createGain();
				g.gain.setValueAtTime( 0.55, t );
				g.gain.exponentialRampToValueAtTime( 0.0001, t + 0.9 );
				o.connect( g ).connect( this.sfx );
				o.start( t ); o.stop( t + 1 );
				this.noiseHit( t, { type: 'lowpass', freq: 2400, q: 0.5, vel: 0.35, dur: 1.0, bus: this.sfx } );
				break;

			}

			case 'dash':
				this.voice( t, [ [ 0, 420 ], [ 0.35, 1250 ] ], { vel: 0.08, vibrato: 0.1, reverb: 0.6, type: 'triangle' } );
				[ 76, 81, 88, 93 ].forEach( ( m, i ) => this.ep( t + i * 0.05, m, 0.14, 0.5, this.sfx, 0.6 ) );
				break;
			case 'heal':
				[ 72, 76, 79, 84 ].forEach( ( m, i ) => this.ep( t + i * 0.06, m, 0.12, 0.6, this.sfx, 0.6 ) );
				break;
			case 'sad':
				[ 69, 64, 60, 57 ].forEach( ( m, i ) => this.ep( t + i * 0.5, m, 0.15, 1.5, this.sfx, 0.9 ) );
				break;

		}

	}

}
