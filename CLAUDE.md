# From. Whale

## 변경할 때 꼭 지킬 것

- **README.md를 같은 PR에서 함께 고친다.** 기능, 화면, 조작, 등장인물, 첫 화면 메뉴, 파일 구성, 주소 옵션이 바뀌면 README의 해당 부분(특징, 등장인물, 조작, 구성 표, 개발용 주소 옵션)을 맞춰 고친다. 버그 수정처럼 README에 적힌 내용이 그대로면 고치지 않아도 된다.
- 게임에 새 문장을 넣으면 `game/js/lang/ko.js`, `en.js`, `ja.js` 세 파일 모두에 넣는다. 첫 화면 문장은 `landing.js`의 `TEXT.ko`, `TEXT.en`, `TEXT.ja`에 넣는다.
- LINE Seed 글꼴은 쓰지 않는다.
