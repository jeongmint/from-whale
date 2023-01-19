

    import * as THREE from 'three';

    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { Water } from 'three/addons/objects/Water2.js';
    import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


    let scene, camera, clock, renderer, water;

    let torusKnot;

    const params = {
    color: '#bdebff',
    scale: 16,
    flowX: -1,
    flowY: 1
    };

    init();
    animate();

    function init() {

    // scene

    scene = new THREE.Scene();

    // camera

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 40, 20, 0 );

    camera.lookAt( scene.position );

    // clock

    clock = new THREE.Clock();

    // mesh

    // ground

    const groundGeometry = new THREE.PlaneGeometry( 4096, 4096 );
    const groundMaterial = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
    const ground = new THREE.Mesh( groundGeometry, groundMaterial );
    ground.rotation.x = Math.PI * - 0.5;
    ground.position.y = - 4;
    scene.add( ground );

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load( 'textures/clear_sea.png', function ( map ) {

    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 1;
    map.repeat.set( 256, 256 );
    groundMaterial.map = map;
    groundMaterial.needsUpdate = true;

    } );

    // water

    const waterGeometry = new THREE.PlaneGeometry( 4096,4096 );

    water = new Water( waterGeometry, {
    color: params.color,
    scale: params.scale,
    flowDirection: new THREE.Vector2( params.flowX, params.flowY ),
    textureWidth: 1024,
    textureHeight: 1024
    } );

    water.position.y = 3;
    water.rotation.x = Math.PI * - 0.5;
    scene.add( water );

    // skybox

    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath( 'examples/textures/cube/Park2/' );

    const cubeTexture = cubeTextureLoader.load( [
        'px.png', 'nx.png',
        'py.png', 'ny.png',
        'pz.png', 'nz.png'
    ] );

    scene.background = cubeTexture;
    scene.rotation.set(0.0, 0.0, 0.0);

    // light

    const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.6 );
    scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.82 );
    directionalLight.position.set( - 1, 1, 1 );
    scene.add( directionalLight );

    // gltf

    const loader = new GLTFLoader();
    loader.load( 'data/hazel/Hazel.glb', function ( gltf ) {
    // Hazel
    gltf.scene.position.set(0.0, 4.0, 0.0);
    gltf.scene.rotation.set(0.0, 0.0, 0.0);
    scene.add( gltf.scene );
    render();

    } );

    loader.load( 'data/luke/Luke.glb', function ( gltf ) {

    gltf.scene.position.set(0.0, 4.0, 10.0);
    gltf.scene.rotation.set(0.0, 0.0, 0.0);
    scene.add( gltf.scene );
    render();

    } );

    loader.load( 'data/orca_army/Orca_Army.glb', function ( gltf ) {

    gltf.scene.position.set(0.0, 4.0, -20.0);
    gltf.scene.rotation.set(0.0, 0.0, 0.0);
    scene.add( gltf.scene );
    render();

    } );

    loader.load( 'data/finn/Finn.glb', function ( gltf ) {

    gltf.scene.position.set(0.0, 4.0, -10.0);
    gltf.scene.rotation.set(0.0, 0.0, 0.0);
    scene.add( gltf.scene );
    render();

    } );

    loader.load( 'data/moby/Moby.glb', function ( gltf ) {

    gltf.scene.position.set(0.0, 4.0, 20.0);
    gltf.scene.rotation.set(0.0, 0.0, 0.0);
    scene.add( gltf.scene );
    render();

    } );


    loader.load( 'data/bottle/Bottle.glb', function ( gltf ) {

    gltf.scene.position.set(0.0, 4.0, -30.0);
    gltf.scene.rotation.set(0.0, 0.0, 0.0);
    scene.add( gltf.scene );
    render();

    } );

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild( renderer.domElement );

    //

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 5;
    controls.maxDistance = 50;

    //

    window.addEventListener( 'resize', onWindowResize );

    }

    function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function animate() {

    requestAnimationFrame( animate );
    render();

    }

    function render() {

    const delta = clock.getDelta();
    renderer.render( scene, camera );

    }
