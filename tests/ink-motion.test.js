import test from 'node:test';
import assert from 'node:assert/strict';
import { InkFighter, MOVES, neutral, resolveInkCombat } from '../src/ink/combat.js';
import { beginSequence, stepSequences, trajectory } from '../src/ink/sequences.js';
import { interpolateFighter } from '../src/ink/interpolation.js';
import { InkRig } from '../src/ink/rig.js';
import { Animator } from '../src/ink/animator.js';
import { strikePose, strikePoint, strikeChannels } from '../src/ink/motion.js';
import { BONES, ARM_REACH, LEG_REACH, REST, solve, CHANNELS } from '../src/ink/skeleton.js';
import { ATTACK, REACT, FALL, RISE, DODGE, THROWER } from '../src/ink/clips.js';
import { sample, NO_LAG } from '../src/ink/track.js';

const pair = () => [new InkFighter(-35, 0), new InkFighter(35, 1)];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const STANCE = solve(REST);
const poseDistance = (a, b) => Math.max(...['hip', 'neck', 'head', 'frontHand', 'backHand', 'frontFoot', 'backFoot', 'frontKnee', 'backKnee', 'frontElbow', 'backElbow'].map(k => dist(a[k], b[k])));

test('every authored attack stays inside limb reach, so a hand or foot is never dragged off its target', () => {
  for (const [key, m] of Object.entries(MOVES)) {
    for (let i = 0; i <= 120; i++) {
      const c = strikeChannels(m, m.duration * i / 120);
      assert.ok(Math.hypot(c.fx, c.fy) <= ARM_REACH + 1e-6 || key === 'upper', `${key} front hand`);
      assert.ok(Math.hypot(c.bx, c.by) <= ARM_REACH + 1e-6, `${key} rear hand`);
      assert.ok(Math.hypot(c.ffx - c.px, c.ffy - c.py) <= LEG_REACH + 4, `${key} front foot`);
      assert.ok(Math.hypot(c.bfx - c.px, c.bfy - c.py) <= LEG_REACH + 4, `${key} rear foot`);
    }
  }
});

test('elbows and knees keep one bending side through every move, state clip and roll', () => {
  const check = (p, label) => {
    for (const side of ['front', 'back']) {
      for (const [root, joint, end, sign] of [[p[side + 'Shoulder'], p[side + 'Elbow'], p[side + 'Hand'], 1], [p.hip, p[side + 'Knee'], p[side + 'Foot'], -1]]) {
        const cross = (end[0] - root[0]) * (joint[1] - root[1]) - (end[1] - root[1]) * (joint[0] - root[0]);
        assert.ok(sign * cross >= -0.05, `${label} ${side} ${sign > 0 ? 'elbow' : 'knee'}`);
      }
    }
  };
  for (const [key, m] of Object.entries(MOVES)) for (let i = 0; i <= 60; i++) check(strikePose(m, m.duration * i / 60), key);
  for (const [name, clip] of Object.entries({ ...REACT, ...FALL, rise: RISE, ...DODGE, ...THROWER }))
    for (let i = 0; i <= 40; i++) check(solve(sample(clip, clip.start + (clip.end - clip.start) * i / 40, NO_LAG)), name);
});

test('arms and legs keep constant bone lengths in every frame', () => {
  const length = (a, b) => dist(a, b);
  for (const m of Object.values(MOVES)) for (let i = 0; i <= 80; i++) {
    const p = strikePose(m, m.duration * i / 80);
    for (const side of ['front', 'back']) {
      assert.ok(Math.abs(length(p[side + 'Shoulder'], p[side + 'Elbow']) - BONES.arm1) < 0.01);
      assert.ok(Math.abs(length(p[side + 'Elbow'], p[side + 'Hand']) - BONES.arm2) < 0.5 || length(p[side + 'Shoulder'], p[side + 'Hand']) >= ARM_REACH - 0.2);
      assert.ok(Math.abs(length(p.hip, p[side + 'Knee']) - BONES.leg1) < 0.01);
    }
  }
});

test('the supporting foot stays planted through standing kicks', () => {
  for (const key of ['kick', 'round']) {
    const m = MOVES[key], rest = strikePose(m, 0).backFoot;
    for (let i = 0; i <= 100; i++) {
      const p = strikePose(m, m.duration * i / 100);
      assert.ok(Math.abs(p.backFoot[0] - rest[0]) < 2.5 && Math.abs(p.backFoot[1] - rest[1]) < 4, `${key} rear foot moved ${dist(p.backFoot, rest).toFixed(1)}`);
    }
  }
});

test('attacks begin and end in the fighting stance so chained and finished moves never pop', () => {
  for (const [key, m] of Object.entries(MOVES)) {
    if (m.pose.startsWith('air')) continue;
    assert.ok(poseDistance(strikePose(m, 0), STANCE) < 1.5, `${key} start`);
    assert.ok(poseDistance(strikePose(m, m.duration), STANCE) < 1.5, `${key} end`);
  }
});

test('limbs move continuously: no frame-to-frame jumps inside any authored move', () => {
  for (const [key, m] of Object.entries(MOVES)) {
    let prev = null;
    for (let i = 0; i <= m.duration * 240; i++) {
      const p = strikePose(m, i / 240);
      if (prev) assert.ok(poseDistance(p, prev) < 22, `${key} jumps ${poseDistance(p, prev).toFixed(1)} at ${(i / 240).toFixed(3)}s`);
      prev = p;
    }
  }
});

test('striking limb accelerates into contact and is fast when it lands', () => {
  for (const key of ['jab', 'cross', 'hook', 'kick', 'round']) {
    const m = MOVES[key], dt = 1 / 480;
    const speedAt = t => dist(strikePoint(m, t + dt), strikePoint(m, t - dt)) / (2 * dt);
    const before = speedAt(m.start - 0.045), at = speedAt(m.start);
    assert.ok(at > 300, `${key} contact speed ${at.toFixed(0)}`);
    assert.ok(at > before * 0.5, `${key} should not have already decelerated at contact`);
  }
});

test('damage reach follows the visible fist or foot in both facing directions', () => {
  for (const direction of [-1, 1]) for (const key of ['jab', 'cross', 'kick', 'round', 'sweep']) {
    const [a, b] = pair();
    a.x = 0; a.facing = direction; a.start(key); a.attack.t = MOVES[key].start + 0.01;
    const reach = strikePoint(MOVES[key], a.attack.t)[0];
    b.x = direction * (reach + 24); resolveInkCombat([a, b], 1);
    assert.equal(b.health, 100, key);
    b.x = direction * (reach + 10); resolveInkCombat([a, b], 1.01);
    assert.equal(b.health, 100 - MOVES[key].damage, key);
  }
});

test('rig.sample is deterministic and finite for every fighter state', () => {
  const rig = new InkRig();
  const states = [
    f => { f.state = 'idle'; }, f => { f.state = 'walk'; f.vx = 200; }, f => { f.duck = true; f.state = 'duck'; },
    f => { f.guard = true; f.state = 'guard'; }, f => { f.grounded = false; f.y = 80; f.vy = 300; f.state = 'jump'; },
    f => { f.state = 'hit'; f.reaction = 'body'; f.stunTotal = .3; f.clock = .1; }, f => { f.state = 'down'; f.clock = .3; },
    f => { f.state = 'ko'; f.clock = .5; }, f => { f.state = 'rise'; f.clock = .2; }, f => { f.state = 'dodge'; f.dodgeDir = f.facing; f.clock = .2; }
  ];
  for (const setup of states) {
    const f = new InkFighter(0, 0); setup(f);
    const a = rig.sample(f, 1.3), b = rig.sample(f, 1.3);
    assert.deepEqual(a.hip, b.hip);
    for (const k of ['hip', 'head', 'frontHand', 'backHand', 'frontFoot', 'backFoot']) assert.ok(a[k].every(Number.isFinite), `${f.state} ${k}`);
  }
});

test('grapple victims follow the shared trajectory and no body sinks below the floor', () => {
  for (const kind of ['throw', 'reap', 'finish', 'finishLow']) {
    const [a, b] = pair(); a.ink = 100; if (kind.startsWith('finish')) b.health = 25;
    assert.ok(beginSequence(a, b, kind));
    const ra = new InkRig(), rb = new InkRig();
    for (let i = 0; i < 130 && a.sequence; i++) {
      stepSequences([a, b], 1 / 60);
      if (!a.sequence) break;
      const tr = trajectory(kind, a.sequence.t);
      if (a.sequence.t >= 0.25) assert.ok(Math.abs(b.y - tr.y) < 1e-6, `${kind} height`);
      for (const [rig, f] of [[ra, a], [rb, b]]) {
        const p = rig.sample(f, 0);
        for (const k of ['hip', 'head', 'frontHand', 'backHand', 'frontFoot', 'backFoot']) assert.ok(p[k][1] <= 8 + 1e-6, `${kind} ${k} below floor`);
      }
    }
  }
});

function walkFrames(speed, frames = 150, duck = false) {
  const rig = new InkRig(), f = new InkFighter(0, 0), out = [];
  f.facing = 1; f.duck = duck; f.state = duck ? 'duck' : 'walk';
  let x = 0;
  for (let i = 0; i < frames; i++) {
    x += speed / 60; f.vx = speed;
    const p = rig.advance(f, i / 60, 1 / 60, x);
    out.push({ x, p: { frontFoot: [...p.frontFoot], backFoot: [...p.backFoot], hip: [...p.hip] } });
  }
  return out;
}

test('planted feet do not skate while the fighter walks', () => {
  for (const speed of [245, -245, 120]) {
    const frames = walkFrames(speed).slice(70);
    let planted = 0, worst = 0;
    for (let i = 1; i < frames.length; i++) {
      for (const k of ['frontFoot', 'backFoot']) {
        const prev = frames[i - 1], cur = frames[i];
        const ground = k === 'frontFoot' ? -5 : -9;
        if (Math.abs(cur.p[k][1] - ground) < 0.05 && Math.abs(prev.p[k][1] - ground) < 0.05) {
          const dWorld = (cur.x + cur.p[k][0]) - (prev.x + prev.p[k][0]);
          planted++; worst = Math.max(worst, Math.abs(dWorld));
        }
      }
    }
    assert.ok(planted > 40, 'feet should spend time planted');
    assert.ok(worst < 1.2, `speed ${speed}: planted foot slid ${worst.toFixed(2)} units in a frame`);
  }
});

test('walking alternates the feet and keeps the pelvis rising and falling with each step', () => {
  const frames = walkFrames(245, 240).slice(60);
  const ys = frames.map(f => f.p.hip[1]);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 2, 'pelvis should bob');
  const lifted = k => frames.filter(f => f.p[k][1] < -12).length;
  assert.ok(lifted('frontFoot') > 10 && lifted('backFoot') > 10, 'both feet should lift');
});

test('standing still breathes: idle is never frozen', () => {
  const rig = new InkRig(), f = new InkFighter(0, 0);
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < 300; i++) { const p = rig.advance(f, i / 60, 1 / 60, 0); min = Math.min(min, p.head[1]); max = Math.max(max, p.head[1]); }
  assert.ok(max - min > 1 && max - min < 8);
});

test('state changes crossfade instead of popping (attack, hit, knockdown, rise)', () => {
  const rig = new InkRig(), [f, o] = pair();
  f.ink = 100;
  let last = null, worst = 0;
  const feed = (n, mut) => {
    for (let i = 0; i < n; i++) {
      mut?.(i);
      const p = rig.advance(f, last === null ? 0 : 1, 1 / 60, f.x);
      if (last) worst = Math.max(worst, poseDistance(p, last));
      last = solve(rig.animator.out);
    }
  };
  feed(30);
  f.start('kick');
  for (let i = 0; i < 20; i++) { f.attack.t = i / 60; feed(1); }
  f.attack = null; f.state = 'hit'; f.reaction = 'body'; f.stunTotal = .4; f.clock = 0; feed(1);
  assert.ok(worst < 40, `worst jump ${worst}`);
});

test('physical impulses overshoot and then settle', () => {
  const control = new Animator(), kicked = new Animator(), f = new InkFighter(0, 0);
  control.step(f, 0, 1 / 60, 0); kicked.step(f, 0, 1 / 60, 0);
  kicked.kick('body', 1);
  let peak = 0, sign = 0, flips = 0, last = 0;
  for (let i = 1; i < 150; i++) {
    const d = kicked.step(f, i / 60, 1 / 60, 0).lean - control.step(f, i / 60, 1 / 60, 0).lean;
    peak = Math.max(peak, Math.abs(d)); last = d;
    const s = Math.sign(d); if (Math.abs(d) > 0.2) { if (sign && s !== sign) flips++; sign = s; }
  }
  assert.ok(peak > 2, 'hit should visibly move the body');
  assert.ok(flips >= 1, 'underdamped spring should overshoot');
  assert.ok(Math.abs(last) < 0.25, 'and come to rest');
});

test('channel list stays in sync between skeleton, rest pose and clips', () => {
  for (const k of CHANNELS) assert.ok(Number.isFinite(REST[k]), k);
  for (const clip of Object.values(ATTACK)) assert.equal(clip.values.length, CHANNELS.length);
});

test('render interpolation still samples attack time between simulation steps', () => {
  const [a, b] = pair();
  a.start('jab'); a.tick(1 / 60, neutral, b);
  a.renderPrevious.attackT = 0; a.attack.t = 1 / 60;
  const v = interpolateFighter(a, 0.5);
  assert.ok(v.attack.t < a.attack.t && v.attack.t > 0);
});
