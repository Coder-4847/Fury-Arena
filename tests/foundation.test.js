import test from 'node:test';
import assert from 'node:assert/strict';
import { Mover } from '../src/world/mover.js';
import { Input } from '../src/core/input.js';
const dt=1/60;
function actions(held=[],buffer=[]) { const pending=new Set(buffer);return {is:a=>held.includes(a),consume:a=>pending.delete(a)}; }
test('movement stays inside arena and on the 2D plane',()=>{
  const mover=new Mover();
  for(let i=0;i<600;i++)mover.update(dt,actions(['right']));
  assert.equal(mover.x,10); assert.equal(mover.y,0); assert.equal(mover.grounded,true);
  for(let i=0;i<600;i++)mover.update(dt,actions(['left']));
  assert.equal(mover.x,-10); assert.equal(mover.z,undefined);
});
test('jump rises, rejects an airborne jump, and lands without sinking',()=>{
  const mover=new Mover(); mover.update(dt,actions([],['jump']));
  assert.ok(mover.y>0); const vy=mover.vy;
  mover.update(dt,actions([],['jump'])); assert.ok(mover.vy<vy);
  for(let i=0;i<120;i++)mover.update(dt,actions());
  assert.equal(mover.y,0); assert.equal(mover.vy,0); assert.equal(mover.grounded,true);
});
function inputWithoutDOM() {
  const input=Object.create(Input.prototype);
  Object.assign(input,{sources:new Map(),held:new Set(),pressed:new Set(),buffer:new Map(),time:1,device:'keyboard',onDevice:()=>{}});
  return input;
}
test('releasing one device does not cancel another held source',()=>{
  const input=inputWithoutDOM(); input.set('key:A','left',true); input.set('touch:1','left',true);
  input.set('key:A','left',false); assert.equal(input.is('left'),true);
  input.set('touch:1','left',false); assert.equal(input.is('left'),false);
});
test('buffer survives a quick tap but expires and cannot be reused',()=>{
  const input=inputWithoutDOM(); input.set('key:Space','jump',true); input.set('key:Space','jump',false);
  input.time+=0.1; assert.equal(input.consume('jump'),true); assert.equal(input.consume('jump'),false);
  input.set('touch:1','jump',true); input.time+=0.2; assert.equal(input.consume('jump'),false);
});
test('screen changes do not synthesize presses from a held controller button',()=>{
  const input=inputWithoutDOM(); input.set('pad:0','jump',true); input.flush(); input.set('pad:0','jump',true);
  assert.equal(input.hit('jump'),false);
});
