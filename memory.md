# Fury Arena — authoritative handoff

## Current request and direction (2026-10-11)
User rejected obstacle collision and green 3D direction. Explicit new scope: no gameplay obstacles, detailed backgrounds, ONE fighter, 2D silhouette combat strongly inspired by supplied Shadow Fight screenshot, ancient scroll UI with black writing, deeply animated/fluid combat including ducks/jumps/dodges. One fighter is implemented as one martial artist mirrored for the opponent. Do not reintroduce weapon pickups, platforms, or selectable 3D characters. Do not deploy until user confirms the game works (original instruction remains).

## Active implementation
`index.html` now loads `src/ink/main.js`. Canvas 2D replaces Three.js entirely on the active page. `style.css` imports `ink.css`. No dependencies/build step; `npm start` serves http://127.0.0.1:4173. Existing server may still run in tool session 45287. User screenshot: C:/Users/ettan/Downloads/Image 1.jpg (reference only, not used as an asset).

- `src/ink/combat.js`: InkFighter state machine, 13 data-driven attacks, high/low hurtboxes, guard/parry, dodge i-frames, jumps, throws, hit-confirm chains, spirit, AI, clear floor and bounds. Downed hurtboxes and reset/get-up regression added.
- `src/ink/rig.js`: code-authored articulated silhouette, two-bone limbs, curved tunic/head/feet/hands, sash/headband secondary motion, smoothed poses/facing, all attack windups/contact/recovery, walk/breathe/crouch/guard/jump/fall/land/dodge/roll/hit/down/rise poses.
- `src/ink/stage.js`: Canvas renderer, two original generated backgrounds, camera, contact shadows, mist/leaves, bounded particles, afterimages, strike arcs, impact rings, flashes/shake.
- `src/ink/audio.js`: pentatonic plucks, low drums, filtered noise swishes and impacts. Reuses AudioSystem primitives only.
- `src/ink/main.js`: parchment menus, duel/training/local/endurance, arena choice, HUD, pause/settings/control guide/results, input/AI integration, hit-stop.
- `ink.css`: parchment scrolls, black/brown text, vermilion seal accents; responsive HUD/menu/touch styles. No green UI.
- `assets/monastery.png`, `assets/moon.png`: original imagegen paintings copied into workspace. Each has uninterrupted floor; scenery is visual only.
- Shared `src/core/input.js` and fixed loop are reused. Old `src/main.js`, Three/vendor/world/data/UI files are retained but inactive historical reference.

## Controls
A/D or arrows move, S/down duck, Space jump, J fist (three hit-confirm chain), K palm, L kick (chains wheel kick); S+J body blow, S+L sweep, W+J or S+K rising fist; aerial J/L. Shift guard / time for parry; Q backstep or direction+Q roll; E close throw; R spirit (60 meter). Local P2 arrows + numpad0/1/2/3/4/5/6 and right Shift. Standard controller mapping inherited. Touch first player; force on in settings for testing. Practice has infinite spirit and selectable still/sparring partner.

## QA / next work
- New focused tests: 17 passed (duck/high vs low, guards/sweep, parry, dodge, one-hit contacts, trades, throws, meter, jumping, bounds, crossing, all attack recovery, knockdown/reset and downed hurtbox).
- Final full suite: 57 passed (40 legacy/shared + 17 new 2D tests). All five new modules pass syntax/local-import checks. Real jump-over traversal, connected-only chains and seeded sparring through KO are covered.
- Browser title/parchment design, arena select, both background images and fighting HUD render successfully with no error/warning logs. Animation announcement was accidentally restarted every update; fixed using a cached message before changing innerHTML.
- Browser hidden tab heavily throttles animation. Visible tab switched on for motion testing; temporary desktop/portrait/landscape viewport overrides used and reset for delivery. Touch defaults to Auto in the fresh game. QA tab `?keyboard-only` avoids connected controller interference.
- Desktop/390×844 portrait/844×390 landscape layouts inspected. Touch jab verified through the live input path (state becomes attack); focus-loss pause/resume verified. Portrait camera zooms closer and the floor remains clear. Final previews saved under ignored test-results/shadow-chronicles-title.jpg and shadow-chronicles-gameplay.jpg. Rebuild ready for user playtest; see latest Git checkpoint. Earlier 3D commit 3346869 is the recovery point.
- Real physical phone multi-touch, full controller mapping, sustained performance, and subjective combat/animation quality need user playtest. Do not claim commercial equivalence.

## Working rules
Read/update this file each session. Preserve new 2D direction across usage interruptions. No deployment or remote yet. Git metadata writes need escalated command permission; workspace edits do not. No agents delegated. Imagegen skill used for backgrounds; original generated copies remain under user Codex generated_images directory. New project assets copied to assets/. Use normal URL for delivery and `?keyboard-only` for QA. Controls and art documentation are in README.md.
