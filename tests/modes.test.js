import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchState } from '../src/core/match.js';
import { MODES } from '../src/data/modes.js';
for(const mode of MODES)test(`${mode.id} completes or resets according to its rules`,()=>{
  const match=new MatchState(mode);
  if(mode.id==='training'){match.finish([100,0]);assert.equal(match.done,false);assert.deepEqual(match.scores,[0,0]);return;}
  for(let i=0;i<mode.wins;i++){match.finish([50,0]);assert.equal(match.done,i===mode.wins-1);if(mode.id==='survival')assert.equal(match.nextHealth[0],75);if(mode.id==='stock')assert.equal(match.nextHealth[0],50);match.advance();}
});
test('survival ends on player defeat and a draw does not award a round',()=>{const survival=new MatchState(MODES.find(m=>m.id==='survival'));survival.finish([0,50]);assert.equal(survival.done,true);const versus=new MatchState(MODES[0]);versus.finish([50,50]);assert.deepEqual(versus.scores,[0,0]);assert.equal(versus.done,false);});
