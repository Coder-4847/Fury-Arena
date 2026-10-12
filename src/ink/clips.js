// Authored motion. Each key is a full pose written as changes from the fighting stance.
// Attack clips are in seconds from the moment of contact (negative = wind-up).
// State clips use their own unit, noted per clip. Hands are relative to the shoulder,
// feet are in floor space, so reading a key is reading the pose.
import { pose, REST } from './skeleton.js';
import { compile } from './track.js';

const G = REST;
const key = (t, changes, tension) => [t, pose(changes), tension];

// Ground attacks start and end in the fighting stance; air attacks in the airborne tuck.
function attack(pre, post, keys, home = G) {
  const list = keys.map(k => key(...k));
  if (!keys.some(k => k[0] <= -pre)) list.push([-pre, pose(home)]);
  if (!keys.some(k => k[0] >= post)) list.push([post, pose(home)]);
  return compile(list);
}
const clip = keys => compile(keys.map(k => key(...k)));

export const AIR = {
  px: -6, py: -92, lean: 10, bend: 10, head: 0, twist: 8,
  fx: 22, fy: -12, bx: 10, by: -14,
  ffx: 30, ffy: -46, bfx: -26, bfy: -34, ffa: .3, bfa: .5, rot: 0
};

export const ATTACK = {
  // Lead fist: sink and cock, snap through with the shoulder, recoil quicker than it left.
  jab: attack(.10, .26, [
    [-.055, { px: -8, lean: 4, bend: 2, twist: 4, fx: 16, fy: -1, bx: 20, by: -12, head: 3, ffx: 38 }],
    [-.025, { px: 0, lean: 9, twist: 20, fx: 38, fy: -4, bx: 20, by: -13, ffx: 43, head: -2 }, 1.2],
    [0, { px: 5, py: -86, lean: 14, bend: 5, twist: 28, fx: 52, fy: -3, bx: 18, by: -14, ffx: 47, head: -5 }, 1.8],
    [.04, { px: 8, py: -86, lean: 16, bend: 6, twist: 31, fx: 66, fy: -3, bx: 17, by: -14, ffx: 49, head: -5 }],
    [.1, { px: 2, lean: 10, twist: 20, fx: 44, fy: -6, bx: 21, by: -12, ffx: 44, head: -1 }],
    [.19, { px: -3, lean: 8, twist: 15, fx: 34, fy: -6 }]
  ]),
  // Rear fist: hips rotate, rear heel pivots, weight drives into the front leg.
  cross: attack(.13, .29, [
    [-.08, { px: -10, lean: 3, bend: 1, twist: -8, fx: 30, fy: -8, bx: 14, by: -6, bfx: -42, bfy: -8, bfa: .5, head: 3 }],
    [-.03, { px: 2, lean: 10, twist: -24, fx: 26, fy: -8, bx: 34, by: -9, ffx: 42, bfx: -34, bfy: -12, bfa: .9, head: -1 }, 1.3],
    [0, { px: 9, py: -85, lean: 15, bend: 6, twist: -32, fx: 22, fy: -8, bx: 53, by: -3, ffx: 46, bfx: -31, bfy: -13, bfa: 1, head: -5 }, 1.7],
    [.05, { px: 12, py: -85, lean: 18, bend: 7, twist: -35, fx: 22, fy: -8, bx: 65, by: -3, ffx: 46, bfx: -30, bfy: -13, bfa: 1, head: -6 }],
    [.12, { px: 6, lean: 12, twist: -18, fx: 28, fy: -8, bx: 44, by: -8, bfx: -34, bfy: -10, bfa: .7 }],
    [.21, { px: 0, lean: 8, twist: 0, bx: 28, by: -11, bfx: -38, bfa: .4 }]
  ]),
  // Turning palm: the lead arm loads behind the head and whips round through the body turn.
  hook: attack(.16, .34, [
    [-.1, { px: -12, lean: 0, bend: 0, twist: -22, fx: -4, fy: -24, bx: 28, by: -10, ffx: 38, bfx: -44, head: 6, py: -86 }],
    [-.04, { px: -2, lean: 8, bend: 3, twist: 6, fx: 20, fy: -22, bx: 28, by: -10, bfx: -38, bfy: -11, bfa: .7, head: 2 }, 1.2],
    [0, { px: 13, py: -85, lean: 17, bend: 6, twist: 32, fx: 50, fy: -2, bx: 24, by: -12, ffx: 46, bfx: -31, bfy: -12, bfa: .9, head: -8 }, 1.7],
    [.05, { px: 17, py: -85, lean: 21, bend: 8, twist: 42, fx: 56, fy: 14, bx: 22, by: -12, ffx: 46, bfx: -30, bfy: -12, bfa: .9, head: -8 }],
    [.15, { px: 8, lean: 13, twist: 24, fx: 40, fy: 8, bx: 24, by: -10, bfx: -34 }],
    [.26, { px: 0, lean: 8, twist: 12, fx: 32, fy: -4 }]
  ]),
  // Body blow: drop under the guard, drive the fist up into the ribs.
  low: attack(.12, .26, [
    [-.07, { px: -14, py: -70, lean: 10, bend: 8, head: 8, twist: 0, fx: 22, fy: 10, bx: 20, by: -4, ffx: 42, bfx: -46 }],
    [-.025, { px: -4, py: -62, lean: 22, bend: 12, head: 10, twist: 14, fx: 46, fy: 20, bx: 18, by: -6, ffx: 46, bfx: -42 }, 1.3],
    [0, { px: 3, py: -58, lean: 26, bend: 14, head: 8, twist: 22, fx: 52, fy: 20, bx: 14, by: -8, ffx: 49, bfx: -40, bfy: -9 }, 1.6],
    [.05, { px: 6, py: -58, lean: 28, bend: 14, head: 8, twist: 25, fx: 61, fy: 24, bx: 14, by: -8, ffx: 50, bfx: -40 }],
    [.12, { px: -4, py: -64, lean: 16, bend: 10, head: 6, twist: 12, fx: 42, fy: 14, ffx: 44, bfx: -42 }]
  ]),
  // Iron palm: a stepping, whole-body drive. Long coil, a step, then both palms thrown.
  palm: attack(.23, .39, [
    [-.15, { px: -14, py: -80, lean: -2, bend: 0, twist: -10, fx: 18, fy: -2, bx: 22, by: 2, ffx: 38, bfx: -46, bfy: -8, head: 4 }],
    [-.07, { px: -6, py: -78, lean: 8, bend: 4, twist: -2, fx: 18, fy: 4, bx: 24, by: 2, ffx: 52, ffy: -10, bfx: -42, bfy: -9 }, 1.2],
    [-.025, { px: 8, py: -82, lean: 18, bend: 8, twist: 10, fx: 48, fy: -6, bx: 40, by: -2, ffx: 62, ffy: -5, bfx: -32, bfy: -10, bfa: .8 }, 1.4],
    [0, { px: 14, py: -83, lean: 21, bend: 9, twist: 12, fx: 54, fy: -6, bx: 46, by: -2, ffx: 63, bfx: -28, bfy: -12, bfa: 1, head: -6 }, 1.6],
    [.07, { px: 19, py: -83, lean: 25, bend: 11, twist: 15, fx: 65, fy: -6, bx: 56, by: -2, ffx: 64, bfx: -26, bfy: -12, bfa: 1, head: -6 }],
    [.2, { px: 12, py: -84, lean: 18, bend: 8, twist: 10, fx: 50, fy: -2, bx: 44, by: 0, ffx: 60, bfx: -30 }],
    [.31, { px: 4, lean: 12, twist: 14, fx: 38, ffx: 48, bfx: -36 }]
  ]),
  // Rising fist: sink, then explode upward through the legs and the whole arm.
  upper: attack(.19, .44, [
    [-.1, { px: -14, py: -66, lean: 12, bend: 10, head: 8, twist: 6, fx: 8, fy: 36, bx: 22, by: -4, ffx: 42, bfx: -46 }],
    [-.04, { px: -4, py: -78, lean: 12, bend: 6, head: 2, twist: 18, fx: 22, fy: 8, bx: 20, by: -8, ffx: 44, bfx: -42, bfy: -10 }, 1.4],
    [0, { px: 5, py: -92, lean: 9, bend: 2, head: -3, twist: 22, fx: 46, fy: -12, bx: 18, by: -14, ffx: 46, ffy: -5, bfx: -35, bfy: -15, bfa: 1 }, 1.8],
    [.05, { px: 8, py: -96, lean: 6, bend: -3, head: -7, twist: 26, fx: 46, fy: -50, bx: 16, by: -14, ffx: 46, bfx: -34, bfy: -19, bfa: 1.2 }],
    [.16, { px: 4, py: -90, lean: 8, bend: 0, twist: 18, fx: 38, fy: -34, bfy: -14, bfa: .8 }],
    [.3, { px: -2, py: -86, lean: 8, twist: 12, fx: 30, fy: -14 }]
  ]),
  // Front kick: chamber the knee, snap the shin, support leg rises onto the ball of the foot.
  kick: attack(.20, .42, [
    [-.13, { px: -8, py: -90, lean: -6, bend: 0, twist: 0, fx: 34, fy: -8, bx: 14, by: -10, ffx: 24, ffy: -58, ffa: .9, bfx: -42, bfy: -7, bfa: .1 }],
    [-.06, { px: -6, py: -93, lean: -10, bend: -2, twist: 0, fx: 40, fy: -10, bx: 0, by: -8, ffx: 36, ffy: -72, ffa: .4, bfx: -42, bfy: -6, bfa: .1 }, 1.3],
    [0, { px: -3, py: -94, lean: -14, bend: -3, head: -4, twist: -4, fx: 40, fy: -12, bx: -6, by: -4, ffx: 70, ffy: -91, ffa: -.4, bfx: -42, bfy: -6, bfa: .15 }, 1.7],
    [.045, { px: -2, py: -95, lean: -17, bend: -4, head: -4, twist: -4, fx: 40, fy: -12, bx: -6, by: -4, ffx: 86, ffy: -100, ffa: -.5, bfx: -42, bfy: -6, bfa: .15 }],
    [.1, { px: -5, py: -92, lean: -12, bend: -2, ffx: 62, ffy: -78, ffa: .1, bfx: -42, bfy: -6 }],
    [.18, { px: -6, py: -90, lean: -6, ffx: 28, ffy: -58, ffa: .8 }],
    [.3, { px: -4, py: -88, lean: 2, ffx: 40, ffy: -26, ffa: .4 }]
  ]),
  // Wheel kick: lean away, whip the leg round and up, spine bows back for the height.
  round: attack(.28, .46, [
    [-.18, { px: -10, py: -90, lean: -4, bend: 0, twist: -14, fx: 28, fy: -10, bx: 10, by: -12, ffx: 28, ffy: -50, ffa: .8, bfx: -42, bfy: -6, bfa: .1 }],
    [-.1, { px: -8, py: -94, lean: -10, bend: -3, twist: -22, fx: 24, fy: 0, bx: -10, by: -26, ffx: 38, ffy: -86, ffa: .6, bfx: -42, bfy: -6, bfa: .2 }],
    [-.03, { px: -2, py: -96, lean: -17, bend: -6, twist: -8, fx: 18, fy: 14, bx: -18, by: -30, ffx: 62, ffy: -118, ffa: .2, bfx: -42, bfy: -6, bfa: .2 }, 1.4],
    [0, { px: 3, py: -97, lean: -22, bend: -9, head: -4, twist: 8, fx: 14, fy: 20, bx: -22, by: -30, ffx: 68, ffy: -122, ffa: -.3, bfx: -42, bfy: -6, bfa: .2 }, 1.6],
    [.05, { px: 3, py: -97, lean: -23, bend: -9, head: -4, twist: 10, fx: 14, fy: 20, bx: -22, by: -30, ffx: 81, ffy: -136, ffa: -.3, bfx: -42, bfy: -6, bfa: .2 }],
    [.14, { px: -4, py: -95, lean: -16, bend: -5, twist: -4, ffx: 46, ffy: -100, ffa: .5 }],
    [.26, { px: -8, py: -92, lean: -7, twist: -10, ffx: 28, ffy: -56, ffa: .8 }],
    [.36, { px: -5, py: -89, lean: 3, ffx: 38, ffy: -24, ffa: .3 }]
  ]),
  // Reaping sweep: fold on the rear leg, shoot the lead leg out along the floor.
  sweep: attack(.23, .43, [
    [-.14, { px: -14, py: -66, lean: 6, bend: 6, head: 6, twist: 6, fx: 30, fy: 6, bx: 4, by: 14, ffx: 40, ffy: -5, bfx: -46, bfy: -6, bfa: .3 }],
    [-.06, { px: -4, py: -60, lean: -8, bend: 0, head: 4, twist: 14, fx: 40, fy: 4, bx: -10, by: 26, ffx: 56, ffy: -8, bfx: -44, bfy: -6, bfa: .2 }, 1.2],
    [0, { px: 8, py: -57, lean: -20, bend: -2, head: -6, twist: 22, fx: 40, fy: 2, bx: -30, by: 30, ffx: 76, ffy: -9, ffa: -.2, bfx: -46, bfy: -6, bfa: .1 }, 1.6],
    [.05, { px: 9, py: -57, lean: -21, bend: -2, head: -6, twist: 24, fx: 40, fy: 2, bx: -30, by: 30, ffx: 91, ffy: -8, ffa: -.2, bfx: -46, bfy: -6 }],
    [.14, { px: 0, py: -58, lean: -14, bend: 0, ffx: 64, ffy: -8, bfx: -44 }],
    [.27, { px: -8, py: -60, lean: -2, ffx: 46, ffy: -6, bfx: -44 }]
  ]),
  // Falling fist: drop the shoulder through the tuck, fist leading.
  airjab: attack(.10, .30, [
    [-.05, { ...AIR, lean: 6, bend: 4, fx: 20, fy: -10, ffx: 28 }],
    [0, { ...AIR, px: 0, lean: 16, bend: 6, twist: 26, fx: 52, fy: 4, bx: 16, by: -12, ffy: -40, ffx: 32 }, 1.7],
    [.05, { ...AIR, px: 2, lean: 20, bend: 8, twist: 32, fx: 65, fy: 8, bx: 16, by: -12, ffy: -40, ffx: 32 }],
    [.15, { ...AIR, lean: 12, fx: 40, fy: -4 }]
  ], AIR),
  // Flying side kick: torso tips back, lead leg drives out, trailing leg stays folded.
  airkick: attack(.13, .45, [
    [-.07, { ...AIR, lean: -4, bend: 0, ffx: 26, ffy: -48, bfx: -16, bfy: -38 }],
    [0, { ...AIR, px: -4, py: -94, lean: -20, bend: -6, head: -2, twist: -8, fx: 40, fy: -6, bx: -20, by: -4, ffx: 70, ffy: -70, ffa: -.4, bfx: -22, bfy: -34, bfa: .6, rot: -10 }, 1.6],
    [.08, { ...AIR, px: -4, py: -94, lean: -20, bend: -6, head: -2, twist: -8, fx: 40, fy: -6, bx: -20, by: -4, ffx: 84, ffy: -78, ffa: -.4, bfx: -22, bfy: -34, bfa: .6, rot: -10 }],
    [.2, { ...AIR, lean: -8, ffx: 44, ffy: -56 }]
  ], AIR),
  // Grab: both hands reach for the collar. The paired sequence takes over at contact.
  throw: attack(.20, .56, [
    [-.1, { px: -10, py: -82, lean: 6, bend: 4, twist: 4, fx: 28, fy: 0, bx: 26, by: 2, ffx: 42, bfx: -42 }],
    [0, { px: 8, py: -78, lean: 20, bend: 10, twist: 16, fx: 54, fy: 6, bx: 50, by: 10, ffx: 48, bfx: -34, head: -4 }, 1.2],
    [.1, { px: 8, py: -78, lean: 20, bend: 10, twist: 16, fx: 54, fy: 6, bx: 50, by: 10, ffx: 48, bfx: -34, head: -4 }]
  ]),
  // Spirit strike: gather low, then release both palms in one wave.
  special: attack(.29, .63, [
    [-.2, { px: -14, py: -74, lean: 4, bend: 6, twist: -12, fx: 16, fy: 18, bx: 12, by: 18, ffx: 40, bfx: -50, bfy: -8, head: 6 }],
    [-.1, { px: -12, py: -72, lean: 0, bend: 4, twist: -16, fx: 10, fy: 20, bx: 6, by: 20, ffx: 38, bfx: -52, bfy: -8, head: 6 }],
    [-.03, { px: 4, py: -80, lean: 18, bend: 10, twist: 8, fx: 46, fy: -4, bx: 40, by: 0, ffx: 56, ffy: -6, bfx: -34, bfy: -10, bfa: .8 }, 1.4],
    [0, { px: 16, py: -83, lean: 22, bend: 11, twist: 12, fx: 54, fy: -4, bx: 52, by: -2, ffx: 65, bfx: -26, bfy: -13, bfa: 1.1, head: -8 }, 1.5],
    [.19, { px: 22, py: -83, lean: 26, bend: 12, twist: 15, fx: 66, fy: -4, bx: 64, by: -2, ffx: 66, bfx: -24, bfy: -13, bfa: 1.1, head: -8 }],
    [.4, { px: 12, py: -84, lean: 16, bend: 8, twist: 10, fx: 46, fy: 0, bx: 40, by: 2, ffx: 58, bfx: -32 }]
  ])
};
ATTACK.reap = ATTACK.throw;
ATTACK.finish = ATTACK.palm;
ATTACK.finishLow = ATTACK.sweep;

// Hit reactions run over the stun time (0..1). The peak lands early, then the body
// finds its feet again; a physical spring layer adds the jolt on top (see animator).
export const REACT = {
  head: clip([
    [0, {}],
    [.28, { px: -13, py: -84, lean: -15, bend: -10, head: -30, twist: -8, fx: 10, fy: -26, bx: 4, by: -30, ffx: 44, bfx: -46, bfy: -8 }],
    [.5, { px: -11, py: -85, lean: -11, bend: -7, head: -20, twist: -5, fx: 16, fy: -20, bx: 10, by: -24, ffx: 43, bfx: -45 }],
    [.78, { px: -6, py: -87, lean: -2, bend: 0, head: -6, twist: 6, fx: 27, fy: -9, bx: 19, by: -13 }],
    [1, {}]
  ]),
  body: clip([
    [0, {}],
    [.28, { px: -12, py: -78, lean: 27, bend: 18, head: 12, twist: 4, fx: 8, fy: 26, bx: 4, by: 30, ffx: 42, bfx: -46, bfy: -8 }],
    [.5, { px: -10, py: -79, lean: 24, bend: 15, head: 10, twist: 5, fx: 11, fy: 21, bx: 8, by: 24, ffx: 42, bfx: -45 }],
    [.78, { px: -6, py: -84, lean: 13, bend: 8, head: 4, twist: 8, fx: 24, fy: 4, bx: 16, by: 0 }],
    [1, {}]
  ]),
  leg: clip([
    [0, {}],
    [.28, { px: -14, py: -66, lean: 12, bend: 8, head: 4, twist: -4, fx: 20, fy: -14, bx: 10, by: -14, ffx: 30, ffy: -12, bfx: -50, bfy: -7 }],
    [.5, { px: -13, py: -67, lean: 12, bend: 7, head: 4, twist: -2, fx: 22, fy: -12, bx: 12, by: -13, ffx: 34, ffy: -7, bfx: -50 }],
    [.78, { px: -8, py: -80, lean: 8, bend: 4, twist: 8 }],
    [1, {}]
  ]),
  // The attacker's arm is thrown wide when a parry turns the strike aside.
  recoil: clip([
    [0, {}],
    [.3, { px: -12, py: -85, lean: -11, bend: -5, head: -10, twist: -14, fx: 10, fy: -30, bx: 0, by: -26, ffx: 38, bfx: -46, bfy: -8 }],
    [.62, { px: -9, py: -85, lean: -6, bend: -2, head: -4, twist: -6, fx: 16, fy: -22, bx: 6, by: -18 }],
    [1, {}]
  ])
};

// Poses that roll the body keep their feet "hanging" below the pelvis in the un-rolled
// frame; hang() writes those targets from the pelvis position.
const hang = (px, py, front = [14, 78], back = [-4, 84]) => ({ ffx: px + front[0], ffy: py + front[1], bfx: px + back[0], bfy: py + back[1] });

// Knockdown: seconds since the hit. The body tips back off its heels, the legs fly
// up, it lands flat, bounces once and settles. FALL_SETTLED is when it lies still.
export const FALL_SETTLED = 0.75;
const lying = (px, py, extra = {}) => ({ px, py, lean: 0, bend: 0, head: 4, twist: 0, fx: 22, fy: 8, bx: -20, by: 10, ...hang(px, py, [12, 80], [-6, 84]), ffa: .1, bfa: .1, rot: -90, stick: 1, ...extra });
const LYING = lying(-14, -14);
export const FALL = {
  back: clip([
    [0, { px: -12, py: -85, lean: -14, bend: -8, head: -22, twist: -6, fx: 10, fy: -24, bx: 4, by: -26, ffx: 44, bfx: -46 }],
    [.13, { px: -24, py: -92, lean: -6, bend: -10, head: -26, twist: -4, fx: 30, fy: -34, bx: -8, by: -44, ...hang(-24, -92, [22, 70], [-6, 76]), ffa: .5, bfa: .6, rot: -22 }],
    [.28, { px: -40, py: -92, lean: 0, bend: -8, head: -20, fx: 40, fy: -22, bx: -16, by: -34, ...hang(-40, -92, [18, 68], [-10, 74]), ffa: .6, bfa: .6, rot: -58 }],
    [.42, lying(-54, -20, { rot: -88, stick: .8 })],
    [.55, lying(-56, -34, { rot: -84, fx: 26, fy: 4, bx: -26, by: 4, stick: .3 })],
    [.7, lying(-56, -14, { rot: -90 })],
    [FALL_SETTLED, lying(-56, -14, { rot: -90 })]
  ]),
  // Legs are swept out: the body whips horizontal, hangs, then slams flat.
  swept: clip([
    [0, { px: -10, py: -78, lean: 10, bend: 6, head: 4, fx: 20, fy: -10, bx: 10, by: -14, ffx: 30, ffy: -12, bfx: -50, bfy: -7 }],
    [.13, { px: -16, py: -98, lean: 0, bend: 0, head: -4, twist: -6, fx: 34, fy: -26, bx: -6, by: -36, ...hang(-16, -98, [26, 66], [-2, 74]), ffa: .5, bfa: .6, rot: -44 }],
    [.27, { px: -24, py: -104, lean: 0, bend: -4, head: -10, fx: 42, fy: -14, bx: -16, by: -22, ...hang(-24, -104, [20, 70], [-8, 76]), ffa: .4, bfa: .5, rot: -80 }],
    [.38, lying(-40, -58, { rot: -92, stick: .2 })],
    [.47, lying(-48, -14, { rot: -90, stick: 1 })],
    [.6, lying(-50, -28, { rot: -87, fx: 24, fy: 4, bx: -24, by: 6, stick: .3 })],
    [.72, lying(-50, -14, { rot: -90 })],
    [FALL_SETTLED, lying(-50, -14, { rot: -90 })]
  ]),
  // A final fall: slower and heavier, with a long, limp settle.
  ko: clip([
    [0, { px: -12, py: -84, lean: -12, bend: -8, head: -26, twist: -6, fx: 8, fy: -20, bx: 4, by: -22, ffx: 44, bfx: -46 }],
    [.16, { px: -24, py: -90, lean: -4, bend: -8, head: -28, fx: 26, fy: -24, bx: -8, by: -30, ...hang(-24, -90, [20, 72], [-8, 78]), ffa: .5, bfa: .5, rot: -26 }],
    [.34, { px: -42, py: -80, lean: 0, bend: -6, head: -20, fx: 34, fy: -10, bx: -14, by: -12, ...hang(-42, -80, [18, 70], [-10, 76]), ffa: .5, bfa: .5, rot: -62 }],
    [.52, lying(-58, -18, { rot: -89, stick: .8 })],
    [.64, lying(-60, -28, { rot: -85, fx: 22, fy: 6, bx: -22, by: 6, stick: .3 })],
    [.84, lying(-60, -14, { rot: -90, fx: 14, fy: 14, bx: -12, by: 16 })],
    [1.2, lying(-60, -14, { rot: -90, fx: 10, fy: 16, bx: -8, by: 18, head: 10 })]
  ])
};

// Getting up (0..1 over the rise): sit up through the hips, roll the weight over the
// feet into a crouch with a hand to the floor, then drive to the stance.
export const RISE = clip([
  [0, lying(-56, -14)],
  [.2, { px: -50, py: -22, lean: -6, bend: -4, head: -10, twist: 0, fx: 22, fy: 28, bx: -22, by: 26, ...hang(-50, -22, [22, 54], [-2, 60]), ffa: .5, bfa: .3, rot: -56, stick: 1 }],
  [.44, { px: -34, py: -40, lean: 14, bend: 10, head: 2, twist: 6, fx: 30, fy: 44, bx: 8, by: 36, ffx: 20, ffy: -5, bfx: -34, bfy: -6, ffa: 0, bfa: .2, rot: -16, stick: 0 }],
  [.7, { px: -16, py: -62, lean: 22, bend: 14, head: 4, twist: 12, fx: 32, fy: 10, bx: 22, by: 0, ffx: 40, bfx: -44, bfy: -8, rot: 0 }],
  [.88, { px: -8, py: -80, lean: 12, bend: 6, twist: 12, fx: 30, fy: -4, bx: 20, by: -8 }],
  [1, {}]
]);

// Dodges (0..1 over .46 s).
export const DODGE = {
  // Hop backward: sink, spring, tuck in the air, absorb the landing.
  back: clip([
    [0, {}],
    [.12, { px: -14, py: -74, lean: -2, bend: 4, head: 2, fx: 30, fy: -6, bx: 20, by: -10, ffx: 42, bfx: -46, bfy: -8 }],
    [.3, { px: -24, py: -100, lean: -14, bend: -4, head: -4, twist: 6, fx: 34, fy: -20, bx: 10, by: -20, ffx: 28, ffy: -34, bfx: -30, bfy: -26, ffa: .4, bfa: .6 }, 1.2],
    [.58, { px: -26, py: -96, lean: -10, bend: -2, head: -2, fx: 34, fy: -16, bx: 12, by: -16, ffx: 36, ffy: -22, bfx: -34, bfy: -12, ffa: .2, bfa: .4 }],
    [.8, { px: -22, py: -74, lean: 4, bend: 6, fx: 30, fy: -6, bx: 20, by: -10, ffx: 44, bfx: -42, bfy: -6 }],
    [1, {}]
  ]),
  // Forward roll: dive under the strike, curl into a ball, come up running.
  roll: clip([
    [0, {}],
    [.12, { px: 8, py: -64, lean: 34, bend: 22, head: 18, twist: 10, fx: 36, fy: 32, bx: 24, by: 30, ffx: 44, bfx: -34, bfy: -8 }],
    [.26, { px: 10, py: -52, lean: 44, bend: 36, head: 30, twist: 0, fx: 18, fy: 34, bx: 12, by: 32, ffx: 14, ffy: -36, bfx: -6, bfy: -26, ffa: .6, bfa: .6, rot: 80, stick: 1 }],
    [.5, { px: 6, py: -50, lean: 44, bend: 38, head: 30, twist: 0, fx: 18, fy: 36, bx: 12, by: 34, ffx: 12, ffy: -34, bfx: -8, bfy: -24, ffa: .6, bfa: .6, rot: 220, stick: 1 }],
    [.72, { px: 2, py: -56, lean: 40, bend: 30, head: 24, twist: 4, fx: 20, fy: 32, bx: 12, by: 30, ffx: 16, ffy: -34, bfx: -8, bfy: -26, ffa: .6, bfa: .6, rot: 330, stick: 1 }],
    [.86, { px: -6, py: -70, lean: 22, bend: 14, head: 8, twist: 10, fx: 28, fy: 6, bx: 16, by: -4, ffx: 40, bfx: -44, bfy: -8, rot: 360 }],
    [1, { rot: 360 }]
  ])
};

// Paired grapples. The victim clips are the body in flight; the sim places its centre.
// Attacker clips are seconds from the start of the sequence.
const GRAB = { px: 8, py: -78, lean: 20, bend: 10, twist: 16, fx: 54, fy: 6, bx: 50, by: 10, ffx: 48, bfx: -34, head: -4 };
const HEAVE = { px: -4, py: -66, lean: 18, bend: 12, twist: 6, fx: 18, fy: -46, bx: 6, by: -52, ffx: 50, bfx: -44, bfy: -6, head: 4 };
const SLAM = { px: 12, py: -62, lean: 38, bend: 22, twist: 12, fx: 58, fy: 30, bx: 54, by: 28, ffx: 56, bfx: -42, head: 10 };
export const THROWER = {
  throw: clip([
    [0, GRAB], [.2, GRAB],
    [.42, { ...HEAVE, px: -12, py: -70, lean: 8, bend: 4, fx: 30, fy: -44, bx: 22, by: -50 }],
    [.62, { ...SLAM, lean: 34, fy: 20, by: 14 }],
    [.8, { ...SLAM, lean: 36, fy: 28, by: 22 }],
    [1.15, {}]
  ]),
  reap: clip([
    [0, GRAB], [.2, GRAB],
    [.4, { px: 6, py: -60, lean: 6, bend: 4, twist: 22, fx: 38, fy: 10, bx: 22, by: 20, ffx: 88, ffy: -10, ffa: -.2, bfx: -44, bfy: -6 }],
    [.67, { px: 8, py: -58, lean: -4, bend: 0, twist: 24, fx: 40, fy: 12, bx: 20, by: 26, ffx: 90, ffy: -9, ffa: -.2, bfx: -46, bfy: -6 }],
    [1.15, {}]
  ]),
  finish: clip([
    [0, GRAB], [.22, GRAB],
    [.65, { ...HEAVE }],
    [1.1, { px: -6, py: -90, lean: -4, bend: -6, twist: 8, fx: 14, fy: -58, bx: 8, by: -60, ffx: 38, bfx: -42, bfy: -14, bfa: 1, head: -10 }],
    [1.5, { ...SLAM, lean: 42, py: -58 }],
    [1.9, {}]
  ]),
  finishLow: clip([
    [0, GRAB], [.22, GRAB],
    [.55, { px: 2, py: -80, lean: 6, bend: 2, twist: 14, fx: 40, fy: -30, bx: 30, by: -34, ffx: 30, ffy: -40, bfx: -30, bfy: -30, ffa: .5, bfa: .5 }],
    [1.05, { px: 8, py: -100, lean: -10, bend: -8, twist: 8, fx: 30, fy: -44, bx: 20, by: -50, ffx: 34, ffy: -36, bfx: -28, bfy: -26, ffa: .5, bfa: .5 }],
    [1.5, { ...SLAM, py: -56, lean: 44 }],
    [1.9, {}]
  ])
};

export const VICTIM = {
  // Held in the grip, limp and trailing, while the sim carries the body over.
  ragdoll: clip([
    [0, { px: -2, py: -82, lean: 4, bend: 0, head: 2, fx: 30, fy: 14, bx: -22, by: 20, ...hang(-2, -82, [20, 74], [-6, 78]), rot: 0 }],
    [.5, { px: -4, py: -86, lean: -6, bend: -6, head: -16, fx: 36, fy: -30, bx: -4, by: -40, ...hang(-4, -86, [26, 62], [-8, 70]), ffa: .5, bfa: .5, rot: 0 }],
    [1, { px: -4, py: -86, lean: 0, bend: -4, head: -12, fx: 30, fy: -20, bx: -12, by: -30, ...hang(-4, -86, [22, 66], [-10, 72]), ffa: .5, bfa: .5, rot: 0 }]
  ]),
  lying: LYING
};
export { LYING };
