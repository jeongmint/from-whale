// MAP 3 · 고래들의 목소리: 소리만 낸다 (WebAudio 합성). 리듬 놀이는 symphony.js 하나뿐
const mtof = ( m ) => 440 * Math.pow( 2, ( m - 69 ) / 12 );

// 범고래의 휘파람 같은 소리. shaky가 클수록 떨리고 끝이 처진다 (울먹임)
export function orcaNote( G, midi, shaky = 0 ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.93 ], [ 0.07, f ], [ 0.4, f * ( 1 - shaky * 0.07 ) ] ], { vel: 0.08, vibrato: 6 + shaky * 6, depth: 0.01 + shaky * 0.03, reverb: 0.9 } );
	a.noiseHit( t, { freq: 3200, q: 7, vel: 0.03, dur: 0.03, bus: a.sfx } );

}

// 헤이즐: 52Hz의 낮은 울림이 깔린 노래
export function hazelNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.97 ], [ 0.05, f ], [ 0.44, f ] ], { vel: 0.13, vibrato: 6, reverb: 0.7 } );
	a.voice( t + 0.02, [ [ 0, f * 0.485 ], [ 0.06, f / 2 ], [ 0.5, f / 2 ] ], { vel: 0.07, vibrato: 4.5, reverb: 1 } );

}

// 루크의 뿔피리 같은 소리 (삼각파, 한 옥타브 아래가 받쳐 준다)
export function hornNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.96 ], [ 0.08, f ], [ 0.55, f ] ], { vel: 0.08, vibrato: 5, type: 'triangle', reverb: 0.9 } );
	a.voice( t, [ [ 0, f / 2 ], [ 0.6, f / 2 ] ], { vel: 0.05, vibrato: 4, reverb: 1 } );

}

// 옛 고래들의 노래 (노래 바위). 루크가 있으면 뿔로 들려준다
export function playOldSong( G, kind ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const t = ctx.currentTime + 0.05;
	if ( kind === 'hump' ) {

		// 혹등고래: 길게 오르내리는 노래가 되풀이된다
		[ [ 0, 260, 470, 330 ], [ 1.6, 300, 560, 360 ], [ 3.2, 240, 420, 280 ] ].forEach( ( [ d, f0, f1, f2 ] ) => a.voice( t + d, [ [ 0, f0 ], [ 0.6, f1 ], [ 1.4, f2 ] ], { vel: 0.1, vibrato: 4, reverb: 1.4 } ) );

	} else if ( kind === 'blue' ) {

		// 대왕고래: 아주 낮고 긴 소리
		a.voice( t, [ [ 0, 92 ], [ 2.2, 84 ], [ 4.2, 70 ] ], { vel: 0.26, type: 'triangle', vibrato: 1.5, reverb: 1.6 } );
		a.voice( t + 0.3, [ [ 0, 184 ], [ 2.2, 168 ], [ 4, 140 ] ], { vel: 0.05, vibrato: 1.5, reverb: 1.6 } );

	} else {

		// 향유고래: 무리마다 다른 딸깍 박자 (점 점 점 쉬고 점)
		[ 0, 0.22, 0.44, 0.9, 1.6, 1.82, 2.04, 2.5 ].forEach( ( d ) => a.noiseHit( t + d, { freq: 2600, q: 5, vel: 0.14, dur: 0.035, bus: a.sfx } ) );

	}

}

// 모비 딕: 아주 낮고 굵은 소리
export function mobyNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.95 ], [ 0.15, f ], [ 0.9, f * 0.97 ] ], { vel: 0.22, type: 'triangle', vibrato: 2.5, reverb: 1.3 } );

}

// 스텔라: 또 하나의 52Hz (맑은 소리 + 한 옥타브 아래)
export function stellaNote( G, midi ) {

	const a = G.audio, ctx = a.ctx;
	if ( ! ctx ) return;
	const f = mtof( midi ), t = ctx.currentTime + 0.01;
	a.voice( t, [ [ 0, f * 0.98 ], [ 0.06, f ], [ 0.5, f ] ], { vel: 0.09, vibrato: 5.5, reverb: 1.2 } );
	a.voice( t + 0.02, [ [ 0, f / 2 ], [ 0.55, f / 2 ] ], { vel: 0.06, vibrato: 4, reverb: 1.4 } );

}
