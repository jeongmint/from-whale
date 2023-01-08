import * as THREE from "../build/three.module.js";
import { OrbitControls } from "../examples/jsm/controls/OrbitControls.js";

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

        this._setupCamera();                                // 따로 객체 선언해줘야 함
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);           // 윈도우를 리사이즈 해주고
        this.resize();                                      // 나머지 객체들인 renderer, camera 를 창 크기에 맞게 설정

        requestAnimationFrame(this.render.bind(this));      // 애니메이션 프레임에 렌더메서드(bind(this)는 이 클래스의 App 전체를 참조)를 넘겨줘서
    }

    _setupCamera(){ // 3차원 그래픽 출력할 가로, 세로
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            100
        );
        camera.position.z = 15;
        this._camera = camera;
    }

    _setupLight(){
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        this._scene.add(light); // 씬 객체의 구성요소로 추가

    }
    _setupModel(){
        const shape = new THREE.Shape();
        const x = -2.5, y = 5;
        shape.moveTo(x+2.5, y+2.5);
        shape.bezierCurveTo(x+2.5, y +2.5, x+2, y, x, y);
        shape.bezierCurveTo(x-3, y, x-3, y+3.5, x-3, y+3.5);
        shape.bezierCurveTo(x-3, y+5.5, x-1.5, y+7.7, x+2.5, y+9.5);
        shape.bezierCurveTo(x+6, y+7.7, x+8, y+4.5, x+8, y+3.5);
        shape.bezierCurveTo(x+8, y+3.5, x+8, y, x+5, y);
        shape.bezierCurveTo(x+3.5, y, x+2.5, y+2.5, x+2.5, y+2.5);


        const geometry = new THREE.ShapeGeometry(shape); // 원판의 크기, 분할할 수
        const fillMaterial = new THREE.MeshPhongMaterial({color: 0x48372f});
        const cube = new THREE.Mesh(geometry, fillMaterial);

        const lineMaterial = new THREE.LineBasicMaterial({color: 0xf230f6});
        const line = new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry), lineMaterial); // 여기서 Wireframe 삭제하면 cube 윤곽선은 사라짐
    
        const group = new THREE.Group()
        group.add(cube);
        group.add(line);

        this._scene.add(group);
        this._cube = group; // 아래에서 업데이트 메서드를 통해 큐브가 업데이트 됨
    }

    // _setupModel(){
    //     const shape = new THREE.Shape();
    //     const x = -2.5, y = 5;
    //     // 이런 식으로 해서
    //     shape.moveTo();
    //     shape.bezierCurveTo();
    //     // 이런 함수들을 사용해서 선을 그려 낼 수 있음

    //     const geometry = new THREE.BufferGeometry();
    //     const points = shape.getPoints();
    //     geometry.setFromPoints(points);

    //     const material = new THREE.LineBasicMaterial({color:0xfff458});
    //     const line = new THREE.Line(geometry, material);
 
    //     this._scene.add(line);
    // }



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