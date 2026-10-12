// Plays seeded AI-vs-AI fights through the real simulation and the stateful animator at
// 60 Hz and reports the biggest single-frame joint jumps, with the state transition that
// caused them. Anything large that is not a launch, hit or throw is a visible pop.
import { InkFighter, InkAI, resolveInkCombat } from '../src/ink/combat.js';
import { InkRig } from '../src/ink/rig.js';
import { solve } from '../src/ink/skeleton.js';
const J = ['hip', 'neck', 'head', 'frontHand', 'backHand', 'frontFoot', 'backFoot', 'frontKnee', 'backKnee'];
let seed = Number(process.argv[2] || 7);
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const fighters = [new InkFighter(-185, 0), new InkFighter(185, 1)], ais = [new InkAI(random), new InkAI(random)], rigs = [new InkRig(), new InkRig()];
fighters[0].ink = fighters[1].ink = 100;
const prev = [null, null], prevCat = [null, null], offenders = [], cats = {};
const seconds = Number(process.argv[3] || 240);
for (let i = 0; i < seconds * 60; i++) {
  const t = i / 60;
  fighters.forEach((f, k) => f.tick(1 / 60, ais[k].update(1 / 60, f, fighters[1 - k], 1), fighters[1 - k], () => {}));
  resolveInkCombat(fighters, t, () => {});
  if (fighters.some(f => f.health <= 0 && f.state === 'ko' && f.clock > 1.2)) { fighters.forEach(f => { f.reset(f.id ? 185 : -185); f.ink = 100; }); prev[0] = prev[1] = null; rigs.forEach(r => r.reset()); }
  fighters.forEach((f, k) => {
    rigs[k].advance(f, t, 1 / 60, f.x);
    const p = solve(rigs[k].animator.out), cat = rigs[k].animator.cat;
    cats[cat] = (cats[cat] || 0) + 1;
    if (prev[k]) {
      let worst = 0, joint = '';
      for (const j of J) { const d = Math.hypot(p[j][0] - prev[k][j][0], p[j][1] - prev[k][j][1]); if (d > worst) { worst = d; joint = j; } }
      offenders.push({ worst, joint, t: t.toFixed(2), from: prevCat[k], to: cat, id: k, state: f.state, vy: f.vy.toFixed(0), y: f.y.toFixed(0), vx: f.vx.toFixed(0), duck: f.duck, guard: f.guard, face: f.facing, land: f.landTime.toFixed(2) });
    }
    prev[k] = p; prevCat[k] = cat;
  });
}
offenders.sort((a, b) => b.worst - a.worst);
const byPair = {};
for (const o of offenders) { const key = `${o.from} -> ${o.to}`; (byPair[key] ||= []).push(o.worst); }
console.log('frames by state:', JSON.stringify(cats));
console.log('worst single-frame jumps by transition (max, p99, count):');
for (const [k, v] of Object.entries(byPair).sort((a, b) => Math.max(...b[1]) - Math.max(...a[1])).slice(0, 25)) {
  const s = [...v].sort((a, b) => a - b);
  console.log(`  ${k.padEnd(34)} max ${s[s.length - 1].toFixed(1).padStart(5)}  p99 ${s[Math.floor(s.length * .99)].toFixed(1).padStart(5)}  n=${v.length}`);
}
console.log('top offenders:');
for (const o of offenders.slice(0, 8)) console.log(`  t=${o.t} ${o.from} -> ${o.to} ${o.worst.toFixed(1)} ${o.joint}`);

console.log('loco->loco > 25:');
for (const o of offenders.filter(o => o.from === 'loco' && o.to === 'loco' && o.worst > 25).slice(0, 12)) console.log('  ', JSON.stringify(o));
if (process.argv.includes('--down')) {
  console.log('down->down > 28:');
  for (const o of offenders.filter(o => (o.from === 'down' && o.to === 'down' || o.from === 'ko' && o.to === 'ko') && o.worst > 28).slice(0, 14)) console.log('  ', o.t, o.from, o.worst.toFixed(1), o.joint, `state=${o.state} y=${o.y} vy=${o.vy}`);
}
