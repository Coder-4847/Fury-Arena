# Fury Arena — The Shadow Chronicles

A 2D silhouette martial arts game, rebuilt around one fighter and precise unarmed combat. The opponent uses the same fighter. Detailed painted scenery sits behind a completely clear, flat fighting floor.

## Play locally

Run `npm start`, then open http://127.0.0.1:4173. No install or build step is needed; Node runs the static server. Do not open index.html directly. All assets are local.

For a phone on the same trusted Wi-Fi, use `node serve.mjs --host 0.0.0.0 --port 4174`, then open your computer's LAN address on port 4174. Landscape is recommended. Physical phone and controller acceptance remains a user playtest item.

## Fighting arts

| Action | Keyboard | Standard controller |
|---|---|---|
| Move / duck | A D / S (or arrows) | Stick / down |
| Jump | Space | A |
| Fist / palm / kick | J / K / L | X / Y / RB |
| Guard / timed parry | Shift | LB |
| Backstep / directional roll | Q / direction + Q | B / direction + B |
| Shoulder / reaping throw | E / down + E | LT / down + LT |
| Silent Bell / Falling Moon finisher | F / down + F | View / down + View |
| Spirit strike (60 spirit) | R | RT |
| Pause | Esc | Menu |

Tap J again during a connected strike's recovery to chain straight → cross → turning palm. Chain L after a connected front kick for a wheel kick. Down + J is a body blow; down + L sweeps; up + J or down + K is a rising fist. Jump + J/L performs aerial strikes. High punches and wheel kicks miss a duck. Sweeps beat standing guard; crouch-guard counters them. Guard just before impact to parry. Throws beat guard at close range. Shoulder throws and reaping throws carry the opponent through a linked grip, lift and slam, with damage on landing. Finishers require 50 spirit and a grounded opponent at 25 health or less, within close range; F performs The Silent Bell and down + F performs Falling Moon. In practice, pause and choose **Practice throws** or **Practice finishers** to set up the move immediately. Dodge invulnerability is brief and ends before recovery finishes.

Player two: arrows move/duck, numpad 0 jump, 1/2/3 attacks, 4 dodge, 5 throw, 6 spirit, right Shift guard, numpad decimal finisher; or a second standard gamepad. Touch supports the first player; enable it in Settings if necessary.

## Contents

- One animated shadow martial artist, mirrored opponent.
- Thirteen base attacks plus a second throw and two finishers, with move-specific wind-up, contact and recovery poses; footwork, breathing, turning, crouching, jumping, falling, landing compression, guards, rolls, backsteps, stagger, knockdown and recovery.
- Two original painted sanctuaries: Monastery of Ash and The Moon Garden.
- Duels (best of three), practice (infinite spirit; still/sparring partner), local two-player, and endurance trials.
- Interpolated high-refresh movement, distance-driven planted walking steps, constrained limb reach, shorter light-hit stops, cached background rendering; Canvas 2D rendering, drifting leaves and fog, contact shadows, strike trails, afterimages, impact rings, particles, hit-stop and camera shake.
- Parchment-and-ink interface; procedural pentatonic music, drums, swishes and impact sounds.

## Development

Active entry: `src/ink/main.js`. Combat logic: `src/ink/combat.js`. Paired throw/finisher timelines: `src/ink/sequences.js`. Render interpolation: `src/ink/interpolation.js`. Animated silhouette rig: `src/ink/rig.js`. Scenery/effects: `src/ink/stage.js`. Audio: `src/ink/audio.js`. Styles: `ink.css`. Input/fixed loop reuse the shared core modules.

`npm test` runs the suite, including dedicated 2D combat regressions. The prior 3D implementation and its tests remain as an inactive historical reference; the current page does not import Three.js or the old world/maps/weapons. Do not confuse those legacy tests with validation of the new game.

## Art and release

Backgrounds are original AI-generated project assets. Fighter silhouettes and motion are code-authored. The supplied screenshot informed composition and mood; no game UI or character sprites were extracted from it. Legacy vendored Three.js retains its MIT license and is not loaded by the 2D version.

Deployment remains pending user playtest confirmation, as requested. GitHub Pages can serve this folder directly: all paths are relative, with no external font or runtime dependencies. No deployment has occurred.
