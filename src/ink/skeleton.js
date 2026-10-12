// Articulated side-view skeleton. Fighter-local space: +X points toward the opponent,
// the floor is y = 0 and "up" is negative y (canvas convention).
//
// A pose is a flat set of scalar channels. Hands are authored relative to their shoulder
// so a leaning or twisting torso carries the arms; feet are authored in floor space so
// they stay planted while the pelvis moves. Elbows and knees solve with a fixed bend
// side, so a limb can never fold the wrong way.
const RAD = Math.PI / 180;

export const BONES = {
  waist: 23, chest: 34, head: 23,
  shoulderDrop: 6, shoulderHalf: 10,
  arm1: 34, arm2: 33,
  leg1: 50, leg2: 48,
  foot: 15, heel: 4
};
export const ARM_REACH = BONES.arm1 + BONES.arm2 - 0.2;
export const LEG_REACH = BONES.leg1 + BONES.leg2 - 0.2;

// px,py   pelvis position            lean  lower-spine angle (deg, + forward)
// bend    chest flex over the waist  head  head tilt on the neck
// twist   shoulder-line turn (+ lead shoulder forward, - rear shoulder forward)
// fx,fy   lead hand from its shoulder        bx,by  rear hand from its shoulder
// ffx,ffy lead ankle in floor space          bfx,bfy rear ankle
// ffa,bfa foot pitch (rad, + toes down)      rot   whole-body roll about the waist (deg, + clockwise)
// stick   0..1: pull a floating body down onto the floor (rolls, falls, lying)
// While rot is far from 0, foot targets are read in the un-rolled frame, i.e. hanging
// below the pelvis; the roll then carries them round with the body.
export const CHANNELS = ['px', 'py', 'lean', 'bend', 'head', 'twist', 'fx', 'fy', 'bx', 'by', 'ffx', 'ffy', 'bfx', 'bfy', 'ffa', 'bfa', 'rot', 'stick'];

export const REST = {
  px: -4, py: -88, lean: 7, bend: 3, head: 2, twist: 14,
  fx: 31, fy: -6, bx: 22, by: -11,
  ffx: 40, ffy: -5, bfx: -40, bfy: -9,
  ffa: 0, bfa: 0.25, rot: 0, stick: 0
};

export const pose = changes => ({ ...REST, ...changes });
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function blendChannels(a, b, t) {
  const out = {};
  for (const k of CHANNELS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/** Two-bone solver. `bend` picks the side the middle joint sits on and never flips. */
export function solveJoint(a, b, l1, l2, bend) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.1));
  const angle = Math.atan2(dy, dx);
  const q = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return [a[0] + Math.cos(angle + q * bend) * l1, a[1] + Math.sin(angle + q * bend) * l1];
}

function reach(root, target, length) {
  const dx = target[0] - root[0], dy = target[1] - root[1], d = Math.hypot(dx, dy);
  return d > length ? [root[0] + dx / d * length, root[1] + dy / d * length] : target;
}

/** Resolve channels into joint positions. Every joint is in fighter-local space. */
export function solve(c, { grounded = true } = {}) {
  const B = BONES;
  const hip = [c.px, c.py];
  const a1 = c.lean * RAD, a2 = (c.lean + c.bend) * RAD, a3 = (c.lean + c.bend + c.head) * RAD;
  const waist = [hip[0] + Math.sin(a1) * B.waist, hip[1] - Math.cos(a1) * B.waist];
  const neck = [waist[0] + Math.sin(a2) * B.chest, waist[1] - Math.cos(a2) * B.chest];
  const head = [neck[0] + Math.sin(a3) * B.head, neck[1] - Math.cos(a3) * B.head];
  const up = [Math.sin(a2), -Math.cos(a2)], fwd = [Math.cos(a2), Math.sin(a2)];
  const span = Math.sin(c.twist * RAD) * B.shoulderHalf;
  const root = [neck[0] - up[0] * B.shoulderDrop, neck[1] - up[1] * B.shoulderDrop];
  const frontShoulder = [root[0] + fwd[0] * (span + 2), root[1] + fwd[1] * (span + 2)];
  const backShoulder = [root[0] - fwd[0] * (span + 2), root[1] - fwd[1] * (span + 2)];
  const frontHand = reach(frontShoulder, [frontShoulder[0] + c.fx, frontShoulder[1] + c.fy], ARM_REACH);
  const backHand = reach(backShoulder, [backShoulder[0] + c.bx, backShoulder[1] + c.by], ARM_REACH);
  const frontFoot = reach(hip, [c.ffx, c.ffy], LEG_REACH);
  const backFoot = reach(hip, [c.bfx, c.bfy], LEG_REACH);
  const p = {
    hip, waist, neck, head, headAngle: a3,
    frontShoulder, backShoulder, frontHand, backHand,
    frontElbow: solveJoint(frontShoulder, frontHand, B.arm1, B.arm2, 1),
    backElbow: solveJoint(backShoulder, backHand, B.arm1, B.arm2, 1),
    frontFoot, backFoot,
    frontKnee: solveJoint(hip, frontFoot, B.leg1, B.leg2, -1),
    backKnee: solveJoint(hip, backFoot, B.leg1, B.leg2, -1),
    frontFootAngle: c.ffa, backFootAngle: c.bfa, rot: c.rot, spine: [a1, a2]
  };
  if (c.rot) rotate(p, waist, c.rot * RAD);
  p.lift = floor(p, grounded, c.stick || 0);
  p.frontToe = toe(p.frontFoot, p.frontFootAngle);
  p.backToe = toe(p.backFoot, p.backFootAngle);
  return p;
}

const JOINTS = ['hip', 'waist', 'neck', 'head', 'frontShoulder', 'backShoulder', 'frontElbow', 'backElbow', 'frontHand', 'backHand', 'frontKnee', 'backKnee', 'frontFoot', 'backFoot'];
function rotate(p, pivot, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (const k of JOINTS) {
    const x = p[k][0] - pivot[0], y = p[k][1] - pivot[1];
    p[k] = [pivot[0] + x * cos - y * sin, pivot[1] + x * sin + y * cos];
  }
  p.headAngle += angle;
  p.frontFootAngle += angle;
  p.backFootAngle += angle;
}

// Keep the body on top of the ground whenever it rolls or lies down.
const RADII = { hip: 11, waist: 10, neck: 7, head: 11, frontElbow: 5, backElbow: 5, frontHand: 6, backHand: 6, frontKnee: 7, backKnee: 7, frontFoot: 5, backFoot: 5 };
function floor(p, grounded, stick) {
  if (!grounded) return 0;
  let low = -Infinity;
  for (const k in RADII) low = Math.max(low, p[k][1] + RADII[k]);
  const shift = low > 0.001 ? low : low < 0 ? low * stick : 0;
  if (Math.abs(shift) < 0.001) return 0;
  for (const k of JOINTS) p[k] = [p[k][0], p[k][1] - shift];
  return Math.max(0, shift);
}
function toe(foot, angle) {
  return [foot[0] + Math.cos(angle) * BONES.foot, foot[1] + Math.sin(angle) * BONES.foot];
}
