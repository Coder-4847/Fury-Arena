# Fury Arena — authoritative handoff

## Summary / run / deploy
Procedural Three.js 3D fighting game with all gameplay on X/Y (Z=0). Plain JavaScript ES modules, no build step. Run `npm start` / `node serve.mjs`, visit http://127.0.0.1:4173. WebGL 2 required. Three.js 0.180.0 vendored locally under MIT. All art, portraits, sounds and music are generated locally; no external asset/CDN dependency. Optional same-Wi-Fi phone server: `node serve.mjs --host 0.0.0.0 --port 4174` (normal default remains loopback-only).

GitHub Pages uses repository root and relative paths; `.nojekyll`, metadata, favicon and README are ready. **Do not deploy until the user explicitly confirms the game works.** Local Git branch `master`, no remote configured. User may be interrupted by usage limits; preserve a playable checkpoint and update this document before stopping.

## Current status — 2026-10-11
Resumed after usage interruptions. All planned content systems are implemented: two fighters, data-driven combat and specials, eight weapons, ten interactive arenas, six modes, full menus, settings, procedural audio. Implementation and local visual/responsive QA are complete through the pre-deployment checkpoint (Phases 7/8); NOT claiming publishable/commercial quality or verified physical-phone performance. Final test run: 40/40 passing, including pickup rotation. All 25 application/server modules pass syntax and local-import checks.

Verified browser flows: title → modes → fighter → map → training; pause/settings/focus retention; complete CPU two-round match → results; sword pickup/equip/throw; all ten arenas rendered and inspected. Portrait 390×844 and landscape 844×390 touch layouts inspected; viewport reset and touch restored to Auto. Snowy Temple HUD contrast verified. Screenshot saved in ignored test-results/fury-arena.jpg. Last desktop Temple sample: 121 rendered FPS, 80 draw calls, 5,298 triangles, no warning/error logs. This is one desktop sample, not a phone benchmark. Current pending work: user playtest and physical-device acceptance, then explicit confirmation before deployment. A shell HTTP probe was blocked by sandbox localhost access; browser smoke tests successfully loaded the game and assets.

## Phase checklist (implementation vs acceptance)
### 1 — Foundation
- [x] Vendored Three.js, procedural arena, side camera, 60 Hz fixed updates/interpolation, bounded X/Y movement.
- [x] Semantic keyboard/mouse, standard gamepad and captured multitouch input; 150ms buffers, coyote time, focus-loss/disconnect pause.
- [x] Static-server browser smoke test and deterministic input/movement regressions.
- [ ] Physical hardware acceptance is part of final QA.
### 2 — Fighter / animation
- [x] Kade and Nyx rigs; idle/run/jump/fall/land/crouch/block/hit/knockdown/get-up/dodge/climb/swing poses.
- [x] Damped transitions, distance-driven leg gait, facing blend, anticipation/strike/recovery, breathing/scarf movement, event hooks/hit-stop.
- [x] Browser visual checks; no claim of parity with commercial mocap animation.
- [ ] Final subjective animation/foot-contact acceptance with user.
### 3 — Combat
- [x] Timed attack volumes, damage/stun/push, guard/dodge/throw, real hitstun combo counter, air attacks, three-hit light chain.
- [x] Two specials per fighter (40/50 Fury), data-driven attacks, sparks/shake/hit-stop/audio/haptics, simultaneous strike trades.
- [x] HUD: rig portraits, health/damage trail, special meter, timer, rounds, combos, intros/KO/results. Configurable training partner.
- [x] Complete match browser check and collision/meter regressions.
### 4 — Weapons
- [x] Sword, staff, hammer, knife, pistol, shotgun, bottle, grenade; models, attacks/projectiles, ammo/durability, indicated timed spawns.
- [x] Pickup/equip/use/throw/drop; capacity-preserving drops; swept projectile collision; old pickups rotate so Rush never stalls.
- [x] Eight weapon lifecycle regressions plus browser sword equip/throw check.
- [ ] Broader human balance/feel pass remains open.
### 5 — First four arenas
- [x] Data-driven Gym, Dojo, Rooftop, Foundry; bounds/spawns/platforms/lighting/hazards; arena selection.
- [x] Swing-kick, climb, throwable props, breakable blockers, gong/press triggers; readable timed hazard warnings.
- [x] Platform/interaction regressions; Gym/Dojo browser rendering checked.
### 6 — Modes / menus
- [x] CPU/local/survival/weapon rush/stock/training; difficulty AI uses weapons/props, blocks, jumps hazards and varies attacks.
- [x] Title/mode/fighter/map/pause/results/settings flows; generated portraits; menu focus and keyboard/gamepad/touch actions.
- [x] Persistence for volume/music/difficulty/graphics/touch settings; second keyboard/gamepad player.
- [x] Match-rule tests cover completion, carryover, survival defeat and draws.
- [ ] Independent physical two-player/device acceptance pending.
### 7 — Content / polish
- [x] Ten arenas: Gym, Silent Dojo, After Hours, Foundry, Scrap Kings, Cargo Nine, Last Train, Low Tide, Overgrown, White Silence.
- [x] Each has different geometry/layout/size and interactions/hazards. Procedural music/SFX, material hit flashes, weapon trails, environmental depth.
- [x] All ten geometry builds + seeded AI simulations pass; text canvas is mocked in those tests (not visual WebGL QA).
- [x] Browser visual sweep of all ten arenas and portrait/landscape touch layouts; no browser warnings/errors observed.
### 8 — Optimization / ship
- [x] Static geometry batching, two instanced particle draws, quality presets (DPR/shadows/particle cap), resource disposal on rebuilds.
- [x] Startup/module/WebGL errors handled, guarded settings storage, relative assets, README/credits/deploy instructions.
- [x] Final regressions: 40 tests pass; 25 modules pass syntax/local-import checks.
- [ ] Real phone multi-touch/audio/performance, physical controller mapping/disconnect and subjective balance acceptance.
- [ ] User confirms game works; create/use agreed remote; deploy; verify live URL. No deployment yet.

## Architecture map
- `index.html`: canvas/loading/error UI, metadata/module entry; `favicon.svg`: original F branding.
- `style.css`: visual identity, responsive menus/HUD/touch controls; `README.md`: player/run/deploy guide.
- `package.json`: ES module + start/test commands; `serve.mjs`: Node static server (loopback default, optional LAN/port, hidden-file/path protection).
- `.gitignore`, `.nojekyll`: repo hygiene/static hosting.
- `vendor/three.module.js`, `three.core.js`, `THREE-LICENSE.txt`: pinned MIT runtime.
- `src/main.js`: integration/composition, screen actions, match stages, input assignment, camera and effects; no engine/framework.
- `src/core/loop.js`: capped fixed-step accumulator; `input.js`: per-source actions/buffers/multitouch/dual pads; `audio.js`: WebAudio synthesis.
- `src/core/match.js`: testable mode scoring/carryover; `settings.js`: validated persisted preferences.
- `src/data/fighters.js`: identity/stats; `moves.js`: attack timing/collision/pose/cost; `weapons.js`: eight weapons; `maps.js`: ten arenas; `modes.js`: six rule sets.
- `src/world/mover.js`: grounded movement/coyote/dodge/state hooks; `fighter.js`: attack/stun/meter/knockdown and move selection.
- `src/world/rig.js`: articulated mesh hierarchy, IK-inspired leg gait and damped procedural poses; local +X forward.
- `src/world/combat.js`: active-window contacts/guard/damage/trades/separation; `weapons.js`: mesh factories, pickups/equipment/projectiles.
- `src/world/maps.js`: scenery build/disposal, platforms/interactions/telegraphed hazards; `scene.js`: renderer/lights/resize and DOM QA metrics.
- `src/world/ai.js`: buffered AI actions/reaction levels/prop and weapon use; injectable RNG for repeatable tests.
- `src/world/effects.js`: bounded instanced particles/trails and camera feedback; `batch.js`: static material grouping while preserving dynamic meshes.
- `src/ui/screens.js`: menu templates/action routing; `hud.js`: in-match UI; `portraits.js`: local rig renders to in-memory portrait PNGs.
- `tests/foundation.test.js`: input/movement invariants; `combat.test.js`: windows/guard/meter/trades; `weapons.test.js`: all eight equipment lifecycles/projectiles/rotation.
- `tests/maps.test.js`: platform and climb/swing release; `modes.test.js`: match rules; `arenas.test.js`: all-map construction and integrated seeded AI combat; `batch.test.js`: rendering-geometry bounds preservation.
- `memory.md`: this canonical handoff; replace stale status rather than only appending contradictory notes.

Connections: input/AI → Fighter/Mover → map physics/interactions → combat/weapon contacts → HUD/audio/effects; fixed simulation positions → Rig interpolation → Three renderer. MatchState controls round results/carryover; Screens dispatches actions to main; registries hold content.

## Decisions / extension conventions
Meters/seconds. X horizontal, Y vertical, Z rendering only. Physics 1/60s; cap catch-up to 0.1s. Previous/current positions interpolate; frozen frames use current position to avoid jitter. `Input.flush()` clears edges/buffers but keeps held sources across menus; `clear()` releases everything on focus loss. A single action can have several device sources. Hidden documents do not poll gamepads. `?keyboard-only` isolates a QA tab from connected-controller input; normal URL retains controllers.

Add moves in `src/data/moves.js` (startup/active/recovery/range/damage/pose); add only new pose logic in rig if needed. Add weapons in `src/data/weapons.js` and `weaponModel` factory. Add maps in `src/data/maps.js` plus themed scenery if needed; keep interactive transforms out of batching (`userData.dynamic=true` for direct meshes). Add modes in `src/data/modes.js` and exceptional rules in MatchState, with focused tests. Charcoal/white/lime + lilac identity, Arial system font. No external art licenses beyond Three MIT.

## Controls
| Action | Keyboard / mouse | Standard pad | Touch |
|---|---|---|---|
| Move/menu | A/D or arrows | Stick/D-pad | Arrows/tap |
| Jump/climb/crouch | Space / W or up / S or down | A / up / down | Jump also climbs near ledges / down |
| Light/heavy/kick | J/K/L; mouse L/R/M | X/Y/RB | Jab/Heavy/Kick |
| Guard/dodge/grab-interact | Shift/Q/E | LB/B/LT | Guard/Dodge/Grab |
| Special/alternate | R / up or down + R | RT / vertical stick + RT | Fury / down + Fury |
| Pickup-use/throw/drop | F / G / down + G | View / L3 / down + L3 | Use / Drop / down + Drop |
| Pause/back/confirm | Esc/Backspace/Enter | Menu/B/A | Pause/Back/tap |
Player 2 local: arrows + numpad 0 jump, 1/2/3 attacks, 4 dodge, 5 grab, 6 special, decimal use, divide throw/drop, right Shift guard; or second standard gamepad. Touch controls cover P1; P2 needs keyboard/second pad.

## Known limitations / pending QA
- Physical phone multi-touch, sound and sustained performance not verified; desktop sample is not evidence for phones.
- Physical gamepad activity was observed and changed live browser screens; full mappings/disconnect/haptics still need acceptance.
- Character-select portrait breathing uses image motion; underlying arena rigs also animate. No imported skeletal/mocap assets.
- Combat balance/animation polish are initial tuning; do not call this commercially equivalent or publishable without user acceptance.
- Eight weapons reuse several procedural attack pose families (slash/thrust/slam/punch/throw) with distinct timing/range/resources; further authored variations can improve feel.
- No online multiplayer; local player two requires the documented controls. Browser autoplay policies may require a pointer/key gesture for audio.
- Local server on 4173 may still run. Use an isolated `?keyboard-only` QA tab to avoid connected pad activity; deliver the normal URL for full controller support.
- Touch preference restored to Auto and viewport override reset after QA. Existing volume/music/difficulty preferences preserved.

## Resume instructions
Read this file first, inspect git status, and reuse/start the local server. The playable checkpoint is ready for user testing. If the user reports a problem, reproduce and fix it, then run focused regressions and update this file. Browser tab IDs are transient; use the normal URL for play and `?keyboard-only` for isolated QA. Git metadata writes require escalated execution. Do not deploy until the user explicitly confirms it works; no confirmation or remote has been received. Physical hardware and subjective quality acceptance remain pending.

## Existing checkpoints
- 5c1cc06 foundation/input
- 601750e procedural rigs
- a6e7c47 combat/HUD/match
- 88475f0 eight weapons
- 4f66cea first four interactive arenas
- 4f686b7 six modes/menus/settings
- Final checkpoint: remaining six arenas, audio/visual polish, batching/particles, pickup rotation, readable HUD/touch layouts, startup errors, README and QA handoff (see latest Git commit).
