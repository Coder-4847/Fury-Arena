// Keyframe tracks. Every channel is a monotone cubic Hermite curve through the keys, so
// velocity stays continuous through a pose (no stop-start at each key) yet a curve never
// overshoots unless a key was authored to. Channels may be sampled at different times
// (see LAG) so the pelvis leads, the shoulders follow and the hands arrive last.
import { CHANNELS, REST, clamp } from './skeleton.js';

const N = CHANNELS.length;
// Hands are interpolated as (angle, reach) about their shoulder, so an arm swings through
// an arc instead of dragging its hand in a straight line through the body.
const POLAR = [[CHANNELS.indexOf('fx'), CHANNELS.indexOf('fy')], [CHANNELS.indexOf('bx'), CHANNELS.indexOf('by')]];

// Seconds a channel trails the clip clock. Negative values run ahead of it.
// Hips drive, the spine unwinds after them, the head is the last thing to catch up.
export const LAG = {
  px: -0.035, py: -0.03, lean: -0.022, bend: -0.01, twist: -0.018, head: 0.035,
  fx: 0, fy: 0, bx: 0, by: 0,
  ffx: -0.02, ffy: -0.02, bfx: -0.02, bfy: -0.02, ffa: -0.01, bfa: -0.01, rot: -0.01
};
const LAGS = CHANNELS.map(k => LAG[k] || 0);
const NO_LAG = CHANNELS.map(() => 0);
export { LAGS, NO_LAG };

function tangents(times, values, scale) {
  const n = times.length, m = new Array(n).fill(0);
  if (n < 3) return m;
  const h = [], d = [];
  for (let i = 0; i < n - 1; i++) { h[i] = times[i + 1] - times[i]; d[i] = (values[i + 1] - values[i]) / h[i]; }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]) * scale[i];
  }
  return m;
}

/**
 * keys: [[time, pose, tension?], ...]; poses are full channel objects (see skeleton.pose).
 * tension 1 = normal, >1 drives harder through the key, 0 stops dead on it.
 */
export function compile(keys) {
  const sorted = [...keys].sort((a, b) => a[0] - b[0]);
  const times = sorted.map(k => k[0]);
  const scale = sorted.map(k => k[2] ?? 1);
  const values = CHANNELS.map(ch => sorted.map(k => k[1][ch] ?? REST[ch]));
  for (const [ix, iy] of POLAR) {
    let previous = null;
    for (let k = 0; k < times.length; k++) {
      const x = values[ix][k], y = values[iy][k];
      let angle = Math.atan2(y, x);
      if (previous !== null) { while (angle - previous > Math.PI) angle -= 2 * Math.PI; while (angle - previous < -Math.PI) angle += 2 * Math.PI; }
      values[ix][k] = previous = angle;
      values[iy][k] = Math.hypot(x, y);
    }
  }
  const slopes = CHANNELS.map((_, i) => tangents(times, values[i], scale));
  return { times, values, slopes, start: times[0], end: times[times.length - 1] };
}

function raw(clip, i, t) {
  const { times, values, slopes } = clip, n = times.length;
  if (t <= times[0]) return values[i][0];
  if (t >= times[n - 1]) return values[i][n - 1];
  let k = 0;
  while (k < n - 2 && t > times[k + 1]) k++;
  const h = times[k + 1] - times[k], u = (t - times[k]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * values[i][k] + (u3 - 2 * u2 + u) * h * slopes[i][k] +
    (-2 * u3 + 3 * u2) * values[i][k + 1] + (u3 - u2) * h * slopes[i][k + 1];
}

function polar(out, clip, at) {
  for (const [ix, iy] of POLAR) {
    const a = raw(clip, ix, at(ix)), r = raw(clip, iy, at(iy));
    out[CHANNELS[ix]] = Math.cos(a) * r;
    out[CHANNELS[iy]] = Math.sin(a) * r;
  }
}
const isPolar = i => POLAR.some(p => p.includes(i));

/** Sample a clip at time t (the clip's own units), with optional per-channel lag. */
export function sample(clip, t, lags = LAGS) {
  const out = {}, at = i => t - lags[i];
  for (let i = 0; i < N; i++) if (!isPolar(i)) out[CHANNELS[i]] = raw(clip, i, at(i));
  polar(out, clip, at);
  return out;
}

/**
 * Attack clips are authored in seconds measured from the moment of contact: the first
 * key sits at -(wind-up), the last at +(recovery). Real moves are stretched onto that
 * timeline in two halves, so retiming a move never moves its contact pose. The kinetic
 * chain lag fades in over the first moments and out over the last, so a move always
 * begins and ends exactly in the stance it was authored from.
 */
export function sampleAttack(clip, move, t, lags = LAGS) {
  const out = {}, pre = -clip.start / Math.max(0.001, move.start), post = clip.end / Math.max(0.001, move.duration - move.start);
  const edge = clamp(Math.min(t, move.duration - t) / 0.06, 0, 1), fade = edge * edge * (3 - 2 * edge);
  const at = i => {
    const s = t - lags[i] * fade - move.start;
    return s < 0 ? s * pre : s * post;
  };
  for (let i = 0; i < N; i++) if (!isPolar(i)) out[CHANNELS[i]] = raw(clip, i, at(i));
  polar(out, clip, at);
  return out;
}
