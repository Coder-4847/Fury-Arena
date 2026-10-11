import test from 'node:test';
import assert from 'node:assert/strict';
import { Fighter } from '../src/world/fighter.js';
import { FIGHTERS } from '../src/data/fighters.js';
import { MOVES } from '../src/data/moves.js';
import { resolveAttack } from '../src/world/combat.js';
function pair(move=MOVES.light){const a=new Fighter(FIGHTERS[0],0,0),b=new Fighter(FIGHTERS[1],1,1);b.facing=-1;a.startAttack(move);a.attack.time=move.startup;return [a,b];}
test('a strike damages once, only during its active window',()=>{const [a,b]=pair();a.attack.time=0;assert.equal(resolveAttack(a,b),false);a.attack.time=.11;assert.equal(resolveAttack(a,b),true);assert.equal(b.health,94);assert.equal(resolveAttack(a,b),false);assert.equal(b.health,94);});
test('guard chips while throws bypass it',()=>{let [a,b]=pair();b.blocking=true;resolveAttack(a,b);assert.equal(b.health,99);[a,b]=pair(MOVES.grab);b.x=.8;b.blocking=true;resolveAttack(a,b);assert.equal(b.health,86);assert.ok(b.downTime>0);});
test('dodge invulnerability and range prevent damage',()=>{const [a,b]=pair();b.invulnerable=.1;assert.equal(resolveAttack(a,b),false);b.invulnerable=0;b.x=4;assert.equal(resolveAttack(a,b),false);});
test('special attacks cannot start without sufficient meter',()=>{const [a,b]=pair();a.attack=null;a.meter=10;const input={is:()=>false,consume:k=>k==='special'};a.update(1/60,input,10,b);assert.equal(a.attack,null);a.meter=100;a.update(1/60,input,10,b);assert.equal(a.attack.move,MOVES.kade1);assert.equal(a.meter,50);});

test('simultaneous active strikes trade instead of favoring player one',async()=>{const {resolveCombat}=await import('../src/world/combat.js');const [a,b]=pair();b.startAttack(MOVES.light);b.attack.time=.11;resolveCombat(a,b);assert.equal(a.health,94);assert.equal(b.health,94);});
