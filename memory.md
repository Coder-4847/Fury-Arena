# Fury Arena — handoff

## Project summary
Procedural Three.js 3D fighting game on an X/Y gameplay plane (Z=0). Plain JavaScript ES modules, no build step. Run `npm start` (or `node serve.mjs`) from this directory, open http://127.0.0.1:4173. Three.js 0.180.0 is pinned in vendor with MIT license. All art is procedural; no other art assets. Static relative paths and `.nojekyll` support GitHub Pages from repository root. **Do not deploy until the user confirms the game works.**

## Current status
Phase 1 foundation implemented and browser smoke-tested. Five deterministic regressions pass. Browser renders the arena and reports no errors or warnings; gamepad activity observed. Full physical-device acceptance is still outstanding. Phase 2 is next. Empty repository at session start, no existing git history or instructions. The full original request is saved in the user's attachment; this file tracks implementation truth, not aspirations.

## Phase checklist
- [x] 1 Foundation: structure / renderer / side camera / fixed loop; all three input types; arena / bounds; playable QA.
- [ ] 2 Fighter: procedural rig; blended state machine; anticipation and follow-through; event hooks / hit-stop; two fighters; animation QA.
- [ ] 3 Combat: hitboxes / hurtboxes; damage / stun / guard / dodge / throws; combos / air attacks; 2–3 specials per fighter; impacts / audio; HUD / rounds; configurable dummy; playable QA.
- [ ] 4 Weapons: timed drops / indicators; equip / drop / throw; durability / ammo; 8 weapons with distinct attacks; playable QA.
- [ ] 5 Arenas: data-driven maps / camera / platforms / hazards; swing / throw / climb / break / trigger; first four maps including Gym; map select; playable QA.
- [ ] 6 Modes: AI / difficulty; CPU / local versus / survival / weapon rush / stock; title / fighter / map / pause / results / settings; every input in menus; complete-loop QA.
- [ ] 7 Content: ten maps with distinct interactions; music / audio pass; effects / lighting / parallax; animation polish; playable QA.
- [ ] 8 Ship: performance / mobile / edge cases / balance; README / controls / credits; user test confirmation; deployment; live URL verification.

## Architecture map
- `index.html`: static entry, canvas, loading/error UI, module bootstrap.
- `style.css`: visual identity, responsive menus and touch controls.
- `favicon.svg`: original vector F mark.
- `package.json`: optional start / test convenience scripts, ES module setting.
- `.gitignore`, `.nojekyll`: repository hygiene and static hosting.
- `vendor/three.module.js`, `three.core.js`, `THREE-LICENSE.txt`: pinned renderer runtime and license.
- `src/main.js`: foundation screen flow, loop and placeholder integration.
- `src/core/loop.js`: 60 Hz fixed updates with interpolated render alpha and frame catch-up cap.
- `src/core/input.js`: action abstraction, independent input sources, 150 ms buffer, keyboard/mouse/gamepad/multitouch and focus-loss handling.
- `src/world/scene.js`: renderer, lighting, procedural training arena, responsive camera.
- `src/world/mover.js`: 2D grounded movement, gravity, jumps, bounds, coyote time.
- `src/data/`, `src/ui/`, `tests/`: reserved for the next systems and meaningful verification.
- `serve.mjs`: optional loopback-only Node static server. `README.md`: run, controls, credits, deployment instructions. `tests/foundation.test.js`: movement and input regressions.
- `memory.md`: this handoff. Update after every significant change.

## Decisions and conventions
Meters/seconds; X horizontal, Y up, Z visual depth only. Logic always runs at 1/60 s. Positions expose previous values for interpolation. Actions are semantic; devices never directly manipulate fighters. Lowercase JS module filenames. Data-driven move/weapon/map/mode registries will be added in phase order. Palette: charcoal, warm white, acid lime; Arial system font; no network font calls. No deployment or external account writes authorized yet.

## Controls
| Action | Keyboard / mouse | Standard gamepad | Touch |
|---|---|---|---|
| Move / navigate | A D / arrows | Stick / D-pad | Arrows / tap menu |
| Jump / gamepad confirm | Space / Enter confirm | A / cross | Up / tap |
| Light / heavy / kick | J / K / L; left / right / middle mouse | X / Y / RB | Jab / Heavy / Kick |
| Guard / dodge / grab | Shift / Q / E | LB / B / LT | Guard / Dodge / Grab |
| Special / use / drop | R / F / G | RT / View / L3 | Fury / Use / Drop |
| Pause / back | Escape / Backspace | Menu / B | Pause / Back buttons |
Only movement is implemented at the foundation phase. Combat mappings are reserved.

## Known bugs / TODOs
- Runtime verified in Codex browser; vendor download complete. Physical-device acceptance remains pending.
- Physical gamepad and physical phone testing are not yet performed; do not claim they are.
- Foundation capsule is intentional for Phase 1, not a finished character.
- Combat and all later phases are pending.

## Resume instructions
If you are a new AI reading this: read this file, run the static server, inspect git status, and verify the current build in a browser. Continue Phase 2; keep the hardware QA caveat explicit. Follow the phase checklist in order. Keep each phase playable, update this file and commit after significant milestones. Never mark hardware testing or commercial quality as achieved without evidence. Prepare deployment only; ask for the user's test confirmation before publishing.

