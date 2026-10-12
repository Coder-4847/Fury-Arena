const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
export const FINISH_THRESHOLD = 25;
export function canFinish(a, b) { return a.health > 0 && b.health > 0 && b.health <= FINISH_THRESHOLD && a.ink >= 50 && a.grounded && b.grounded && !a.sequence && !b.sequence; }

export const IMPACT = { throw: 0.8, reap: 0.67, finish: 1.5, finishLow: 1.5 };
const GRIP = 0.22;

/**
 * Where the thrown body is, in front of the thrower, at time t: offset along the throw
 * direction, height above the floor, and roll in degrees (+ forward over the shoulder).
 * The simulation moves the victim along this path and the rig animates the same one.
 */
export function trajectory(kind, t) {
  if (kind === 'throw') {
    if (t < 0.2) return { x: 48, y: 0, rot: 0 };
    if (t < 0.45) { const k = smooth((t - 0.2) / 0.25); return { x: lerp(48, 12, k), y: lerp(0, 34, k), rot: lerp(0, 80, k) }; }
    if (t < 0.8) { const u = (t - 0.45) / 0.35; return { x: lerp(12, 160, smooth(u)), y: lerp(34, 0, u) + Math.sin(u * Math.PI) * 84, rot: lerp(80, 270, smooth(u)) }; }
    return { x: 160, y: 0, rot: -90 };
  }
  if (kind === 'reap') {
    if (t < 0.2) return { x: 48, y: 0, rot: 0 };
    if (t < 0.4) { const k = smooth((t - 0.2) / 0.2); return { x: lerp(48, 56, k), y: lerp(0, 24, k), rot: lerp(0, -34, k) }; }
    if (t < 0.67) { const u = (t - 0.4) / 0.27; return { x: lerp(56, 122, smooth(u)), y: lerp(24, 0, u * u), rot: lerp(-34, -90, smooth(u)) }; }
    return { x: 122, y: 0, rot: -90 };
  }
  if (kind === 'finish') {
    if (t < GRIP) return { x: 48, y: 0, rot: 0 };
    if (t < 0.7) { const k = smooth((t - GRIP) / 0.48); return { x: lerp(48, 18, k), y: lerp(0, 104, k), rot: lerp(0, -82, k) }; }
    if (t < 1.1) { const k = smooth((t - 0.7) / 0.4); return { x: lerp(18, 8, k), y: lerp(104, 114, k), rot: lerp(-82, -104, k) }; }
    if (t < 1.5) { const u = (t - 1.1) / 0.4; return { x: lerp(8, 150, smooth(u)), y: lerp(114, 0, u * u), rot: lerp(-104, -90, u) }; }
    return { x: 150, y: 0, rot: -90 };
  }
  // finishLow: the Falling Moon, thrower and victim leave the ground together.
  if (t < GRIP) return { x: 48, y: 0, rot: 0 };
  if (t < 0.55) { const k = smooth((t - GRIP) / 0.33); return { x: lerp(48, 24, k), y: lerp(0, 58, k), rot: lerp(0, 60, k) }; }
  if (t < 1.5) { const u = (t - 0.55) / 0.95; return { x: lerp(24, 128, smooth(u)), y: lerp(58, 0, u) + Math.sin(u * Math.PI) * 52, rot: lerp(60, 270, smooth(u)) }; }
  return { x: 128, y: 0, rot: -90 };
}

/** Pose-side description of the victim's flight (used by the animator). */
export function victimFrame(s, t) {
  const impact = IMPACT[s.kind] ?? 0.8, start = s.kind === 'reap' ? 0.2 : GRIP;
  const tr = trajectory(s.kind, t);
  return { u: (t - start) / (impact - start), rot: tr.rot, lift: 0, landed: t >= impact, impact, hold: {} };
}

export function beginSequence(a, b, kind, emit = () => {}) {
  if (a.sequence || b.sequence || !a.grounded || !b.grounded || b.invuln > 0 || Math.abs(a.x - b.x) > 105) return false;
  const finish = kind === 'finish' || kind === 'finishLow';
  if (finish && !canFinish(a, b)) return false;
  const direction = a.x > 310 ? -1 : a.x < -310 ? 1 : a.facing, origin = clamp(a.x, -460, 460);
  a.facing = direction;
  const s = { a, b, kind, finish, t: 0, prevT: 0, duration: finish ? 1.9 : 1.15, origin, direction, startA: a.x, startB: b.x, impacted: false };
  for (const f of [a, b]) { f.sequence = s; f.attack = null; f.vx = f.vy = 0; f.guard = f.duck = false; f.stun = 0; f.clock = 0; }
  a.state = 'throwing'; b.state = 'captured'; if (finish) a.ink -= 50;
  emit({ type: 'grapple', a, b, name: kind === 'finish' ? 'THE SILENT BELL' : kind === 'finishLow' ? 'FALLING MOON' : kind === 'reap' ? 'REAPING THROW' : 'SHOULDER THROW' });
  return true;
}

export function stepSequences(fighters, dt, emit = () => {}) {
  for (const a of fighters) {
    const s = a.sequence;
    if (!s || s.a !== a) continue;
    const b = s.b;
    s.prevT = s.t; s.t = Math.min(s.duration, s.t + dt);
    const t = s.t, d = s.direction, settle = smooth(t / 0.2);
    a.x = lerp(s.startA, s.origin, settle);
    const tr = trajectory(s.kind, t);
    // Grip first: the victim is drawn in to the grappler, then follows the throw path.
    b.x = t < 0.2 ? lerp(s.startB, s.origin + d * 48, settle) : s.origin + d * tr.x;
    b.y = t < 0.2 ? 0 : tr.y;
    a.y = s.kind === 'finishLow' && t > 0.55 && t < 1.5 ? Math.sin((t - 0.55) / 0.95 * Math.PI) * 85 : 0;
    const impact = IMPACT[s.kind];
    if (t >= impact && !s.impacted) {
      s.impacted = true;
      const damage = s.finish ? b.health : s.kind === 'reap' ? 12 : 16;
      b.health = Math.max(0, b.health - damage);
      b.y = 0; b.hitFlash = 0.1; b.knocked = true;
      a.ink = clamp(a.ink + 8, 0, 100); b.ink = clamp(b.ink + 4, 0, 100);
      emit({ type: 'slam', a, b, hy: 15, damage, move: { damage, cost: s.finish ? 50 : 0, name: s.finish ? 'Finisher' : 'Throw' } });
    }
    if (s.impacted) b.y = 0;
    a.grounded = a.y === 0; b.grounded = b.y === 0;
    if (t >= s.duration) {
      a.sequence = b.sequence = null; a.state = 'idle'; a.clock = 0; b.clock = 0.8;
      b.state = b.health <= 0 ? 'ko' : 'down'; b.stun = b.health <= 0 ? 0 : 0.55; b.invuln = 0.3; b.y = 0; b.grounded = true; b.vx = 0;
      a.px = a.x; b.px = b.x; a.py = a.y; b.py = b.y; a.renderPrevious = b.renderPrevious = null;
      if (b.health <= 0) emit({ type: 'ko', a, b });
    }
  }
}
