# Fury Arena — authoritative handoff

## Current request and direction (2026-10-11)
User rejected obstacle collision and green 3D direction. Explicit new scope: no gameplay obstacles, detailed backgrounds, ONE fighter, 2D silhouette combat strongly inspired by supplied Shadow Fight screenshot, ancient scroll UI with black writing, deeply animated/fluid combat including ducks/jumps/dodges. One fighter is implemented as one martial artist mirrored for the opponent. Do not reintroduce weapon pickups, platforms, or selectable 3D characters. Do not deploy until user confirms the game works (original instruction remains).

## Latest revision — anatomy and strike weight
Implementation checkpoint: `c01831c` — Author anatomical strikes and align damage with visible contact. Saved locally; working tree was clean after that commit. This handoff refresh follows that checkpoint.
User reported wrong-way bending, weightless punches/kicks and bland unrealistic motion. New src/ink/motion.js authors joint rotations for each strike, with fixed-length arms, consistent elbow/knee bend sides, hip/shoulder loading, accelerating extension, re-chamber and recovery. Standing kicks keep the rear support foot planted. Collision reach and height now follow the rendered striking fist/foot. AI closes to the shorter physical reach. Head/body/leg reactions differ, with matching impact audio; ordinary broad white strike arcs were removed (spirit arcs remain). Punch/kick timings revised. Attack poses render directly without smoothing away their contact timing. Head reaction rotation fades back to neutral.

Prior paired throws and finishers remain: E / down+E throws; F / down+F finishers (50 spirit, grounded opponent <=25 HP, close range). Practice pause menu has setup shortcuts. Interpolated rendering and cached backgrounds remain.

Validation: full suite 71/71 (31 active 2D motion/combat, 40 legacy/shared), eight active modules syntax checked. Tests cover bend direction, fixed arm lengths, planted kick support, visible reach, both facing directions, plus existing throws/finishers. Motion-study contact sheets for jab/cross/kick/round were inspected in the preceding session. A fresh browser verification on resume was blocked when the browser security policy rejected binding to the existing error-page tab; no workaround attempted. Last known local server was restarted in tool session 10159 at http://127.0.0.1:4173. Session IDs and server availability are transient; verify before reusing. Subjective animation feel still needs user playtest. Save checkpoint locally only; no deployment.

## Active implementation
`index.html` now loads `src/ink/main.js`. Canvas 2D replaces Three.js entirely on the active page. `style.css` imports `ink.css`. No dependencies/build step; `npm start` serves http://127.0.0.1:4173. Earlier server session 45287 ended; use the last-known server information above. User screenshot: C:/Users/ettan/Downloads/Image 1.jpg (reference only, not used as an asset).

- `src/ink/combat.js`: InkFighter state machine, 16 move definitions (13 base moves, reaping throw and two finishers), high/low hurtboxes, guard/parry, dodge i-frames, jumps, throws, hit-confirm chains, spirit, AI, clear floor and bounds. Downed hurtboxes and reset/get-up regression added.
- `src/ink/motion.js`: authored strike rotations, phase interpolation, consistent joint solving, strike contact points and regional hit reactions.
- `src/ink/sequences.js`: paired throw/finisher grip, lift and impact timelines; one damage event, participant locking, inward wall throws and release before round completion.
- `src/ink/interpolation.js`: render snapshots between fixed simulation updates without changing combat state.
- `src/ink/rig.js`: code-authored articulated silhouette, two-bone limbs, curved tunic/head/feet/hands, sash/headband secondary motion, smoothed poses, all attack windups/contact/recovery, walk/breathe/crouch/guard/jump/fall/land/dodge/roll/hit/down/rise poses.
- `src/ink/stage.js`: Canvas renderer, two original generated backgrounds, camera, contact shadows, mist/leaves, bounded particles, afterimages, spirit strike arcs, impact rings, flashes/shake.
- `src/ink/audio.js`: pentatonic plucks, low drums, filtered noise swishes and impacts. Reuses AudioSystem primitives only.
- `src/ink/main.js`: parchment menus, duel/training/local/endurance, arena choice, HUD, pause/settings/control guide/results, input/AI integration, hit-stop.
- `ink.css`: parchment scrolls, black/brown text, vermilion seal accents; responsive HUD/menu/touch styles. No green UI.
- `assets/monastery.png`, `assets/moon.png`: original imagegen paintings copied into workspace. Each has uninterrupted floor; scenery is visual only.
- Shared `src/core/input.js` and fixed loop are reused. Old `src/main.js`, Three/vendor/world/data/UI files are retained but inactive historical reference.

## Controls
A/D or arrows move, S/down duck, Space jump, J fist (three hit-confirm chain), K palm, L kick (chains wheel kick); S+J body blow, S+L sweep, W+J or S+K rising fist; aerial J/L. Shift guard / time for parry; Q backstep or direction+Q roll; E shoulder throw, S+E reaping throw; F Silent Bell, S+F Falling Moon; R spirit (60 meter). Esc pauses. Local P2 arrows move/duck; numpad0 jump, 1/2/3 attacks, 4 dodge, 5 throw, 6 spirit, decimal finisher, right Shift guard. Standard controller: stick move/duck, A jump, X/Y/RB attacks, LB guard, B dodge, LT throw, RT spirit, View finisher, Menu pause. Touch first player; force on in settings for testing. Practice has infinite spirit and selectable still/sparring partner.

## QA / next work
- User playtest: subjective impact feel, mirrored animations, physical phone multi-touch, controller mappings and sustained performance.
- Ignored test-results/motion-study.html provides load/contact/re-chamber frame sheets and looping move preview. Earlier screenshots under test-results are historical, not proof of this revision.
- Use ?keyboard-only for browser QA to avoid connected controller input. Normal URL retains controller support.
- Earlier checkpoints: 3346869 (3D), 064e2b9 (2D rebuild), 6f396f0 (throws/finishers). Current anatomy implementation checkpoint: c01831c. Subsequent documentation commits may become HEAD without changing the game.

## Source request and verification commands
Original request attachment: `C:/Users/ettan/.codex/attachments/e969f7c8-d80f-4b02-a7b5-6a52acc8174f/Pasted text.txt`. Later direct user feedback governs the current 2D scope and animation priorities.
Run `npm test` for the complete suite; focused active tests are `tests/ink.test.js` and `tests/ink-motion.test.js`. Syntax-check all eight `src/ink/*.js` modules with `node --check`; run `git diff --check` before saving. Tests establish mechanics and mathematical constraints, not subjective animation quality. No new gameplay changes were made during this handoff refresh.

## Working rules
Read/update this file each session. Preserve new 2D direction across usage interruptions. No deployment or remote yet. Git metadata writes need escalated command permission; workspace edits do not. No agents delegated. Imagegen skill used for backgrounds; original generated copies remain under user Codex generated_images directory. New project assets copied to assets/. Use normal URL for delivery and `?keyboard-only` for QA. Controls and art documentation are in README.md.
