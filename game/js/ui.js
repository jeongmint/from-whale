import { SPEAKERS } from './story.js';
import { fillName } from './name.js';
import { lang, t } from './i18n.js';

const $ = ( id ) => document.getElementById( id );

const HEART_SVG = `<svg viewBox="0 0 11 10" shape-rendering="crispEdges"><path fill="#7fe9ff" d="M1 1h3v1h1v1h1V2h1V1h3v1h1v3h-1v1h-1v1h-1v1h-1v1H5V8H4V7H3V6H2V5H1V4H0V2h1z"/><path fill="#eaf6ff" d="M2 2h1v1H2z"/></svg>`;

export class UI {

	constructor( game ) {

		this.game = game;
		this.portraits = {};
		this.dialogQueue = null;
		this.typing = null;
		this.toastCount = 0;

		$( 'dialog' ).addEventListener( 'pointerdown', ( e ) => {

			e.stopPropagation();
			this.advance();

		} );

		document.querySelectorAll( '[data-close]' ).forEach( ( b ) => b.addEventListener( 'click', () => this.closeOverlay() ) );

	}

	// 터치 기기에서는 키보드 안내를 버튼 안내로 바꾼다
	dev( s ) {

		s = fillName( s, this.game.playerName );
		if ( ! this.game.touch || ! s ) return s;
		for ( const [ keys, touch ] of lang().ui.touchKeys ) s = s.split( keys ).join( touch );
		return s
			.replace( /\[E\]/g, '[♪]' ).replace( /\[Space\]/g, '[⤴]' ).replace( /\[L\]/g, '[✉]' )
			.replace( /<kbd>E<\/kbd>/g, '<kbd>♪</kbd>' ).replace( /<kbd>Space<\/kbd>/g, '<kbd>⤴</kbd>' );

	}

	show( id, on = true ) {

		$( id ).classList.toggle( 'hidden', ! on );

	}

	// --- 상태창 ---

	setHearts( n, max ) {

		const el = $( 'hearts' );
		if ( el.childElementCount !== max ) {

			el.innerHTML = Array.from( { length: max }, () => HEART_SVG ).join( '' );

		}

		[ ...el.children ].forEach( ( svg, i ) => svg.classList.toggle( 'lost', i >= n ) );
		if ( this.lastHearts !== undefined && n < this.lastHearts ) {

			el.classList.remove( 'hit' );
			void el.offsetWidth;
			el.classList.add( 'hit' );

		}

		this.lastHearts = n;

	}

	setStamina( v, dash = false ) {

		const m = $( 'stamina' );
		m.firstElementChild.style.width = `${Math.max( 0, v ) * 100}%`;
		m.classList.toggle( 'low', v < 0.25 && ! dash );
		m.classList.toggle( 'dash', dash );

	}

	setBottles( n, total ) {

		$( 'bottle-count' ).textContent = `${n}/${total}`;

	}

	setParty( members ) {

		$( 'party' ).innerHTML = members.map( ( m ) => {

			const img = this.portraits[ m.key ];
			const style = m.state !== 'none' && img ? `style="background-image:url(${img})"` : '';
			const cls = m.state === 'on' ? 'on' : m.state === 'gone' ? 'on gone' : '';
			return `<div class="slot ${cls}" ${style}>${m.state === 'none' ? '?' : ''}<small>${m.state === 'none' ? '???' : m.name}</small></div>`;

		} ).join( '' );

	}

	setPlayerName( name, isDefault ) {

		$( 'hud-name' ).textContent = isDefault ? 'HAZEL.52HZ' : `${name.toUpperCase()}.52HZ`;

	}

	setMuted( muted ) {

		$( 'btn-mute' ).classList.toggle( 'off', muted );

	}

	// --- 목표 ---

	setObjective( chapter, text ) {

		const label = $( 'obj-chapter' );
		label.textContent = chapter;
		// 좁은 자리(세로 폰)에서는 거리 앞에 짧은 이름만: 'CHAPTER 01 · 등대지기' → 'CH.01'
		$( 'obj-dist' ).dataset.chapter = chapter.split( ' · ' )[ 0 ].replace( /^CHAPTER\s*/i, 'CH.' );
		$( 'obj-text' ).textContent = this.dev( text );
		const box = $( 'hud-objective' );
		box.classList.remove( 'pulse' );
		void box.offsetWidth;
		box.classList.add( 'pulse' );

	}

	setDistance( d ) {

		$( 'obj-dist' ).textContent = d == null ? '' : `▲ ${Math.round( d )}m`;

	}

	banner( small, strong, em = '', kind = '' , seconds = 2.8 ) {

		const b = $( 'banner' );
		clearTimeout( this.bannerTimer );
		b.className = kind;
		b.querySelector( 'small' ).textContent = this.dev( small );
		b.querySelector( 'strong' ).textContent = this.dev( strong );
		b.querySelector( 'em' ).textContent = this.dev( em );
		void b.offsetWidth;
		this.bannerTimer = setTimeout( () => {

			b.classList.add( 'out' );
			this.bannerTimer = setTimeout( () => b.classList.add( 'hidden' ), 500 );

		}, seconds * 1000 );

	}

	toast( text ) {

		const el = document.createElement( 'div' );
		el.className = 'toast';
		el.textContent = this.dev( text );
		$( 'toasts' ).appendChild( el );
		setTimeout( () => el.remove(), 3800 );

	}

	prompt( html ) {

		const p = $( 'prompt' );
		if ( ! html ) {

			p.classList.add( 'hidden' );
			this.lastPrompt = null;
			return;

		}

		if ( this.lastPrompt !== html ) {

			p.innerHTML = this.dev( html );
			this.lastPrompt = html;

		}

		p.classList.remove( 'hidden' );

	}

	// --- 챕터 카드 ---

	card( num, title, sub, seconds = 3.6, extra = '' ) {

		const c = $( 'card' );
		$( 'card-num' ).textContent = num;
		$( 'card-title' ).textContent = this.dev( title );
		$( 'card-sub' ).textContent = this.dev( sub );
		$( 'card-extra' ).innerHTML = fillName( extra, this.game.playerName, true );
		c.className = '';
		return new Promise( ( resolve ) => {

			setTimeout( () => {

				c.classList.add( 'out' );
				setTimeout( () => {

					c.classList.add( 'hidden' );
					resolve();

				}, 900 );

			}, seconds * 1000 );

		} );

	}

	// --- 대화 ---

	say( lines ) {

		return new Promise( ( resolve ) => {

			this.dialogQueue = { lines: [ ...lines ], resolve };
			this.show( 'dialog' );
			document.body.classList.add( 'talking' );
			this.nextLine();

		} );

	}

	get dialogOpen() {

		return !! this.dialogQueue;

	}

	nextLine() {

		const q = this.dialogQueue;
		const line = q.lines.shift();
		if ( ! line ) {

			this.show( 'dialog', false );
			document.body.classList.remove( 'talking' );
			this.dialogQueue = null;
			q.resolve();
			return;

		}

		const sp = SPEAKERS[ line.who ] ?? SPEAKERS.narrator;
		const d = $( 'dialog' );
		d.className = 'win';
		if ( ! sp.portrait ) d.classList.add( 'no-portrait' );
		if ( line.who === 'narrator' ) d.classList.add( 'narrator' );
		if ( line.who === 'hazel' ) d.classList.add( 'hertz' );
		const name = $( 'dialog-name' );
		name.textContent = this.dev( line.name ?? ( lang().speakers[ line.who ] || 'NARRATION' ) );
		$( 'dialog' ).querySelector( '.win-bar' ).style.background = sp.bar ?? '';
		const img = this.portraits[ sp.portrait ];
		$( 'dialog-portrait' ).style.backgroundImage = img ? `url(${img})` : '';

		this.game.audio.play( 'blip' );
		line.onShow?.();

		const text = this.dev( line.text );
		const el = $( 'dialog-text' );
		el.textContent = '';
		let i = 0;
		clearInterval( this.typing );
		this.typing = setInterval( () => {

			i += 1;
			el.textContent = text.slice( 0, i );
			if ( i >= text.length ) {

				clearInterval( this.typing );
				this.typing = null;

			}

		}, 28 );
		this.currentText = text;

	}

	advance() {

		if ( ! this.dialogQueue ) return false;
		if ( this.typing ) {

			clearInterval( this.typing );
			this.typing = null;
			$( 'dialog-text' ).textContent = this.currentText;
			return true;

		}

		this.nextLine();
		return true;

	}

	// --- 편지 / 편지함 ---

	letter( { head, body, from, scrambled } ) {

		$( 'letter-head' ).textContent = head;
		const b = $( 'letter-body' );
		b.textContent = body;
		b.classList.toggle( 'scrambled', !! scrambled );
		$( 'letter-from' ).textContent = from ?? '';
		this.show( 'letter' );
		this.overlay = 'letter';
		return new Promise( ( resolve ) => {

			this.overlayResolve = resolve;

		} );

	}

	journal( entries, total ) {

		const list = $( 'journal-list' );
		const items = entries.map( ( e ) => e.read
			? `<li><b>${e.head}</b><p>${e.body}</p><p style="text-align:right;color:var(--cyan)">${e.from}</p></li>`
			: `<li class="unread"><b>${e.head}</b><p>${e.scrambled}</p></li>` );
		for ( let i = entries.length; i < total; i ++ ) items.push( `<li class="empty">${t( 'journal.empty' )}</li>` );
		list.innerHTML = items.join( '' );
		this.show( 'journal' );
		this.overlay = 'journal';
		return new Promise( ( resolve ) => {

			this.overlayResolve = resolve;

		} );

	}

	closeOverlay() {

		if ( ! this.overlay ) return false;
		this.show( this.overlay, false );
		this.overlay = null;
		const r = this.overlayResolve;
		this.overlayResolve = null;
		r?.();
		return true;

	}

	// --- 보스 게이지 ---

	setBoss( on, value = 0, max = 5, hint = '' ) {

		this.show( 'hud-boss', on );
		if ( ! on ) return;
		const g = $( 'boss-gauge' );
		if ( g.childElementCount !== max ) g.innerHTML = '<span></span>'.repeat( max );
		[ ...g.children ].forEach( ( s, i ) => s.classList.toggle( 'on', i < value ) );
		$( 'boss-hint' ).textContent = hint;

	}

	// --- 화면 전환 ---

	fade( to, seconds = 1 ) {

		const f = $( 'fade' );
		f.style.transition = `opacity ${seconds}s`;
		f.style.opacity = to;
		return new Promise( ( r ) => setTimeout( r, seconds * 1000 ) );

	}

	// --- 목표 표시 (화면 안: 마름모 / 밖: 가장자리 화살표) ---

	updateMarker( screen, dist, visible ) {

		const marker = $( 'marker' ), arrow = $( 'edge-arrow' );
		if ( ! visible ) {

			marker.classList.add( 'hidden' );
			arrow.classList.add( 'hidden' );
			return;

		}

		const { w, h } = this.game.view;
		const label = `${Math.round( dist )}m`;
		const margin = 48;
		if ( screen.onScreen ) {

			arrow.classList.add( 'hidden' );
			marker.classList.remove( 'hidden' );
			marker.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -100%)`;
			marker.querySelector( 'span' ).textContent = label;

		} else {

			marker.classList.add( 'hidden' );
			arrow.classList.remove( 'hidden' );
			const cx = w / 2, cy = h / 2;
			let dx = screen.x - cx, dy = screen.y - cy;
			if ( screen.behind ) {

				dx = - dx; dy = - dy;
				if ( dy < 0 ) dy = Math.abs( dy ) + h;

			}

			const s = Math.min( ( w / 2 - margin ) / Math.abs( dx || 1e-6 ), ( h / 2 - margin ) / Math.abs( dy || 1e-6 ) );
			// 위쪽 상태창과 아래쪽 소나에 겹치지 않게
			const x = Math.max( margin, Math.min( w - margin, cx + dx * s ) );
			const bottom = x > w - 260 ? 240 : margin;
			const y = Math.max( 130, Math.min( h - bottom, cy + dy * s ) );
			const ang = Math.atan2( dy, dx ) + Math.PI / 2;
			arrow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
			arrow.querySelector( '.arrow' ).style.transform = `rotate(${ang}rad)`;
			arrow.querySelector( 'span' ).textContent = label;

		}

	}

	// 부서진 나침반 게이지 (소나 창 제목줄). null이면 숨긴다
	setCompass( v ) {

		const el = $( 'compass-meter' );
		el.hidden = v === null;
		if ( v === null ) return;
		el.querySelector( '.fill' ).style.width = `${Math.round( v * 100 )}%`;
		el.classList.toggle( 'weak', v <= 0.35 );

	}

	// --- 소나 미니맵 ---

	drawMinimap( data ) {

		const c = $( 'minimap' );
		const ctx = c.getContext( '2d' );
		const W = c.width, R = W / 2;
		const scale = R / data.range;
		ctx.clearRect( 0, 0, W, W );
		ctx.save();
		ctx.beginPath();
		ctx.arc( R, R, R - 1, 0, Math.PI * 2 );
		ctx.clip();
		ctx.fillStyle = 'rgba(2, 12, 40, 0.92)';
		ctx.fillRect( 0, 0, W, W );

		ctx.strokeStyle = 'rgba(95, 168, 255, 0.25)';
		ctx.lineWidth = 1;
		for ( let i = 1; i <= 3; i ++ ) {

			ctx.beginPath();
			ctx.arc( R, R, R * i / 3, 0, Math.PI * 2 );
			ctx.stroke();

		}

		ctx.beginPath();
		ctx.moveTo( R, 0 ); ctx.lineTo( R, W );
		ctx.moveTo( 0, R ); ctx.lineTo( W, R );
		ctx.stroke();

		// 회전하는 소나 빛
		const sweep = data.time * 1.6;
		const grad = ctx.createConicGradient ? ctx.createConicGradient( sweep, R, R ) : null;
		if ( grad ) {

			grad.addColorStop( 0, 'rgba(127, 233, 255, 0.28)' );
			grad.addColorStop( 0.12, 'rgba(127, 233, 255, 0)' );
			grad.addColorStop( 1, 'rgba(127, 233, 255, 0)' );
			ctx.fillStyle = grad;
			ctx.fillRect( 0, 0, W, W );

		}

		// 플레이어 기준으로 회전 (위쪽 = 바라보는 방향)
		const yaw = data.yaw;
		const cos = Math.cos( yaw ), sin = Math.sin( yaw );
		const toMap = ( x, z ) => {

			const dx = x - data.px, dz = z - data.pz;
			// 앞(forward) 방향이 화면 위쪽이 되도록 회전
			const fx = dx * sin + dz * cos; // 앞쪽 성분
			const rx = dx * cos - dz * sin; // 오른쪽 성분 (+x 쪽이 왼쪽이 되도록 부호 반전)
			return [ R - rx * scale, R - fx * scale ];

		};

		ctx.fillStyle = 'rgba(95, 140, 220, 0.35)';
		for ( const r of data.rocks ) {

			const [ x, y ] = toMap( r.x, r.z );
			if ( x < - 20 || y < - 20 || x > W + 20 || y > W + 20 ) continue;
			ctx.beginPath();
			ctx.arc( x, y, Math.max( 1.5, r.r * scale ), 0, Math.PI * 2 );
			ctx.fill();

		}

		const blip = ( p, color, size, shape = 'dot', clamp = false ) => {

			let [ x, y ] = toMap( p.x, p.z );
			const dx = x - R, dy = y - R;
			const d = Math.hypot( dx, dy );
			if ( d > R - 6 ) {

				if ( ! clamp ) return;
				x = R + dx / d * ( R - 7 );
				y = R + dy / d * ( R - 7 );

			}

			ctx.fillStyle = color;
			ctx.strokeStyle = color;
			ctx.beginPath();
			if ( shape === 'diamond' ) {

				ctx.moveTo( x, y - size ); ctx.lineTo( x + size, y ); ctx.lineTo( x, y + size ); ctx.lineTo( x - size, y );
				ctx.closePath();
				ctx.fill();

			} else if ( shape === 'ring' ) {

				ctx.lineWidth = 1.5;
				ctx.arc( x, y, size, 0, Math.PI * 2 );
				ctx.stroke();

			} else {

				ctx.arc( x, y, size, 0, Math.PI * 2 );
				ctx.fill();

			}

		};

		for ( const p of data.points ) blip( p, p.color, p.size ?? 3, p.shape, p.clamp );
		if ( data.objective ) blip( data.objective, '#ffd36b', 5, 'diamond', true );

		// 부서진 나침반: 흐려질수록 지직거리고, 다 흐려지면 신호 없음
		const signal = data.signal ?? 1;
		if ( signal < 0.35 ) {

			const noise = 1 - signal / 0.35;
			ctx.fillStyle = `rgba(2, 12, 40, ${signal <= 0 ? 0.94 : noise * ( 0.35 + Math.random() * 0.4 )})`;
			ctx.fillRect( 0, 0, W, W );
			ctx.fillStyle = 'rgba(157, 140, 255, 0.35)';
			for ( let i = 0; i < 4 + noise * 12; i ++ ) ctx.fillRect( 0, Math.random() * W, W, 1 + Math.random() * 2 );
			if ( signal <= 0 ) {

				ctx.fillStyle = '#9d8cff';
				ctx.font = `bold ${Math.round( W * 0.085 )}px monospace`;
				ctx.textAlign = 'center';
				ctx.fillText( 'NO SIGNAL', R, R + W * 0.2 );

			}

		}

		ctx.restore();

		// 플레이어 화살표 (지도 위쪽 = 카메라 정면, 화살표 = 고래가 바라보는 쪽)
		ctx.save();
		ctx.translate( R, R );
		ctx.rotate( - ( data.heading ?? 0 ) );
		ctx.fillStyle = '#eaf6ff';
		ctx.beginPath();
		ctx.moveTo( 0, - 7 ); ctx.lineTo( 5, 5 ); ctx.lineTo( 0, 2 ); ctx.lineTo( - 5, 5 );
		ctx.closePath();
		ctx.fill();
		ctx.restore();

		ctx.strokeStyle = 'rgba(127, 233, 255, 0.6)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc( R, R, R - 1, 0, Math.PI * 2 );
		ctx.stroke();

	}

}
