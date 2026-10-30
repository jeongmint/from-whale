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
import { CHAPTERS, PLACES, BOTTLES, LETTER_TOTAL, ORCA_PACKS, KELP_GROVES, scramble, epilogue, lukeLateFall, duetAgain, map2 } from './story.js';
import { lang, t, setLang, applyStatic } from './i18n.js';
import { openScores } from './scores.js';
import { Dive, DIVE_TOP, DIVE_BOTTOM, ZONES, zoneAt } from './dive.js';
import { buildTrench, trenchCenter, trenchRadius } from './map2.js';
import { loadSealife, Sealife } from './sealife.js';
import { Guards } from './guards.js';

const BASE = window.FW_ASSET_BASE ?? '../';
const query = new URLSearchParams( location.search );
// 테스트 옵션 ?stella: 편지 6통을 다 모은 상태로 엔딩부터 (스텔라 → 듀엣 → 서브 엔딩). 저장은 건드리지 않는다
const STELLA_TEST = query.has( 'stella' );
// 테스트 옵션 ?gold: 엔딩 6개 보상(금빛 바다)을 미리 본다. 저장은 건드리지 않는다
const GOLD_TEST = query.has( 'gold' );
// 테스트 옵션 ?dive: MAP 2 미리보기 (포털 → 바닷속)부터 시작. 저장은 건드리지 않는다
const DIVE_TEST = query.has( 'dive' );
const LOW = ( query.get( 'q' ) ?? ( matchMedia( '(pointer: coarse)' ).matches ? 'low' : 'high' ) ) === 'low';
const DT_MAX = Number( query.get( 'dtmax' ) ) || 1 / 20;

const MAX_SPEED = 17;
const BOOST_SPEED = 33;
const TURN_RATE = 1.9;
const MAX_HEARTS = 3;
const DETECT = 56;
const DASH_SPEED = 50;
const REVERSE_SPEED = 9; // 조이스틱을 아래로 당기거나 폰을 뒤로 젖혔을 때 최고 후진 속도
const STUN_TIME = 1.1; // 떨어지는 별
const CHARGE_STUN = 1.5; // 돌진하는 모비에게 받혔을 때
const SAVE_KEY = 'fromwhale.save.v1';
const EPILOGUE = CHAPTERS.length; // 엔딩 뒤 남은 편지 찾기 (이어하기 번호)

// 갈래 엔딩. 3장 매복까지 연합군에게 LUKE_MAX_HITS번 넘게 맞지 않으면 루크가 살고,
// 보스전에서 처음 쓰러지면 핀이 대신 맞는다. 루크·핀이 살았는지에 따라 엔딩 넷
const LUKE_MAX_HITS = 1; // 한 번까지는 봐준다 (처음 맞으면 루크가 경고, 두 번째에 대신 들이받는다)
const AMBUSH_HEADSTART = 3; // 매복 컷신 뒤 연합군이 잠수해서 헤이즐 뒤쪽에 모이는 시간 (초)
const AMBUSH_DASH = 2.2; // 매복 컷신 뒤 헤이즐이 치고 나가는 시간 (초)
const ROUTES = {
	light: { luke: false, finn: true }, // 꺼지지 않는 빛
	friends: { luke: true, finn: true }, // 동료의 힘
	compass: { luke: true, finn: false }, // 부서진 나침반
	sacrifice: { luke: false, finn: false }, // 희생
	late: { late: true } // 지각한 고래: 모비 딕을 만나기 전에 편지를 다 모으면 루크·핀과 상관없이 이 엔딩
};
const ENDING_ORDER = [ ...Object.keys( ROUTES ), 'heart' ]; // heart: 한 장에서 두 번 쓰러지면 (멈춘 고래의 심장)
const ENDINGS_KEY = 'fromwhale.endings';
// 듀엣 다시 부르기 (?duet 또는 타이틀 버튼): 스텔라를 만난 적 있을 때만. 이어하기 저장은 건드리지 않는다
let duetMode = query.has( 'duet' ) && loadEndings().includes( 'stella' );
// 테스트 옵션 ?route=light|friends|compass|sacrifice|late: 4장 이후를 그 갈래로 시작 (?chapter와 함께)
const ROUTE_TEST = ROUTES[ query.get( 'route' ) ] ? query.get( 'route' ) : null;
const newRoute = ( key ) => ( { hits: 0, luke: true, finn: true, late: false, ...ROUTES[ key ] } );
// 핀이 떠나면 나침반이 COMPASS_TIME초에 걸쳐 흐려진다. COMPASS_WEAK 아래로는 길 안내가 깜빡이고, 0이면 꺼진다
const COMPASS_TIME = 50;
const COMPASS_WEAK = 0.35;

const $ = ( id ) => document.getElementById( id );
const wrapAngle = ( a ) => Math.atan2( Math.sin( a ), Math.cos( a ) );

window.addEventListener( 'error', ( e ) => showError( e.message ) );
window.addEventListener( 'unhandledrejection', ( e ) => showError( e.reason?.stack ?? String( e.reason ) ) );
function showError( msg ) {

	const el = $( 'error' );
	el.textContent = `${t( 'error' )}\n${String( msg ).split( '\n' )[ 0 ]}\n`;
	const retry = document.createElement( 'button' );
	retry.className = 'chip';
	retry.textContent = t( 'retry' );
	retry.onclick = () => location.reload();
	el.append( retry );
	el.classList.remove( 'hidden' );

}

// ---------------------------------------------------------------
// 렌더러 / 후처리
// ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer( { antialias: false, powerPreference: 'high-performance' } );
const pixelRatio = Math.min( window.devicePixelRatio, LOW ? 1 : 1.5 );
renderer.setPixelRatio( pixelRatio );
renderer.setSize( innerWidth, innerHeight, false );
renderer.outputEncoding = THREE.sRGBEncoding;
$( 'app' ).appendChild( renderer.domElement );

const scene = new THREE.Scene();
const fog = new THREE.FogExp2( new THREE.Color( 0x123572 ).convertSRGBToLinear(), 0.00105 );
scene.fog = fog;
const camera = new THREE.PerspectiveCamera( 55, innerWidth / innerHeight, 0.5, 4200 );
camera.position.set( 0, 10, 30 );

const moonDir = new THREE.Vector3( 0.42, 0.17, - 0.89 ).normalize();
const hemiLight = new THREE.HemisphereLight( 0x5f8dff, 0x041030, 0.75 );
scene.add( hemiLight );
const moonLight = new THREE.DirectionalLight( 0xc4dcff, 1.15 );
moonLight.position.copy( moonDir ).multiplyScalar( 100 );
scene.add( moonLight );
const ambientLight = new THREE.AmbientLight( 0x26407a, 0.35 );
scene.add( ambientLight );
// 바닷속: 깊어질수록 달빛이 사라지고, 헤이즐 등의 빛 문양이 둘레를 비춘다
const hazelLamp = new THREE.PointLight( 0x7fe9ff, 0, 40, 1.6 );
scene.add( hazelLamp );

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

// 화면 크기: 캔버스는 CSS로 늘 화면을 꽉 채우고, 실제 보이는 크기가 바뀌면(폰 회전 등) 매 프레임 확인해서 맞춘다.
// iOS는 회전 직후의 resize 이벤트에서 아직 예전 크기를 알려 주는 경우가 있어서 이벤트만 믿지 않는다.
const view = { w: 0, h: 0 };
function syncSize() {

	const el = renderer.domElement;
	const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
	if ( w === view.w && h === view.h ) return;
	view.w = w;
	view.h = h;
	camera.fov = w < h ? 74 : 55;
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	renderer.setSize( w, h, false );
	composer.setSize( w, h );

}

syncSize();

// ---------------------------------------------------------------
// 게임 상태
// ---------------------------------------------------------------
const audio = new AudioEngine();

const G = {
	scene, camera, audio, PLACES, view,
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
	stun: 0,
	singCooldown: 0,
	jumpCooldown: 0,
	knock: new THREE.Vector3(),
	checkpoint: { x: 0, z: 0, yaw: Math.PI },
	objectiveTarget: null,
	camTarget: null,
	camOrbit: 0, // 터치: 고래 등 뒤 기준으로 돌린 만큼 (잠시 뒤 제자리로)
	camYaw: 0, // 카메라가 바라보는 방향. PC는 고래와 따로 돈다
	shake: 0,
	waiters: [],
	listeners: {},
	pendingKelp: null,
	boss: null,
	shards: [],
	dash: 0,
	compass: null,
	save: loadSave(),
	customName: loadName(),
	get playerName() {

		return this.customName || lang().defaultName;

	}
};
window.__fw = G;
// 저장된 갈래. 갈래가 생기기 전 저장으로 4장 이후를 이어하면 루크가 떠난 갈래
G.route = G.save.route ? { ...newRoute(), ...G.save.route } : newRoute( G.save.chapter >= 4 ? 'light' : null );

// 본 엔딩 목록 (저장과 따로 남는다)
function loadEndings() {

	try {

		const e = JSON.parse( localStorage.getItem( ENDINGS_KEY ) );
		return Array.isArray( e ) ? e : [];

	} catch ( e ) {

		return [];

	}

}

// 엔딩 6개를 다 모은 보상: 달빛 윤슬이 금빛 → 하늘색으로 번지고, 달이 금빛, 헤이즐의 빛 문양이 더 반짝인다
function allEndingsSeen() {

	const seen = loadEndings();
	return ENDING_ORDER.every( ( k ) => seen.includes( k ) );

}

function applyGoldenSea() {

	G.goldenSea = true;
	G.ocean.uniforms.uMoonColor.value.set( 0xff9a00 ).convertSRGBToLinear(); // 아주 밝아서 하얗게 날아가지 않도록 진한 금빛
	G.ocean.uniforms.uMoonEdge.value.set( 0x5cc8ff ).convertSRGBToLinear();
	G.sky.moonUniforms.uDisc.value.set( 0.95, 0.34, 0.0 ); // 윤슬과 같은 금빛 (초록을 낮춰야 레몬빛 · 흰빛으로 날아가지 않는다)
	G.sky.moonUniforms.uHalo.value.set( 0.45, 0.7, 1.0 );
	G.sky.moonUniforms.uGold.value = 1;
	G.sky.capture( renderer ); // 바다에 비치는 하늘(반사)도 다시 찍는다

}

function saveEnding( key ) {

	if ( STELLA_TEST || duetMode || DIVE_TEST ) return;
	const seen = loadEndings();
	if ( seen.includes( key ) ) return;
	seen.push( key );
	try {

		localStorage.setItem( ENDINGS_KEY, JSON.stringify( seen ) );

	} catch ( e ) { /* 저장 불가 */ }

}

function loadSave() {

	try {

		const s = JSON.parse( localStorage.getItem( SAVE_KEY ) );
		if ( s && typeof s.chapter === 'number' ) {

			const ids = [ 0, ...BOTTLES.map( ( b ) => b.id ) ];
			s.bottles = ( s.bottles ?? [] ).filter( ( id ) => ids.includes( id ) );
			s.read = ( s.read ?? [] ).filter( ( id ) => ids.includes( id ) );
			if ( ( s.chapter > 0 || s.cleared ) && ! s.bottles.includes( 0 ) ) s.bottles.push( 0 );
			return s;

		}

	} catch ( e ) { /* 저장 없음 */ }

	return { chapter: 0, bottles: [], read: [], kelps: [] };

}

function persist() {

	if ( STELLA_TEST || duetMode || DIVE_TEST ) return;
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

		return G.save.bottles.filter( ( id ) => id !== 0 && ! G.save.read.includes( id ) ).length;

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

	// --- 갈래 ---

	endingKey() {

		const r = G.route;
		if ( r.late ) return 'late';
		return r.luke ? ( r.finn ? 'friends' : 'compass' ) : ( r.finn ? 'light' : 'sacrifice' );

	},

	lukeCanLive() {

		return G.route.hits <= LUKE_MAX_HITS;

	},

	// 연출 중에 점프 신호: 플레이어가 점프할 때까지 기다린다
	jumpCue() {

		G.jumpCueOn = true;
		return G.until( () => ! G.jumpCueOn );

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

	// 매복 뒤 루크의 희생: 헤이즐과 부딪힌 연합군 사이로 뛰어든다. 근처 연합군은 한동안 멈춘다
	async lukeBlock( o ) {

		const luke = G.actors.luke;
		const h = G.actors.hazel;
		G.party.luke = 'busy';
		const dx = o.whale.pos.x - h.pos.x, dz = o.whale.pos.z - h.pos.z;
		const d = Math.hypot( dx, dz ) || 1;
		luke.scripted = { x: h.pos.x + dx / d * 5, z: h.pos.z + dz / d * 5, speed: 45 };
		for ( const other of G.orcas ) {

			if ( other.state === 'gone' || other.state === 'retreat' ) continue;
			if ( Math.hypot( other.whale.pos.x - h.pos.x, other.whale.pos.z - h.pos.z ) > 140 ) continue;
			other.state = 'stun';
			other.stunT = 8;

		}

		const t0 = G.time;
		await G.until( () => Math.hypot( luke.pos.x - luke.scripted.x, luke.pos.z - luke.scripted.z ) < 3 || G.time - t0 > 2 );
		luke.breach( 9 );
		await G.wait( 0.5 );
		G.flash( 0.9 );
		G.shake = 1.2;
		G.audio.play( 'hit' );
		G.audio.play( 'boom' );
		G.world.ring( luke.pos.x, luke.pos.z, { color: 0xffd36b, to: 70, life: 1.2, width: 0.25 } );
		G.world.splash( luke.pos.x, luke.root.position.y, luke.pos.z, { count: 120, power: 14 } );
		luke.setGlow( 1.2, 0xffb070 );

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

	// 루크가 사는 갈래: 헤이즐과 루크가 함께 뛰어오르고, 달려든 연합군끼리 한가운데서 부딪힌다
	async lukeDodge( ring ) {

		const luke = G.actors.luke;
		const h = G.actors.hazel;
		await G.wait( 0.55 );
		G.flash( 0.6 );
		G.shake = 1.1;
		G.audio.play( 'boom' );
		G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 140, power: 15 } );
		G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 60, life: 1.2, width: 0.25 } );
		ring.forEach( ( o ) => {

			o.state = 'stun';
			o.stunT = 2.5;

		} );
		luke.setGlow( 1.2, 0xffb070 );
		G.flags.lukeSaved = true;
		await G.wait( 1.4 );
		luke.setGlow( 0.3, 0xffd36b ); // 루크의 등불

	},

	lukeFall() {

		const luke = G.actors.luke;
		luke.scripted = null;
		luke.hold = true;
		luke.falling = true;
		luke.targetDepth = 16;
		G.party.luke = 'gone';
		G.route.luke = false;
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

		// 컷신이 끝난 순간엔 연합군이 헤이즐을 빙 둘러싸고 있다. 잠수해서 헤이즐 뒤쪽(도망칠 방향의 반대)으로 모였다가
		// AMBUSH_HEADSTART초 뒤 떠올라 쫓아온다. 앞을 막은 채로 쫓으면 피할 길이 없으니까
		const h = G.actors.hazel;
		const ex = PLACES.kelp5.x - h.pos.x, ez = PLACES.kelp5.z - h.pos.z;
		const el = Math.hypot( ex, ez ) || 1;
		ring.forEach( ( o, i ) => {

			const side = ( i - ( ring.length - 1 ) / 2 ) * 9;
			o.state = 'regroup';
			o.stunT = AMBUSH_HEADSTART;
			o.goal = { back: 50, side, dx: ex / el, dz: ez / el };
			o.whale.targetDepth = 9;

		} );
		// 헤이즐은 도망칠 방향으로 돌아서 잠깐 아주 빠르게 치고 나간다 (그동안은 부딪혀도 괜찮다)
		h.yaw = Math.atan2( ex, ez );
		G.camYaw = h.yaw;
		G.dash = AMBUSH_DASH;
		G.stamina = 1;
		G.audio.play( 'dash' );
		// 매복 전에 들켜서 쫓아오던 순찰대는 제자리로
		for ( const o of G.orcas ) if ( ! o.ambush && o.state === 'chase' ) o.state = 'return';

	},

	ambushRetreat( ring, shaman ) {

		ring.forEach( ( o ) => o.state = 'retreat' );
		shaman.targetDepth = 25;
		if ( G.party.luke === 'gone' ) G.actors.luke.root.visible = false;

	},

	// --- 4장 ---

	mobyRise() {

		const m = G.actors.moby;
		const h = G.actors.hazel;
		const c = PLACES.moby;
		const dx = h.pos.x - c.x, dz = h.pos.z - c.z;
		const d = Math.hypot( dx, dz ) || 1;
		m.place( c.x + dx / d * 40, c.z + dz / d * 40 );
		m.yaw = Math.atan2( h.pos.x - m.pos.x, h.pos.z - m.pos.z );
		m.depth = 40;
		m.targetDepth = 0;
		m.root.visible = true;
		m.hold = true;
		G.world.ring( m.pos.x, m.pos.z, { color: 0xbcd6ff, to: 90, life: 2.4 } );

	},

	stellaRise() {

		const s = G.actors.stella;
		const h = G.actors.hazel;
		const f = h.forward;
		s.place( h.pos.x + f.x * 170 - f.z * 50, h.pos.z + f.z * 170 + f.x * 50 );
		s.yaw = Math.atan2( h.pos.x - s.pos.x, h.pos.z - s.pos.z ) + 0.6;
		s.depth = 60;
		s.targetDepth = 0;
		s.root.visible = true;
		s.setGlow( 0.12, 0xffb020 );
		G.world.ring( s.pos.x, s.pos.z, { color: 0xffd36b, to: 160, life: 3 } );

	},

	// --- MAP 2 ---

	// 이 깊이(m)보다 아래는 물살이 막는다 (null = 기지까지 열림)
	setDiveFloor( depth ) {

		G.diveFloor = depth === null ? DIVE_BOTTOM : - depth;
		G.diveFloorWarned = false;

	},

	// 맵 2 기지 문 앞: 샤먼이 헤이즐과 문 사이를 막아선다
	shamanAtDoor( door ) {

		const s = G.actors.shaman;
		const h = G.actors.hazel;
		// 헤이즐 앞, 문 쪽으로 비스듬히 비켜선 자리에서 헤이즐을 마주 본다
		const a = Math.atan2( door.pos.x - h.pos.x, door.pos.z - h.pos.z ) + 1.1;
		const x = h.pos.x + Math.sin( a ) * 26, z = h.pos.z + Math.cos( a ) * 26;
		s.place( x, z, Math.atan2( h.pos.x - x, h.pos.z - z ) );
		s.depth = s.targetDepth = s.surfaceY - G.diveY + 2;
		s.hold = true;
		s.root.visible = true;
		s.setGlow( 0.25, 0xff2050 );
		G.camFocus( s, { side: 1, dist: 34, height: 6 } );
		return s;

	},

	// 정지 코드가 통한 뒤: 붉은 눈이 모두 꺼진다
	calmAlliance() {

		G.guards?.calm();
		G.actors.shaman.setGlow( 0, 0x000000 );

	},

	// 기록을 읽으면 그 자리가 쓰러졌을 때 깨어나는 곳이 되고, 하트가 다 찬다
	logRead( log ) {

		G.diveCheckpoint = { x: log.pos.x, z: log.pos.z, y: log.pos.y };
		heal( true );

	},

	nearLog( log ) {

		const h = G.actors.hazel;
		return Math.hypot( h.pos.x - log.pos.x, h.pos.z - log.pos.z ) < 13 && Math.abs( G.diveY - log.pos.y ) < 9;

	},

	// 정지 코드가 통하면 기지 창에 불이 켜진다
	openBase() {

		const door = G.map2.logs[ G.map2.logs.length - 1 ];
		G.dive.pulse( door.pos );
		G.world.splash( door.pos.x, door.pos.y, door.pos.z, { count: 120, power: 12, color: 0xffd36b } );
		G.audio.play( 'join' );
		G.map2.group.traverse( ( o ) => {

			if ( o.material?.emissive && o.material.emissive.getHex() === 0xff3355 ) o.material.emissive.set( 0x7fe9ff );

		} );

	},

	// 듀엣이 끝난 뒤 점수판 (노래 이름을 붙여 TOP 10에 남긴다)
	scores() {

		return openScores( G.ui, { name: G.playerName, score: G.flags.duetScore ?? 0, max: G.flags.duetMax ?? 0, rank: G.flags.duetRank ?? 'B', counts: G.flags.duetCounts ?? { perfect: 0, excellent: 0, good: 0 }, test: STELLA_TEST } );

	},

	duet( chart, title ) {

		return duet( chart, title );

	},

	songPuzzle( actor, patterns ) {

		return songPuzzle( actor, patterns );

	},

	boss( chapterLabel ) {

		return new Promise( ( resolve ) => startBoss( resolve, chapterLabel ) );

	},

	flash( v = 0.8 ) {

		finalPass.uniforms.uFlash.value = v;

	},

	// forced: 'heart'(멈춘 고래의 심장)처럼 갈래와 상관없는 엔딩
	async showEnding( forced = null ) {

		G.ended = true;
		if ( forced === 'deep' ) return showMap2Ending();
		if ( ! forced ) {

			G.save.chapter = 0;
			G.save.cleared = true;
			persist();

		}

		const minutes = Math.floor( G.stats.time / 60 ), seconds = Math.floor( G.stats.time % 60 );
		const key = forced ?? G.endingKey();
		const hadAll = allEndingsSeen();
		saveEnding( key );
		if ( G.flags.subEnding ) saveEnding( 'stella' );
		const newlyAll = ! hadAll && allEndingsSeen();
		if ( newlyAll ) applyGoldenSea();
		$( 'ending-head' ).textContent = `ENDING · ${t( `endings.${key}.name` )}${G.flags.subEnding ? ' · SUB ENDING' : ''}`;
		renderEndings( $( 'ending-list' ), key );
		// 스텔라를 만난 적 있으면 여기서 바로 듀엣만 다시
		$( 'btn-duet-end' ).classList.toggle( 'hidden', !! forced || ! loadEndings().includes( 'stella' ) );
		// 스텔라를 만난 적 있으면 MAP 2 미리보기 (포털 → 바닷속)
		$( 'btn-dive' ).classList.toggle( 'hidden', !! forced || ! loadEndings().includes( 'stella' ) );
		$( 'ending-quote' ).innerHTML = t( 'ending.quote' );
		$( 'ending-stats' ).innerHTML = [
			`PLAY TIME ${minutes}:${String( seconds ).padStart( 2, '0' )}`,
			`LETTERS ${G.bottleCount()}/${LETTER_TOTAL}`,
			G.flags.duetRank ? `DUET ${G.flags.duetRank} · ★ ${G.flags.duetStars}` : '',
			forced ? t( 'ending.heartHint' ) : G.flags.subEnding ? t( 'ending.sub' ) : t( 'ending.hint' ),
			newlyAll ? `<b class="gold">${t( 'ending.allEndings' )}</b>` : ''
		].filter( Boolean ).join( '<br>' );
		$( 'btn-again' ).textContent = t( forced ? 'ending.retry' : 'ending.again' );
		const left = ! forced && ! G.flags.subEnding && G.bottleCount() < LETTER_TOTAL;
		$( 'btn-search' ).classList.toggle( 'hidden', ! left );
		if ( left ) $( 'btn-search' ).textContent = t( 'ending.search', { n: G.bottleCount(), total: LETTER_TOTAL } );
		await G.ui.fade( 0.6, 2 );
		G.ui.show( 'hud', false );
		G.ui.show( 'ending' );

	}

} );

// MAP 2 엔딩 화면
async function showMap2Ending() {

	const minutes = Math.floor( G.stats.time / 60 ), seconds = Math.floor( G.stats.time % 60 );
	saveEnding( 'deep' );
	$( 'ending-head' ).textContent = `MAP 2 ENDING · ${t( 'endings.deep.name' )}`;
	renderEndings( $( 'ending-list' ), 'deep' );
	for ( const id of [ 'btn-duet-end', 'btn-dive', 'btn-search' ] ) $( id ).classList.add( 'hidden' );
	$( 'ending-quote' ).innerHTML = t( 'ending.quote' );
	$( 'ending-stats' ).innerHTML = [
		`PLAY TIME ${minutes}:${String( seconds ).padStart( 2, '0' )}`,
		`LOGS ${G.map2.logs.filter( ( l ) => l.read ).length}/${G.map2.logs.length}`,
		G.flags.duetRank ? `STOP CODE ${G.flags.duetRank}` : '',
		t( 'ending.deepHint' )
	].filter( Boolean ).join( '<br>' );
	$( 'btn-again' ).textContent = t( 'ending.again' );
	await G.ui.fade( 0.6, 2 );
	G.ui.show( 'hud', false );
	G.ui.show( 'ending' );

}

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

	if ( G.diving ) return; // MAP 2엔 연합군이 없다 (맵 1의 연합군은 숨겨 둔다)

	const h = G.actors.hazel;
	const frozen = G.cutsceneOn || G.ui.dialogOpen || G.diving; // 바닷속(MAP 2 미리보기)에선 수면의 연합군이 쫓지 않는다
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
				if ( frozen ) { w.speed *= 0.9; break; } // 대화 · 컷신 중엔 쫓지 않고 멈춰 기다린다
				steerTo( w, h.pos.x, h.pos.z, 19.8, dt, 2.4 );
				if ( fromHome > 220 || dP > 120 ) o.state = 'return';
				break;
			case 'hunt':
				if ( frozen ) { w.speed *= 0.9; break; }
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
				if ( o.stunT <= 0 ) {

					o.state = o.after ?? ( o.ambush ? ( G.flags.escaping ? 'hunt' : 'hold' ) : ( dP < 110 ? 'chase' : 'return' ) ); // 매복 추격 중에 부딪힌 녀석은 다시 쫓아온다
					o.after = null;

				}
				break;
			case 'regroup':
				// 헤이즐이 지금 있는 곳의 뒤쪽으로 (치고 나가는 헤이즐을 놓치지 않게)
				steerTo( w, h.pos.x - o.goal.dx * o.goal.back - o.goal.dz * o.goal.side, h.pos.z - o.goal.dz * o.goal.back + o.goal.dx * o.goal.side, 34, dt, 3 );
				if ( ! frozen ) o.stunT -= dt;
				if ( o.stunT <= 0 ) {

					o.state = 'hunt';
					w.targetDepth = 0;

				}

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

			// 매복을 함께 넘긴 뒤에도, 모비 딕에게 닿기 전에 맞으면 루크가 대신 들이받고 떠난다
			if ( lukeGuards() && G.route.hits >= LUKE_MAX_HITS ) {

				G.route.hits ++;
				o.state = 'stun';
				o.stunT = 1.6;
				lukeLateFall( G, o );

			} else if ( damage( 1, w.pos ) ) {

				G.route.hits ++;
				o.state = 'stun';
				o.stunT = 1.6;
				// 처음 맞으면 루크가 경고한다 (한 번만 더 맞으면 루크가 대신 들이받는다)
				if ( G.route.hits === LUKE_MAX_HITS && G.party.luke === 'on' && ! G.flags.mobyMet ) G.ui.toast( t( 'toast.lukeWarn' ) );

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

// MAP 2 경비 연합군에게 들켰을 때 (경고음 · 안내는 4초에 한 번)
function guardAlert( key ) {

	if ( G.time - ( G.lastAlert ?? - 99 ) < 4 ) return;
	G.lastAlert = G.time;
	G.audio.play( 'warn' );
	G.ui.toast( t( key ) );

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

// 기절했을 때 머리 위를 도는 별 세 개
let stunStars = null;

function updateStunStars( h, on ) {

	if ( ! stunStars ) {

		if ( ! on ) return;
		const c = document.createElement( 'canvas' );
		c.width = c.height = 64;
		const ctx = c.getContext( '2d' );
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		for ( let i = 0; i < 10; i ++ ) {

			const a = - Math.PI / 2 + i * Math.PI / 5;
			const r = i % 2 ? 11 : 30;
			ctx.lineTo( 32 + Math.cos( a ) * r, 32 + Math.sin( a ) * r );

		}

		ctx.fill();
		const mat = new THREE.SpriteMaterial( { map: new THREE.CanvasTexture( c ), color: new THREE.Color( 2.2, 1.8, 0.6 ), transparent: true, depthWrite: false, fog: false } );
		stunStars = new THREE.Group();
		for ( let i = 0; i < 3; i ++ ) {

			const s = new THREE.Sprite( mat );
			s.scale.setScalar( 1.3 );
			stunStars.add( s );

		}

		scene.add( stunStars );

	}

	stunStars.visible = on;
	if ( ! on ) return;
	stunStars.position.set( h.pos.x, h.root.position.y + 3, h.pos.z );
	stunStars.children.forEach( ( s, i ) => {

		const a = G.time * 5 + i * Math.PI * 2 / 3;
		s.position.set( Math.cos( a ) * 2, Math.sin( a * 2 ) * 0.25, Math.sin( a ) * 2 );

	} );

}
// stun: 그 시간 동안 헤엄·노래·점프를 못 하고 비틀거린다 (머리 위로 별이 돈다)
// 루크가 대신 맞아 줄 수 있는 때: 매복을 함께 넘겼고, 아직 보스전 전이고, 헤이즐이 맞을 수 있는 상태
function lukeGuards() {

	const h = G.actors.hazel;
	if ( G.invuln > 0 || h.airborne || G.cutsceneOn || G.fainting || G.dash > 0 ) return false;
	return G.flags.lukeSaved && G.party.luke === 'on' && ! G.lukeFalling && G.save.chapter <= 4 && ! G.flags.mobyMet;

}

function damage( n, from, { stun = 0 } = {} ) {

	const h = G.actors.hazel;
	if ( G.invuln > 0 || h.airborne || G.cutsceneOn || G.fainting || G.dash > 0 ) return false;
	G.hearts -= n;
	G.invuln = 2.4;
	if ( stun > 0 ) {

		G.stun = stun;
		h.speed = 0;

	}

	G.audio.play( 'hit' );
	finalPass.uniforms.uHurt.value = 1;
	G.shake = 0.8;
	const dx = h.pos.x - from.x, dz = h.pos.z - from.z;
	const d = Math.hypot( dx, dz ) || 1;
	G.knock.set( dx / d * 30, 0, dz / d * 30 );
	G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 50, power: 8, color: 0xffb0c0 } );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	if ( G.hearts <= 0 ) {

		if ( G.boss?.active && G.party.finn === 'on' ) finnShield( from );
		else faint();

	}

	return true;

}

async function faint() {

	G.fainting = true;
	G.cutscene( true );
	// 한 장에서 두 번째로 쓰러지면 심장이 멈춘다 (엔딩). 핀이 대신 맞은 건 세지 않는다
	// 맵 2에선 심장이 멈추지 않고, 마지막으로 읽은 기록 앞에서 깨어난다
	if ( ! G.diving ) {

		G.chapterFaints = ( G.chapterFaints ?? 0 ) + 1;
		if ( G.chapterFaints >= 2 ) return heartStop();

	}

	G.ui.toast( t( G.diving ? 'map2.faint' : 'toast.faint' ) );
	await G.ui.fade( 1, 1.2 );
	const h = G.actors.hazel;
	if ( G.diving ) {

		const c = G.diveCheckpoint;
		h.place( c.x, c.z, h.yaw );
		G.diveY = c.y;
		G.diveVy = 0;
		camera.position.set( c.x - Math.sin( G.camYaw ) * 20, c.y + 4.5, c.z - Math.cos( G.camYaw ) * 20 );
		for ( const g of G.guards?.list ?? [] ) if ( g.state === 'chase' || g.state === 'spot' || g.state === 'stun' ) g.state = 'return';

	} else if ( G.boss?.active ) {

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
	G.camYaw = h.yaw;
	G.camOrbit = 0;
	G.hearts = MAX_HEARTS;
	G.stamina = 1;
	G.invuln = 3;
	G.stun = 0;
	G.knock.set( 0, 0, 0 );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	await G.wait( 0.3 );
	await G.ui.fade( 0, 1 );
	if ( ! G.diving ) G.ui.toast( t( 'toast.lastHeart' ) );
	G.cutscene( false );
	G.fainting = false;

}

// 멈춘 고래의 심장: 헤이즐이 가라앉고 엔딩. 저장은 그 장 그대로라 이어하기로 그 장 처음부터 다시 한다
async function heartStop() {

	const T = lang().story.heart;
	const h = G.actors.hazel;
	if ( G.boss?.active ) {

		clearMeteors();
		G.ui.setBoss( false );

	}

	G.objectiveTarget = null;
	G.setMusic( { drums: 0, bass: 0, tension: 0, sax: 0, melody: 0.3, piano: 0.8 } );
	G.audio.play( 'sad' );
	G.camFocus( h, { side: 1, dist: 26, height: 10 } );
	for ( let i = 0; i < 40; i ++ ) {

		h.depth += 0.25;
		h.speed *= 0.85;
		h.setOpacity?.( 1 - i / 60 );
		await G.wait( 0.05 );

	}

	await G.say( T.lines.map( ( [ who, text ] ) => ( { who, text } ) ) );
	await G.card( ...T.card );
	await G.showEnding( 'heart' );

}

function heal( full = false ) {

	G.hearts = full ? MAX_HEARTS : Math.min( MAX_HEARTS, G.hearts + 1 );
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	G.audio.play( 'heal' );

}

// 핀의 눈물: 핀이 떠난 뒤, 스턴 중에 노래하면 비가 내려 스턴이 바로 풀린다
function finnTears() {

	const h = G.actors.hazel;
	G.stun = 0;
	G.singCooldown = 0.6;
	audio.play( 'sob' );
	audio.play( 'heal' );
	G.world.rain( h.pos.x, h.pos.z );
	G.world.ring( h.pos.x, h.pos.z, { color: 0x9d8cff, to: 26, life: 0.9, width: 0.2 } );
	G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 40, power: 6, color: 0xb9a8ff } );

}

// 보스전에서 처음 쓰러질 때 핀이 대신 맞는다 (부서진 나침반 · 희생 갈래)
async function finnShield( from ) {

	const T = lang().story.ch4;
	const say = ( arr ) => G.say( arr.map( ( [ who, text ] ) => ( { who, text } ) ) );
	const finn = G.actors.finn, h = G.actors.hazel;
	G.fainting = true;
	G.cutscene( true );
	clearMeteors();
	G.stun = 0;
	G.knock.set( 0, 0, 0 );
	G.party.finn = 'busy';
	const dx = from.x - h.pos.x, dz = from.z - h.pos.z;
	const d = Math.hypot( dx, dz ) || 1;
	finn.scripted = { x: h.pos.x + dx / d * 8, z: h.pos.z + dz / d * 8, speed: 50 };
	G.camFocus( finn, { side: - 1, dist: 36, height: 12 } );
	const t0 = G.time;
	await G.until( () => Math.hypot( finn.pos.x - finn.scripted.x, finn.pos.z - finn.scripted.z ) < 3 || G.time - t0 > 2 );
	finn.breach( 9 );
	await G.wait( 0.5 );
	G.flash( 0.9 );
	G.shake = 1.2;
	G.audio.play( 'hit' );
	G.audio.play( 'boom' );
	G.world.ring( finn.pos.x, finn.pos.z, { color: 0x9d8cff, to: 60, life: 1.2, width: 0.25 } );
	G.world.splash( finn.pos.x, finn.root.position.y, finn.pos.z, { count: 120, power: 14 } );
	finn.setGlow( 1, 0x9d8cff );
	G.hearts = MAX_HEARTS;
	G.ui.setHearts( G.hearts, MAX_HEARTS );
	await G.wait( 0.8 );
	await say( T.finnLast );

	finn.scripted = null;
	finn.hold = true;
	finn.falling = true;
	finn.targetDepth = 16;
	G.party.finn = 'gone';
	G.route.finn = false;
	G.flags.finnGone = true;
	G.ui.setParty( partyList() );
	G.audio.setMix( { drums: 0 }, 4 );
	G.audio.play( 'sad' );
	await G.wait( 3 );
	G.ui.banner( ...T.bannerFinn, 'sad', 4 );
	await G.wait( 2.5 );
	await say( T.compass );
	G.compass = 1;
	G.ui.setCompass( 1 );
	finn.root.visible = false;
	await say( T.tears );
	G.flags.finnTears = true;
	G.ui.banner( ...T.bannerTears, 'join', 4.5 );
	G.boss.phase = 'rage';
	G.boss.t = - 1;
	G.boss.meteorT = 2;
	updateBossHud();
	G.invuln = 3;
	G.camRelease();
	G.cutscene( false );
	G.fainting = false;

}

// 부서진 나침반: 시간이 지나면 길 안내가 흐려지고, 미역 곁에서 노래하면 다시 맞춰진다
function updateCompass( dt ) {

	if ( G.compass === null || ! G.started || G.ended || G.cutsceneOn || G.ui.dialogOpen ) return;
	const before = G.compass;
	G.compass = Math.max( 0, G.compass - dt / COMPASS_TIME );
	if ( before > COMPASS_WEAK && G.compass <= COMPASS_WEAK ) G.ui.toast( t( 'toast.compassWeak' ) );
	if ( before > 0 && G.compass === 0 ) G.ui.toast( t( 'toast.compassOff' ) );
	G.ui.setCompass( G.compass );

}

function refillCompass( k ) {

	if ( G.compass === null || G.compass > 0.97 ) return;
	G.compass = 1;
	G.ui.setCompass( 1 );
	G.ui.toast( t( 'toast.compassOn' ) );
	G.world.ring( k.x, k.z, { color: 0x9d8cff, to: 36, life: 1.2, delay: 0.2 } );

}

// 나침반이 흐려지면 길 안내가 깜빡이다가 꺼진다
function guideVisible() {

	const c = G.compass;
	if ( c === null || c > COMPASS_WEAK ) return true;
	if ( c <= 0 ) return false;
	return ( G.time * 2.5 ) % 1 < 0.35 + 0.65 * c / COMPASS_WEAK;

}

// 엔딩 도감: 본 엔딩은 이름, 못 본 엔딩은 힌트
function renderEndings( el, current ) {

	const seen = loadEndings();
	const count = ENDING_ORDER.filter( ( k ) => seen.includes( k ) ).length;
	const items = ENDING_ORDER.map( ( k ) => seen.includes( k )
		? `<li class="seen${k === current ? ' now' : ''}">◆ ${t( `endings.${k}.name` )}</li>`
		: `<li>◇ ??? <small>${G.ui.dev( t( `endings.${k}.hint` ) )}</small></li>` );
	if ( seen.includes( 'stella' ) ) items.push( `<li class="seen star">★ ${t( 'endings.stella' )}</li>` );
	if ( seen.includes( 'deep' ) ) items.push( `<li class="seen star${current === 'deep' ? ' now' : ''}">◈ MAP 2 · ${t( 'endings.deep.name' )}</li>` );
	el.innerHTML = `<li class="head">ENDINGS ${count}/${ENDING_ORDER.length}</li>${items.join( '' )}`;

}

function setCheckpoint( x, z ) {

	G.checkpoint = { x, z, yaw: G.actors.hazel.yaw };

}

// ---------------------------------------------------------------
// 보스: 모비 딕 설득하기
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// 따라 부르기: 상대가 리듬(울음)을 들려주면, 같은 박자로 52Hz를 불러 대답한다
// 첫 대답 시점을 기준으로 간격만 맞으면 된다. 스토리 게임이라 넉넉하게 봐주고, 세 번 틀리면 루크가 박자를 세 준다
// ---------------------------------------------------------------
const SONG_BEAT = 60 / 92; // 음악과 같은 박자
const SONG_TOLERANCE = 0.2; // 초

function songPuzzle( actor, patterns ) {

	return new Promise( ( resolve ) => {

		const box = $( 'song' ), beatsEl = $( 'song-beats' ), hint = $( 'song-hint' );
		const now = () => performance.now() / 1000;
		const say = ( key ) => hint.textContent = G.ui.dev( t( `song.${key}` ) );
		const timers = new Set();
		const later = ( s, fn ) => {

			const id = setTimeout( () => {

				timers.delete( id );
				fn();

			}, s * 1000 );
			timers.add( id );

		};

		let round = 0, fails = 0, dots = [];
		const state = { turn: false, taps: [], tap };
		G.puzzle = state;
		$( 'song-title' ).textContent = t( 'song.title' );
		document.body.classList.add( 'singing' );
		G.ui.show( 'song' );
		box.onpointerdown = ( e ) => {

			e.stopPropagation();
			tap();

		};

		G.audio.setMix( { melody: 0.15 }, 1 );
		actor.setGlow( 0.25, 0x7fe9ff );

		function listen() {

			const p = patterns[ round ];
			state.turn = false;
			state.taps = [];
			box.classList.remove( 'turn' );
			beatsEl.innerHTML = '<span></span>'.repeat( p.length );
			dots = [ ...beatsEl.children ];
			say( 'listen' );
			p.forEach( ( b, i ) => later( 0.5 + b * SONG_BEAT, () => {

				G.audio.play( 'sob' );
				actor.setGlow( 0.7, 0x7fe9ff );
				later( 0.15, () => actor.setGlow( 0.25 ) );
				G.world.ring( actor.pos.x, actor.pos.z, { color: 0x7fe9ff, to: 14, life: 0.6, width: 0.3 } );
				dots[ i ].classList.add( 'them' );
				later( 0.22, () => dots[ i ].classList.remove( 'them' ) );

			} ) );
			later( 0.5 + p[ p.length - 1 ] * SONG_BEAT + SONG_BEAT * 1.2, () => {

				state.turn = true;
				box.classList.add( 'turn' );
				say( 'turn' );

			} );

		}

		function tap() {

			if ( ! state.turn ) return;
			const p = patterns[ round ];
			const at = now();
			const taps = state.taps;
			if ( taps.length && at - taps[ taps.length - 1 ] < 0.08 ) return;
			taps.push( at );
			const i = taps.length - 1;
			const h = G.actors.hazel;
			G.audio.play( 'echo' );
			G.world.ring( h.pos.x, h.pos.z, { color: 0xffd36b, to: 12, life: 0.6, width: 0.3 } );
			const off = ( at - taps[ 0 ] ) - ( p[ i ] - p[ 0 ] ) * SONG_BEAT;
			if ( Math.abs( off ) > SONG_TOLERANCE ) return miss( i );
			dots[ i ].classList.add( 'ok' );
			if ( taps.length === p.length ) return pass();
			// 다음 박자가 너무 늦으면 놓친 것
			const wait = ( p[ i + 1 ] - p[ i ] ) * SONG_BEAT + SONG_TOLERANCE + 0.05;
			const count = taps.length;
			later( wait, () => state.turn && state.taps.length === count && miss( count ) );

		}

		function miss( i ) {

			state.turn = false;
			box.classList.remove( 'turn' );
			if ( dots[ i ] ) dots[ i ].classList.add( 'bad' );
			G.audio.play( 'miss' );
			fails ++;
			if ( fails >= 3 ) {

				say( 'help' );
				dots.forEach( ( d ) => d.className = 'ok' );
				return later( 1.4, next );

			}

			say( 'miss' );
			later( 1.3, listen );

		}

		function pass() {

			state.turn = false;
			box.classList.remove( 'turn' );
			G.audio.play( 'pickup' );
			say( 'good' );
			later( 1.2, next );

		}

		function next() {

			round ++;
			fails = 0;
			if ( round < patterns.length ) return listen();
			say( 'done' );
			G.audio.play( 'heal' );
			actor.setGlow( 0.1, 0x7fe9ff );
			G.world.ring( actor.pos.x, actor.pos.z, { color: 0x7fe9ff, to: 40, life: 1.4 } );
			later( 1.4, () => {

				for ( const id of timers ) clearTimeout( id );
				G.puzzle = null;
				box.onpointerdown = null;
				G.ui.show( 'song', false );
				document.body.classList.remove( 'singing' );
				G.audio.setMix( { melody: 1 }, 1.5 );
				actor.setGlow( 0 );
				resolve();

			} );

		}

		listen();

	} );

}

// ---------------------------------------------------------------
// 스텔라와 듀엣: 음악 박자에 맞춰 ♪(노래)·⤴(점프) 노트를 맞히는 리듬 게임. 실패는 없고 등급만 매긴다
// 시계는 오디오 시계에서 출력 지연을 뺀 값이라, 귀에 들리는 박자와 노트가 맞는다
// ---------------------------------------------------------------
// 판정 창 (초)과 점수: PERFECT는 거의 정확히 맞힌 것만, EXCELLENT는 조금 어긋난 것, GOOD은 그 밖
const DUET_PERFECT = 0.025, DUET_EXCELLENT = 0.06, DUET_GOOD = 0.15;
const DUET_POINTS = { perfect: 10, excellent: 8, good: 5 };
const DUET_SPEED = 150; // 노트가 흘러오는 속도 (px/초)

function duet( chart, title = null ) {

	return new Promise( ( resolve ) => {

		const track = $( 'duet-track' ), judgeEl = $( 'duet-judge' ), comboEl = $( 'duet-combo' );
		const lanes = { S: track.querySelector( '[data-lane="S"]' ), J: track.querySelector( '[data-lane="J"]' ) };
		const ctx = audio.ctx;
		const lat = ctx ? ( ctx.outputLatency || ctx.baseLatency || 0 ) : 0;
		const clock = () => ( ctx && audio.ctx === ctx ) ? ctx.currentTime - lat : performance.now() / 1000;
		const beat = 60 / 92;
		const bar0 = ( ctx && audio.restartForm() ) || clock() + 0.6; // 첫 마디는 스텔라의 카운트
		const t0 = bar0 + beat * 4;
		const notes = chart.map( ( [ b, lane, midi ] ) => {

			const el = document.createElement( 'div' );
			el.className = `duet-note ${lane}`;
			el.textContent = lane === 'S' ? '♪' : '⤴';
			track.appendChild( el );
			return { t: t0 + b * beat, lane, midi, el, done: false };

		} );
		const end = notes[ notes.length - 1 ].t + 1.2;
		const prev = { melody: audio.mix.melody, sax: audio.mix.sax };
		// 점프 노트 하나가 별똥별 하나. 다 맞히면 밤하늘에 별똥별이 우수수 쏟아진다
		const starsEl = $( 'duet-stars' ), starTotal = notes.filter( ( n ) => n.lane === 'J' ).length;
		const aim = () => camera.getWorldDirection( new THREE.Vector3() ).setY( 0 ).normalize();
		const showStars = () => starsEl.textContent = `★ ${stars}/${starTotal}`;
		let score = 0, combo = 0, stars = 0;
		const counts = { perfect: 0, excellent: 0, good: 0 };
		const flashT = {};

		$( 'duet-title' ).textContent = title ?? t( 'duet.title' );
		$( 'duet-help' ).textContent = G.ui.dev( t( 'duet.help' ) );
		judgeEl.textContent = t( 'duet.ready' );
		judgeEl.className = '';
		starsEl.className = '';
		showStars();
		comboEl.textContent = '';
		document.body.classList.add( 'singing' );
		G.ui.show( 'duet' );
		audio.setMix( { melody: 0, sax: 0 }, 0.8 );
		for ( const [ lane, el ] of Object.entries( lanes ) ) el.onpointerdown = ( e ) => {

			e.stopPropagation();
			hit( lane );

		};

		// 스텔라의 카운트 (첫 마디 네 박)
		if ( ctx ) for ( let i = 0; i < 4; i ++ ) audio.voice( bar0 + i * beat, [ [ 0, i === 3 ? 330 : 220 ], [ 0.25, i === 3 ? 330 : 220 ] ], { vel: 0.1, reverb: 0.9 } );

		const show = ( kind ) => {

			judgeEl.textContent = t( `duet.${kind}` );
			judgeEl.className = kind;
			comboEl.textContent = combo > 1 ? t( 'duet.combo', { n: combo } ) : '';

		};

		function hit( lane, at = clock() ) {

			const flash = lanes[ lane ];
			flash.classList.add( 'flash' );
			clearTimeout( flashT[ lane ] );
			flashT[ lane ] = setTimeout( () => flash.classList.remove( 'flash' ), 120 );
			let note = null, closest = DUET_GOOD;
			for ( const n of notes ) {

				const d = Math.abs( at - n.t );
				if ( ! n.done && n.lane === lane && d <= closest ) {

					note = n;
					closest = d;

				}

			}

			if ( ! note ) return; // 빈 박자에 누른 건 벌하지 않는다
			note.done = true;
			note.el.classList.add( 'hit' );
			const kind = closest <= DUET_PERFECT ? 'perfect' : closest <= DUET_EXCELLENT ? 'excellent' : 'good';
			score += DUET_POINTS[ kind ];
			counts[ kind ] ++;
			combo ++;
			show( kind );
			if ( lane === 'S' ) {

				// 헤이즐이 멜로디, 스텔라가 한 옥타브 아래로 같이 부른다
				if ( ctx ) {

					const f = 440 * Math.pow( 2, ( note.midi - 69 ) / 12 );
					const now = ctx.currentTime;
					audio.voice( now, [ [ 0, f * 0.97 ], [ 0.05, f ], [ 0.42, f ] ], { vel: 0.13, vibrato: 6, reverb: 0.7 } );
					audio.voice( now + 0.02, [ [ 0, f * 0.485 ], [ 0.06, f / 2 ], [ 0.5, f / 2 ] ], { vel: 0.08, vibrato: 4.5, reverb: 1 } );

				}

				const h = G.actors.hazel;
				G.world.ring( h.pos.x, h.pos.z, { color: 0x7fe9ff, to: 12, life: 0.5, width: 0.3 } );

			} else {

				jump();
				stars ++;
				showStars();
				G.sky.spawnShootingStar( true, aim() );
				const s = G.actors.stella;
				G.world.ring( s.pos.x, s.pos.z, { color: 0xffd36b, to: 60, life: 1, width: 0.25 } );

			}

		}

		function frame() {

			const now = clock();
			const w = track.clientWidth;
			for ( const n of notes ) {

				if ( ! n.done && now > n.t + DUET_GOOD ) {

					n.done = true;
					n.el.classList.add( 'miss' );
					combo = 0;
					show( 'miss' );

				}

				const x = 45 + ( n.t - now ) * DUET_SPEED;
				n.el.style.display = x < - 20 || x > w + 20 ? 'none' : '';
				n.el.style.transform = `translateX(${x.toFixed( 1 )}px)`;

			}

			if ( now > end ) return finish();
			requestAnimationFrame( frame );

		}

		function finish() {

			G.duetPlay = null;
			const max = notes.length * DUET_POINTS.perfect;
			const ratio = score / max;
			const rank = ratio >= 0.85 ? 'S' : ratio >= 0.6 ? 'A' : 'B';
			G.flags.duetRank = rank;
			G.flags.duetScore = score;
			G.flags.duetMax = max;
			G.flags.duetCounts = { ...counts };
			G.flags.duetStars = `${stars}/${starTotal}`;
			judgeEl.textContent = t( 'duet.rank', { r: rank } );
			judgeEl.className = 'perfect';
			comboEl.textContent = `${Math.round( ratio * 100 )}% · P${counts.perfect} E${counts.excellent} G${counts.good}`;
			audio.play( rank === 'B' ? 'heal' : 'join' );
			// 스텔라 엔딩 내내 별똥별이 보는 쪽 하늘로 계속 떨어진다. 맞힌 별이 많을수록 더 많이
			G.sky.aim = aim();
			G.sky.meteorShower = 1.2 + 1.3 * stars / starTotal;
			if ( stars === starTotal ) {

				// 밤하늘 완성: 별똥별이 우수수 쏟아진다
				starsEl.classList.add( 'full' );
				starsEl.textContent = t( 'duet.sky' );
				G.sky.shower( 48, 4, G.sky.aim );

			}
			setTimeout( () => {

				G.ui.show( 'duet', false );
				document.body.classList.remove( 'singing' );
				for ( const n of notes ) n.el.remove();
				for ( const el of Object.values( lanes ) ) el.onpointerdown = null;
				audio.setMix( prev, 1.5 );
				resolve( rank );

			}, 1800 );

		}

		G.duetPlay = { hit, notes, clock };
		requestAnimationFrame( frame );

	} );

}

function startBoss( resolve, chapterLabel ) {

	const arena = makeSurfaceDecal( { color: 0x3a7dff, inner: 0.99, outer: 1, opacity: 0.3 } );
	arena.scale.setScalar( 160 );
	arena.position.set( PLACES.moby.x, 0, PLACES.moby.z );
	scene.add( arena );
	// 루크가 함께면 등불로 비춰서 노래가 닿는 원이 넓어진다
	const reach = G.party.luke === 'on' ? 64 : 46;
	const listenRing = makeSurfaceDecal( { color: 0x5fd8ff, inner: 0.95, outer: 1, opacity: 0, fill: 0.12 } );
	listenRing.scale.setScalar( reach );
	scene.add( listenRing );

	G.boss = { active: true, phase: 'rage', t: 0, resonance: 0, meteorT: 1.5, arena, listenRing, reach, resolve, meteors: [] };
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
	mobyBody( frozen );
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

			if ( b.t > 3.5 ) {

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

// 모비 몸(머리~꼬리 캡슐)에 닿으면 밀려나고, 하트도 하나 준다
function mobyBody( frozen ) {

	const m = G.actors.moby;
	const h = G.actors.hazel;
	const f = m.forward;
	const half = m.length * 0.42;
	const ax = m.pos.x - f.x * half, az = m.pos.z - f.z * half; // 꼬리 쪽
	const bx = m.pos.x + f.x * half, bz = m.pos.z + f.z * half; // 머리 쪽
	const vx = bx - ax, vz = bz - az;
	const t = Math.max( 0, Math.min( 1, ( ( h.pos.x - ax ) * vx + ( h.pos.z - az ) * vz ) / ( vx * vx + vz * vz ) ) );
	const px = ax + vx * t, pz = az + vz * t;
	const radius = ( 4.5 + 3 * t ) * m.length / 46 + 2.5; // 머리 쪽이 더 굵다 (몸 크기에 비례) + 헤이즐 몸
	const dx = h.pos.x - px, dz = h.pos.z - pz;
	const d = Math.hypot( dx, dz );
	if ( d >= radius || h.airborne ) return;
	const nx = d > 0.01 ? dx / d : - f.z, nz = d > 0.01 ? dz / d : f.x;
	h.pos.x = px + nx * radius;
	h.pos.z = pz + nz * radius;
	if ( ! frozen ) damage( 1, { x: px, z: pz }, G.boss?.phase === 'charge' ? { stun: CHARGE_STUN } : {} );

}

async function bossSing() {

	const b = G.boss;
	const m = G.actors.moby;
	if ( b.phase !== 'listen' || G.distTo( m.pos ) > b.reach + 4 ) return;
	b.resonance ++;
	b.phase = 'rage';
	b.t = - 0.5;
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

	const warnTime = G.party.finn === 'on' ? 1.7 : 1.25;
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
			G.world.ring( m.x, m.z, { color: 0xffb060, to: 10, life: 0.8, width: 0.3 } );
			G.audio.play( 'boom' );
			G.shake = Math.max( G.shake, 0.35 );
			if ( G.distTo( m ) < 7.5 ) damage( 1, m, { stun: STUN_TIME } );
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
const touch = { x: 0, y: 0, boost: false, up: false, down: false, active: false };

// 기울기 조종 (일시정지 메뉴의 실험실): 가로로 든 폰을 앞으로 눕히면 앞으로, 뒤로 젖히면 천천히 뒤로, 좌우로 기울이면 방향 전환.
// 켤 때, 계속하기를 누를 때, 대화가 끝나 다시 움직일 수 있을 때 들고 있던 자세를 기준(0)으로 삼는다.
const TILT_KEY = 'fromwhale.tilt';
const tilt = { on: false, ready: false, roll: 0, pitch: 0, roll0: 0, pitch0: 0, cal: true, angle: null };

function screenAngle() {

	if ( typeof window.orientation === 'number' ) return window.orientation;
	return screen.orientation ? screen.orientation.angle : 0;

}

function onOrientation( e ) {

	if ( e.beta == null || e.gamma == null ) return;
	const deg = Math.PI / 180, b = e.beta * deg, g = e.gamma * deg;
	// 기기 좌표의 중력 방향 → 화면 좌표 (가로 모드면 화면이 기기에 대해 돌아가 있다)
	const gx = Math.sin( g ) * Math.cos( b ), gy = - Math.sin( b ), gz = - Math.cos( g ) * Math.cos( b );
	const angle = screenAngle(), a = angle * deg;
	const sx = gx * Math.cos( a ) - gy * Math.sin( a ), sy = gx * Math.sin( a ) + gy * Math.cos( a );
	const roll = Math.atan2( sx, Math.hypot( sy, gz ) ); // + 오른쪽이 내려감
	const pitch = Math.atan2( - gz, - sy ); // 0 화면이 똑바로 섬, 90° 화면이 하늘을 봄. 앞으로 눕히면 커진다
	if ( angle !== tilt.angle ) { tilt.angle = angle; tilt.cal = true; }
	if ( tilt.cal ) {

		tilt.roll = tilt.roll0 = roll;
		tilt.pitch = tilt.pitch0 = pitch;
		tilt.cal = false;

	}

	tilt.roll += ( roll - tilt.roll ) * 0.35;
	tilt.pitch += ( pitch - tilt.pitch ) * 0.35;
	tilt.ready = true;

}

const tiltActive = () => tilt.on && tilt.ready && G.touch && view.w > view.h;

// 작은 흔들림은 무시하고, 기준에서 5°부터 움직여 20°에서 최고 속도
function tiltInput() {

	const ramp = ( v, from, to ) => Math.sign( v ) * Math.min( 1, Math.max( 0, ( Math.abs( v ) - from ) / ( to - from ) ) );
	const deg = 180 / Math.PI;
	const p = ramp( ( tilt.pitch - tilt.pitch0 ) * deg, 5, 20 );
	const r = ramp( ( tilt.roll - tilt.roll0 ) * deg, 3, 22 );
	return { throttle: p, turn: - r * 1.2 };

}

function setTilt( on ) {

	const DOE = window.DeviceOrientationEvent;
	if ( on && ! DOE ) return tiltFailed();
	// iOS는 버튼을 누른 그 순간에 권한을 물어야 한다
	if ( on && typeof DOE.requestPermission === 'function' ) {

		DOE.requestPermission().then( ( s ) => s === 'granted' ? enableTilt( true ) : tiltFailed() ).catch( tiltFailed );
		return;

	}

	enableTilt( on );

}

function enableTilt( on ) {

	tilt.on = on;
	tilt.cal = true;
	if ( on ) window.addEventListener( 'deviceorientation', onOrientation );
	else window.removeEventListener( 'deviceorientation', onOrientation );
	try { localStorage.setItem( TILT_KEY, on ? '1' : '0' ); } catch ( e ) { /* 저장 못 해도 이번 판은 된다 */ }
	$( 'lab-status' ).hidden = true;
	tiltLabel();
	// 센서가 없는 기기는 이벤트가 오지 않는다
	if ( on ) setTimeout( () => tilt.on && ! tilt.ready && tiltFailed(), 1500 );

}

function tiltFailed() {

	if ( tilt.on ) enableTilt( false );
	$( 'lab-status' ).hidden = false;

}

function tiltLabel() {

	const btn = $( 'btn-tilt' );
	btn.textContent = `${t( 'lab.tilt' )} · ${t( tilt.on ? 'lab.on' : 'lab.off' )}`;
	btn.classList.toggle( 'on', tilt.on );
	btn.setAttribute( 'aria-pressed', String( tilt.on ) );

}

window.addEventListener( 'keydown', ( e ) => {

	if ( e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement ) return;
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
	if ( G.puzzle && [ 'KeyE', 'Space', 'Enter' ].includes( code ) ) return G.puzzle.tap();
	if ( G.duetPlay && ( code === 'KeyE' || code === 'Enter' ) ) return G.duetPlay.hit( 'S' );
	if ( G.duetPlay && code === 'Space' ) return G.duetPlay.hit( 'J' );
	if ( ui.dialogOpen ) {

		if ( [ 'Space', 'Enter', 'KeyE' ].includes( code ) ) ui.advance();
		return;

	}

	if ( G.jumpCueOn && code === 'Space' ) {

		if ( jump() ) G.jumpCueOn = false;
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
	if ( on ) tiltLabel();
	else tilt.cal = true;

}

function openJournal() {

	const entries = G.save.bottles.filter( ( id ) => id !== 0 ).sort( ( a, b ) => a - b ).map( ( id ) => {

		const l = lang().letters.find( ( x ) => x.id === id );
		return { ...l, read: G.save.read.includes( id ), scrambled: scramble( l.body ) };

	} );
	if ( G.flags.letter0Read ) entries.unshift( { ...lang().mobyLetter, head: t( 'journal.mobyHead' ), read: true } );
	G.ui.journal( entries, LETTER_TOTAL );

}

function setupTouch() {

	const coarse = matchMedia( '(pointer: coarse)' ).matches || 'ontouchstart' in window;
	if ( ! coarse ) return;
	G.touch = true;
	document.body.classList.add( 'touch' );
	$( 'btn-tilt' ).onclick = () => setTilt( ! tilt.on );
	let saved = null;
	try { saved = localStorage.getItem( TILT_KEY ); } catch ( e ) { /* 없음 */ }
	if ( saved === '1' && window.DeviceOrientationEvent ) {

		// iOS는 다시 켤 때도 화면을 한 번 눌러야 권한을 물을 수 있다
		if ( typeof DeviceOrientationEvent.requestPermission === 'function' ) {

			tilt.on = true;
			window.addEventListener( 'touchend', () => setTilt( true ), { once: true, capture: true } );

		} else enableTilt( true );

	}
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
			else if ( G.diving && ! G.duetPlay && ! G.puzzle && ! G.ui.dialogOpen && ! G.ui.overlay && ( act === 'jump' || act === 'down' ) ) touch[ act === 'jump' ? 'up' : 'down' ] = true;
			else if ( G.ui.dialogOpen || G.ui.overlay ) onAction( 'KeyE' );
			else onAction( act === 'sing' ? 'KeyE' : 'Space' );

		} );
		const up = () => {

			btn.classList.remove( 'held' );
			if ( act === 'boost' ) touch.boost = false;
			if ( act === 'jump' ) touch.up = false;
			if ( act === 'down' ) touch.down = false;

		};

		btn.addEventListener( 'pointerup', up );
		btn.addEventListener( 'pointercancel', up );
		btn.addEventListener( 'pointerleave', up );

	} );

}

// 모바일: 두 번 탭·핀치로 화면이 확대되지 않게 막는다 (iOS는 viewport 설정만으로는 안 막힘)
function preventZoom() {

	const typing = ( e ) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
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
	const d = ( e.clientX - drag.x ) * 0.006;
	if ( G.touch ) G.camOrbit -= d;
	else G.camYaw -= d;
	drag.x = e.clientX;
	G.lastDrag = G.time;

} );
window.addEventListener( 'pointerup', () => drag = null );

// ---------------------------------------------------------------
// 플레이어 행동
// ---------------------------------------------------------------
function sing() {

	if ( G.stun > 0 && G.flags.finnTears && ! G.cutsceneOn && ! G.ui.dialogOpen ) return finnTears();
	if ( G.singCooldown > 0 || G.stun > 0 ) return;
	const h = G.actors.hazel;
	G.singCooldown = 1.3;
	audio.play( 'sing' );
	if ( G.diving ) {

		G.dive.pulse( h.root.position ); // 바닷속: 노래가 소나처럼 둘레를 밝힌다
		G.sea?.reveal( h.root.position ); // 숨은 곰치도 붉게 드러난다
		G.guards?.hear( h.root.position ); // 가까운 경비는 '완벽한 노래'에 멈추고, 멀리서 들은 경비는 몰려온다

	}
	else for ( let i = 0; i < 3; i ++ ) G.world.ring( h.pos.x, h.pos.z, { color: 0x7fe9ff, to: 58, life: 1.6, delay: i * 0.28 } );
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
	const kelp = nearestKelp( 34 );
	if ( kelp ) refillCompass( kelp );

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
	if ( ! k || G.hearts >= MAX_HEARTS ) return false;
	k.glow = 1.5;
	G.world.ring( k.x, k.z, { color: 0x6dffe0, to: 30, life: 1.2, delay: 0.3 } );
	setTimeout( () => heal( true ), 300 );
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

	if ( G.diving ) return false; // 바닷속에선 Space가 위로 헤엄치기
	const h = G.actors.hazel;
	if ( G.jumpCooldown > 0 || h.airborne || G.stun > 0 ) return false;
	if ( h.breach( 12 + Math.min( h.speed, BOOST_SPEED ) * 0.12 ) ) {

		G.jumpCooldown = 0.35;
		G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 40, power: 7 } );
		audio.play( 'splash', { vel: 0.25 } );
		// 동료도 따라서 뛰어오른다
		for ( const key of [ 'luke', 'finn' ] ) {

			if ( G.party[ key ] === 'on' ) setTimeout( () => G.actors[ key ].breach( 11 ), 250 + Math.random() * 300 );

		}

		return true;

	}

	return false;

}

async function collectBottle( b ) {

	b.remove( scene );
	audio.play( 'pickup' );
	G.world.ring( b.x, b.z, { color: 0x7fe9ff, to: 20, life: 0.9 } );
	if ( b.id === 0 ) {

		// 모비의 편지도 6통 중 한 통
		if ( ! G.save.bottles.includes( 0 ) ) G.save.bottles.push( 0 );
		persist();
		G.ui.setBottles( G.bottleCount(), LETTER_TOTAL );
		G.emit( 'bottle0' );
		return;

	}

	if ( ! G.save.bottles.includes( b.id ) ) G.save.bottles.push( b.id );
	heal();
	G.ui.setBottles( G.bottleCount(), LETTER_TOTAL );
	const reader = G.reader();
	const letter = lang().letters.find( ( l ) => l.id === b.id );
	if ( reader ) {

		G.save.read.push( b.id );
		persist();
		await G.ui.letter( letter );
		await G.say( [ { who: reader, text: t( `bottleReact.${reader}` ) } ] );

	} else {

		persist();
		G.ui.toast( t( 'toast.unreadBottle', { n: G.bottleCount(), total: LETTER_TOTAL } ) );

	}

	if ( G.bottleCount() === LETTER_TOTAL ) G.ui.banner( ...t( 'banner.allLetters' ), 'join', 3.5 );

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

	const normalTex = await new THREE.TextureLoader().loadAsync( BASE + 'data/res/textures/waternormals.jpg' );
	setLoad( 0.15 );
	const models = await loadModels( BASE, ( p ) => setLoad( 0.15 + p * 0.85 ) );
	G.models = models;

	G.sky = new Sky( { moonDir } );
	scene.add( G.sky.group );
	G.sky.capture( renderer );

	G.ocean = new Ocean( { envMap: G.sky.cubeTarget.texture, normalMap: normalTex, fog, moonDir, gridStep: LOW ? 5 : 2.5 } );
	scene.add( G.ocean.mesh );
	G.dive = new Dive( { scene, camera, fog, sky: G.sky, ocean: G.ocean } );
	if ( GOLD_TEST || allEndingsSeen() ) applyGoldenSea();
	G.targetWaves = 0.65;

	const avoid = [
		...Object.values( PLACES ).map( ( p ) => ( { ...p, r: 70 } ) ),
		...BOTTLES.map( ( b ) => ( { ...b, r: 30 } ) ),
		{ ...PLACES.moby, r: 190 },
		...KELP_GROVES.map( ( g ) => ( { ...g, r: 30 } ) )
	];
	G.world = new World( { scene, fog, places: { lighthouse: PLACES.lighthouse }, avoid, models } );
	G.dive.world = G.world; // 잠수할 때 맵 1의 얕은 해저를 치운다

	const A = G.actors;
	A.hazel = new Whale( models.hazel, { name: 'hazel', length: 8, ride: 0.38, freq: 3.8, amp: 0.085, emissive: 1.4 } );
	A.luke = new Whale( models.luke, { name: 'luke', length: 11, ride: 0.36, freq: 3.3, amp: 0.07, emissive: 1.4 } );
	A.finn = new Whale( models.finn, { name: 'finn', length: 10, ride: 0.42, freq: 2.9, amp: 0.06, emissive: 0.55 } );
	// 헤이즐(8)에 비해 커야 압도감이 난다. 실제 비율(상괭이 : 향유고래 : 대왕고래 ≈ 1.8m : 18m : 28m)보다는 작게
	A.moby = new Whale( models.moby, { name: 'moby', length: 48, ride: 0.3, freq: 1.5, amp: 0.05, emissive: 0.6 } );
	A.stella = new Whale( models.stella, { name: 'stella', length: 120, ride: 0.36, freq: 1.0, amp: 0.05, emissive: 1.6 } );
	A.shaman = new Whale( models.orca, { name: 'shaman', length: 18, ride: 0.42, freq: 2.4, amp: 0.05, recolor: [ 0x7a1f4f, 0xffb3d1 ], emissive: 0.1 } );
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
	G.ui.setBottles( 0, LETTER_TOTAL );

	setupTouch();
	$( 'loading' ).classList.add( 'hidden' );
	$( 'title-buttons' ).classList.remove( 'hidden' );
	const debugChapter = query.has( 'chapter' ) ? Number( query.get( 'chapter' ) ) : STELLA_TEST || duetMode || DIVE_TEST ? 5 : null;
	const continueBtn = $( 'btn-continue' );
	const showContinue = () => {

		if ( G.save.chapter <= 0 || debugChapter !== null ) return;
		continueBtn.classList.remove( 'hidden' );
		continueBtn.textContent = t( 'title.continueAt', { ch: [ 'PROLOGUE', 'CH.01', 'CH.02', 'CH.03', 'CH.04', 'ENDING', 'EPILOGUE' ][ G.save.chapter ] } );

	};

	showContinue();
	// 본 엔딩 수 (◆ 본 엔딩, ◇ 아직, ★ 스텔라)
	const seen = loadEndings();
	if ( seen.length ) {

		$( 'title-endings' ).textContent = `ENDINGS ${ENDING_ORDER.map( ( k ) => seen.includes( k ) ? '◆' : '◇' ).join( '' )} ${ENDING_ORDER.filter( ( k ) => seen.includes( k ) ).length}/${ENDING_ORDER.length}${seen.includes( 'stella' ) ? ' · ★' : ''}`;
		$( 'title-endings' ).classList.remove( 'hidden' );

	}

	// 스텔라를 만난 적 있으면 타이틀에서 바로 듀엣. ?duet 으로 들어왔으면 시작 버튼 자체가 듀엣
	const duetTitle = () => {

		if ( duetMode ) $( 'btn-start' ).textContent = t( 'title.duet' );
		$( 'btn-duet' ).classList.toggle( 'hidden', duetMode || ! seen.includes( 'stella' ) );

	};

	duetTitle();
	$( 'btn-duet' ).onclick = () => {

		setName( $( 'nickname' ).value );
		duetMode = true;
		start( 5 );

	};

	continueBtn.onclick = () => {

		setName( $( 'nickname' ).value );
		start( G.save.chapter );

	};

	// 언어 (타이틀에서만 바꾼다)
	document.querySelectorAll( '[data-lang]' ).forEach( ( btn ) => btn.addEventListener( 'click', () => {

		setLang( btn.dataset.lang );
		showContinue();
		duetTitle();
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
		if ( duetMode || DIVE_TEST ) return start( 5 ); // 듀엣만 · MAP 2 미리보기: 지난 판의 루크 · 핀 그대로
		if ( debugChapter === null ) G.save = { chapter: 0, bottles: [], read: [], kelps: [] };
		G.route = newRoute( ROUTE_TEST ?? ( debugChapter >= 4 ? 'light' : null ) );
		if ( STELLA_TEST ) G.save = { ...G.save, bottles: [ 0, ...BOTTLES.map( ( b ) => b.id ) ], read: [ 0, ...BOTTLES.map( ( b ) => b.id ) ] };
		start( debugChapter ?? 0 );

	};

	$( 'btn-resume' ).onclick = () => setPaused( false );
	$( 'btn-restart' ).onclick = () => {

		G.save = { chapter: 0, bottles: [], read: [], kelps: [] };
		persist();
		location.reload();

	};

	$( 'btn-again' ).onclick = () => location.reload();
	$( 'btn-duet-end' ).onclick = () => location.href = `${location.pathname}?duet`;
	$( 'btn-dive' ).onclick = async () => {

		G.ui.show( 'ending', false );
		G.ended = false;
		G.camRelease();
		G.ui.show( 'hud' );
		await G.ui.fade( 0, 1.2 );
		openDivePortal();

	};
	$( 'btn-duet-more' ).onclick = () => {

		G.ui.show( 'duet-again', false );
		runDuetAgain();

	};
	$( 'btn-duet-title' ).onclick = () => location.href = location.pathname;
	$( 'btn-search' ).onclick = () => searchAfterEnding();
	setupFeedback();
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

		G.setStarfall( true );
		for ( const k of [ 'kelp4', 'kelp5' ] ) G.kelps[ k ].read = true;
		if ( G.route.luke ) {

			G.flags.lukeSaved = true;
			A.luke.setGlow( 0.3, 0xffd36b );

		} else {

			G.party.luke = 'gone';
			G.flags.lukeGone = true;
			A.luke.root.visible = false;
			G.world.lighthouse.setOn( false );
			G.world.lighthouse.on = 0;
			G.audio.setMix( { bass: 0 }, 0.1 );
			G.flags.lukeLight = true;
			spawnLukeLight( PLACES.ambush.x, PLACES.ambush.z, false );

		}

		if ( ! G.route.finn ) {

			G.party.finn = 'gone';
			G.flags.finnGone = true;
			A.finn.root.visible = false;
			G.flags.finnTears = true;
			G.audio.setMix( { drums: 0 }, 0.1 );
			G.compass = 1;
			G.ui.setCompass( 1 );

		}

	}
	if ( n >= 5 ) {

		G.mobyRise();
		A.moby.depth = 0;

	}

	if ( n >= 1 && ! G.save.bottles.includes( 0 ) ) G.save.bottles.push( 0 ); // 프롤로그의 모비 편지
	for ( const k of G.save.kelps ) if ( G.kelps[ k ] ) G.kelps[ k ].read = true;
	for ( const b of G.bottles ) if ( G.save.bottles.includes( b.id ) ) b.remove( scene );

	G.ui.setParty( partyList() );
	G.ui.setBottles( G.bottleCount(), LETTER_TOTAL );
	setCheckpoint( at.x, at.z );
	placeCompanions();

}

// ---------------------------------------------------------------
// 엔딩 화면의 '아이디어 · 버그 보내기': Netlify Forms로 바로 접수. 안 되면 메일 주소를 보여 준다
// (Netlify에서 폼 감지를 켜야 접수된다. 접수된 글은 Netlify > Forms > feedback, 메일 알림도 설정 가능)
// ---------------------------------------------------------------
const FEEDBACK_MAIL = 'jmin.mild@gmail.com';

function setupFeedback() {

	const form = $( 'feedback' ), status = $( 'feedback-status' ), text = form.elements.message;
	$( 'btn-feedback' ).onclick = () => {

		form.hidden = ! form.hidden;
		text.placeholder = t( 'feedback.placeholder' );
		if ( ! form.hidden ) text.focus();

	};

	form.onsubmit = async ( e ) => {

		e.preventDefault();
		if ( ! text.value.trim() ) return text.focus();
		form.elements.info.value = [
			lang().code, G.touch ? 'touch' : 'pc', `${view.w}x${view.h}`,
			$( 'ending-stats' ).innerText.replace( /\n/g, ' / ' ), navigator.userAgent
		].join( ' · ' );
		status.textContent = t( 'feedback.sending' );
		let ok = false;
		try {

			const res = await fetch( '/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( new FormData( form ) ).toString()
			} );
			ok = res.ok;

		} catch ( err ) { /* 네트워크 오류 */ }

		if ( ok ) {

			status.textContent = t( 'feedback.thanks' );
			text.value = '';
			return;

		}

		// 접수가 안 되면 메일로: 주소 복사 + 메일 앱 (적은 내용을 본문에 담는다)
		const mail = `mailto:${FEEDBACK_MAIL}?subject=${encodeURIComponent( 'From. Whale' )}&body=${encodeURIComponent( text.value )}`;
		status.innerHTML = `${t( 'feedback.fail' )}<br><b>${FEEDBACK_MAIL}</b> <button type="button" class="chip" id="feedback-copy">${t( 'feedback.copy' )}</button> <a class="chip" href="${mail}">${t( 'feedback.mailApp' )}</a>`;
		$( 'feedback-copy' ).onclick = async ( ev ) => {

			try {

				await navigator.clipboard.writeText( FEEDBACK_MAIL );
				ev.target.textContent = t( 'feedback.copied' );

			} catch ( err ) { /* 복사 불가 */ }

		};

	};

}

// 엔딩 화면에서 '남은 편지 찾으러 가기': 엔딩 바다에서 계속 헤엄친다
async function searchAfterEnding() {

	const h = G.actors.hazel;
	G.ui.show( 'ending', false );
	G.ended = false;
	G.save.chapter = EPILOGUE;
	G.save.route = { ...G.route };
	persist();
	G.chapterFaints = 0;
	G.camRelease();
	setCheckpoint( h.pos.x, h.pos.z );
	G.ui.show( 'hud' );
	await G.ui.fade( 0, 1.2 );
	await epilogue( G );

}

async function start( chapter ) {

	if ( G.started || ! G.ready ) return;
	audio.init();
	G.started = true;

	for ( const b of BOTTLES ) G.bottles.push( G.world.makeBottle( b, b.id ) );
	setupChapter( chapter );
	G.camYaw = G.actors.hazel.yaw;

	G.ui.show( 'title', false );
	G.ui.show( 'hud' );
	if ( G.touch ) $( 'touch' ).classList.remove( 'hidden' );
	if ( G.touch && view.w < view.h ) G.ui.toast( t( 'toast.rotate' ) );
	G.stats.time = 0;

	if ( duetMode ) return runDuetAgain();
	if ( DIVE_TEST ) return openDivePortal();

	if ( chapter >= EPILOGUE ) {

		G.chapterFaints = 0;
		G.save.chapter = EPILOGUE;
		G.save.route = { ...G.route };
		persist();
		await epilogue( G );
		return;

	}

	for ( let i = chapter; i < CHAPTERS.length; i ++ ) {

		G.chapterFaints = 0;
		G.save.chapter = i;
		G.save.route = { ...G.route };
		persist();
		await CHAPTERS[ i ]( G );

	}

}

// MAP 2 미리보기: 헤이즐 앞 수면에 포털이 열리고, 들어가면 바닷속으로
async function openDivePortal() {

	const h = G.actors.hazel;
	const T = lang().story.ending;
	const f = h.forward;
	const portal = { x: h.pos.x + f.x * 45, z: h.pos.z + f.z * 45 };
	G.cutscene( true );
	G.setStarfall( false );
	G.dive.openPortal( portal.x, portal.z );
	G.seaLoad ??= loadSealife( BASE ); // 바다 생물 모델은 무거워서 포털이 열릴 때 미리 받아 둔다
	G.world.ring( portal.x, portal.z, { color: 0xb9a8ff, to: 40, life: 1.6 } );
	G.audio.play( 'join' );
	const said = G.actors.stella.root.visible ? T.portal : T.portalNone;
	await G.say( said.map( ( [ who, text ] ) => ( { who, text } ) ) );
	G.cutscene( false );
	G.objective( t( 'dive.label' ), t( 'dive.objPortal' ), portal );
	await G.until( () => G.distTo( portal ) < 9 && ! G.ui.dialogOpen );
	await enterDive();

}

// 깊이계 · 층이 바뀌면 배너 · 바닥(미리보기의 끝)에 닿으면 안내
function updateDepth() {

	const d = - G.diveY;
	const zi = zoneAt( d ).i;
	$( 'depth-meter' ).textContent = `▼ ${Math.round( d )}m · ${t( 'dive.zones' )[ zi ]}`;
	if ( zi !== G.diveZone ) {

		if ( G.diveZone !== undefined ) G.ui.banner( `▼ ${ZONES[ zi ].depth}m`, t( 'dive.zones' )[ zi ], t( 'dive.zoneSub' )[ zi ], 'join', 3.5 );
		G.diveZone = zi;

	}

}

async function enterDive() {

	const h = G.actors.hazel;
	G.cutscene( true );
	G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 90, power: 10, color: 0xb9a8ff } );
	G.audio.play( 'splash' );
	await G.ui.fade( 1, 0.8 );
	G.diving = true;
	G.diveY = - 6;
	G.diveCheckpoint = { x: h.pos.x, z: h.pos.z, y: - 6 };
	G.diveVy = 0;
	G.dive.enter();
	if ( ! G.map2 ) G.map2 = { ...buildTrench( scene, { x: h.pos.x, z: h.pos.z } ), entry: { x: h.pos.x, z: h.pos.z } };
	// MAP 2는 다른 맵: 맵 1의 것들(등대, 미역, 유리병, 연합군, 모비 딕, 스텔라, 빛 조각...)은 모두 치운다
	const keep = new Set( [ h.root, G.actors.luke.root, G.actors.finn.root, G.dive.group, G.map2.group, hemiLight, moonLight, ambientLight, hazelLamp, stunStars ] );
	for ( const o of scene.children ) if ( ! keep.has( o ) ) o.visible = false;
	if ( ! G.guards ) {

		G.guards = new Guards( { scene, model: G.models.orca, entry: G.map2.entry, altar: G.map2.logs.find( ( l ) => l.landmark === 'bones' ).pos } );
		G.guards.onSpot = () => guardAlert( 'map2.guardSpot' );
		G.guards.onHear = () => guardAlert( 'map2.guardHear' );
		G.guards.onStun = () => {

			if ( G.guardStunHinted ) return;
			G.guardStunHinted = true;
			G.ui.toast( t( 'map2.guardStun' ) );

		};
		G.guards.onHit = ( pos ) => damage( 1, pos, { stun: 0.3 } );

	}

	( G.seaLoad ??= loadSealife( BASE ) ).then( ( models ) => {

		if ( G.sea ) return;
		G.sea = new Sealife( models, G.map2.group, G.map2.entry );
		G.sea.onMeet = ( key ) => key === 'coelacanth' && G.ui.toast( t( 'map2.coelacanth' ) );
		// 해파리에 닿으면 하트 하나 (하트가 다 차 있으면 그냥 지나간다)
		G.sea.onHeal = () => {

			if ( G.hearts >= MAX_HEARTS ) return false;
			heal();
			G.ui.toast( t( 'map2.jelly' ) );
			return true;

		};
		G.sea.onBite = ( pos ) => {

			if ( ! damage( 1, pos, { stun: 0.5 } ) ) return;
			if ( G.eelHinted ) return;
			G.eelHinted = true;
			G.ui.toast( t( 'map2.eel' ) );

		};

	} );
	document.body.classList.add( 'diving' );
	G.setMusic( { tension: 0, drums: 0, bass: 0, melody: 0.6, piano: 1, sax: 0 } );
	camera.position.set( h.pos.x - Math.sin( G.camYaw ) * 20, G.diveY + 4.5, h.pos.z - Math.cos( G.camYaw ) * 20 );
	await G.ui.fade( 0, 1.2 );
	await G.card( ...t( 'dive.card' ) );
	G.cutscene( false );
	G.ui.toast( t( 'dive.hint' ) );
	map2( G );

}

// 듀엣 다시 부르기: 스텔라와 듀엣 → 점수판 → 한 곡 더 / 타이틀로
async function runDuetAgain() {

	await duetAgain( G );
	G.ui.show( 'duet-again' );

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
	if ( control ) G.stun = Math.max( 0, G.stun - dt );
	const stunned = G.stun > 0;

	let throttle = 0, turn = 0, boost = false, steer = null;
	if ( control && ! stunned ) {

		// 키보드: 화면(카메라) 기준으로 헤엄친다. W 앞 · S 뒤 · A/D 옆. 고래가 그쪽으로 몸을 돌려 헤엄친다
		const ix = ( keys.has( 'KeyD' ) || keys.has( 'ArrowRight' ) ? 1 : 0 ) - ( keys.has( 'KeyA' ) || keys.has( 'ArrowLeft' ) ? 1 : 0 );
		const iz = ( keys.has( 'KeyW' ) || keys.has( 'ArrowUp' ) ? 1 : 0 ) - ( keys.has( 'KeyS' ) || keys.has( 'ArrowDown' ) ? 1 : 0 );
		if ( ix || iz ) {

			steer = Math.atan2( - ix, iz ); // 카메라 정면에서 얼마나 틀었는지 (+ 왼쪽)
			const diff = wrapAngle( G.camYaw + steer - h.yaw );
			turn = Math.max( - 1.6, Math.min( 1.6, diff * 2.5 ) );
			throttle = Math.abs( diff ) > 2 ? 0.3 : 1; // 크게 돌아설 때는 천천히

		}

		boost = keys.has( 'ShiftLeft' ) || keys.has( 'ShiftRight' ) || touch.boost;
		if ( touch.active ) {

			// 많이 밀수록 빠르게, 아래로 당기면 뒤로
			const push = Math.min( 1, Math.hypot( touch.x, touch.y ) * 1.2 );
			const stick = touch.y > 0.6 ? - push : push;
			if ( Math.abs( stick ) > Math.abs( throttle ) ) throttle = stick;
			turn = - touch.x * 1.2;

		}

		if ( tiltActive() ) {

			const m = tiltInput();
			if ( Math.abs( m.throttle ) > Math.abs( throttle ) ) throttle = m.throttle;
			if ( Math.abs( m.turn ) > Math.abs( turn ) ) turn = m.turn;

		}

	}

	// 대화나 장면이 끝나 다시 움직일 수 있게 되면 지금 자세를 기울기 기준으로
	if ( control && ! G.hadControl ) tilt.cal = true;
	G.hadControl = control;
	const tilting = tiltActive();
	if ( tilting !== G.tilting ) { G.tilting = tilting; document.body.classList.toggle( 'tilt', tilting ); }

	// 핀이 있으면 부스트가 오래 간다
	const finn = G.party.finn === 'on';
	const boosting = boost && throttle > 0 && G.stamina > 0.02;
	if ( boosting ) G.stamina = Math.max( 0, G.stamina - dt * ( finn ? 0.16 : 0.26 ) );
	else G.stamina = Math.min( 1, G.stamina + dt * ( finn ? 0.26 : 0.16 ) );

	let target = throttle > 0 ? throttle * ( boosting ? BOOST_SPEED : MAX_SPEED ) : throttle * REVERSE_SPEED;
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
	// 엔딩 6개 보상: 빛 문양이 더 밝게, 천천히 반짝인다
	if ( G.goldenSea ) {

		const k = 2.1 + 0.9 * Math.sin( G.time * 2.4 ) ** 2;
		for ( const m of h.materials ) m.emissiveIntensity = k;

	}
	h.speed += ( target - h.speed ) * Math.min( 1, dt * ( G.dash > 0 ? 3 : throttle === 0 ? 0.9 : 1.6 ) );

	// 대화 중에는 상대를 바라본다
	if ( G.faceTarget && ! control ) {

		const ty = Math.atan2( G.faceTarget.x - h.pos.x, G.faceTarget.z - h.pos.z );
		let dy = Math.atan2( Math.sin( ty - h.yaw ), Math.cos( ty - h.yaw ) );
		h.yaw += dy * Math.min( 1, dt * 2 );

	}

	const turnRate = TURN_RATE * ( 0.6 + 0.4 * ( 1 - Math.min( Math.abs( h.speed ) / BOOST_SPEED, 1 ) ) );
	h.yaw += turn * turnRate * dt;
	// PC 카메라는 따로 돈다. 앞쪽(W 쪽)으로 헤엄칠 때만 천천히 등 뒤로 따라간다 (A/D만 누르면 옆으로 헤엄)
	if ( ! G.touch && steer !== null && Math.abs( steer ) < 0.8 && ! drag ) G.camYaw += wrapAngle( h.yaw - G.camYaw ) * ( 1 - Math.exp( - dt * 1.2 ) );
	h.bank = - turn * Math.min( 1, Math.abs( h.speed ) / MAX_SPEED ) * 0.45;
	if ( stunned ) h.bank = Math.sin( G.time * 16 ) * 0.35 * Math.min( 1, G.stun / 0.4 );
	updateStunStars( h, stunned );

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

	// 바닷속: Space · ⤴ 위로, C · ⤵ 아래로. 손을 떼면 그 깊이를 유지한다
	if ( G.diving ) {

		// 정지 코드 리듬 중엔 Space가 박자 입력이라 위로 헤엄치지 않는다
		const v = control && ! G.duetPlay ? ( keys.has( 'Space' ) || touch.up ? 1 : 0 ) - ( keys.has( 'KeyC' ) || touch.down ? 1 : 0 ) : 0;
		G.diveVy += ( v * ( boost ? 18 : 9 ) - G.diveVy ) * Math.min( 1, dt * 3 ); // 가속 중엔 위아래도 빠르게
		const floor = G.diveFloor ?? DIVE_BOTTOM;
		G.diveY = THREE.MathUtils.clamp( G.diveY + G.diveVy * dt, floor, DIVE_TOP );
		if ( G.diveY === floor || G.diveY === DIVE_TOP ) G.diveVy *= 0.5;
		// 이 층의 기록을 아직 못 읽었으면 물살이 막는다
		if ( G.map2 && G.diveY <= floor + 0.3 && v < 0 && floor > DIVE_BOTTOM && ! G.diveFloorWarned ) {

			G.diveFloorWarned = true;
			G.ui.toast( t( 'map2.current' ) );

		}

		// 협곡 벽 밖으로는 못 나간다
		if ( G.map2 ) {

			const c = trenchCenter( G.map2.entry, - G.diveY );
			const R = trenchRadius( - G.diveY ) - 5;
			const dx = h.pos.x - c.x, dz = h.pos.z - c.y, d = Math.hypot( dx, dz );
			if ( d > R ) {

				h.pos.x = c.x + dx / d * R;
				h.pos.z = c.y + dz / d * R;

			}

		}
		h.depth = h.surfaceY - G.diveY;

	}

	G.stats.swum += Math.abs( h.speed ) * dt;
	if ( h.update( dt ) ) {

		G.world.splash( h.pos.x, h.root.position.y, h.pos.z, { count: 70, power: 9 } );
		G.world.ring( h.pos.x, h.pos.z, { color: 0xbfeaff, from: 2, to: 14, life: 0.8, width: 0.3 } );
		audio.play( 'splash' );

	}

	if ( G.diving ) h.root.rotateX( - THREE.MathUtils.clamp( G.diveVy * 0.06, - 0.5, 0.5 ) ); // 오르내릴 때 머리를 든다 · 숙인다
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
		if ( key === 'shaman' && ! G.diving && w.depth > 22 && w.targetDepth > 20 ) w.root.visible = false;

	}

}

function updateBottlesAndKelp( dt ) {

	if ( G.diving ) return G.ui.prompt( null ); // MAP 2엔 맵 1의 유리병 · 미역 · 빛 조각이 없다

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
		else if ( G.boss?.active && G.boss.phase === 'listen' && G.distTo( G.actors.moby.pos ) < G.boss.reach + 4 ) prompt = t( 'prompt.moby' );
		else if ( G.hearts < MAX_HEARTS && nearestKelp( 34 ) ) prompt = t( 'prompt.recharge' );
		else if ( G.compass !== null && G.compass < 0.97 && nearestKelp( 34 ) ) prompt = t( 'prompt.compass' );

	}

	if ( G.stun > 0 && G.flags.finnTears && ! G.cutsceneOn && ! G.ui.dialogOpen ) prompt = t( 'prompt.tears' );
	if ( G.jumpCueOn ) prompt = t( 'prompt.jump' );

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
		const base = G.diving ? G.diveY : 0; // 바닷속에선 지금 깊이를 기준으로
		desired.set( mx + dz * t.side * t.dist - dx * t.dist * 0.35, base + t.height, mz - dx * t.side * t.dist - dz * t.dist * 0.35 );
		look = new THREE.Vector3( mx, base + 3, mz );

	} else {

		if ( G.touch ) {

			// 터치는 카메라가 고래 등 뒤에 붙어 있고, 화면을 드래그해 돌려도 잠시 뒤 돌아온다
			if ( G.time - ( G.lastDrag ?? - 99 ) > 1.8 && ! drag ) G.camOrbit *= Math.exp( - dt * 1.5 );
			G.camYaw = h.yaw + G.camOrbit;

		}

		const yaw = G.camYaw;
		const dist = 24 + Math.abs( h.speed ) * 0.28;
		const f = h.forward;
		if ( G.diving ) {

			// 바닷속: 헤이즐 뒤 살짝 위에서, 같은 깊이를 따라간다
			desired.set( h.pos.x - Math.sin( yaw ) * dist * 0.8, G.diveY + 4.5 + G.diveVy * 0.15, h.pos.z - Math.cos( yaw ) * dist * 0.8 );
			look = new THREE.Vector3( h.pos.x + f.x * 6, G.diveY + 1 + G.diveVy * 0.2, h.pos.z + f.z * 6 );

		} else {

			desired.set( h.pos.x - Math.sin( yaw ) * dist, h.root.position.y * 0.4 + 8.5 + Math.abs( h.speed ) * 0.05, h.pos.z - Math.cos( yaw ) * dist );
			look = new THREE.Vector3( h.pos.x + f.x * 5, h.root.position.y * 0.5 + 4.2, h.pos.z + f.z * 5 );

		}

	}

	const k = 1 - Math.exp( - dt * ( G.camTarget ? 1.6 : 3.2 ) );
	camera.position.lerp( desired, k );
	if ( G.diving ) {

		camera.position.y = THREE.MathUtils.clamp( camera.position.y, DIVE_BOTTOM - 4, - 1.2 ); // 물 밖으로 나가지 않게
		if ( G.map2 ) {

			const c = trenchCenter( G.map2.entry, - camera.position.y );
			const R = trenchRadius( - camera.position.y ) - 1;
			const dx = camera.position.x - c.x, dz = camera.position.z - c.y, d = Math.hypot( dx, dz );
			if ( d > R ) camera.position.set( c.x + dx / d * R, camera.position.y, c.y + dz / d * R );

		}

	}
	else {

		const floor = sampleOcean( camera.position.x, camera.position.z ) + 2.8;
		if ( camera.position.y < floor ) camera.position.y = floor;

	}
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
	if ( t && ! G.cutsceneOn && ! G.ended && guideVisible() ) {

		const y = sampleOcean( t.x, t.z ) + 8;
		_v.set( t.x, y, t.z ).project( camera );
		const behind = _v.z > 1;
		const onScreen = ! behind && Math.abs( _v.x ) < 0.95 && Math.abs( _v.y ) < 0.92;
		const screen = { x: ( _v.x * 0.5 + 0.5 ) * view.w, y: ( - _v.y * 0.5 + 0.5 ) * view.h, onScreen, behind };
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
	// MAP 2: 소나엔 연구 일지와 동료만 (맵 1의 바위 · 미역 · 등대는 없다)
	if ( G.diving && G.map2 ) {

		const next = G.map2.logs.find( ( l ) => ! l.read );
		for ( const l of G.map2.logs ) points.push( l === next ? { x: l.pos.x, z: l.pos.z, color: '#7fe9ff', size: 4, shape: 'diamond' } : { x: l.pos.x, z: l.pos.z, color: l.read ? 'rgba(185,168,255,0.6)' : 'rgba(127,233,255,0.35)', size: 2.5 } );
		// 경비 연합군: 쫓아올 땐 깜빡이는 빨간 점 (비슷한 깊이만)
		for ( const g of G.guards?.list ?? [] ) if ( g.state !== 'calm' && Math.abs( g.y - G.diveY ) < 25 ) points.push( { x: g.whale.pos.x, z: g.whale.pos.z, color: g.state === 'chase' || g.state === 'spot' ? ( Math.floor( G.time * 6 ) % 2 ? '#ff3355' : '#ffd0d8' ) : 'rgba(255,90,110,0.55)', size: 3 } );
		// 노래로 드러났거나 노리는 중인 곰치는 빨간 점 (비슷한 깊이만)
		for ( const e of G.sea?.eels ?? [] ) if ( ( e.glow > 0 || e.state === 'tell' || e.state === 'lunge' ) && Math.abs( e.home.y - G.diveY ) < 25 ) points.push( { x: e.home.x, z: e.home.z, color: '#ff5a6e', size: 3.5 } );
		for ( const key of [ 'luke', 'finn' ] ) if ( G.party[ key ] === 'on' ) points.push( { x: G.actors[ key ].pos.x, z: G.actors[ key ].pos.z, color: '#eaf6ff', size: 3 } );
		G.ui.drawMinimap( { px: h.pos.x, pz: h.pos.z, yaw: G.camYaw, heading: h.yaw - G.camYaw, range: 140, time: G.time, rocks: [], points, objective: t, signal: 1 } );
		return;

	}

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
		px: h.pos.x, pz: h.pos.z, yaw: G.camYaw, heading: h.yaw - G.camYaw, range: 260, time: G.time,
		rocks: G.world.colliders, points, objective: t, signal: G.compass ?? 1
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
	G.dive.update( dt, G.time, G.diving ? - G.diveY : 0 );
	if ( G.diving ) updateDepth();
	{

		// 깊을수록 달빛이 사라진다 (수면 위에선 원래대로)
		const depth = G.diving ? - G.diveY : 0;
		const k = Math.max( 0.04, Math.exp( - depth / 35 ) );
		hemiLight.intensity = 0.75 * k;
		ambientLight.intensity = 0.35 * k;
		moonLight.intensity = 1.15 * k;
		const flash = G.dive.flash ?? 0;
		hazelLamp.intensity = G.diving ? ( 1 - k ) * 2.4 + flash * 5 : 0;
		hazelLamp.distance = 40 + flash * 70;
		hazelLamp.position.copy( G.actors.hazel.root.position ).y += 3;
		if ( G.map2 ) G.map2.update( G.time );
		const active = ! G.cutsceneOn && ! G.ui.dialogOpen && ! G.ui.overlay && ! G.duetPlay && ! G.fainting;
		if ( G.sea && G.diving ) G.sea.update( dt, G.time, camera.position, G.actors.hazel.root.position, flash, active );
		if ( G.guards && G.diving ) G.guards.update( dt, G.actors.hazel.root.position, active );

	}

	updatePlayer( dt );
	updateCompass( dt );
	// 바닷속에선 동료도 같은 깊이로
	if ( G.diving ) for ( const key of [ 'luke', 'finn' ] ) if ( G.party[ key ] === 'on' ) G.actors[ key ].targetDepth = G.actors[ key ].surfaceY - G.diveY;
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
	const raw = clock.getDelta();
	const dt = Math.min( raw, DT_MAX ); // 게임 진행은 한 프레임 최대 DT_MAX까지만
	G.fps = G.fps ? G.fps * 0.95 + ( 1 / Math.max( raw, 1e-3 ) ) * 0.05 : 30; // FPS는 실제 프레임 시간으로
	if ( G.ready && ! G.menuPaused && ! G.ui.overlay ) update( dt );
	syncSize();
	if ( G.ready ) composer.render( dt );

}

boot().then( loop );
