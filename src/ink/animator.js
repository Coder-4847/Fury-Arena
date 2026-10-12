// Turns fighter state into skeleton channels: procedural locomotion (idle, shuffle-step,
// crouch, guard, air), authored clips for actions, a crossfade between them, and a
// spring layer that makes hits, landings and weight shifts physically overshoot.
import { CHANNELS, REST, clamp, lerp, smooth, pose, blendChannels } from './skeleton.js';
import { sample, sampleAttack, LAGS, NO_LAG } from './track.js';
import { ATTACK, REACT, FALL, RISE, DODGE, THROWER, VICTIM, LYING, AIR, FALL_SETTLED } from './clips.js';
import { victimFrame } from './sequences.js';

import { RISE_TIME, DODGE_TIME } from './motion.js';
const GAIT_DISTANCE = 52, GAIT_CROUCH = 38;

// ---------------------------------------------------------------- locomotion layers
// A duck folds the torso forward rather than sinking the hips, so the head is as low as
// the hurtbox says it is while both knees still bend like a squat, not a kneel.
const CROUCH = pose({ px: -6, py: -62, lean: 30, bend: 18, head: 6, twist: 14, fx: 34, fy: 4, bx: 20, by: -6, ffx: 32, ffy: -5, bfx: -18, bfy: -7, ffa: 0, bfa: .1 });
const GUARD = { fx: 20, fy: -18, bx: 14, by: -26, lean: 4, bend: 5, head: -7, twist: 10, px: -7 };
const GUARD_DELTA = Object.fromEntries(Object.keys(GUARD).map(k => [k, GUARD[k] - REST[k]]));

const easeInOut = u => u * u * (3 - 2 * u);
function footPath(p, lo, hi, groundY, lift) {
  const swing = 0.45;
  if (p < swing) {
    const u = p / swing;
    return [lerp(lo, hi, easeInOut(u)), groundY - Math.sin(Math.PI * u) * lift, Math.sin(Math.PI * u)];
  }
  const u = (p - swing) / (1 - swing);
  return [hi - (hi - lo) * u, groundY, 0];
}
const wrap = p => ((p % 1) + 1) % 1;

function idlePose(t) {
  const breath = Math.sin(t * 2.5), bob = Math.sin(t * 9.2), sway = Math.sin(t * 1.7 + 1);
  return {
    ...REST,
    py: REST.py + bob * 1.2 + breath * 0.7,
    px: REST.px + sway * 1.3,
    lean: REST.lean + breath * 0.5 + sway * 0.6,
    bend: REST.bend + breath * 1.3,
    head: REST.head - breath * 0.5 + Math.sin(t * 1.3) * 0.8,
    fx: REST.fx + Math.sin(t * 2.3) * 1.3, fy: REST.fy - breath * 0.9 + bob * 0.8,
    bx: REST.bx + Math.sin(t * 2.1 + 1) * 1.1, by: REST.by - breath * 0.8 + bob * 0.7,
    bfa: REST.bfa + (bob * 0.5 + 0.5) * 0.1
  };
}

// A fighter's shuffle: the lead foot steps, the rear foot follows. Planted feet slide
// back at exactly the body's speed (no skating); swing feet lift, cross and replant.
function walkPose(L, crouch) {
  const D = crouch ? GAIT_CROUCH : GAIT_DISTANCE, drift = D * 0.55, half = drift / 2, amp = crouch ? 0.6 : 1;
  const dir = Math.sign(L.advance) || 1, speed = clamp(Math.abs(L.advance) / 245, 0, 1);
  const front = footPath(wrap(L.gait), 40 - half, 40 + half, -5, 16 * amp);
  const back = footPath(wrap(L.gait + 0.5), -40 - half, -40 + half, -5, 16 * amp);
  const step = Math.sin(L.gait * Math.PI * 4), sway = Math.sin(L.gait * Math.PI * 2);
  return {
    ...REST,
    ffx: front[0], ffy: front[1], ffa: -front[2] * 0.35,
    bfx: back[0], bfy: back[2] > 0 ? back[1] : -9, bfa: back[2] > 0 ? -back[2] * 0.3 : 0.25,
    py: REST.py + 1 - Math.abs(step) * 2.4 * amp,
    px: REST.px + sway * 2.2 + dir * speed * 3,
    lean: REST.lean + dir * speed * (dir > 0 ? 5 : 2.5) + Math.abs(step) * 0.8,
    bend: REST.bend + speed * 2,
    twist: REST.twist + sway * 5,
    fx: REST.fx + Math.cos(L.gait * Math.PI * 2) * 3, fy: REST.fy - Math.abs(step) * 1.2,
    bx: REST.bx - Math.cos(L.gait * Math.PI * 2) * 3, by: REST.by - Math.abs(step)
  };
}

function airPose(f, L) {
  const rise = clamp(f.vy / 680, -1, 1);
  const tuck = 1 - Math.abs(rise) * 0.55;
  const launch = smooth((rise - 0.25) / 0.75), fall = smooth((-rise - 0.15) / 0.85);
  const stretch = { ...AIR, py: -98, lean: 6, bend: 2, ffx: 36, ffy: -36, bfx: -30, bfy: -20, fx: 30, fy: -34, bx: -4, by: -38, ffa: .6, bfa: 1, head: -4 };
  const reachDown = { ...AIR, py: -94, lean: 4, bend: 6, ffx: 38, ffy: -20, bfx: -30, bfy: -12, fx: 34, fy: 10, bx: -2, by: 16, ffa: .2, bfa: .3, head: 0 };
  let c = { ...AIR };
  for (const k of CHANNELS) {
    c[k] = lerp(lerp(AIR[k], stretch[k], launch), reachDown[k], fall);
  }
  const drift = clamp(f.vx * f.facing / 245, -1, 1);
  c.lean += drift * 6; c.px += drift * 4;
  c.py += (1 - tuck) * 0;
  return c;
}

// ---------------------------------------------------------------- spring layer
const SPRING = {
  px: [20, .5], py: [24, .38], lean: [22, .34], bend: [20, .36], head: [26, .3],
  fx: [26, .36], fy: [26, .36], bx: [26, .36], by: [26, .36]
};
const SPRING_KEYS = Object.keys(SPRING);

const HIT_IMPULSE = {
  head: { head: -380, lean: -120, bend: -90, px: -60, fx: 90, fy: -70, bx: 60, by: -90, py: 24 },
  body: { lean: 160, bend: 130, head: 90, px: -70, py: 56, fx: -50, fy: 80, bx: -30, by: 90 },
  leg: { py: 150, lean: 70, px: -50, bend: 40, fy: -60, by: -60 },
  block: { lean: -48, px: -110, fx: -170, fy: 40, bx: -120, by: 30, py: 22 },
  parry: { lean: 28, px: 30, fx: 260, fy: -60, bx: 80, py: -20 },
  recoil: { lean: -150, px: -90, fx: -200, fy: -120 }
};

export class Animator {
  constructor() {
    this.loco = { walk: 0, duck: 0, guard: 0, air: 0, gait: 0, advance: 0, lastX: null, pending: false };
    this.spring = Object.fromEntries(SPRING_KEYS.map(k => [k, { x: 0, v: 0 }]));
    this.cat = null; this.from = null; this.fade = 0; this.fadeFor = 0.1;
    this.out = { ...REST }; this.fallOffset = 0; this.landed = 0;
  }

  /** Physical shove from the simulation: a hit, block, parry, landing. */
  kick(kind, power = 1) {
    const spec = HIT_IMPULSE[kind];
    if (spec) for (const k in spec) this.spring[k].v += spec[k] * power;
    else if (kind === 'land') { this.spring.py.v += 190 * power; this.spring.lean.v += 40 * power; this.spring.bend.v += 60 * power; this.spring.fy.v += 60 * power; this.spring.by.v += 80 * power; }
  }

  step(f, time, dt, wx = f.x) {
    dt = clamp(dt, 0, 1 / 20);
    const L = this.loco;
    if (L.lastX !== null && dt > 0) {
      const dx = (wx - L.lastX) * f.facing;
      if (Math.abs(dx) < 60) { L.gait += dx / (L.duck > 0.5 ? GAIT_CROUCH : GAIT_DISTANCE); L.advance += (dx / dt - L.advance) * (1 - Math.exp(-dt * 16)); }
    }
    L.lastX = wx;
    const rate = (current, target, speed) => dt > 0 ? current + (target - current) * (1 - Math.exp(-dt * speed)) : target;
    const lowGuard = f.duck || f.state === 'duck' || f.state === 'lowguard';
    L.duck = rate(L.duck, lowGuard && f.grounded ? 1 : 0, 15);
    L.guard = rate(L.guard, f.guard ? 1 : 0, 20);
    L.walk = rate(L.walk, Math.abs(L.advance) > 22 && f.grounded ? 1 : 0, 14);
    L.air = rate(L.air, f.grounded ? 0 : 1, f.grounded ? 14 : 30);

    const { cat, c } = this.base(f, time);
    let ch = c;
    if (cat !== this.cat) {
      const previous = this.cat;
      this.from = previous === null ? null : this.snapshot();
      this.fade = 0; this.fadeFor = fadeTime(previous, cat);
      if (cat === 'down' || cat === 'ko') this.fallOffset = this.lying() ? (cat === 'ko' ? .62 : FALL_SETTLED) : 0;
      this.cat = cat;
    } else if (f.clock < (this.lastClock ?? 0) - 0.015) {
      if (cat === 'down' || cat === 'ko') {
        // Struck again on the way down or on the ground: carry on from where the fall had got to.
        this.fallOffset = this.lying() ? (cat === 'ko' ? 0.62 : FALL_SETTLED) : Math.max(0, (this.fallT ?? 0) - f.clock);
      } else if (cat.startsWith('hit')) {
        // The same reaction struck again: blend from where the body is, not from the clip start.
        this.from = this.snapshot(); this.fade = 0; this.fadeFor = 0.05;
      }
    }
    this.lastClock = f.clock;
    if (this.from) {
      this.fade += dt;
      const k = this.fade / this.fadeFor;
      if (k >= 1 || dt === 0 && !this.from) this.from = null;
      else ch = blendChannels(this.from, ch, smooth(k));
    }
    ch = this.applySprings(ch, dt, cat);
    this.out = ch;
    return ch;
  }

  lying() { return this.out.rot < -60 && this.out.rot > -120 && this.out.py > -45; }
  snapshot() {
    const s = { ...this.out };
    s.rot = ((s.rot % 360) + 540) % 360 - 180;
    return s;
  }

  applySprings(ch, dt, cat) {
    const out = { ...ch };
    const weight = cat.startsWith('atk') ? 0.25 : cat.startsWith('seq') ? 0 : 1;
    for (const k of SPRING_KEYS) {
      const s = this.spring[k], [w, z] = SPRING[k];
      if (dt > 0) {
        // Semi-implicit Euler, substepped so a long frame cannot blow the spring up.
        const n = Math.ceil(dt / (1 / 120)), h = dt / n;
        for (let i = 0; i < n; i++) {
          s.v += (-w * w * s.x - 2 * z * w * s.v) * h;
          s.x += s.v * h;
        }
        s.x = clamp(s.x, -40, 40);
      }
      out[k] += s.x * weight;
    }
    return out;
  }

  /** The un-sprung, un-faded pose for the fighter's current state. */
  /** The simulation updates state in the fighter's own tick; a hit lands between ticks. */
  visualState(f) {
    if (f.sequence) return f.state;
    if (f.health <= 0) return 'ko';
    if (f.stun > 0) return f.knocked ? 'down' : 'hit';
    if (f.state === 'attack' && !f.attack) return 'idle';
    return f.state;
  }

  base(f, time) {
    const state = this.visualState(f);
    if (f.sequence) return this.grapple(f);
    if (state === 'attack' && f.attack) {
      return { cat: 'atk:' + f.attack.key, c: sampleAttack(ATTACK[f.attack.m.pose] || ATTACK.palm, f.attack.m, f.attack.t) };
    }
    if (state === 'hit') {
      const kind = REACT[f.reaction] ? f.reaction : 'head';
      const total = Math.max(0.12, f.stunTotal || 0.3);
      return { cat: 'hit:' + kind, c: sample(REACT[kind], clamp(f.clock / total, 0, 1), NO_LAG) };
    }
    if (state === 'down') {
      const kind = f.reaction === 'leg' ? 'swept' : 'back';
      this.fallT = f.clock + this.fallOffset;
      return { cat: 'down', c: sample(FALL[kind], this.fallT) };
    }
    if (state === 'ko') { this.fallT = f.clock + this.fallOffset; return { cat: 'ko', c: sample(FALL.ko, this.fallT) }; }
    if (state === 'rise') return { cat: 'rise', c: sample(RISE, clamp(f.clock / RISE_TIME, 0, 1)) };
    if (state === 'dodge') {
      const roll = f.dodgeDir === f.facing;
      return { cat: roll ? 'dodge:roll' : 'dodge:back', c: sample(DODGE[roll ? 'roll' : 'back'], clamp(f.clock / DODGE_TIME, 0, 1)) };
    }
    return { cat: 'loco', c: this.locomotion(f, time) };
  }

  locomotion(f, time) {
    const L = this.loco;
    let c = idlePose(time);
    if (L.walk > 0.001) {
      const walk = walkPose(L, L.duck > 0.5);
      c = blendChannels(c, walk, L.walk);
    }
    if (L.duck > 0.001) {
      const base = walkAtCrouch(L, time);
      c = blendChannels(c, base, L.duck);
    }
    if (L.guard > 0.001) for (const k in GUARD_DELTA) c[k] += GUARD_DELTA[k] * L.guard;
    if (L.air > 0.001) c = blendChannels(c, airPose(f, L), L.air);
    if (f.grounded && f.landTime > 0 && this.landed !== f.landTime) {
      // Landing absorb as a slow dip layered on the spring impulse.
      const u = 1 - f.landTime / 0.16;
      const dip = Math.sin(clamp(u, 0, 1) * Math.PI) * 5 * (f.landPower ?? 1);
      c.py -= -dip; c.lean += dip * .6; c.bend += dip * .8;
    }
    return c;
  }

  grapple(f) {
    const s = f.sequence, t = f.sequenceTime ?? s.t, victim = s.b.id === f.id;
    const kind = s.kind;
    if (!victim) return { cat: `seq:${kind}:a`, c: sample(THROWER[kind] || THROWER.throw, t, NO_LAG) };
    return { cat: `seq:${kind}:v`, c: victimPose(s, t) };
  }
}

function walkAtCrouch(L, time) {
  const speedBlend = clamp(Math.abs(L.advance) / 85, 0, 1) * L.walk;
  const idle = { ...CROUCH, py: CROUCH.py + Math.sin(time * 2.5) * 0.8, bend: CROUCH.bend + Math.sin(time * 2.5) * 1 };
  if (speedBlend < 0.01) return idle;
  const w = walkPose(L, true);
  const out = { ...idle };
  for (const k of ['ffx', 'ffy', 'ffa', 'bfx', 'bfy', 'bfa']) out[k] = lerp(idle[k], idle[k] + (w[k] - REST[k]), speedBlend);
  out.py += (w.py - REST.py) * speedBlend * 0.5;
  return out;
}

function fadeTime(from, to) {
  if (!from) return 0.08;
  if (to.startsWith('atk')) return from === 'loco' ? 0.07 : 0.05;
  if (to.startsWith('hit')) return 0.055;
  if (to === 'down' || to === 'ko') return 0.07;
  if (to === 'rise') return 0.06;
  if (to.startsWith('dodge')) return 0.05;
  if (to.startsWith('seq')) return 0.08;
  if (from.startsWith('atk')) return 0.1;
  if (from.startsWith('hit')) return 0.14;
  if (from.startsWith('dodge')) return 0.12;
  return 0.1;
}

// The thrown body: carried by the sim, rotated and limp here. Impact is when it lands.
function victimPose(s, t) {
  const frame = victimFrame(s, t);
  const c = sample(VICTIM.ragdoll, clamp(frame.u, 0, 1), NO_LAG);
  if (frame.landed) {
    const k = smooth((t - frame.impact) / 0.16);
    const out = blendChannels({ ...c, ...frame.hold, rot: -90 }, { ...LYING, px: -14 }, k);
    out.py += Math.sin(Math.PI * clamp((t - frame.impact) / 0.3, 0, 1)) * -14;
    return out;
  }
  return { ...c, ...frame.hold, rot: frame.rot, py: c.py + (frame.lift || 0) };
}

export function groundContact(f) { return f.y <= 0.5; }
export { LAGS, NO_LAG };
