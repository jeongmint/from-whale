# GLB 압축 결과

총 26개 파일. 원본 `/Users/user/Downloads/glb/`는 수정하지 않았습니다.
용량은 ZIP을 풀었을 때 GLB 파일 합계이며, 1 MB = 1,000,000 bytes입니다.

| 버전 | 총 GLB 용량 | 원본 대비 감소 | 사용 조건 |
| --- | ---: | ---: | --- |
| 원본 | 34.47 MB | — | 기존 파일 |
| general | 19.71 MB | 42.82% | 추가 압축 확장이 없는 표준 GLB |
| meshopt | 9.33 MB | 72.95% | EXT_meshopt_compression 지원 및 Meshopt 디코더 필요 |

## 어떤 버전을 사용할까요?

별도 디코더 설정 없이 사용하려면 `general` 버전을 사용하세요.
Meshopt를 지원하는 웹 뷰어에서는 `meshopt` 버전이 더 작습니다.
두 버전 모두 원본과 파일명을 동일하게 유지했습니다.

Three.js GLTFLoader에서 Meshopt 버전을 불러오는 예시:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('/models/clownfish-base.glb', (gltf) => {
  scene.add(gltf.scene);
  // gltf.animations에 기존 애니메이션이 들어 있습니다.
});
```

## 처리와 검증

- 완전히 동일한 정점과 중복 데이터를 정리하고, 작은 오차 허용 범위에서 불필요한 애니메이션 키프레임을 줄였습니다.
- 폴리곤을 줄이거나 정점 좌표를 양자화하지 않았습니다. Meshopt 버전의 추가 버퍼 압축은 무손실입니다.
- 재로딩 및 Meshopt 디코딩 후 모든 삼각형의 좌표·법선·색상·본 인덱스·본 가중치를 원본과 비교해 일치를 확인했습니다. 삼각형 순서와 정점 인덱스는 달라질 수 있습니다.
- 씬 계층, 노드 이름과 기본 변환, 재질, 스킨·본 구성, 애니메이션 이름·채널·시간 범위가 유지되는지 확인했습니다.
- 각 버전에서 원본 키프레임 시점과 그 사이 시점 총 2,306,216개를 수치 비교했습니다. 위치·스케일 등 벡터 성분의 최대 절대 차이는 약 0.0000172(모델 내부 단위), 회전 차이는 최대 약 0.01142도입니다.
- Khronos glTF Validator에서 일반 버전과 Meshopt 디코딩 후 일반 GLB로 변환한 버전 모두 26개 파일의 오류가 0개였습니다. 원본에도 있는 비루트 스킨 노드 관련 경고 등은 남아 있을 수 있습니다.
- 특정 앱에서의 화면 렌더링과 애니메이션 재생은 별도로 확인하지 않았습니다.

파일별 전후 크기는 `size-report.csv`에 있습니다.
