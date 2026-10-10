# Fury Arena

A procedural 3D fighter on a 2D gameplay plane. Work in progress, implemented in phase order. See [memory.md](./memory.md) for current scope and honest test status.

## Run
With Node.js installed, run `npm start` (or `node serve.mjs`) and open http://127.0.0.1:4173. No installation or build step required. Alternatively use any static HTTP server from this folder. Opening `index.html` as `file://` will not work with ES modules.

## Controls
Move: A/D or arrows. Jump: Space. Light/heavy/kick: J/K/L or left/right/middle mouse. Guard: Shift. Dodge: Q. Grab: E. Special: R. Use/pickup: F. Drop: G. Pause: Esc. Menus: arrows and Enter, mouse, or touch.

Standard gamepad: left stick/D-pad moves, A/cross jumps and confirms, X/square light, Y/triangle heavy, RB/R1 kick, LB/L1 guard, B/circle dodge/back, LT/L2 grab, RT/R2 special, View/Share use, L3 drop, Menu/Options pause. Touch controls appear automatically on coarse-pointer devices.

## Checks
`npm test` runs deterministic movement and input regressions. Physical controller and phone validation still require hardware.

## Deploy (only after user confirmation)
Serve the repository root as a static site. All runtime imports and resources are relative and vendored. For GitHub Pages, push to a repository, choose Settings → Pages → Deploy from a branch → main / root. `.nojekyll` is included. No deployment has been performed.

## Credits
Code, interface, geometry and branding are original procedural work. Three.js 0.180.0 (MIT) is vendored under `vendor/`; see its included license. System Arial font; no remote fonts or artwork.
