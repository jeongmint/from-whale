import * as THREE from 'three';
import { OrbitControls } from "./examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "./examples/jsm/loaders/RGBELoader.js"

class App {

    // 밑줄로 시작하는 것들은 외부에서 호출하면 안됨
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;  // 다른 method 에서 참조

        const renderer = new THREE.WebGLRenderer({ antialias : true});  // 렌더러 객체에 antialias 활성화(오브젝트 계단현상 최소화)
        renderer.setPixelRatio(window.devicePixelRatio);    // 윈도우 pc 화면 비율을 동일하게 가져감(확대 150% 이런 것..)
        divContainer.appendChild(renderer.domElement);      // 자식 렌더러로 연결
        
        this._renderer = renderer;                          // 참조할 수 있도록 연결
    
        const scene = new THREE.Scene();                    // 씬 객체 생성
        this._scene = scene;                                // 씬 객체를 필드화해서 다른 곳에서도 참조할 수 있도록 함
        this._scene.background = new THREE.Color("white");

        const rgbeLoader = new RGBELoader()
        .load("data/hdri/blue_clouds.hdr", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this._scene.background = texture; // 3차원 배경으로 사용
            this._scene.environment = texture; // 광원으로 사용
            //texture.dispose();
        }
    );

        this._setupCamera();                                // 따로 객체 선언해줘야 함
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);           // 윈도우를 리사이즈 해주고
        this.resize();                                      // 나머지 객체들인 renderer, camera 를 창 크기에 맞게 설정

        requestAnimationFrame(this.render.bind(this));      // 애니메이션 프레임에 렌더메서드(bind(this)는 이 클래스의 App 전체를 참조)를 넘겨줘서
    }

    _setupCamera(){ // 3차원 그래픽 출력할 가로, 세로
        const camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.x = -13;
        camera.position.y = 3;
        camera.position.z = -10;
        this._camera = camera;

        this._scene.add(this._camera);
    }

    _setupLight(){
        const color = 0xffffff;
        const intensity = 0.85;
        const directLight = new THREE.DirectionalLight(color, intensity);
        directLight.position.set(8, 4, 2);
        // this._scene.add(light); // 씬 객체의 구성요소로 추가
        this._camera.add(directLight);
    }

    _setupModel(){
        const gltfLoader = new GLTFLoader();
        const url01 = "data/finn/Finn.gltf";
        const url02 = "data/hazel/Hazel.gltf";
        const url03 = "data/moby/Moby.gltf";
        const url04 = "data/luke/Luke.gltf";
        const url05 = "data/orca_army/Orca_Army.gltf";
        const url06 = "data/bottle/Bottle.gltf";

        gltfLoader.load(
            url01, // Finn
            (gltf) => {
                const root01 = gltf.scene;
                root01.position.set(1.0, 0.0, 10.0);
                this._scene.add(root01);
            }
        );
        gltfLoader.load(
            url02, // Hazel
            (gltf) => {
                const root02 = gltf.scene;
                root02.position.set(1.0, 0.0, 0.0);
                this._scene.add(root02);
            }
        );
        gltfLoader.load(
            url03, // Moby
            (gltf) => {
                const root03 = gltf.scene;
                root03.position.set(1.0, 0.0, 30.0);
                this._scene.add(root03);
            }
        );
        gltfLoader.load(
            url04, // Luke
            (gltf) => {
                const root04 = gltf.scene;
                root04.position.set(1.0, 0.0, -10.0);
                this._scene.add(root04);
            }
        );
        gltfLoader.load(
            url05, // Orca Army
            (gltf) => {
                const root05 = gltf.scene;
                root05.position.set(1.0, 0.0, 20.0);
                this._scene.add(root05);
            }
        );
        gltfLoader.load(
            url06, // Orca Army
            (gltf) => {
                const root06 = gltf.scene;
                root06.position.set(1.0, 0.0, -20.0);
                this._scene.add(root06);
            }
        );
    }

    _setupControls(){
        new OrbitControls(this._camera, this._divContainer);
    }

    resize(){
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
    }

    render(time){
        this._renderer.render(this._scene, this._camera);   // 카메라 시점을 사용해서 렌더링
        this.update(time);                                  // 속성 값을 계속 업데이트
        requestAnimationFrame(this.render.bind(this));      // 위에서 가져온 코드를 사용해서 일정 시점에 반복해서 빠르게 호출
    }

    update(time){ // 렌더 메서드에서 가져온 타임
        time *= 0.001;
        // this._cube.rotation.z = time; // 위의 셋업 모델에서 만든 큐브에 들어가는 것
        // this._cube.rotation.y = time;
    }
}

window.onload = function() {
    new App();
}