// node tools/dump-frames.mjs <seed> <t0> <t1> <fighter>   — per-frame channels for a window of an AI fight
import { InkFighter, InkAI, resolveInkCombat } from '../src/ink/combat.js';
import { InkRig } from '../src/ink/rig.js';
import { solve, CHANNELS } from '../src/ink/skeleton.js';
let seed = Number(process.argv[2]); const T0 = Number(process.argv[3]), T1 = Number(process.argv[4]), who = Number(process.argv[5]);
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const fighters = [new InkFighter(-185, 0), new InkFighter(185, 1)], ais = [new InkAI(random), new InkAI(random)], rigs = [new InkRig(), new InkRig()];
fighters[0].ink = fighters[1].ink = 100;
for (let i = 0; i < T1 * 60 + 2; i++) {
  const t = i / 60;
  fighters.forEach((f, k) => f.tick(1 / 60, ais[k].update(1 / 60, f, fighters[1 - k], 1), fighters[1 - k], () => {}));
  resolveInkCombat(fighters, t, () => {});
  if (fighters.some(f => f.health <= 0 && f.state === 'ko' && f.clock > 1.2)) { fighters.forEach(f => { f.reset(f.id ? 185 : -185); f.ink = 100; }); rigs.forEach(r => r.reset()); }
  fighters.forEach((f, k) => {
    rigs[k].advance(f, t, 1 / 60, f.x);
    if (k === who && t >= T0 && t <= T1) {
      const o = rigs[k].animator.out, p = solve(o);
      console.log(`${t.toFixed(2)} ${f.state} ${rigs[k].animator.cat} clk=${f.clock.toFixed(2)} off=${(rigs[k].animator.fallOffset||0).toFixed(2)} y=${f.y.toFixed(0)} | rot=${o.rot.toFixed(0)} px=${o.px.toFixed(0)} py=${o.py.toFixed(0)} lean=${o.lean.toFixed(0)} f=(${o.fx.toFixed(0)},${o.fy.toFixed(0)}) b=(${o.bx.toFixed(0)},${o.by.toFixed(0)}) hand=(${p.frontHand.map(v => v.toFixed(0))}) stick=${(o.stick||0).toFixed(1)}`);
    }
  });
}
