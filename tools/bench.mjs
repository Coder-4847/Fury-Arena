import { InkRig } from '../src/ink/rig.js';
import { InkFighter } from '../src/ink/combat.js';
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const rigs = [new InkRig(), new InkRig()], fs = [new InkFighter(-100, 0), new InkFighter(100, 1)];
fs[0].ink = 100;
const N = 6000, t0 = performance.now();
for (let i = 0; i < N; i++) {
  if (i % 90 === 0) fs[0].start(['jab', 'kick', 'round', 'palm'][(i / 90 | 0) % 4]);
  if (fs[0].attack) fs[0].attack.t = (i % 90) / 60 * 0.8;
  for (const k of [0, 1]) rigs[k].draw(ctx, fs[k], fs[k].x, 0, 1, i / 60, 1 / 60, false, false);
}
const ms = performance.now() - t0;
console.log(`${(ms / N / 2 * 1000).toFixed(0)} µs per fighter-frame (rig step + solve + paint calls, stub canvas)`);
