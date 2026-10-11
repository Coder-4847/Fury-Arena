# Fury Arena — handoff

## Project summary
Procedural Three.js 3D fighter on the X/Y plane; gameplay Z=0. Plain JavaScript ES modules, no build step. `npm start` / `node serve.mjs`, then http://127.0.0.1:4173. Three.js 0.180.0 vendored with MIT license. No external art/fonts. All paths relative; `.nojekyll` included. **Never deploy before the user confirms it works.**

## Current status — 2026-10-11
Resumed after the user's usage interruption. Phase 1 committed as 5c1cc06. Phase 2 implementation checkpoint committed as 601750e. Phase 3 combat implemented; browser round-flow verified through NYX WINS 0–2, with no warnings/errors. Ten deterministic tests pass. No browser errors/warnings in the combat smoke test. Camera now frames both fighters dynamically; simultaneous hits trade fairly. Phase 3 complete and committed as a6e7c47. Phase 4 implemented and pickup browser-verified; next Phase 5 arena framework. Do not describe the game as publishable yet.

## Phase checklist
### 1 Foundation
- [x] Structure, vendored renderer, side camera, bounded arena, fixed 60 Hz updates and render interpolation.
- [x] Keyboard/mouse, standard gamepad and multitouch abstraction, buffering and focus-loss pause.
- [x] Static-server browser smoke test and five input/movement regression checks.
- [ ] Physical phone and full physical-controller acceptance (final QA).
### 2 Fighters
- [x] Two distinct articulated procedural humanoids; idle/run/jump/fall/land/crouch/guard/dodge/hit/knockdown/get-up poses.
- [x] Frame-rate-independent blending, anticipation/strike/recovery, breathing/scarf motion, state events, hit-stop support.
- [x] Distance-driven two-link leg gait and smooth facing; browser visual check.
- [ ] Commercial-quality animation acceptance remains subjective and needs user playtest.
### 3 Combat
- [x] Active-window collision volumes, health/damage/stun/push, directional guard, dodge invulnerability, throws.
- [x] Light chain, heavy/kick/air attacks; two meter-gated specials per fighter; all defined as data.
- [x] Hit-stop/shake/sparks/haptics/procedural audio; health/damage trail/meter/timer/round/combo HUD.
- [x] Idle/block/attack partner in pause menu; best-of-three flow, round intro, KO, results/rematch.
- [x] Browser full-match verification reached results (NYX WINS 0–2); no warnings/errors. Initial move timings/costs tuned; broader balance testing remains in Phase 8.
### 4 Weapons
- [x] Timed indicated drops, equip/drop/throw, durability/ammo, eight weapon definitions. Nineteen regression checks pass; browser verified sword pickup/equipped model. Broader weapon balance remains in final QA.
### 5 Arenas
- [ ] Data-driven bounds/camera/platforms/hazards/spawns; interactable framework; swing/throw/climb/break/trigger; first four including Gym; map select; playable QA.
### 6 Modes and menus
- [ ] Difficulty AI using weapons/interactions; CPU/local/survival/weapon rush/stock; complete title/mode/fighter/map/pause/results/settings flows on all input types.
### 7 Content and polish
- [ ] Ten distinct maps, each with interaction/hazard; audio/music pass; effects/lighting; animation pass; playable QA.
### 8 Ship
- [ ] Performance/phone/input-edge/balance QA; user confirmation; deploy; live URL verification.
- [x] README controls/credits, relative paths and hosting instructions prepared.

## Architecture map
- index.html: canvas, loading/error UI and module entry; favicon.svg: original F mark.
- style.css: responsive branding, menus, HUD and touch layout.
- package.json: optional start/test scripts; serve.mjs: loopback-only static server.
- .gitignore / .nojekyll: hygiene/static hosting.
- vendor/three.module.js + three.core.js + THREE-LICENSE.txt: pinned MIT runtime.
- src/main.js: screen navigation, match stages/rounds, training partner, fixed/render integration, dynamic camera.
- src/core/loop.js: capped fixed-step accumulator.
- src/core/input.js: per-source held actions, 150ms buffer, keyboard/mouse/gamepad/touch, focus loss.
- src/core/audio.js: procedural sound and rhythm synthesis; unlock on gesture.
- src/data/fighters.js: Kade/Nyx appearance and stats.
- src/data/moves.js: timings/ranges/damage/poses/chains/special costs.
- src/world/mover.js: grounded physics, coyote jump, guard/crouch/dodge and state events.
- src/world/fighter.js: extends mover with attack/stun/meter/knockdown state and move selection.
- src/world/rig.js: articulated meshes, interpolated transform and smoothed poses; local +X forward.
- src/world/combat.js: attack collision, guard/damage and simultaneous resolution, body separation.
- src/world/effects.js: capped transient impact particles and camera feedback.
- src/world/scene.js: renderer, lights, training floor and resize handling.
- src/ui/hud.js: health trails, meters, pips, timer, combo, announcement.
- tests/foundation.test.js: input source/buffer/menu latch, movement/jump/bounds.
- tests/combat.test.js: hit windows/one-hit rule, guard/throw, invulnerability/range, meter, trades.
- README.md: run/controls/credits/deploy; memory.md: authoritative handoff.

## Decisions / conventions
Meters and seconds. X horizontal, Y up, Z visual depth only. Previous positions interpolate fixed simulation states. Actions semantic, never device-specific inside fighters. Input `flush` on screens retains held sources to avoid repeat confirmation. `clear` on focus loss clears everything. Moves are objects in src/data/moves.js; add pose behavior in rig only when needed. Weapon/map/mode registries pending. Charcoal/white/lime with lilac opponent; Arial system font. No deployed remote/repository configured.

## Controls
| Action | Keyboard / mouse | Standard pad | Touch |
|---|---|---|---|
| Move/menu | A D/arrows | Stick/D-pad | Arrows/tap |
| Jump/confirm | Space/Enter | A/cross | Up/tap |
| Light/heavy/kick | J/K/L; mouse left/right/middle | X/Y/RB | Jab/Heavy/Kick |
| Guard/dodge/grab | Shift/Q/E | LB/B/LT | Guard/Dodge/Grab |
| Special/alternate | R / up or down + R | RT / vertical stick + RT | Fury / down + Fury |
| Use/drop (pending) | F/G | View/L3 | Use/Drop |
| Pause/back | Escape/Backspace | Menu/B | Pause/Back |

## Known bugs / TODOs
- No physical phone performance/multitouch test; gamepad activity observed but full controller acceptance not independently verified.
- Animation and combat need continued polish/balance; no commercial-quality claim.
- Browser verified a complete two-round loss into results; further win/draw edge checks belong in final QA.
- Procedural portraits are initial letters; replace with real rig renders in menu phase.
- Map framework and full modes are next; weapons implemented.
- Browser may still be open with the game and server may still run (local port 4173); reuse them where possible.

## Resume
Read this file, git status and changed source. Start/reuse server, run npm test, inspect browser. Finish Phase 3 QA before Phase 4. Keep build playable, update this file after significant changes, commit checkpoints. Git metadata writes require tool sandbox escalation in this environment; regular project edits do not. Never deploy without user confirmation. Do not turn an unchecked hardware/quality claim into a checked deliverable without evidence.


### Phase 4 implementation checkpoint
Added src/data/weapons.js (eight parameterized weapon definitions) and src/world/weapons.js (procedural models, indicated timed drops, equipment, durability/ammo, thrown and fired projectiles with swept X collision). Integrated F use/pickup, G throw, down+G drop; melee/ranged attack overrides. tests/weapons.test.js covers all eight equipment lifecycles and projectile direction after owner turns. Nineteen tests pass. Browser pickup verification in progress. Next: Phase 5 after verification; keep weapon balance on final QA list.

