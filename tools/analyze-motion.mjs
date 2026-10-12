// Dev report for authored motion: reach clamping, floor lifting and speed peaks.
//   node tools/analyze-motion.mjs [name]
import { MOVES } from '../src/ink/combat.js';
import { strikeChannels, strikePose, strikePoint } from '../src/ink/motion.js';
import { ARM_REACH, LEG_REACH, solve } from '../src/ink/skeleton.js';
import { sample, NO_LAG } from '../src/ink/track.js';
import { REACT, FALL, RISE, DODGE, THROWER } from '../src/ink/clips.js';

const only = process.argv[2];
const HZ = 240, KICK = ['kick', 'round', 'sweep', 'airkick'];
const over = c => Math.max(Math.hypot(c.fx, c.fy) - ARM_REACH, Math.hypot(c.bx, c.by) - ARM_REACH, Math.hypot(c.ffx - c.px, c.ffy - c.py) - LEG_REACH, Math.hypot(c.bfx - c.px, c.bfy - c.py) - LEG_REACH);

function report(name, duration, channelsAt, point) {
  let clamp = 0, lift = 0, peak = 0, peakAt = 0, prev = null;
  for (let i = 0; i <= duration * HZ; i++) {
    const t = i / HZ, c = channelsAt(t), p = solve(c);
    clamp = Math.max(clamp, over(c)); lift = Math.max(lift, p.lift);
    if (point) { const q = point(t); if (prev) { const v = Math.hypot(q[0] - prev[0], q[1] - prev[1]) * HZ; if (v > peak) { peak = v; peakAt = t; } } prev = q; }
  }
  const flag = (clamp > 0.5 ? ' CLAMP' : '') + (lift > 1 ? ' LIFT' : '');
  console.log(`${name.padEnd(14)} clamp=${clamp.toFixed(1).padStart(5)} lift=${lift.toFixed(1).padStart(5)}${point ? ` peak=${peak.toFixed(0)}u/s@${peakAt.toFixed(2)}` : ''}${flag}`);
}
for (const [key, m] of Object.entries(MOVES)) {
  if (only && key !== only) continue;
  const c = strikePoint(m, m.start);
  report(key, m.duration, t => strikeChannels(m, t), t => strikePoint(m, t));
  console.log(`   contact (${c[0].toFixed(0)}, ${c[1].toFixed(0)}) at ${m.start}s`);
}
const states = { ...Object.fromEntries(Object.entries(REACT).map(([k, v]) => ['react.' + k, [v, 1]])), ...Object.fromEntries(Object.entries(FALL).map(([k, v]) => ['fall.' + k, [v, v.end]])), rise: [RISE, 1], ...Object.fromEntries(Object.entries(DODGE).map(([k, v]) => ['dodge.' + k, [v, 1]])), ...Object.fromEntries(Object.entries(THROWER).map(([k, v]) => ['thrower.' + k, [v, v.end]])) };
for (const [name, [clip, dur]] of Object.entries(states)) {
  if (only && !name.includes(only)) continue;
  report(name, dur, t => sample(clip, t, NO_LAG));
}

// Per-key detail for a state clip: node tools/analyze-motion.mjs rise --keys
if (process.argv.includes('--keys')) {
  for (const [name, [clip]] of Object.entries(states)) {
    if (only && !name.includes(only)) continue;
    clip.times.forEach((t, i) => {
      const c = {}; ['px','py','lean','bend','head','twist','fx','fy','bx','by','ffx','ffy','bfx','bfy','ffa','bfa','rot'].forEach((k, j) => c[k] = clip.values[j][i]);
      const p = solve(c);
      console.log(`${name} t=${t.toFixed(2)} over=${over(c).toFixed(1)} lift=${p.lift.toFixed(1)}`);
    });
  }
}
