import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Ocean, sampleOcean, makeSurfaceDecal } from './ocean.js';
import { Sky } from './sky.js';
import { World } from './world.js';
import { loadModels, Whale, followSlot, idleCircle, steerTo, updateSwimTime, makePortraits } from './actors.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';
import { cleanName, loadName, saveName } from './name.js';
import { CHAPTERS, PLACES, BOTTLES, ORCA_PACKS, KELP_GROVES, scramble } from './story.js';
import { lang, t, setLang, applyStatic } from './i18n.js';

const BASE = window.FW_ASSET_BASE ?? '../';
const query = new URLSearchParams( location.search );
const LOW = ( query.get( 'q' ) ?? ( matchMedia( '(pointer: coarse)' ).matches ? 'low' : 'high' ) ) === 'low';
const DT_MAX = Number( query.get( 'dtmax' ) ) || 1 / 20;

const MAX_SPEED = 17;
const BOOST_SPEED = 33;
const TURN_RATE = 1.9;
const MAX_HEARTS = 3;
const DETECT = 56;
const DASH_SPEED = 50;
const SAVE_KEY = 'fromwhale.save.v1';

const $ = ( id ) => document.getElementById( id );

window.addEventListener( 'error', ( e ) => showError( e.message ) );
window.addEventListener( 'unhandledrejection', ( e ) => showError( e.reason?.stack ?? String( e.reason ) ) );
function showError( msg ) {

	const el = $( 'error' );
	el.textContent = `${t( 'error' )}\n${msg}`;
	el.classList.remove( 'hidden' );

}

// ---------------------------------------------------------------
// 렌더러 / 후처리
// ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer( { antialias: false, powerPreference: 'high-performance' } );
const pixelRatio = Math.min( window.devicePixelRatio, LOW ? 1 : 1.5 );
renderer.setPixelRatio( pixelRatio );
renderer.setSize( innerWidth, innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;
$( 'app' ).appendChild( renderer.domElement );

const scene = new THREE.Scene();
const fog = new THREE.FogExp2( new THREE.Color( 0x123572 ).convertSRGBToLinear(), 0.00105 );
scene.fog = fog;
const camera = new THREE.PerspectiveCamera( 55, innerWidth / innerHeight, 0.5, 4200 );
camera.position.set( 0, 10, 30 );

const moonDir = new THREE.Vector3( 0.42, 0.17, - 0.89 ).normalize();
scene.add( new THREE.HemisphereLight( 0x5f8dff, 0x041030, 0.75 ) );
const moonLight = new THREE.DirectionalLight( 0xc4dcff, 1.15 );
moonLight.position.copy( moonDir ).multiplyScalar( 100 );
scene.add( moonLight );
scene.add( new THREE.AmbientLight( 0x26407a, 0.35 ) );

const FinalShader = {
	uniforms: {
		tDiffuse: { value: null },
		uTime: { value: 0 },
		uFlash: { value: 0 },
		uHurt: { value: 0 },
		uExposure: { value: 1.08 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
	`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform float uTime;
		uniform float uFlash;
		uniform float uHurt;
		uniform float uExposure;
		varying vec2 vUv;
		vec3 aces( vec3 x ) { return clamp( ( x * ( 2.51 * x + 0.03 ) ) / ( x * ( 2.43 * x + 0.59 ) + 0.14 ), 0.0, 1.0 ); }
		float hash( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }
		void main() {
			vec2 c = vUv - 0.5;
			vec2 off = c * dot( c, c ) * 0.014;
			vec3 col;
			col.r = texture2D( tDiffuse, vUv + off ).r;
			col.g = texture2D( tDiffuse, vUv ).g;
			col.b = texture2D( tDiffuse, vUv - off ).b;
			col = aces( col * uExposure );
			col = LinearTosRGB( vec4( col, 1.0 ) ).rgb;
			float vig = smoothstep( 0.95, 0.2, length( c * vec2( 1.0, 1.15 ) ) );
			col *= mix( 0.6, 1.0, vig );
			col += vec3( 0.0, 0.015, 0.045 ) * ( 1.0 - vig );
			col *= 0.988 + 0.012 * sin( gl_FragCoord.y * 1.5708 );
			col += ( hash( gl_FragCoord.xy + fract( uTime ) * 100.0 ) - 0.5 ) * 0.028;
			col = mix( col, vec3( 1.0, 0.25, 0.4 ), uHurt * ( 1.0 - vig ) * 0.85 );
			col = mix( col, vec3( 1.0 ), uFlash );
			gl_FragColor = vec4( col, 1.0 );
		}
	`
};

const rt = new THREE.WebGLRenderTarget( 1, 1, { type: THREE.HalfFloatType, samples: renderer.capabilities.isWebGL2 && ! LOW ? 4 : 0 } );
const composer = new EffectComposer( renderer, rt );
composer.setPixelRatio( pixelRatio );
composer.setSize( innerWidth, innerHeight );
composer.addPass( new RenderPass( scene, camera ) );
const bloom = new UnrealBloomPass( new THREE.Vector2( innerWidth, innerHeight ), 0.85, 0.55, 0.8 );
composer.addPass( bloom );
const finalPass = new ShaderPass( FinalShader );
composer.addPass( finalPass );

function fitCamera() {

	camera.fov = innerWidth < innerHeight ? 74 : 55;
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();

}

fitCamera();
window.addEventListener( 'resize', () => {

	fitCamera();
	camera.updateProjectionMatrix();
	renderer.setSize( innerWidth, innerHeight );
	composer.setSize( innerWidth, innerHeight );

} );

// ---------------------------------------------------------------
// 게임 상태
// ---------------------------------------------------------------
const audio = new AudioEngine();

const G = {
	scene, camera, audio, PLACES,
	ui: null, world: null, ocean: null, sky: null,
	actors: {},
	orcas: [],
	bottles: [],
	kelps: {},
	groves: [],
	party: { luke: 'none', finn: 'none' },
	flags: {},
	stats: { swum: 0, time: 0 },
	time: 0,
	started: false,
	menuPaused: false,
	cutsceneOn: false,
	hearts: MAX_HEARTS,
	stamina: 1,
	invuln: 0,
	singCooldown: 0,
	jumpCooldown: 0,
	knock: new THREE.Vector3(),
	checkpoint: { x: 0, z: 0, yaw: Math.PI },
	objectiveTarget: null,
	camTarget: null,
	camOrbit: 0,
	shake: 0,
	waiters: [],
	listeners: {},
	pendingKelp: null,
	boss: null,
	shards: [],
	dash: 0,
	save: loadSave(),
	customName: loadName(),
	get playerName() {

		return this.customName || lang().defaultName;

	}
};
window.__fw = G;

function loadSave() {

	try {

		const s = JSON.parse( localStorage.getItem( SAVE_KEY ) );
		if ( s && typeof s.chapter === 'number' ) return s;

	} catch ( e ) { /* 저장 없음 */ }

	return { chapter: 0, bottles: [], read: [], kelps: [] };

}

function persist() {

	try {

		localStorage.setItem( SAVE_KEY, JSON.stringify( G.save ) );

	} catch ( e ) { /* 저장 불가 */ }

}

// ---------------------------------------------------------------
// 이야기용 API
// ---------------------------------------------------------------
Object.assign( G, {

	wait( seconds ) {

		const end = G.time + seconds;
		return G.until( () => G.time >= end );

	},

	until( check ) {

		return new Promise( ( resolve ) => G.waiters.push( { check, resolve } ) );

	},

	emit( name, data ) {

		const list = G.listeners[ name ];
		if ( ! list ) return;
		G.listeners[ name ] = [];
		list.forEach( ( fn ) => fn( data ) );

	},

	untilEvent( name ) {

		return new Promise( ( resolve ) => ( G.listeners[ name ] ??= [] ).push( resolve ) );

	},

	say( lines ) {

		return G.ui.say( lines );

	},

	card( num, title, sub, opts = {} ) {

		G.audio.play( 'objective' );
		return G.ui.card( num, title, sub, opts.seconds, opts.extra );

	},

	letter( data ) {

		G.audio.play( 'pickup' );
		return G.ui.letter( data );

	},

	toast( text ) {

		G.ui.toast( text );

	},

	banner( ...args ) {

		G.ui.banner( ...args );

	},

	objective( chapter, text, target = null ) {

		G.objectiveTarget = target;
		G.ui.setObjective( chapter, text );
		G.ui.banner( t( 'banner.objective' ), text, chapter );
		G.audio.play( 'objective' );

	},

	distTo( p ) {

		const h = G.actors.hazel.pos;
		return Math.hypot( p.x - h.x, p.z - h.z );

	},

	cutscene( on ) {

		G.cutsceneOn = on;
		if ( on ) G.actors.hazel.speed *= 0.5;

	},

	camFocus( target, opts = {} ) {

		G.camTarget = { target: target.pos ?? target, side: 1, dist: 42, height: 14, ...opts };

	},

	camRelease() {

		G.camTarget = null;

	},

	faceEachOther( actor ) {

		const h = G.actors.hazel;
		actor.hold = true;
		actor.speed = 0;
		actor.yaw = Math.atan2( h.pos.x - actor.pos.x, h.pos.z - actor.pos.z );
		G.faceTarget = actor.pos;

	},

	setMusic( mix ) {

		G.audio.setMix( mix );

	},

	join( key, ability ) {

		const actor = G.actors[ key ];
		actor.hold = false;
		G.faceTarget = null;
		G.party[ key ] = 'on';
		G.flags[ key + 'Joined' ] = true;
		G.ui.setParty( partyList() );
		G.audio.play( 'join' );
		G.audio.whaleCall( G.audio.ctx?.currentTime + 0.6, key );
		G.ui.banner( t( 'banner.companion' ), t( key === 'luke' ? 'banner.joinLuke' : 'banner.joinFinn' ), t( 'banner.ability', { text: ability } ), 'join', 4 );
		G.audio.setMix( key === 'luke' ? { bass: 0.9 } : { drums: 0.75 } );
		G.world.ring( actor.pos.x, actor.pos.z, { color: 0xffd36b, to: 40, life: 1.6 } );

	},

	reader() {

		if ( G.party.luke === 'on' ) return 'luke';
		if ( G.party.finn === 'on' ) return 'finn';
		return null;

	},

	unreadCount() {

		return G.save.bottles.filter( ( id ) => ! G.save.read.includes( id ) ).length;

	},

	readAllBottles() {

		G.save.read = [ ...G.save.bottles ];
		persist();

	},

	bottleCount() {

		return G.save.bottles.length;

	},

	spawnStoryBottle() {

		const h = G.actors.hazel;
		const f = h.forward;
		const p = { x: h.pos.x + f.x * 55 + f.z * 12, z: h.pos.z + f.z * 55 - f.x * 12 };
		const b = G.world.makeBottle( p, 0 );
		b.reveal = 999;
		G.bottles.push( b );
		G.audio.play( 'sonar' );
		return b;

	},

	readKelp( key ) {

		G.pendingKelp = key;
		return G.untilEvent( 'kelp:' + key );

	},

	setStarfall( on ) {

		G.sky.meteorShower = on ? 0.7 : 0;
		G.targetWaves = on ? 0.95 : 0.65;

	},

	// --- 3장: 매복 ---

	spawnShaman() {

		const s = G.actors.shaman;
		const h = G.actors.hazel;
		const f = h.forward;
		s.place( h.pos.x + f.x * 62, h.pos.z + f.z * 62 );
		s.yaw = Math.atan2( - f.x, - f.z );
		s.depth = 22;
		s.targetDepth = 0;
		s.root.visible = true;
		s.setGlow( 0.18, 0xff2050 );
		return s;

	},

	spawnAmbush( n, radius ) {

		const h = G.actors.hazel;
		const ring = [];
		for ( let i = 0; i < n; i ++ ) {

			const a = ( i / n ) * Math.PI * 2 + 0.3;
			const w = new Whale( G.models.orca, { name: 'ambush', length: 10, ride: 0.42, freq: 3, amp: 0.06 } );
			w.place( h.pos.x + Math.cos( a ) * radius, h.pos.z + Math.sin( a ) * radius );
			w.yaw = Math.atan2( h.pos.x - w.pos.x, h.pos.z - w.pos.z );
			w.depth = 10;
			w.targetDepth = 0;
			scene.add( w.root );
			const o = makeOrcaAgent( w, { x: w.pos.x, z: w.pos.z, r: 10 }, 'hold' );
			o.ambush = true;
			G.orcas.push( o );
			ring.push( o );

		}

		G.audio.play( 'warn' );
		return ring;

	},

	ambushCharge( ring ) {

		ring.forEach( ( o ) => o.state = 'close' );

	},

	async lukeShield( ring ) {

		const luke = G.actors.luke;
		const h = G.actors.hazel;
		const shaman = G.actors.shaman;
		G.party.luke = 'busy';
		const dx = shaman.pos.x - h.pos.x, dz = shaman.pos.z - h.pos.z;
		const d = Math.hypot( dx, dz );
		luke.scripted = { x: h.pos.x + dx / d * 10, z: h.pos.z + dz / d * 10, speed: 45 };
		const t0 = G.time;
		await G.until( () => Math.hypot( luke.pos.x - luke.scripted.x, luke.pos.z - luke.scripted.z ) < 3 || G.time - t0 > 3 );
		luke.breach( 9 );
		await G.wait( 0.5 );
		G.flash( 0.9 );
		G.shake = 1.2;
		G.audio.play( 'hit' );
		G.audio.play( 'boom' );
		G.world.ring( luke.pos.x, luke.pos.z, { color: 0xffd36b, to: 70, life: 1.2, width: 0.25 } );
		G.world.splash( luke.pos.x, luke.root.position.y, luke.pos.z, { count: 120, power: 14 } );
		ring.forEach( ( o ) => {

			o.state = 'stun';
			o.stunT = 2.5;

		} );
		luke.setGlow( 1.2, 0xffb070 );

	},

	lukeFall() {

		const luke = G.actors.luke;
		luke.scripted = null;
		luke.hold = true;
		luke.falling = true;
		luke.targetDepth = 16;
		G.party.luke = 'gone';
		G.flags.lukeGone = true;
		G.ui.setParty( partyList() );
		G.world.lighthouse.setOn( false );
		G.audio.setMix( { bass: 0 }, 4 );

	},

	scatterLukeLight() {

		const luke = G.actors.luke;
		G.flags.lukeLight = true;
		spawnLukeLight( luke.pos.x, luke.pos.z, true );
		G.world.ring( luke.pos.x, luke.pos.z, { color: 0xffc27a, to: 60, life: 2 } );
		G.audio.play( 'dash' );

	},

	ambushChase( ring ) {

		ring.forEach( ( o ) => {

			o.state = 'hunt';
			o.stunT = 0;

		} );

	},

	ambushRetreat( ring, shaman ) {

		ring.forEach( ( o ) => o.state = 'retreat' );
		shaman.targetDepth = 25;
		G.actors.luke.root.visible = false;

	},

	// --- 4장 ---

	mobyRise() {

		const m = G.actors.moby;
		const h = G.actors.hazel;
		const c = PLACES.moby;
		const dx = h.pos.x - c.x, dz = h.pos.z - c.z;
		const d = Math.hypot( dx, dz ) || 1;
		m.place( c.x + dx / d * 30, c.z + dz / d * 30 );
		m.yaw = Math.atan2( h.pos.x - m.pos.x, h.pos.z - m.pos.z );
		m.depth = 30;
		m.targetDepth = 0;
		m.root.visible = true;
		m.hold = true;
		G.world.ring( m.pos.x, m.pos.z, { color: 0xbcd6ff, to: 90, life: 2.4 } );

	},

	stellaRise() {

		const s = G.actors.stella;
		const h = G.actors.hazel;
		const f = h.forward;
		s.place( h.pos.x + f.x * 130 - f.z * 40, h.pos.z + f.z * 130 + f.x * 40 );
		s.yaw = Math.atan2( h.pos.x - s.pos.x, h.pos.z - s.pos.z ) + 0.6;
		s.depth = 45;
		s.targetDepth = 0;
		s.root.visible = true;
		s.setGlow( 0.9, 0x3d6bff );
		G.world.ring( s.pos.x, s.pos.z, { color: 0xffd36b, to: 160, life: 3 } );

	},

	boss( chapterLabel ) {

		return new Promise( ( resolve ) => startBoss( resolve, chapterLabel ) );

	},

	flash( v = 0.8 ) {

		finalPass.uniforms.uFlash.value = v;

	},

	async showEnding() {

		G.ended = true;
		G.save.chapter = 0;
		G.save.cleared = true;
		persist();
		const minutes = Math.floor( G.stats.time / 60 ), seconds = Math.floor( G.stats.time % 60 );
		$( 'ending-head' ).textContent = G.flags.subEnding ? 'THE END · SUB ENDING CLEAR' : 'THE END';
		$( 'ending-quote' ).innerHTML = t( 'ending.quote' );
		$( 'ending-stats' ).innerHTML = [
			`PLAY TIME ${minutes}:${String( seconds ).padStart( 2, '0' )}`,
			`LETTERS ${G.bottleCount()}/${BOTTLES.length}`,
			G.flags.subEnding ? t( 'ending.sub' ) : t( 'ending.hint' )
		].join( '<br>' );
		await G.ui.fade( 0.6, 2 );
		G.ui.show( 'hud', false );
		G.ui.show( 'ending' );

	}

} );

function partyList() {

	return [
		{ key: 'luke', name: 'LUKE', state: G.party.luke === 'busy' ? 'on' : G.party.luke },
		{ key: 'finn', name: 'FINN', state: G.party.finn }
	];

}

// ---------------------------------------------------------------
// 연합군 범고래
// ---------------------------------------------------------------
function makeOrcaAgent( whale, pack, state = 'patrol' ) {

	const ring = makeSurfaceDecal( { color: 0xff3355, inner: 0.972, outer: 1, opacity: 0.4 } );
	ring.scale.setScalar( DETECT );
	scene.add( ring );
	return { whale, pack, state, angle: Math.random() * Math.PI * 2, stunT: 0, ring, alertT: 0 };

}

function updateOrcas( dt ) {

	const h = G.actors.hazel;
	const frozen = G.cutsceneOn || G.ui.dialogOpen;
	const showRings = G.party.finn === 'on';

	for ( const o of G.orcas ) {

		const w = o.whale;
		if ( o.state === 'gone' ) continue;
		const dx = h.pos.x - w.pos.x, dz = h.pos.z - w.pos.z;
		const dP = Math.hypot( dx, dz );
		const fromHome = Math.hypot( w.pos.x - o.pack.x, w.pos.z - o.pack.z );

		switch ( o.state ) {

			case 'patrol':
				o.angle += dt * 10 / o.pack.r;
				steerTo( w, o.pack.x + Math.cos( o.angle ) * o.pack.r, o.pack.z + Math.sin( o.angle ) * o.pack.r, 11, dt, 2.2 );
				if ( ! frozen && dP < DETECT && ! h.airborne && G.started ) alertOrca( o );
				break;
			case 'chase':
				steerTo( w, h.pos.x, h.pos.z, 20.5, dt, 2.4 );
				if ( fromHome > 220 || dP > 120 ) o.state = 'return';
				break;
			case 'hunt':
				steerTo( w, h.pos.x, h.pos.z, 19.5, dt, 2.2 );
				if ( dP > 180 ) o.state = 'retreat';
				break;
			case 'return':
				if ( steerTo( w, o.pack.x + Math.cos( o.angle ) * o.pack.r, o.pack.z + Math.sin( o.angle ) * o.pack.r, 14, dt, 2.2 ) < 8 ) o.state = 'patrol';
				if ( ! frozen && dP < DETECT * 0.6 ) alertOrca( o );
				break;
			case 'stun':
				o.stunT -= dt;
				steerTo( w, w.pos.x - dx, w.pos.z - dz, 16, dt, 3 );
				if ( o.stunT <= 0 ) o.state = o.ambush ? 'hold' : ( dP < 110 ? 'chase' : 'return' );
				break;
			case 'hold':
				w.speed *= 0.95;
				steerTo( w, h.pos.x, h.pos.z, 0, dt, 2 );
				break;
			case 'close':
				if ( dP > 15 ) steerTo( w, h.pos.x, h.pos.z, 18, dt, 3 );
				else w.speed *= 0.9;
				break;
			case 'retreat':
				steerTo( w, w.pos.x - dx, w.pos.z - dz, 20, dt, 2 );
				w.targetDepth = 14;
				if ( w.depth > 12 ) {

					o.state = 'gone';
					scene.remove( w.root );

				}

				break;

		}

		// 부딪힘
		const hostile = [ 'chase', 'hunt', 'return', 'patrol' ].includes( o.state );
		if ( hostile && ! frozen && dP < 7.5 ) {

			if ( damage( 1, w.pos ) ) {

				o.state = 'stun';
				o.stunT = 1.6;

			}

		}

		G.world.collide( w.pos, 3.5 );
		w.update( dt );
		w.depth += ( ( w.targetDepth ?? 0 ) - w.depth ) * Math.min( 1, dt * 1.5 );

		o.ring.visible = showRings && o.state !== 'gone' && o.state !== 'retreat' && ! o.ambush;
		o.ring.position.set( w.pos.x, 0, w.pos.z );
		const alert = o.state === 'chase' || o.state === 'hunt';
		o.ring.material.uniforms.uOpacity.value = alert ? 0.75 + Math.sin( G.time * 12 ) * 0.25 : 0.32;

	}

	// 서로 겹치지 않게
	for ( let i = 0; i < G.orcas.length; i ++ ) {

		for ( let j = i + 1; j < G.orcas.length; j ++ ) {

			const a = G.orcas[ i ].whale.pos, b = G.orcas[ j ].whale.pos;
			const dx = b.x - a.x, dz = b.z - a.z;
			const d = Math.hypot( dx, dz );
			if ( d < 7 && d > 0.01 ) {

				const push = ( 7 - d ) * 0.5;
				a.x -= dx / d * push; a.z -= dz / d * push;
				b.x += dx / d * push; b.z += dz / d * push;

			}

		}

	}

}

function alertOrca( o ) {

	if ( o.state === 'chase' ) return;
	o.state = 'chase';
	if ( G.time - ( G.lastAlert ?? - 99 ) > 4 ) {

		G.lastAlert = G.time;
		G.audio.play( 'warn' );
		G.ui.toast( t( G.flags.lukeLight ? 'toast.spottedLight' : 'toast.spotted' ) );

	}

}

// ---------------------------------------------------------------
// 루크의 빛 조각
// ---------------------------------------------------------------
function spawnLukeLight( fromX, fromZ, animate ) {

	const pts = [];
	// 탈출로: 루크가 쓰러진 곳 → 남쪽 해류
	const tx = PLACES.kelp5.x, tz = PLACES.kelp5.z;
	const dx = tx - fromX, dz = tz - fromZ;
	const len = Math.hypot( dx, dz ) || 1;
	const n = 10;
	for ( let i = 1; i <= n; i ++ ) {

		const t = i / ( n + 1 );
		const wob = Math.sin( i * 1.9 ) * 14;
		pts.push( { x: fromX + dx * t - dz / len * wob, z: fromZ + dz * t + dx / len * wob, delay: animate ? 0.6 + i * 0.22 : 0 } );

	}

	// 연합군 해역 곳곳
	ORCA_PACKS.forEach( ( p, i ) => {

		for ( let k = 0; k < 2; k ++ ) {

			const a = i * 1.7 + k * Math.PI;
			pts.push( { x: p.x + Math.cos( a ) * p.r * 1.6, z: p.z + Math.sin( a ) * p.r * 1.6 } );

		}

	} );

	// 모비 딕의 바다 둘레
	for ( let k = 0; k < 6; k ++ ) {

		const a = k / 6 * Math.PI * 2 + 0.4;
		pts.push( { x: PLACES.moby.x + Math.cos( a ) * 115, z: PLACES.moby.z + Math.sin( a ) * 115 } );

	}

	for ( const p of pts ) G.shards.push( G.world.makeLightShard( p ) );

}

function collectShard( s ) {

	s.active = false;
	s.respawn = 18;
	G.dash = 4;
	G.stamina = 1;
	audio.play( 'dash' );
	G.world.ring( s.x, s.z, { color: 0xffc27a, to: 28, life: 0.9, width: 0.2 } );
	if ( ! G.flags.dashTip ) {

		G.flags.dashTip = true;
		G.ui.toast( t( 'toast.dash' ) );

	}

}

// ---------------------------------------------------------------
// 피해 / 기절
// ---------------------------------------------------------------
function damage( n, from ) {

	const h = G.actors.hazel;
	if ( G.invuln > 0 || h.airborne || G.cutsceneOn || G.fainting || G.dash > 0 ) return false;
	G.hearts -= n;
	G.invuln = 2.4;
	G.audio.play( 'hit' );
	finalPass.uniforms.uHurt.value = 1;
	G.shake = 0.8;
	const dx = h.pos.x - from.x, dz = h.pos.z - from.z;
	const d = Math.hypot( dx, dz ) || 1;
	G.knock.set( dx / d * 30, 0, dz / d * 30 );
	G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 50, power: 8, color: 0xffb0c0 } );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	if ( G.hearts <= 0 ) faint();
	return true;

}

async function faint() {

	G.fainting = true;
	G.cutscene( true );
	G.ui.toast( t( 'toast.faint' ) );
	await G.ui.fade( 1, 1.2 );
	const h = G.actors.hazel;
	if ( G.boss?.active ) {

		const c = PLACES.moby;
		const dx = h.pos.x - c.x, dz = h.pos.z - c.z;
		const d = Math.hypot( dx, dz ) || 1;
		h.place( c.x + dx / d * 120, c.z + dz / d * 120, Math.atan2( - dx, - dz ) );
		G.boss.phase = 'rage';
		G.boss.t = 0;
		clearMeteors();

	} else {

		h.place( G.checkpoint.x, G.checkpoint.z, G.checkpoint.yaw );
		for ( const o of G.orcas ) {

			if ( o.state === 'chase' || o.state === 'stun' ) o.state = 'return';
			if ( o.state === 'hunt' ) {

				// 매복 추격 중이면 조금 떨어진 곳에서 다시 쫓아오게
				const a = Math.random() * Math.PI * 2;
				o.whale.place( h.pos.x + Math.cos( a ) * 90, h.pos.z + Math.sin( a ) * 90 );

			}

		}

	}

	placeCompanions();
	G.hearts = MAX_HEARTS;
	G.stamina = 1;
	G.invuln = 3;
	G.knock.set( 0, 0, 0 );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	await G.wait( 0.3 );
	await G.ui.fade( 0, 1 );
	G.ui.toast( t( 'toast.again' ) );
	G.cutscene( false );
	G.fainting = false;

}

function heal( full = false ) {

	G.hearts = full ? MAX_HEARTS : Math.min( MAX_HEARTS, G.hearts + 1 );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	G.audio.play( 'heal' );

}

function setCheckpoint( x, z ) {

	G.checkpoint = { x, z, yaw: G.actors.hazel.yaw };

}

// ---------------------------------------------------------------
// 보스: 모비 딕 설득하기
// ---------------------------------------------------------------
function startBoss( resolve, chapterLabel ) {

	const arena = makeSurfaceDecal( { color: 0x3a7dff, inner: 0.99, outer: 1, opacity: 0.3 } );
	arena.scale.setScalar( 160 );
	arena.position.set( PLACES.moby.x, 0, PLACES.moby.z );
	scene.add( arena );
	const listenRing = makeSurfaceDecal( { color: 0x5fd8ff, inner: 0.95, outer: 1, opacity: 0, fill: 0.12 } );
	listenRing.scale.setScalar( 46 );
	scene.add( listenRing );

	G.boss = { active: true, phase: 'rage', t: 0, resonance: 0, meteorT: 1.5, arena, listenRing, resolve, meteors: [] };
	G.actors.moby.hold = false;
	setCheckpoint( G.actors.hazel.pos.x, G.actors.hazel.pos.z );
	G.audio.setMix( { tension: 0.6, drums: 1, melody: 0.4 } );
	G.objective( chapterLabel, t( 'boss.objective' ) );
	updateBossHud();

}

function updateBossHud() {

	const b = G.boss;
	const hint = t( b.phase === 'listen' ? 'boss.hintListen' : b.phase === 'windup' || b.phase === 'charge' ? 'boss.hintCharge' : 'boss.hintRage' );
	G.ui.setBoss( true, b.resonance, lang().mobyResonance.length, hint );

}

function updateBoss( dt ) {

	const b = G.boss;
	const m = G.actors.moby;
	const h = G.actors.hazel;
	const c = PLACES.moby;
	const frozen = G.cutsceneOn || G.ui.dialogOpen;

	// 무대 밖으로 못 나가게
	const ax = h.pos.x - c.x, az = h.pos.z - c.z;
	const ad = Math.hypot( ax, az );
	if ( ad > 158 ) {

		h.pos.x = c.x + ax / ad * 158;
		h.pos.z = c.z + az / ad * 158;

	}

	b.listenRing.position.set( m.pos.x, 0, m.pos.z );
	updateMeteors( dt, frozen );
	if ( frozen ) return;

	b.t += dt;
	const prevPhase = b.phase;
	switch ( b.phase ) {

		case 'rage':
			idleCircle( m, c.x, c.z, 70, 15, dt );
			m.setGlow( 0.25, 0xff4060 );
			b.meteorT -= dt;
			if ( b.meteorT <= 0 ) {

				b.meteorT = 0.75 + Math.random() * 0.4;
				const near = Math.random() < 0.7;
				const r = near ? Math.random() * 14 : 20 + Math.random() * 80;
				const a = Math.random() * Math.PI * 2;
				const base = near ? h.pos : { x: c.x, z: c.z };
				const lead = near ? h.forward.multiplyScalar( h.speed * 0.9 ) : { x: 0, z: 0 };
				spawnMeteor( base.x + lead.x + Math.cos( a ) * r, base.z + lead.z + Math.sin( a ) * r );

			}

			if ( b.t > 6 ) {

				b.phase = 'windup';
				b.t = 0;
				G.audio.play( 'warn' );

			}

			break;
		case 'windup':
			steerTo( m, h.pos.x, h.pos.z, 3, dt, 3 );
			m.setGlow( 0.4 + b.t * 0.8, 0xff3050 );
			if ( b.t > 1.2 ) {

				b.phase = 'charge';
				b.t = 0;
				b.chargeYaw = Math.atan2( h.pos.x - m.pos.x, h.pos.z - m.pos.z );
				m.yaw = b.chargeYaw;
				G.audio.whaleCall( null, 'moby' );

			}

			break;
		case 'charge': {

			m.speed = 52;
			const f = m.forward;
			m.pos.x += f.x * m.speed * dt;
			m.pos.z += f.z * m.speed * dt;
			// 몸통(머리 쪽 절반)과 부딪히는지
			for ( let k = 0; k <= 3; k ++ ) {

				const px = m.pos.x + f.x * ( k * 6 ), pz = m.pos.z + f.z * ( k * 6 );
				if ( Math.hypot( h.pos.x - px, h.pos.z - pz ) < 9 ) damage( 1, { x: px, z: pz } );

			}

			if ( b.t > 1.4 || Math.hypot( m.pos.x - c.x, m.pos.z - c.z ) > 150 ) {

				b.phase = 'listen';
				b.t = 0;
				m.speed = 0;
				G.audio.play( 'sonar' );

			}

			break;

		}

		case 'listen':
			m.speed *= 0.92;
			m.setGlow( 0.6 + Math.sin( G.time * 4 ) * 0.2, 0x3fc8ff );
			if ( b.t > 5.5 ) {

				b.phase = 'rage';
				b.t = 0;

			}

			break;

	}

	b.listenRing.material.uniforms.uOpacity.value = b.phase === 'listen' ? 0.55 + Math.sin( G.time * 6 ) * 0.2 : 0;
	if ( prevPhase !== b.phase ) updateBossHud();

}

async function bossSing() {

	const b = G.boss;
	const m = G.actors.moby;
	if ( b.phase !== 'listen' || G.distTo( m.pos ) > 50 ) return;
	b.resonance ++;
	b.phase = 'rage';
	b.t = - 1.5;
	heal();
	updateBossHud();
	G.world.ring( m.pos.x, m.pos.z, { color: 0x7fe9ff, to: 90, life: 1.8, width: 0.2 } );
	G.flash( 0.25 );
	const lines = lang().mobyResonance;
	await G.say( [ { who: 'moby', text: lines[ b.resonance - 1 ] } ] );
	if ( b.resonance >= lines.length ) endBoss();

}

function endBoss() {

	const b = G.boss;
	b.active = false;
	clearMeteors();
	scene.remove( b.arena, b.listenRing );
	G.ui.setBoss( false );
	G.actors.moby.setGlow( 0.5, 0x7fe9ff );
	G.actors.moby.hold = true;
	G.actors.moby.speed = 0;
	G.sky.meteorShower = 0.35;
	G.targetWaves = 0.55;
	G.ui.banner( ...t( 'banner.mobyDone' ), 'join', 4 );
	G.audio.play( 'join' );
	b.resolve();

}

const meteorGeo = new THREE.CylinderGeometry( 0.2, 2.2, 26, 10, 1, true );
meteorGeo.translate( 0, 13, 0 );
const meteorMat = new THREE.MeshBasicMaterial( { color: new THREE.Color( 2.5, 2.2, 1.6 ), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false } );
const meteorHeadMat = new THREE.MeshBasicMaterial( { color: new THREE.Color( 4, 3.5, 2.5 ), fog: false } );

function spawnMeteor( x, z ) {

	const warnTime = G.party.finn === 'on' ? 2.1 : 1.6;
	const warn = makeSurfaceDecal( { color: 0xff9a40, inner: 0.85, outer: 1, opacity: 1, fill: 0.5 } );
	warn.scale.setScalar( 7.5 );
	warn.position.set( x, 0, z );
	scene.add( warn );
	const streak = new THREE.Group();
	const tail = new THREE.Mesh( meteorGeo, meteorMat );
	const head = new THREE.Mesh( new THREE.SphereGeometry( 1.6, 12, 8 ), meteorHeadMat );
	streak.add( tail, head );
	streak.visible = false;
	scene.add( streak );
	const from = new THREE.Vector3( x + 70, 200, z - 50 );
	const dir = new THREE.Vector3( x, 0, z ).sub( from ).normalize();
	streak.quaternion.setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), dir.clone().negate() );
	G.boss.meteors.push( { x, z, t: 0, warnTime, warn, streak, from } );

}

function updateMeteors( dt, frozen ) {

	const b = G.boss;
	if ( ! b ) return;
	for ( let i = b.meteors.length - 1; i >= 0; i -- ) {

		const m = b.meteors[ i ];
		if ( ! frozen ) m.t += dt;
		const k = m.t / m.warnTime;
		m.warn.material.uniforms.uOpacity.value = 0.6 + Math.sin( m.t * ( 8 + k * 20 ) ) * 0.4;
		const fallT = m.t - ( m.warnTime - 0.45 );
		if ( fallT > 0 ) {

			m.streak.visible = true;
			const p = Math.min( fallT / 0.45, 1 );
			const h = sampleOcean( m.x, m.z );
			m.streak.position.lerpVectors( m.from, new THREE.Vector3( m.x, h, m.z ), p );

		}

		if ( m.t >= m.warnTime ) {

			const h = sampleOcean( m.x, m.z );
			G.world.splash( m.x, h, m.z, { count: 70, power: 12, color: 0xffd6a0 } );
			G.world.ring( m.x, m.z, { color: 0xffb060, to: 18, life: 0.8, width: 0.3 } );
			G.audio.play( 'boom' );
			G.shake = Math.max( G.shake, 0.35 );
			if ( G.distTo( m ) < 7.5 ) damage( 1, m );
			removeMeteor( i );

		}

	}

}

function removeMeteor( i ) {

	const m = G.boss.meteors[ i ];
	scene.remove( m.warn, m.streak );
	m.warn.material.dispose();
	m.streak.children[ 1 ].geometry.dispose();
	G.boss.meteors.splice( i, 1 );

}

function clearMeteors() {

	if ( ! G.boss ) return;
	for ( let i = G.boss.meteors.length - 1; i >= 0; i -- ) removeMeteor( i );

}

// ---------------------------------------------------------------
// 입력
// ---------------------------------------------------------------
const keys = new Set();
const touch = { x: 0, y: 0, boost: false, active: false };

window.addEventListener( 'keydown', ( e ) => {

	if ( e.target instanceof HTMLInputElement ) return;
	if ( [ 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ].includes( e.code ) ) e.preventDefault();
	keys.add( e.code );
	if ( e.repeat || ! G.started ) return;
	onAction( e.code );

} );
window.addEventListener( 'keyup', ( e ) => keys.delete( e.code ) );
window.addEventListener( 'blur', () => keys.clear() );

function onAction( code ) {

	const ui = G.ui;
	if ( ui.overlay ) {

		if ( [ 'KeyE', 'Enter', 'Space', 'Escape', 'KeyL' ].includes( code ) ) ui.closeOverlay();
		return;

	}

	if ( G.menuPaused ) {

		if ( code === 'Escape' ) setPaused( false );
		return;

	}

	if ( code === 'Escape' ) return setPaused( true );
	if ( code === 'KeyM' ) return G.ui.setMuted( audio.toggleMute() );
	if ( ui.dialogOpen ) {

		if ( [ 'Space', 'Enter', 'KeyE' ].includes( code ) ) ui.advance();
		return;

	}

	if ( G.cutsceneOn || G.ended ) return;
	if ( code === 'KeyE' ) sing();
	if ( code === 'Space' ) jump();
	if ( code === 'KeyL' ) openJournal();

}

function setPaused( on ) {

	G.menuPaused = on;
	G.ui.show( 'pause', on );

}

function openJournal() {

	const entries = G.save.bottles.slice().sort( ( a, b ) => a - b ).map( ( id ) => {

		const l = lang().letters.find( ( x ) => x.id === id );
		return { ...l, read: G.save.read.includes( id ), scrambled: scramble( l.body ) };

	} );
	if ( G.flags.letter0Read ) entries.unshift( { ...lang().mobyLetter, head: t( 'journal.mobyHead' ), read: true } );
	G.ui.journal( entries, BOTTLES.length + ( G.flags.letter0Read ? 1 : 0 ) );

}

function setupTouch() {

	const coarse = matchMedia( '(pointer: coarse)' ).matches || 'ontouchstart' in window;
	if ( ! coarse ) return;
	G.touch = true;
	document.body.classList.add( 'touch' );
	const stick = $( 'stick' ), knob = $( 'stick-knob' );
	let id = null;
	const move = ( e ) => {

		const r = stick.getBoundingClientRect();
		let x = ( e.clientX - r.left - r.width / 2 ) / ( r.width / 2 );
		let y = ( e.clientY - r.top - r.height / 2 ) / ( r.height / 2 );
		const l = Math.hypot( x, y );
		if ( l > 1 ) { x /= l; y /= l; }
		touch.x = x; touch.y = y;
		knob.style.transform = `translate(${x * 38}px, ${y * 38}px)`;

	};

	stick.addEventListener( 'pointerdown', ( e ) => {

		id = e.pointerId;
		stick.setPointerCapture( id );
		touch.active = true;
		move( e );

	} );
	stick.addEventListener( 'pointermove', ( e ) => e.pointerId === id && move( e ) );
	const end = () => {

		id = null;
		touch.active = false;
		touch.x = touch.y = 0;
		knob.style.transform = '';

	};

	stick.addEventListener( 'pointerup', end );
	stick.addEventListener( 'pointercancel', end );

	document.querySelectorAll( '#touch-buttons button' ).forEach( ( btn ) => {

		const act = btn.dataset.act;
		btn.addEventListener( 'pointerdown', ( e ) => {

			e.preventDefault();
			btn.classList.add( 'held' );
			if ( act === 'boost' ) touch.boost = true;
			else if ( G.ui.dialogOpen || G.ui.overlay ) onAction( 'KeyE' );
			else onAction( act === 'sing' ? 'KeyE' : 'Space' );

		} );
		const up = () => {

			btn.classList.remove( 'held' );
			if ( act === 'boost' ) touch.boost = false;

		};

		btn.addEventListener( 'pointerup', up );
		btn.addEventListener( 'pointercancel', up );
		btn.addEventListener( 'pointerleave', up );

	} );

}

// 모바일: 두 번 탭·핀치로 화면이 확대되지 않게 막는다 (iOS는 viewport 설정만으로는 안 막힘)
function preventZoom() {

	const typing = ( e ) => e.target instanceof HTMLInputElement;
	let lastTouchEnd = 0;
	document.addEventListener( 'touchend', ( e ) => {

		const now = performance.now();
		if ( now - lastTouchEnd < 350 && ! typing( e ) ) e.preventDefault();
		lastTouchEnd = now;

	}, { passive: false } );
	document.addEventListener( 'touchmove', ( e ) => {

		if ( e.touches.length > 1 ) e.preventDefault();

	}, { passive: false } );
	for ( const ev of [ 'gesturestart', 'gesturechange', 'gestureend', 'dblclick' ] ) {

		document.addEventListener( ev, ( e ) => ! typing( e ) && e.preventDefault(), { passive: false } );

	}

}

preventZoom();

// 마우스 드래그로 시점 돌리기
let drag = null;
renderer.domElement.addEventListener( 'pointerdown', ( e ) => {

	if ( G.ui?.dialogOpen ) {

		G.ui.advance();
		return;

	}

	drag = { x: e.clientX, id: e.pointerId };

} );
window.addEventListener( 'pointermove', ( e ) => {

	if ( ! drag || e.pointerId !== drag.id ) return;
	G.camOrbit -= ( e.clientX - drag.x ) * 0.006;
	drag.x = e.clientX;
	G.lastDrag = G.time;

} );
window.addEventListener( 'pointerup', () => drag = null );

// ---------------------------------------------------------------
// 플레이어 행동
// ---------------------------------------------------------------
function sing() {

	if ( G.singCooldown > 0 ) return;
	const h = G.actors.hazel;
	G.singCooldown = 1.3;
	audio.play( 'sing' );
	for ( let i = 0; i < 3; i ++ ) G.world.ring( h.pos.x, h.pos.z, { color: 0x7fe9ff, to: 58, life: 1.6, delay: i * 0.28 } );
	G.emit( 'sing' );

	let revealed = 0;
	for ( const b of G.bottles ) {

		if ( ! b.collected && G.distTo( b ) < 340 ) {

			b.reveal = 9;
			revealed ++;

		}

	}

	if ( revealed ) setTimeout( () => audio.play( 'sonar' ), 700 );

	for ( const o of G.orcas ) {

		if ( ( o.state === 'patrol' || o.state === 'return' ) && G.distTo( o.whale.pos ) < 160 ) alertOrca( o );

	}

	if ( G.pendingKelp && G.distTo( G.kelps[ G.pendingKelp ] ) < 34 ) doReadKelp( G.pendingKelp );
	else rechargeAtKelp();

	if ( G.boss?.active ) bossSing();

}

function nearestKelp( range ) {

	let best = null, bestD = range;
	for ( const k of [ ...Object.values( G.kelps ), ...G.groves ] ) {

		const d = G.distTo( k );
		if ( d < bestD ) {

			best = k;
			bestD = d;

		}

	}

	return best;

}

// 미역 근처에서 노래하면 스태미나가 가득 찬다
function rechargeAtKelp() {

	const k = nearestKelp( 34 );
	if ( ! k ) return false;
	G.stamina = 1;
	k.glow = 1.5;
	G.world.ring( k.x, k.z, { color: 0x6dffe0, to: 30, life: 1.2, delay: 0.3 } );
	setTimeout( () => audio.play( 'heal' ), 300 );
	G.ui.toast( t( 'toast.recharge' ) );
	return true;

}

async function doReadKelp( key ) {

	const k = G.kelps[ key ];
	G.pendingKelp = null;
	k.read = true;
	if ( ! G.save.kelps.includes( key ) ) G.save.kelps.push( key );
	persist();
	G.cutscene( true );
	G.world.ring( k.x, k.z, { color: 0x6dffe0, to: 45, life: 1.4 } );
	await G.wait( 0.6 );
	const reader = G.reader();
	const name = t( `kelpReader.${reader ?? 'none'}` );
	const kelp = lang().kelps[ key ];
	await G.say( [ { who: 'kelp', name, text: kelp.text }, ...kelp.after.map( ( [ who, text ] ) => ( { who, text } ) ) ] );
	heal( true );
	G.stamina = 1;
	setCheckpoint( k.x + 18, k.z + 18 );
	G.ui.toast( t( 'toast.kelpHeal' ) );
	G.cutscene( false );
	G.emit( 'kelp:' + key );

}

function jump() {

	const h = G.actors.hazel;
	if ( G.jumpCooldown > 0 || h.airborne ) return;
	if ( h.breach( 12 + Math.min( h.speed, BOOST_SPEED ) * 0.12 ) ) {

		G.jumpCooldown = 0.35;
		G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 40, power: 7 } );
		audio.play( 'splash', { vel: 0.25 } );
		// 동료도 따라서 뛰어오른다
		for ( const key of [ 'luke', 'finn' ] ) {

			if ( G.party[ key ] === 'on' ) setTimeout( () => G.actors[ key ].breach( 11 ), 250 + Math.random() * 300 );

		}

	}

}

async function collectBottle( b ) {

	b.remove( scene );
	audio.play( 'pickup' );
	G.world.ring( b.x, b.z, { color: 0x7fe9ff, to: 20, life: 0.9 } );
	if ( b.id === 0 ) {

		G.emit( 'bottle0' );
		return;

	}

	if ( ! G.save.bottles.includes( b.id ) ) G.save.bottles.push( b.id );
	heal();
	G.ui.setBottles( G.bottleCount(), BOTTLES.length );
	const reader = G.reader();
	const letter = lang().letters.find( ( l ) => l.id === b.id );
	if ( reader ) {

		G.save.read.push( b.id );
		persist();
		await G.ui.letter( letter );
		await G.say( [ { who: reader, text: t( `bottleReact.${reader}` ) } ] );

	} else {

		persist();
		G.ui.toast( t( 'toast.unreadBottle', { n: G.bottleCount(), total: BOTTLES.length } ) );

	}

	if ( G.bottleCount() === BOTTLES.length ) G.ui.banner( ...t( 'banner.allLetters' ), 'join', 3.5 );

}

// ---------------------------------------------------------------
// 시작 준비
// ---------------------------------------------------------------
async function boot() {

	applyStatic();
	G.ui = new UI( G );
	G.ui.setMuted( audio.muted );
	audio.onNeedsTap = () => G.started && G.ui.toast( t( 'toast.tapAudio' ) );

	fetch( BASE + 'data/res/logo/fromwhale_logo.svg' ).then( ( r ) => r.text() ).then( ( svg ) => {

		const paths = [ ...svg.matchAll( /<path[^>]*d="([^"]+)"/g ) ].map( ( m ) => m[ 1 ] );
		$( 'logo-whale' ).innerHTML = paths.map( ( d ) => `<path d="${d}"/>` ).join( '' );

	} ).catch( () => {} );

	const setLoad = ( p ) => {

		$( 'load-pct' ).textContent = `${Math.round( p * 100 )}%`;
		$( 'load-bar' ).style.width = `${p * 100}%`;

	};

	const normalTex = await new THREE.TextureLoader().loadAsync( BASE + 'examples/textures/waternormals.jpg' );
	setLoad( 0.15 );
	const models = await loadModels( BASE, ( p ) => setLoad( 0.15 + p * 0.85 ) );
	G.models = models;

	G.sky = new Sky( { moonDir } );
	scene.add( G.sky.group );
	G.sky.capture( renderer );

	G.ocean = new Ocean( { envMap: G.sky.cubeTarget.texture, normalMap: normalTex, fog, moonDir, gridStep: LOW ? 5 : 2.5 } );
	scene.add( G.ocean.mesh );
	G.targetWaves = 0.65;

	const avoid = [
		...Object.values( PLACES ).map( ( p ) => ( { ...p, r: 70 } ) ),
		...BOTTLES.map( ( b ) => ( { ...b, r: 30 } ) ),
		{ ...PLACES.moby, r: 190 },
		...KELP_GROVES.map( ( g ) => ( { ...g, r: 30 } ) )
	];
	G.world = new World( { scene, fog, places: { lighthouse: PLACES.lighthouse }, avoid, models } );

	const A = G.actors;
	A.hazel = new Whale( models.hazel, { name: 'hazel', length: 8, ride: 0.38, freq: 3.8, amp: 0.085, emissive: 1.4 } );
	A.luke = new Whale( models.luke, { name: 'luke', length: 11, ride: 0.36, freq: 3.3, amp: 0.07, emissive: 1.4 } );
	A.finn = new Whale( models.finn, { name: 'finn', length: 10, ride: 0.42, freq: 2.9, amp: 0.06, emissive: 0.55 } );
	A.moby = new Whale( models.moby, { name: 'moby', length: 46, ride: 0.3, freq: 1.5, amp: 0.05, emissive: 0.6 } );
	A.stella = new Whale( models.hazel, { name: 'stella', length: 85, ride: 0.26, freq: 1.0, amp: 0.05, tint: 0x3b6cff, emissive: 3 } );
	A.shaman = new Whale( models.hazel, { name: 'shaman', length: 30, ride: 0.32, freq: 2.0, amp: 0.05, tint: 0x4a3f5c, emissive: 0.1 } );
	for ( const a of Object.values( A ) ) scene.add( a.root );
	A.moby.root.visible = A.stella.root.visible = A.shaman.root.visible = false;

	for ( const pack of ORCA_PACKS ) {

		for ( let i = 0; i < pack.n; i ++ ) {

			const w = new Whale( models.orca, { name: 'orca', length: 10, ride: 0.42, freq: 3.0, amp: 0.06 } );
			const o = makeOrcaAgent( w, pack );
			o.angle = ( i / pack.n ) * Math.PI * 2;
			w.place( pack.x + Math.cos( o.angle ) * pack.r, pack.z + Math.sin( o.angle ) * pack.r );
			scene.add( w.root );
			G.orcas.push( o );

		}

	}

	for ( const key of [ 'kelp1', 'kelp2', 'kelp3', 'kelp4', 'kelp5' ] ) G.kelps[ key ] = G.world.makeKelp( PLACES[ key ] );
	for ( const g of KELP_GROVES ) G.groves.push( G.world.makeKelp( g, true ) );

	try {

		G.ui.portraits = makePortraits( models );

	} catch ( e ) {

		console.warn( 'portrait render failed', e );

	}

	A.hazel.place( 0, 0, Math.PI );
	A.luke.place( PLACES.luke.x, PLACES.luke.z );
	A.finn.place( PLACES.finn.x, PLACES.finn.z );
	G.ui.setParty( partyList() );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	G.ui.setBottles( 0, BOTTLES.length );

	setupTouch();
	$( 'loading' ).classList.add( 'hidden' );
	$( 'title-buttons' ).classList.remove( 'hidden' );
	const debugChapter = query.has( 'chapter' ) ? Number( query.get( 'chapter' ) ) : null;
	const continueBtn = $( 'btn-continue' );
	const showContinue = () => {

		if ( G.save.chapter <= 0 || debugChapter !== null ) return;
		continueBtn.classList.remove( 'hidden' );
		continueBtn.textContent = t( 'title.continueAt', { ch: [ 'PROLOGUE', 'CH.01', 'CH.02', 'CH.03', 'CH.04', 'ENDING' ][ G.save.chapter ] } );

	};

	showContinue();
	continueBtn.onclick = () => {

		setName( $( 'nickname' ).value );
		start( G.save.chapter );

	};

	// 언어 (타이틀에서만 바꾼다)
	document.querySelectorAll( '[data-lang]' ).forEach( ( btn ) => btn.addEventListener( 'click', () => {

		setLang( btn.dataset.lang );
		showContinue();
		G.ui.setPlayerName( G.playerName, ! G.customName );

	} ) );

	// 닉네임 (비워 두면 언어별 기본 이름: 헤이즐 / Hazel / ヘイゼル)
	const setName = ( raw ) => {

		G.customName = cleanName( raw );
		saveName( G.customName );
		G.ui.setPlayerName( G.playerName, ! G.customName );

	};

	const nameInputs = [ $( 'nickname' ), $( 'nickname-pause' ) ];
	for ( const input of nameInputs ) {

		input.value = G.customName;
		input.addEventListener( 'input', () => {

			setName( input.value );
			for ( const other of nameInputs ) if ( other !== input ) other.value = input.value;

		} );

	}

	$( 'nickname' ).addEventListener( 'keydown', ( e ) => {

		if ( e.key === 'Enter' ) {

			$( 'nickname' ).blur();
			$( 'btn-start' ).click();

		}

	} );
	G.ui.setPlayerName( G.playerName, ! G.customName );

	$( 'btn-start' ).onclick = () => {

		setName( $( 'nickname' ).value );
		if ( debugChapter === null ) G.save = { chapter: 0, bottles: [], read: [], kelps: [] };
		start( debugChapter ?? 0 );

	};

	$( 'btn-resume' ).onclick = () => setPaused( false );
	$( 'btn-restart' ).onclick = () => {

		G.save = { chapter: 0, bottles: [], read: [], kelps: [] };
		persist();
		location.reload();

	};

	$( 'btn-again' ).onclick = () => location.reload();
	$( 'btn-journal' ).onclick = () => ! G.cutsceneOn && ! G.ui.dialogOpen && openJournal();
	$( 'btn-mute' ).onclick = () => G.ui.setMuted( audio.toggleMute() );
	$( 'btn-pause' ).onclick = () => setPaused( true );

	G.ready = true;
	if ( query.has( 'autostart' ) ) start( debugChapter ?? 0 );

}

function placeCompanions() {

	const h = G.actors.hazel;
	const f = h.forward;
	for ( const [ key, side ] of [ [ 'luke', 1 ], [ 'finn', - 1 ] ] ) {

		if ( G.party[ key ] !== 'on' ) continue;
		G.actors[ key ].place( h.pos.x - f.x * 10 + f.z * side * 7, h.pos.z - f.z * 10 - f.x * side * 7, h.yaw );

	}

}

// 이어하기/디버그: 해당 장의 시작 상태로 맞춘다
function setupChapter( n ) {

	const A = G.actors;
	const starts = [ PLACES.start, { x: 20, z: - 70 }, { x: - 20, z: - 270 }, { x: 440, z: - 300 }, { x: 240, z: 545 }, { x: 180, z: 650 } ];
	const at = starts[ Math.min( n, starts.length - 1 ) ];
	const nextTarget = [ PLACES.bottle0, PLACES.lighthouse, PLACES.kelp1, PLACES.kelp4, PLACES.moby, PLACES.moby ][ Math.min( n, 5 ) ];
	A.hazel.place( at.x, at.z, Math.atan2( nextTarget.x - at.x, nextTarget.z - at.z ) );

	if ( n >= 2 ) {

		G.party.luke = 'on';
		G.flags.lukeJoined = true;
		G.flags.letter0Read = true;
		G.audio.setMix( { bass: 0.9 }, 0.1 );

	}

	if ( n >= 3 ) {

		G.party.finn = 'on';
		G.flags.finnJoined = true;
		G.audio.setMix( { drums: 0.75 }, 0.1 );
		for ( const k of [ 'kelp1', 'kelp2', 'kelp3' ] ) G.kelps[ k ].read = true;

	}

	if ( n >= 4 ) {

		G.party.luke = 'gone';
		G.flags.lukeGone = true;
		A.luke.root.visible = false;
		G.world.lighthouse.setOn( false );
		G.world.lighthouse.on = 0;
		G.audio.setMix( { bass: 0 }, 0.1 );
		for ( const k of [ 'kelp4', 'kelp5' ] ) G.kelps[ k ].read = true;

	}

	if ( n >= 4 ) {

		G.setStarfall( true );
		G.flags.lukeLight = true;
		spawnLukeLight( PLACES.ambush.x, PLACES.ambush.z, false );

	}
	if ( n >= 5 ) {

		G.mobyRise();
		A.moby.depth = 0;

	}

	for ( const k of G.save.kelps ) if ( G.kelps[ k ] ) G.kelps[ k ].read = true;
	for ( const b of G.bottles ) if ( G.save.bottles.includes( b.id ) ) b.remove( scene );

	G.ui.setParty( partyList() );
	G.ui.setBottles( G.bottleCount(), BOTTLES.length );
	setCheckpoint( at.x, at.z );
	placeCompanions();

}

async function start( chapter ) {

	if ( G.started || ! G.ready ) return;
	audio.init();
	G.started = true;

	for ( const b of BOTTLES ) G.bottles.push( G.world.makeBottle( b, b.id ) );
	setupChapter( chapter );

	G.ui.show( 'title', false );
	G.ui.show( 'hud' );
	if ( G.touch ) $( 'touch' ).classList.remove( 'hidden' );
	if ( G.touch && innerWidth < innerHeight ) G.ui.toast( t( 'toast.rotate' ) );
	G.stats.time = 0;

	for ( let i = chapter; i < CHAPTERS.length; i ++ ) {

		G.save.chapter = i;
		persist();
		await CHAPTERS[ i ]( G );

	}

}

// ---------------------------------------------------------------
// 매 프레임
// ---------------------------------------------------------------
const clock = new THREE.Clock();
const _v = new THREE.Vector3();
const camLook = new THREE.Vector3( 0, 2, - 10 );

function updatePlayer( dt ) {

	const h = G.actors.hazel;
	const control = G.started && ! G.cutsceneOn && ! G.ui.dialogOpen && ! G.ended;

	let throttle = 0, turn = 0, boost = false;
	if ( control ) {

		if ( keys.has( 'KeyW' ) || keys.has( 'ArrowUp' ) ) throttle = 1;
		if ( keys.has( 'KeyS' ) || keys.has( 'ArrowDown' ) ) throttle = - 0.35;
		if ( keys.has( 'KeyA' ) || keys.has( 'ArrowLeft' ) ) turn += 1;
		if ( keys.has( 'KeyD' ) || keys.has( 'ArrowRight' ) ) turn -= 1;
		boost = keys.has( 'ShiftLeft' ) || keys.has( 'ShiftRight' ) || touch.boost;
		if ( touch.active ) {

			throttle = Math.max( throttle, Math.min( 1, Math.hypot( touch.x, touch.y ) * 1.2 ) * ( touch.y > 0.6 ? - 0.35 : 1 ) );
			turn = - touch.x * 1.2;

		}

	}

	// 핀이 있으면 부스트가 오래 간다
	const finn = G.party.finn === 'on';
	const boosting = boost && throttle > 0 && G.stamina > 0.02;
	if ( boosting ) G.stamina = Math.max( 0, G.stamina - dt * ( finn ? 0.16 : 0.26 ) );
	else G.stamina = Math.min( 1, G.stamina + dt * ( finn ? 0.26 : 0.16 ) );

	let target = throttle > 0 ? throttle * ( boosting ? BOOST_SPEED : MAX_SPEED ) : throttle * 8;
	if ( G.dash > 0 ) {

		G.dash -= dt;
		if ( control ) target = DASH_SPEED;
		G.dashTrail = ( G.dashTrail ?? 0 ) - dt;
		if ( G.dashTrail <= 0 ) {

			G.dashTrail = 0.12;
			G.world.ring( h.pos.x, h.pos.z, { color: 0xffc27a, from: 2, to: 9, life: 0.6, width: 0.3 } );

		}

	}

	h.setGlow( G.dash > 0 ? 0.5 : 0, 0xffb070 );
	h.speed += ( target - h.speed ) * Math.min( 1, dt * ( G.dash > 0 ? 3 : throttle === 0 ? 0.9 : 1.6 ) );

	// 대화 중에는 상대를 바라본다
	if ( G.faceTarget && ! control ) {

		const ty = Math.atan2( G.faceTarget.x - h.pos.x, G.faceTarget.z - h.pos.z );
		let dy = Math.atan2( Math.sin( ty - h.yaw ), Math.cos( ty - h.yaw ) );
		h.yaw += dy * Math.min( 1, dt * 2 );

	}

	const turnRate = TURN_RATE * ( 0.6 + 0.4 * ( 1 - Math.min( Math.abs( h.speed ) / BOOST_SPEED, 1 ) ) );
	h.yaw += turn * turnRate * dt;
	h.bank = - turn * Math.min( 1, Math.abs( h.speed ) / MAX_SPEED ) * 0.45;

	const f = h.forward;
	h.pos.x += f.x * h.speed * dt + G.knock.x * dt;
	h.pos.z += f.z * h.speed * dt + G.knock.z * dt;
	G.knock.multiplyScalar( Math.exp( - dt * 4 ) );
	G.world.collide( h.pos, 3.2 );

	// 세상의 끝
	const cx = h.pos.x - 150, cz = h.pos.z - 150;
	const cd = Math.hypot( cx, cz );
	if ( cd > 1150 ) {

		h.pos.x = 150 + cx / cd * 1150;
		h.pos.z = 150 + cz / cd * 1150;
		if ( G.time - ( G.lastEdge ?? - 99 ) > 6 ) {

			G.lastEdge = G.time;
			G.ui.toast( t( 'toast.fog' ) );

		}

	}

	G.stats.swum += Math.abs( h.speed ) * dt;
	if ( h.update( dt ) ) {

		G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 70, power: 9 } );
		G.world.ring( h.pos.x, h.pos.z, { color: 0xbfeaff, from: 2, to: 14, life: 0.8, width: 0.3 } );
		audio.play( 'splash' );

	}

	G.invuln = Math.max( 0, G.invuln - dt );
	h.root.visible = G.invuln <= 0 || Math.floor( G.time * 14 ) % 2 === 0 || G.cutsceneOn;
	G.singCooldown = Math.max( 0, G.singCooldown - dt );
	G.jumpCooldown = Math.max( 0, G.jumpCooldown - dt );

}

function updateCompanions( dt ) {

	const A = G.actors;
	const h = A.hazel;
	const slots = { luke: { x: 8.5, z: - 4 }, finn: { x: - 9, z: - 6 } };
	const homes = { luke: PLACES.luke, finn: PLACES.finn };

	for ( const key of [ 'luke', 'finn' ] ) {

		const w = A[ key ];
		if ( ! w.root.visible ) continue;
		if ( w.scripted ) {

			// 연출용 이동: 회전 반경 없이 목표로 곧장, 가까워질수록 느리게 (빙빙 돌지 않게)
			const s = w.scripted;
			const dx = s.x - w.pos.x, dz = s.z - w.pos.z;
			const d = Math.hypot( dx, dz );
			if ( d > 0.5 ) {

				const dy = Math.atan2( Math.sin( Math.atan2( dx, dz ) - w.yaw ), Math.cos( Math.atan2( dx, dz ) - w.yaw ) );
				w.yaw += dy * Math.min( 1, dt * 8 );

			}

			w.speed = Math.min( s.speed, d * 3 );
			const move = Math.min( d, w.speed * dt );
			if ( d > 0.01 ) {

				w.pos.x += dx / d * move;
				w.pos.z += dz / d * move;

			}

		} else if ( G.party[ key ] === 'on' ) {

			followSlot( w, h, slots[ key ], dt, BOOST_SPEED + 8 );
			const dx = w.pos.x - h.pos.x, dz = w.pos.z - h.pos.z;
			const d = Math.hypot( dx, dz );
			if ( d < 6 && d > 0.01 ) {

				w.pos.x = h.pos.x + dx / d * 6;
				w.pos.z = h.pos.z + dz / d * 6;

			}

			if ( d > 160 ) placeCompanions();

		} else if ( w.hold ) {

			w.speed *= 0.95;
			w.pos.addScaledVector( w.forward, w.speed * dt );

		} else if ( G.party[ key ] === 'none' ) {

			idleCircle( w, homes[ key ].x, homes[ key ].z, 12, 4, dt );

		}

		if ( ! w.scripted ) G.world.collide( w.pos, 3 );
		w.update( dt );
		w.depth += ( ( w.targetDepth ?? 0 ) - w.depth ) * Math.min( 1, dt * ( w.falling ? 0.35 : 1.5 ) );
		if ( w.falling ) {

			w.setGlow( Math.max( 0, w.swim.glow.value - dt * 0.3 ) );
			w.setOpacity( Math.max( 0, 1 - w.depth / 16 ) );
			w.pitch = THREE.MathUtils.lerp( w.pitch, - 0.5, dt );

		}

	}

	// 연출용 고래들
	for ( const key of [ 'moby', 'stella', 'shaman' ] ) {

		const w = A[ key ];
		if ( ! w.root.visible ) continue;
		if ( key === 'moby' && G.boss?.active ) {

			updateBoss( dt );

		} else if ( w.hold ) {

			w.speed *= 0.95;
			const ty = Math.atan2( h.pos.x - w.pos.x, h.pos.z - w.pos.z );
			const dy = Math.atan2( Math.sin( ty - w.yaw ), Math.cos( ty - w.yaw ) );
			w.yaw += dy * Math.min( 1, dt * 0.6 );

		}

		w.update( dt );
		w.depth += ( ( w.targetDepth ?? 0 ) - w.depth ) * Math.min( 1, dt * 0.8 );
		if ( key === 'shaman' && w.depth > 22 && w.targetDepth > 20 ) w.root.visible = false;

	}

}

function updateBottlesAndKelp( dt ) {

	for ( const b of G.bottles ) {

		if ( b.collected ) continue;
		b.update( dt, G.time );
		if ( G.started && ! G.cutsceneOn && ! G.ui.dialogOpen && G.distTo( b ) < 6.5 ) collectBottle( b );

	}

	for ( const k of Object.values( G.kelps ) ) k.update( dt, G.time );
	for ( const k of G.groves ) k.update( dt, G.time );

	for ( const s of G.shards ) {

		s.update( dt, G.time );
		if ( s.ready && G.started && ! G.cutsceneOn && ! G.ui.dialogOpen && G.distTo( s ) < 7 ) collectShard( s );

	}

	// 상호작용 안내
	let prompt = null;
	if ( G.started && ! G.cutsceneOn && ! G.ui.dialogOpen ) {

		if ( G.pendingKelp && G.distTo( G.kelps[ G.pendingKelp ] ) < 34 ) prompt = t( 'prompt.kelp' );
		else if ( G.boss?.active && G.boss.phase === 'listen' && G.distTo( G.actors.moby.pos ) < 50 ) prompt = t( 'prompt.moby' );
		else if ( G.stamina < 0.9 && nearestKelp( 34 ) ) prompt = t( 'prompt.recharge' );

	}

	G.ui.prompt( prompt );

}

function updateCamera( dt ) {

	const h = G.actors.hazel;
	const desired = _v;
	let look;

	if ( ! G.started ) {

		const a = G.time * 0.05 + 2.4;
		desired.set( h.pos.x + Math.sin( a ) * 34, 9 + Math.sin( G.time * 0.3 ) * 1.5, h.pos.z + Math.cos( a ) * 34 );
		look = new THREE.Vector3( h.pos.x, 4, h.pos.z );

	} else if ( G.camTarget ) {

		const t = G.camTarget;
		const mx = ( h.pos.x + t.target.x ) / 2, mz = ( h.pos.z + t.target.z ) / 2;
		let dx = t.target.x - h.pos.x, dz = t.target.z - h.pos.z;
		const d = Math.hypot( dx, dz );
		if ( d < 1 ) {

			dx = h.forward.x; dz = h.forward.z;

		} else {

			dx /= d; dz /= d;

		}
		desired.set( mx + dz * t.side * t.dist - dx * t.dist * 0.35, t.height, mz - dx * t.side * t.dist - dz * t.dist * 0.35 );
		look = new THREE.Vector3( mx, 3, mz );

	} else {

		if ( G.time - ( G.lastDrag ?? - 99 ) > 1.8 && ! drag ) G.camOrbit *= Math.exp( - dt * 1.5 );
		const yaw = h.yaw + G.camOrbit;
		const dist = 24 + Math.abs( h.speed ) * 0.28;
		desired.set( h.pos.x - Math.sin( yaw ) * dist, h.root.position.y * 0.4 + 8.5 + Math.abs( h.speed ) * 0.05, h.pos.z - Math.cos( yaw ) * dist );
		const f = h.forward;
		look = new THREE.Vector3( h.pos.x + f.x * 5, h.root.position.y * 0.5 + 4.2, h.pos.z + f.z * 5 );

	}

	const k = 1 - Math.exp( - dt * ( G.camTarget ? 1.6 : 3.2 ) );
	camera.position.lerp( desired, k );
	const floor = sampleOcean( camera.position.x, camera.position.z ) + 2.8;
	if ( camera.position.y < floor ) camera.position.y = floor;
	camLook.lerp( look, 1 - Math.exp( - dt * 5 ) );
	camera.lookAt( camLook );

	if ( G.shake > 0 ) {

		camera.position.x += ( Math.random() - 0.5 ) * G.shake;
		camera.position.y += ( Math.random() - 0.5 ) * G.shake;
		G.shake = Math.max( 0, G.shake - dt * 1.8 );

	}

}

function updateHud() {

	if ( ! G.started ) return;
	G.ui.setStamina( G.stamina, G.dash > 0 );
	const t = G.objectiveTarget;
	if ( t && ! G.cutsceneOn && ! G.ended ) {

		const y = sampleOcean( t.x, t.z ) + 8;
		_v.set( t.x, y, t.z ).project( camera );
		const behind = _v.z > 1;
		const onScreen = ! behind && Math.abs( _v.x ) < 0.95 && Math.abs( _v.y ) < 0.92;
		const screen = { x: ( _v.x * 0.5 + 0.5 ) * innerWidth, y: ( - _v.y * 0.5 + 0.5 ) * innerHeight, onScreen, behind };
		const d = G.distTo( t );
		G.ui.updateMarker( screen, d, d > 12 );
		G.ui.setDistance( d );

	} else {

		G.ui.updateMarker( null, 0, false );
		G.ui.setDistance( null );

	}

	// 소나 미니맵 (30fps)
	G.mapTimer = ( G.mapTimer ?? 0 ) + 1;
	if ( G.mapTimer % 2 ) return;
	const h = G.actors.hazel;
	const points = [];
	for ( const b of G.bottles ) {

		if ( ! b.collected && ( b.reveal > 0 || G.distTo( b ) < 110 ) ) points.push( { x: b.x, z: b.z, color: '#7fe9ff', size: 3 } );

	}

	for ( const [ key, k ] of Object.entries( G.kelps ) ) {

		if ( G.pendingKelp === key ) points.push( { x: k.x, z: k.z, color: '#6dffe0', size: 4, shape: 'diamond' } );
		else points.push( { x: k.x, z: k.z, color: k.read ? 'rgba(185,168,255,0.6)' : 'rgba(109,255,224,0.5)', size: 2.5 } );

	}

	for ( const s of G.shards ) if ( s.ready ) points.push( { x: s.x, z: s.z, color: '#ffc27a', size: 2.5 } );
	for ( const k of G.groves ) points.push( { x: k.x, z: k.z, color: 'rgba(109,255,224,0.55)', size: 2 } );

	for ( const o of G.orcas ) {

		if ( o.state === 'gone' ) continue;
		if ( G.party.finn === 'on' || G.distTo( o.whale.pos ) < 90 ) points.push( { x: o.whale.pos.x, z: o.whale.pos.z, color: o.state === 'chase' || o.state === 'hunt' ? '#ff3355' : '#ff6b8b', size: 3 } );

	}

	for ( const key of [ 'luke', 'finn' ] ) {

		const w = G.actors[ key ];
		if ( w.root.visible && G.party[ key ] !== 'gone' ) points.push( { x: w.pos.x, z: w.pos.z, color: G.party[ key ] === 'on' ? '#eaf6ff' : '#b9a8ff', size: 3 } );

	}

	points.push( { x: PLACES.lighthouse.x, z: PLACES.lighthouse.z, color: G.world.lighthouse.target ? '#ffe9b0' : '#556', size: 5, shape: 'ring', clamp: true } );
	if ( G.actors.moby.root.visible ) points.push( { x: G.actors.moby.pos.x, z: G.actors.moby.pos.z, color: '#bcd6ff', size: 7, shape: 'ring' } );

	G.ui.drawMinimap( {
		px: h.pos.x, pz: h.pos.z, yaw: h.yaw, range: 260, time: G.time,
		rocks: G.world.colliders, points, objective: t
	} );

}

function update( dt ) {

	G.time += dt;
	if ( G.started && ! G.ended ) G.stats.time += dt;

	// 기다리는 이야기 진행
	if ( G.waiters.length ) {

		const ready = G.waiters.filter( ( w ) => w.check() );
		if ( ready.length ) {

			G.waiters = G.waiters.filter( ( w ) => ! ready.includes( w ) );
			ready.forEach( ( w ) => w.resolve() );

		}

	}

	G.ocean.intensity += ( G.targetWaves - G.ocean.intensity ) * Math.min( 1, dt * 0.3 );
	updateSwimTime( G.time );
	G.ocean.update( G.time, G.actors.hazel.pos );
	G.sky.update( dt, camera.position );
	G.world.update( dt, G.time );

	updatePlayer( dt );
	updateCompanions( dt );
	updateOrcas( dt );
	updateBottlesAndKelp( dt );
	updateCamera( dt );
	updateHud();

	finalPass.uniforms.uTime.value = G.time;
	finalPass.uniforms.uFlash.value = Math.max( 0, finalPass.uniforms.uFlash.value - dt * 1.4 );
	finalPass.uniforms.uHurt.value = Math.max( 0, finalPass.uniforms.uHurt.value - dt * 1.5 );

}

function loop() {

	requestAnimationFrame( loop );
	const dt = Math.min( clock.getDelta(), DT_MAX );
	G.fps = G.fps ? G.fps * 0.95 + ( 1 / Math.max( dt, 1e-3 ) ) * 0.05 : 30;
	if ( G.ready && ! G.menuPaused && ! G.ui.overlay ) update( dt );
	if ( G.ready ) composer.render( dt );

}

boot().then( loop );
