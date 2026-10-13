# from-whale
WebGL Three.js Project about Blue and Whale

## 🐋 From. Whale

52Hz로 노래하는 고래 **헤이즐**의 바다 모험 게임. 이세계의 2066년, 밤바다. (BETA)

- 첫 화면: <https://from-whale.netlify.app/> · 게임: <https://from-whale.netlify.app/game/>
- 로컬 실행: 저장소 루트에서 `python3 -m http.server` → <http://localhost:8000/game/>
- 언어: 한국어 · English · 日本語 (기기 언어 자동 선택)
- 닉네임 설정 (기본: 헤이즐 / Hazel / ヘイゼル)
- 저장: 챕터 단위 이어하기, 본 엔딩은 따로 기록
- 실험실 (폰 일시정지 메뉴): 기울기 조종, 가로 모드 전용
- 의견 보내기: 엔딩 화면 → Netlify Forms `feedback` (폼 감지 · 메일 알림 설정 필요)

### 특징

- **싸우지 않는 게임** — 공격 없이 52Hz 노래만. 보스 모비 딕도 노래로 설득
- **52Hz = 게임 규칙** — 아무도 못 알아듣는 노래, 루크의 편지 통역
- **따라 부르기** — 핀의 울음 박자에 노래로 대답 (2장)
- **자라는 음악** — 실시간 합성. 루크 베이스, 핀 드럼, 동료가 떠나면 빠짐. 에필로그 색소폰
- **갈래 엔딩 4개 + 엔딩 도감** — 루크 · 핀의 운명으로 결정 (아래 표). 못 본 엔딩은 힌트만
- **미역 줄기** — 길 안내 글, 곁에서 노래하면 하트 회복
- **모비 딕 보스전** — 몸 충돌 · 떨어지는 별에 하트 −1, 별은 1.1초 기절
- **스텔라 (숨겨진 엔딩)** — 유리병 편지 6통 → 12마디 블루스 듀엣 (S·A·B 등급, 점프 노트마다 별똥별). 엔딩 후 에필로그에서 남은 편지 수집
- **우주와 바다** — Gerstner 파도, 윤슬, 고리 행성, 별똥별, 블룸
- **레트로 파란 UI** — 창 모양 HUD, 소나 미니맵, 챕터 카드, PC 조작 안내. 폰 가로 모드 대화창은 아래쪽 한 줄
- **가벼운 모델** — 고래당 정점 500~650개, 512px 텍스처. 폰 지원

### 갈래 엔딩

- 3장 매복: 연합군에게 1번 이하로 맞으면 점프로 함께 회피 → 루크 생존, 루크의 등불 (보스전 노래 범위 확대). 2번 이상이면 루크 희생, 빛 조각 (가속)
- 보스전: 처음 쓰러지면 핀이 대신 맞음 → 부서진 나침반 (길 안내가 흐려지다 꺼짐, 미역 곁 노래로 복구)

| 엔딩 | 루크 | 핀 |
| --- | --- | --- |
| 꺼지지 않는 빛 | ✕ | ○ |
| 동료의 힘 | ○ | ○ |
| 부서진 나침반 | ○ | ✕ |
| 희생 | ✕ | ✕ |

### 등장인물

| 이름 | 설정 | 모델 |
| --- | --- | --- |
| 헤이즐 | 52Hz 상괭이, 등의 빛 문양 | `data/hazel/Hazel.glb` |
| 루크 | 일각고래 등대지기, 통역사 | `data/luke/Luke.glb` |
| 핀 | 울보 범고래 길잡이 | `data/finn/Finn.glb` |
| 연합군 | 범고래 무리 | `data/orca_army/Orca_Army.glb` |
| 연합군 대장 · 샤먼 | 분홍 범고래 | `Orca_Army.glb` + `recolor` |
| 모비 딕 | 향유고래, 마지막 보스 | `data/moby/Moby.glb` |
| 스텔라 | 노란 대왕고래, 또 하나의 52Hz | 임시 `Hazel.glb` + `solidColor` (예정 `data/stella/Stella.glb`) |

색 옵션 (`game/js/actors.js`의 `Whale`): `solidColor` 단색, `recolor: [ 어두운 색, 밝은 색 ]` 무늬 유지 색 변경

### 조작

| 키보드 | 모바일 | 동작 |
| --- | --- | --- |
| `W A S D` / 방향키 | 조이스틱 | 헤엄 (키보드: 화면 기준, A·D 옆으로 · 조이스틱: 아래로 당기면 후진) |
| 마우스 드래그 | 화면 드래그 | 시점 (폰은 잠시 뒤 고래 뒤로 복귀) |
| — | 기울기 (실험실, 가로 모드) | 앞으로 눕히면 전진 · 뒤로 젖히면 후진 · 좌우로 방향 |
| `Shift` | `»` | 가속 (스태미나) |
| `Space` | `⤴` | 점프 (공중 무적) · 매복 회피 · 듀엣 점프 노트 |
| `E` | `♪` | 노래 · 말 걸기 · 소나 · 대화 넘기기 · 따라 부르기 · 듀엣 노래 노트 |
| `L` / `M` / `Esc` | 오른쪽 위 버튼 | 편지함 / 소리 / 일시정지 |
| POD 창 고래 칩 | POD 창 고래 칩 | 첫 화면 |

### 첫 화면

- PLAY · ABOUT (PITCH / CONCEPT / BGM) · CONTACT
- `#pitch`, `#concept`, `#bgm` 주소로 탭 바로 열기
- 글꼴: Squaredance (`files/SquaredanceFontV1-Regular.ttf`)

### 구성

| 파일 | 내용 |
| --- | --- |
| `index.html`, `landing.css`, `landing.js` | 첫 화면 |
| `game/index.html`, `game/style.css` | 게임 화면, HUD |
| `game/js/ocean.js` | Gerstner 파도 (GPU + 같은 계산의 CPU 버전) |
| `game/js/sky.js` | 밤하늘, 고리 행성, 별똥별, 반사용 큐브맵 |
| `game/js/world.js` | 해저, 바위, 등대, 미역, 유리병, 빛 조각 |
| `game/js/actors.js` | 고래 모델, 헤엄 셰이더, 색 바꾸기, 초상화 |
| `game/js/audio.js` | 합성 음악, 효과음 |
| `game/js/ui.js` | HUD, 대화창, 챕터 카드, 소나 |
| `game/js/story.js` | 챕터 진행, 갈래 엔딩, 지도 좌표 |
| `game/js/lang/*.js` | 언어별 문장 (ko / en / ja) |
| `game/js/i18n.js` | 언어 선택 |
| `game/js/name.js` | 닉네임, 조사 처리 (`{N은}`, `{N을}`) |
| `game/js/main.js` | 렌더링, 블룸, 입력, 연합군 AI, 보스전, 갈래 · 엔딩 도감, 에필로그 |
| `scene.html` | 초기 3D 고래 장면 |

### 개발용 주소 옵션

- `?chapter=0~6` 챕터 지정 시작 (0 프롤로그 … 5 엔딩, 6 에필로그)
- `?stella` 편지 6통을 모은 상태로 엔딩부터 시작 (스텔라 → 듀엣 → 서브 엔딩). 저장 데이터는 그대로
- `?route=light|friends|compass|sacrifice` 4장 이후를 그 갈래로 시작 (`?chapter=4`, `?chapter=5`와 함께. 예: `?chapter=5&route=compass`)
- `?q=low` 저사양 모드 (터치 기기 자동)
