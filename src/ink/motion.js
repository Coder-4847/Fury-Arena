// Strike geometry for the simulation. Damage reach is read from the same authored clip
// the renderer plays, so the visible fist or foot is where a strike can land.
import { solve, solveJoint } from './skeleton.js';
import { sampleAttack } from './track.js';
import { ATTACK } from './clips.js';

export { solveJoint };
// Shared timings: the simulation owns them, the animator stretches its clips to fit.
export const RISE_TIME = 0.62;
export const DODGE_TIME = 0.46;
export const clipFor = move => ATTACK[move.pose] || ATTACK.palm;

export function strikeChannels(move, t) {
  return sampleAttack(clipFor(move), move, t);
}

export function strikePose(move, t) {
  return solve(strikeChannels(move, t));
}

const KICKS = ['kick', 'round', 'sweep', 'airkick'];
/** The part that makes contact: the toe for kicks, the rear fist for a cross, otherwise the lead fist. */
export function strikePoint(move, t) {
  const p = strikePose(move, t);
  if (KICKS.includes(move.pose)) return p.frontToe;
  return p[move.pose === 'cross' ? 'backHand' : 'frontHand'];
}
