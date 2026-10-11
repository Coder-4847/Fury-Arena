# Fury Arena

A procedural 3D arena fighter on a 2D plane. Two fighters, ten arenas, eight weapons, six modes. Plain JavaScript and locally vendored Three.js; no install or build step. Current QA status and remaining work are in [memory.md](./memory.md).

## Play locally
Run `npm start` (or `node serve.mjs`), then open http://127.0.0.1:4173 in a browser with WebGL 2. Do not open index.html directly. The default server is accessible only on this computer.

For a phone on the same Wi-Fi, run `node serve.mjs --host 0.0.0.0 --port 4174` and open `http://YOUR-COMPUTER-LAN-IP:4174` on the phone. Stop that server with Ctrl+C when finished. Graphics and touch options are in Settings. Touch controls can be forced on for hybrid devices.

## Controls
| Action | Keyboard / mouse | Standard gamepad |
|---|---|---|
| Move / navigate | A/D or arrows | Left stick / D-pad |
| Jump / climb / crouch | Space / W or up / S or down | A/cross / stick up / stick down |
| Light / heavy / kick | J/K/L; mouse left/right/middle | X/square / Y/triangle / RB/R1 |
| Guard / dodge / grab or interact | Shift / Q / E | LB/L1 / B/circle / LT/L2 |
| Special / alternate special | R / up or down + R | RT/R2 / stick up or down + RT/R2 |
| Pick up or use / throw / drop | F / G / down + G | View/Share / L3 / down + L3 |
| Pause / back / confirm | Escape / Backspace / Enter | Menu/Options / B/circle / A/cross |

Light attacks chain on hit during recovery. Specials cost 50 or 40 Fury. Stand near marked arena props and interact; hold up beside a platform to climb. Touch has labeled action buttons; its jump button also climbs beside a platform. Hold down + Fury for the alternate special, down + Drop to place a weapon.

Local player 2 uses arrows, numpad 0 jump, 1/2/3 attacks, 4 dodge, 5 grab/interact, 6 special, decimal pickup, divide throw/drop, right Shift guard. Or connect two standard gamepads. Local versus requires a keyboard or second gamepad for player 2.

## Modes
Versus CPU and Local Versus are best of three. Survival has five waves and restores 25 health between wins. Weapon Rush drops a weapon every two seconds. Last Standing gives three lives and the winner carries their remaining health. Training has unlimited Fury, no timer, automatic resets, and idle/guard/attack partner settings in Pause.

## Checks
`npm test` covers input, movement, combat, equipment, map interactions, all ten AI arena simulations, mode rules, and geometry batching. It does not replace physical gamepad, multi-touch, audio or phone performance testing. Add `?keyboard-only` to the local URL for reproducible keyboard/touch QA without connected-controller input affecting that tab.

## GitHub Pages — wait for confirmation
No deployment has been performed. Once the user confirms the game works, push this repository to the agreed GitHub repository and publish its root from the chosen branch in Pages settings. The local branch is currently `master`; no remote has been configured. `.nojekyll`, relative imports, local dependencies, favicon and metadata are already included. No build command, service, API key or CDN is required.

## Credits
Original procedural geometry, branding, interface and WebAudio synthesis. Three.js 0.180.0, MIT: see [vendor/THREE-LICENSE.txt](./vendor/THREE-LICENSE.txt). System Arial font. No external art, music or font assets.
