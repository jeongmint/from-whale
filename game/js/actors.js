import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sampleOcean } from './ocean.js';

export const MODEL_FILES = {
	hazel: 'data/hazel/Hazel.glb',
	luke: 'data/luke/Luke.glb',
	finn: 'data/finn/Finn.glb',
	orca: 'data/orca_army/Orca_Army.glb',
	moby: 'data/moby/Moby.glb',
	bottle: 'data/bottle/Bottle.glb'
};

export function loadModels( base, onProgress ) {

	const loader = new GLTFLoader();
	const entries = Object.entries( MODEL_FILES );
	let done = 0;
	// .glb를 못 올리는 곳(아티팩트 미리보기)에서는 base64 텍스트로 받아서 푼다
	const suffix = window.FW_MODEL_SUFFIX || '';
	return Promise.all( entries.map( ( [ key, file ] ) => new Promise( ( resolve, reject ) => {

		const finish = ( gltf ) => {

			done ++;
			onProgress?.( done / entries.length );
			resolve( [ key, gltf ] );

		};

		if ( ! suffix ) return loader.load( base + file, finish, undefined, reject );
		fetch( base + file + suffix ).then( ( r ) => r.text() ).then( ( b64 ) => {

			const bin = atob( b64.trim() );
			const bytes = new Uint8Array( bin.length );
			for ( let i = 0; i < bin.length; i ++ ) bytes[ i ] = bin.charCodeAt( i );
			loader.parse( bytes.buffer, '', finish, reject );

		} ).catch( reject );

	} ) ) ).then( ( list ) => Object.fromEntries( list ) );

}

// 모든 고래 모델은 머리가 -x, 꼬리가 +x 방향이다.
// 꼬리 쪽으로 갈수록 크게 위아래로 흔들어 헤엄치는 모습을 만든다.
const swimTime = { value: 0 };

function addSwim( material, uniforms ) {

	material.onBeforeCompile = ( shader ) => {

		shader.uniforms.uSwimTime = swimTime;
		shader.uniforms.uSwimAmp = uniforms.amp;
		shader.uniforms.uSwimFreq = uniforms.freq;
		shader.uniforms.uSwimPhase = uniforms.phase;
		shader.uniforms.uGlowColor = uniforms.glowColor;
		shader.uniforms.uGlow = uniforms.glow;
		shader.vertexShader = 'uniform float uSwimTime;\nuniform float uSwimAmp;\nuniform float uSwimFreq;\nuniform float uSwimPhase;\n' +
			shader.vertexShader.replace( '#include <begin_vertex>', /* glsl */`
				#include <begin_vertex>
				float swimT = clamp( ( position.x + 1.0 ) * 0.5, 0.0, 1.0 );
				transformed.y += uSwimAmp * sin( uSwimTime * uSwimFreq + uSwimPhase - position.x * 2.6 ) * ( 0.12 + swimT * swimT * 1.1 );
			` );
		shader.fragmentShader = 'uniform vec3 uGlowColor;\nuniform float uGlow;\n' +
			shader.fragmentShader.replace( '#include <emissivemap_fragment>', /* glsl */`
				#include <emissivemap_fragment>
				totalEmissiveRadiance += uGlowColor * uGlow;
			` );

	};

	material.customProgramCacheKey = () => 'fw-swim';

}

export function updateSwimTime( t ) {

	swimTime.value = t;

}

// 텍스처의 밝고 어두운 무늬는 그대로 두고 색만 [어두운 색 → 밝은 색] 사이로 바꾼다
const recolorCache = new Map();

function recolorTexture( tex, [ dark, light ] ) {

	const key = `${tex.uuid}:${dark}:${light}`;
	if ( recolorCache.has( key ) ) return recolorCache.get( key );
	const img = tex.image;
	const canvas = document.createElement( 'canvas' );
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext( '2d' );
	ctx.drawImage( img, 0, 0 );
	const data = ctx.getImageData( 0, 0, canvas.width, canvas.height );
	const d = data.data;
	let lo = 255, hi = 0;
	for ( let i = 0; i < d.length; i += 4 ) {

		const l = d[ i ] * 0.3 + d[ i + 1 ] * 0.59 + d[ i + 2 ] * 0.11;
		if ( l < lo ) lo = l;
		if ( l > hi ) hi = l;

	}

	const a = new THREE.Color( dark ), b = new THREE.Color( light );
	for ( let i = 0; i < d.length; i += 4 ) {

		const t = ( d[ i ] * 0.3 + d[ i + 1 ] * 0.59 + d[ i + 2 ] * 0.11 - lo ) / Math.max( 1, hi - lo );
		d[ i ] = ( a.r + ( b.r - a.r ) * t ) * 255;
		d[ i + 1 ] = ( a.g + ( b.g - a.g ) * t ) * 255;
		d[ i + 2 ] = ( a.b + ( b.b - a.b ) * t ) * 255;

	}

	ctx.putImageData( data, 0, 0 );
	const out = new THREE.CanvasTexture( canvas );
	out.encoding = tex.encoding;
	out.flipY = tex.flipY;
	out.wrapS = tex.wrapS;
	out.wrapT = tex.wrapT;
	recolorCache.set( key, out );
	return out;

}

const _normal = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler( 0, 0, 0, 'YXZ' );

export class Whale {

	constructor( gltf, { name, length = 10, ride = 0.3, freq = 3.2, amp = 0.07, tint = null, solidColor = null, recolor = null, emissiveTint = null, emissive = 1, glowColor = 0x000000, scaleY = 1 } = {} ) {

		this.name = name;
		this.length = length;
		this.root = new THREE.Group();
		this.root.name = name;
		this.inner = new THREE.Group();
		this.root.add( this.inner );

		const model = gltf.scene.clone( true );
		const box = new THREE.Box3().setFromObject( model );
		const size = box.getSize( new THREE.Vector3() );
		const center = box.getCenter( new THREE.Vector3() );
		model.position.sub( center );

		this.swim = {
			amp: { value: amp },
			freq: { value: freq },
			phase: { value: Math.random() * 10 },
			glowColor: { value: new THREE.Color( glowColor ) },
			glow: { value: 0 }
		};
		this.baseAmp = amp;
		this.materials = [];
		model.traverse( ( o ) => {

			if ( o.isMesh ) {

				o.material = o.material.clone();
				if ( tint ) o.material.color.multiply( new THREE.Color( tint ) );
				// 텍스처 색 대신 한 가지 색으로 칠한다 (무늬·빛나는 문양은 그대로)
				if ( solidColor !== null ) {

					o.material.map = null;
					o.material.color.set( solidColor );

				}

				if ( recolor && o.material.map ) o.material.map = recolorTexture( o.material.map, recolor );
				if ( emissiveTint !== null ) o.material.emissive.multiply( new THREE.Color( emissiveTint ) );
				o.material.emissiveIntensity = emissive;
				addSwim( o.material, this.swim );
				this.materials.push( o.material );

			}

		} );

		const s = length / size.x;
		this.inner.add( model );
		this.inner.scale.set( s, s * scaleY, s );
		this.inner.rotation.y = Math.PI / 2; // 머리(-x)가 +z를 보도록
		this.height = size.y * s;
		this.rideOffset = - this.height * ( 0.5 - ride );
		this.inner.position.y = this.rideOffset;

		this.pos = new THREE.Vector3();
		this.yaw = 0;
		this.speed = 0;
		this.jumpY = 0;
		this.vy = 0;
		this.airborne = false;
		this.depth = 0; // 아래로 가라앉는 정도 (연출용)
		this.pitch = 0;
		this.roll = 0;
		this.bank = 0;
		this.surfaceY = 0;
		this.opacity = 1;

	}

	get forward() {

		return new THREE.Vector3( Math.sin( this.yaw ), 0, Math.cos( this.yaw ) );

	}

	setGlow( v, color ) {

		this.swim.glow.value = v;
		if ( color !== undefined ) this.swim.glowColor.value.set( color );

	}

	setOpacity( v ) {

		if ( v === this.opacity ) return;
		this.opacity = v;
		for ( const m of this.materials ) {

			if ( m.transparent !== ( v < 1 ) ) m.needsUpdate = true;
			m.transparent = v < 1;
			m.opacity = v;
			m.depthWrite = v > 0.5;

		}

	}

	place( x, z, yaw = this.yaw ) {

		this.pos.set( x, 0, z );
		this.yaw = yaw;
		this.speed = 0;

	}

	// 점프(브리칭)
	breach( power = 13 ) {

		if ( this.airborne ) return false;
		this.airborne = true;
		this.vy = power;
		return true;

	}

	update( dt ) {

		let landed = false;
		if ( this.airborne ) {

			this.jumpY += this.vy * dt;
			this.vy -= 26 * dt;
			if ( this.jumpY <= 0 && this.vy < 0 ) {

				this.jumpY = 0;
				this.vy = 0;
				this.airborne = false;
				landed = true;

			}

		}

		const h = sampleOcean( this.pos.x, this.pos.z, _normal );
		this.surfaceY += ( h - this.surfaceY ) * Math.min( 1, dt * 8 );

		const f = this.forward;
		const slopeF = - ( _normal.x * f.x + _normal.z * f.z ) / Math.max( _normal.y, 0.2 );
		const slopeR = - ( _normal.x * f.z - _normal.z * f.x ) / Math.max( _normal.y, 0.2 );
		let targetPitch = Math.atan( slopeF ) * 0.8;
		if ( this.airborne ) targetPitch = Math.atan2( this.vy, Math.max( this.speed, 6 ) ) * 0.9;
		this.pitch += ( targetPitch - this.pitch ) * Math.min( 1, dt * 5 );
		this.roll += ( Math.atan( slopeR ) * 0.6 + this.bank - this.roll ) * Math.min( 1, dt * 4 );

		const swimBob = Math.sin( swimTime.value * this.swim.freq.value + this.swim.phase.value ) * 0.04;
		this.swim.amp.value = this.baseAmp * ( 0.55 + Math.min( Math.abs( this.speed ) / 20, 1.2 ) );

		this.root.position.set( this.pos.x, this.surfaceY + this.jumpY - this.depth, this.pos.z );
		_e.set( - this.pitch + swimBob, this.yaw, this.roll );
		_q.setFromEuler( _e );
		this.root.quaternion.copy( _q );
		return landed;

	}

}

// 동료: 플레이어 뒤쪽의 정해진 자리로 따라온다
export function followSlot( whale, leader, offset, dt, maxSpeed ) {

	const f = leader.forward;
	const rx = f.z, rz = - f.x; // 오른쪽
	const tx = leader.pos.x + f.x * offset.z + rx * offset.x;
	const tz = leader.pos.z + f.z * offset.z + rz * offset.x;
	const dx = tx - whale.pos.x, dz = tz - whale.pos.z;
	const dist = Math.hypot( dx, dz );

	let desired = Math.min( maxSpeed, dist * 1.4 );
	if ( dist < 1.5 ) desired = 0;
	whale.speed += ( desired - whale.speed ) * Math.min( 1, dt * 3 );

	let targetYaw = dist > 3 ? Math.atan2( dx, dz ) : leader.yaw;
	let dy = targetYaw - whale.yaw;
	dy = Math.atan2( Math.sin( dy ), Math.cos( dy ) );
	const turn = Math.min( 1, dt * 3.5 );
	whale.yaw += dy * turn;
	whale.bank = THREE.MathUtils.clamp( - dy * 0.8, - 0.5, 0.5 );

	const moveDir = dist > 0.01 ? [ dx / dist, dz / dist ] : [ 0, 0 ];
	const fw = whale.forward;
	const mx = THREE.MathUtils.lerp( fw.x, moveDir[ 0 ], 0.5 );
	const mz = THREE.MathUtils.lerp( fw.z, moveDir[ 1 ], 0.5 );
	whale.pos.x += mx * whale.speed * dt;
	whale.pos.z += mz * whale.speed * dt;

}

// 제자리에서 천천히 원을 그리며 헤엄치기
export function idleCircle( whale, cx, cz, radius, speed, dt ) {

	whale.circleA = ( whale.circleA ?? Math.random() * Math.PI * 2 ) + dt * speed / radius;
	const tx = cx + Math.cos( whale.circleA ) * radius;
	const tz = cz + Math.sin( whale.circleA ) * radius;
	steerTo( whale, tx, tz, speed, dt, 2.5 );

}

export function steerTo( whale, tx, tz, speed, dt, turnRate = 2.5 ) {

	const dx = tx - whale.pos.x, dz = tz - whale.pos.z;
	const dist = Math.hypot( dx, dz );
	const targetYaw = Math.atan2( dx, dz );
	let dy = targetYaw - whale.yaw;
	dy = Math.atan2( Math.sin( dy ), Math.cos( dy ) );
	whale.yaw += THREE.MathUtils.clamp( dy, - turnRate * dt, turnRate * dt );
	whale.bank = THREE.MathUtils.clamp( - dy * 0.6, - 0.45, 0.45 );
	const want = dist < 2 ? 0 : speed;
	whale.speed += ( want - whale.speed ) * Math.min( 1, dt * 2.5 );
	const f = whale.forward;
	whale.pos.x += f.x * whale.speed * dt;
	whale.pos.z += f.z * whale.speed * dt;
	return dist;

}

// 대화창 초상화: 작은 렌더러로 한 번씩 찍어 둔다
export function makePortraits( models ) {

	const size = 160;
	const r = new THREE.WebGLRenderer( { alpha: true, antialias: true, preserveDrawingBuffer: true } );
	r.setSize( size, size );
	r.outputEncoding = THREE.sRGBEncoding;
	const scene = new THREE.Scene();
	scene.add( new THREE.HemisphereLight( 0xbfe0ff, 0x10204a, 1.1 ) );
	const dl = new THREE.DirectionalLight( 0xffffff, 1.2 );
	dl.position.set( 1, 2, 2 );
	scene.add( dl );
	const cam = new THREE.PerspectiveCamera( 30, 1, 0.1, 200 );
	const out = {};

	const shots = {
		hazel: [ 'hazel', {} ],
		luke: [ 'luke', {} ],
		finn: [ 'finn', {} ],
		moby: [ 'moby', {} ],
		shaman: [ 'orca', { recolor: [ 0x7a1f4f, 0xffb3d1 ], emissive: 0.1 } ],
		stella: [ 'hazel', { solidColor: 0xffb000, emissiveTint: 0xfff0b0, emissive: 1.2 } ],
		orca: [ 'orca', {} ]
	};

	for ( const [ key, [ model, opt ] ] of Object.entries( shots ) ) {

		const w = new Whale( models[ model ], { length: 10, ...opt } );
		w.inner.position.y = 0;
		w.root.rotation.y = - 0.9;
		scene.add( w.root );
		cam.position.set( 0, 1.2, 13 );
		cam.lookAt( 0, 0, 0 );
		r.render( scene, cam );
		out[ key ] = r.domElement.toDataURL( 'image/png' );
		scene.remove( w.root );

	}

	r.dispose();
	r.forceContextLoss?.();
	return out;

}
