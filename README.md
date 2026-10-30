# 🐋 From. Whale

**English** · [한국어](README.ko.md)

[![Hazel the whale glowing in moonlit ripples — From. Whale](data/res/og.jpg)](https://from-whale.netlify.app/game/)

**[▶ Play now](https://from-whale.netlify.app/game/)** · [Home page](https://from-whale.netlify.app/) · No install, runs in the browser (PC · phone)

A sea adventure of **Hazel**, a whale who sings at 52Hz. Another world, the year 2066, a night sea. (BETA)

| Lighthouse and ringed planet | Moby Dick boss fight |
| --- | --- |
| ![Hazel swimming toward the lighthouse under a ringed planet](data/res/shots/play.jpg) | ![Moby Dick, Luke and Finn among falling-star warning circles](data/res/shots/boss.jpg) |
| **Duet with Stella · shooting stars** | **Phone, landscape** |
| ![Rhythm duet with Stella under a shower of shooting stars](data/res/shots/stella.jpg) | ![Landscape phone screen with joystick and buttons](data/res/shots/mobile.jpg) |

- Run locally: `python3 -m http.server` in the repo root → <http://localhost:8000/game/> (duet scoreboard shows this device only; `npx netlify dev` for the server too)
- Languages: 한국어 · English · 日本語 (picked from the device language)
- Custom nickname (default: 헤이즐 / Hazel / ヘイゼル)
- Saves: continue by chapter, seen endings kept separately
- LAB (phone pause menu): tilt steering, landscape only. Tip shown in the prologue
- Feedback: ending screen → Netlify Forms `feedback` (needs form detection and email notification)
- Link preview: `data/res/og.jpg` (1200×627, moonlit first scene). Refresh with LinkedIn Post Inspector after changing

### Features

- **No fighting** — no attacks, only a 52Hz song. Even the boss, Moby Dick, is won over by singing
- **52Hz as a game rule** — a song no one understands, letters translated by Luke
- **Call and response** — answer Finn's sobbing rhythm with a song (ch. 2)
- **Growing music** — synthesized live. Luke's bass, Finn's drums, dropped when a friend leaves. Saxophone in the epilogue
- **6 endings + ending gallery** — 4 decided by Luke's and Finn's fates + The Late Whale + A Whale's Stopped Heart (below). Unseen endings show hints only. All 6 unlock a **golden sea** (moon glitter fading from gold to sky blue, a golden moon, Hazel's glowing pattern sparkling brighter)
- **Kelp** — signposts with written directions, sing beside them to restore hearts
- **Moby Dick boss fight** — 6 songs that reach him win him over. Body hits and falling stars cost a heart; stun 1.1 s from stars, 1.5 s from charges (with Finn's Tears, a song clears it at once)
- **Stella (hidden ending)** — all 6 letters in bottles (Moby's prologue letter included) → 12-bar blues duet (PERFECT ±25 ms · EXCELLENT ±60 ms · GOOD ±150 ms, 450 max, S from 85% · A from 60%, a shooting star per jump note) → name the song and leave it with your nickname and score on the shared **Duet TOP 10**. After meeting Stella, "Sing the duet again" on the title or ending screen replays just the duet (save data untouched). Remaining letters can be found in the epilogue after the ending
- **Space and sea** — Gerstner waves, glittering ripples, ringed planet, shooting stars, bloom
- **MAP 2 · Under the sea (BETA)** — after meeting Stella, "Into the deep" on the ending screen → a portal on the surface → dive. Inside, MAP 1 (lighthouse, kelp, Alliance…) is gone and only MAP 2 remains (the sonar shows the research logs). Keep descending a trench: sunlight zone → twilight (40 m) → midnight (120 m) → trench (250 m) → the Doctor's base at the bottom (318 m). The deeper you go the more the moonlight fades; Hazel's glowing pattern and her song (sonar) light the way. Six research logs, one per layer (wrecked sub, lab, red terminal, whale bones, grad student J's record, the Doctor's memo); the current blocks the way down until each is read. Luke translates the writing, or you get only the drawings; Finn's fate changes the stop-device scene. At the base door the pink Shaman blocks the way: she calls the base AI "the Voice of the Deep". Sing the stop code → the red eyes go dark, the Shaman's Voice falls silent → MAP 2 ending "A Song Heard". Sea life per layer: reef fish schools in the sunlight zone (scatter when Hazel comes close), stingray · grouper · barracuda · reef sharks in the twilight, glowing moon jellyfish at midnight (brighter when you sing; touch one for a heart, then it dims for 30 s), coelacanths in the trench, crabs · urchins · starfish · shrimp at the bottom. Alliance guards (red eyes) patrol the middle of the trench from the twilight zone down and, after a one-second stare (time to slip away to the walls), chase Hazel when they see her; singing at 52Hz brings every guard in earshot, but the "perfect song" learned from the duet with Stella freezes guards close by for a few seconds (red eyes go dark). Two guards circle the whale bones as an altar of "purification". The moray holes in the walls are taboo, so guards never follow you there. Moray eels hide in those walls: they shiver, then lunge and bite (1 heart, short stun). Singing makes nearby morays glow red and shows them on the sonar. Reading a log refills hearts; fainting in MAP 2 wakes Hazel by the last log read (no heart-stop ending)
- **Retro blue UI** — window-style HUD, sonar minimap, chapter cards, PC controls guide, current objective inside the HAZEL window (top center left clear). One-line dialog at the bottom, two-column title, and the call-and-response window at the bottom left in tilt mode on landscape phones
- **Light models** — 500–650 vertices per whale, 512px textures. Phone support

### Branching endings

- Luke: hit by the Alliance at most once until reaching Moby Dick (Luke warns you after the first) → Luke lives, Luke's lantern (wider song range in the boss fight). Hit twice before the ch. 3 ambush → Luke's sacrifice at the ambush; the second hit after getting through it together → Luke rams in and falls on the spot. Either way, light shards (speed boost)
- Boss fight: Finn takes the first fall → broken compass (directions fade and go dark, restored by singing beside kelp) + Finn's Tears (sing while stunned → violet rain, stun cleared at once)
- All 6 letters before meeting Moby Dick: **The Late Whale** (regardless of Luke and Finn, Moby grumbles, Stella is late too) → Stella's duet follows, 2 endings in one run
- Two falls in one chapter: **A Whale's Stopped Heart** → Continue restarts that chapter (Finn's fall does not count)

| Ending | Luke | Finn |
| --- | --- | --- |
| The Light That Never Fades | ✕ | ○ |
| The Strength of Friends | ○ | ○ |
| The Broken Compass | ○ | ✕ |
| Sacrifice | ✕ | ✕ |
| The Late Whale | any | any |

### Characters

| Name | Role | Model |
| --- | --- | --- |
| Hazel | 52Hz finless porpoise, glowing pattern on the back | `data/hazel/Hazel.glb` |
| Luke | Narwhal lighthouse keeper, translator | `data/luke/Luke.glb` |
| Finn | Crybaby orca guide | `data/finn/Finn.glb` |
| The Alliance | Orca pod; guards of the trench in MAP 2 | `data/orca_army/Orca_Army.glb` |
| Alliance chief · Shaman | Pink orca; hears the base AI as "the Voice of the Deep" (MAP 2) | `Orca_Army.glb` + `recolor` |
| Moby Dick | Sperm whale, final boss | `data/moby/Moby.glb` |
| Stella | Yellow blue whale, another 52Hz, throat pleats, sparkling six-point star on the back | `data/stella/Stella.glb` (generated by `tools/make_stella.py`) |
| MAP 2 sea life | Reef fish, jellyfish, coelacanth, crabs and more (24 kinds), moray eels as the threat | `data/polyfork/*.glb` ([Polyfork](https://polyfork.dev) free low-poly, Meshopt compressed, loaded when the portal opens) |

Color options (`Whale` in `game/js/actors.js`): `solidColor` for a single color, `recolor: [ dark, light ]` to recolor while keeping the pattern

### Controls

| Keyboard | Mobile | Action |
| --- | --- | --- |
| `W A S D` / arrow keys | Joystick | Swim (keyboard: camera-relative, A·D strafe · joystick: pull down to reverse) |
| Mouse drag | Screen drag | Camera (on phones it returns behind the whale after a moment) |
| — | Tilt (LAB, landscape) | Lean forward to swim, back to reverse, sideways to turn |
| `Shift` | `»` | Boost (stamina) |
| `Space` | `⤴` | Jump (invincible in the air) · ambush dodge · duet jump notes · swim up under the sea |
| `C` | `⤵` (under the sea only) | Swim down under the sea |
| `E` | `♪` | Sing · talk · sonar · next line · call and response · duet song notes |
| `L` / `M` / `Esc` | Top-right buttons | Letters / sound / pause |
| Whale chip in the POD window | Whale chip in the POD window | Home page |

### Home page

- PLAY · ABOUT (PITCH / CONCEPT / BGM) · CONTACT (email · GitHub repo · LinkedIn)
- `#pitch`, `#concept`, `#bgm` open a tab directly
- Font: Squaredance (`files/SquaredanceFontV1-Regular.ttf`)

### Files

| File | Contents |
| --- | --- |
| `index.html`, `landing.css`, `landing.js` | Home page |
| `game/index.html`, `game/style.css` | Game screen, HUD |
| `game/js/ocean.js` | Gerstner waves (GPU + matching CPU version) |
| `game/js/sky.js` | Night sky, ringed planet, shooting stars, reflection cubemap |
| `game/js/world.js` | Seabed, rocks, lighthouse, kelp, bottles, light shards |
| `game/js/actors.js` | Whale models, swim shader, recoloring, portraits |
| `game/js/audio.js` | Synthesized music, sound effects |
| `game/js/ui.js` | HUD, dialog box, chapter cards, sonar |
| `game/js/story.js` | Chapter flow, branching endings, map coordinates, MAP 2 story · stop code |
| `game/js/lang/*.js` | Text per language (ko / en / ja) |
| `game/js/i18n.js` | Language selection |
| `game/js/name.js` | Nickname, Korean particles (`{N은}`, `{N을}`) |
| `game/js/dive.js` | MAP 2: portal, underwater view (water ceiling, particles, light shafts, depth layers, sonar) |
| `game/js/guards.js` | MAP 2 Alliance guards: patrol, chase, hearing the song, wall taboo, bone altar ritual |
| `game/js/sealife.js` | MAP 2 sea life: where each kind lives, schools, drifting jellyfish, bottom crawlers, moray eel ambushes |
| `game/js/map2.js` | MAP 2: trench terrain, landmarks per layer (sub · lab · terminal · whale bones · base), research log positions |
| `game/js/scores.js` | Duet scoreboard window (saves on this device only when the server can't be reached) |
| `game/js/main.js` | Rendering, bloom, input, Alliance AI, boss fight, routes · ending gallery, epilogue |
| `netlify/functions/duet-scores.mjs` | Duet scoreboard server (Netlify Functions + Blobs). Keeps the TOP 50; checks length, banned words, score matching the judgment counts, 20 s between posts. Remove entries in the Netlify dashboard → Blobs → `duet-scores` → `top-v2` |
| `package.json` | `@netlify/blobs` for the server code |
| `tools/make_stella.py` | Stella model generator (low-poly blue whale with texture). Edit the numbers, then `python3 tools/make_stella.py` |
| `scene.html` | Early 3D whale scene |

### Dev URL options

- `?chapter=0~6` start at a chapter (0 prologue … 5 ending, 6 epilogue)
- `?stella` start at the ending with all 6 letters (Stella → duet → sub ending). Save data untouched
- `?route=light|friends|compass|sacrifice|late` start ch. 4 onward on that route (with `?chapter=4` or `?chapter=5`, e.g. `?chapter=5&route=compass`)
- `?duet` just the duet, once you've met Stella (same as the title / ending screen button; scores go to the scoreboard; save data untouched)
- `?dive` start at the MAP 2 preview (portal → under the sea). Save data untouched
- `?gold` preview the all-endings reward (golden sea). Save data untouched
- `?q=low` low-spec mode (automatic on touch devices)
