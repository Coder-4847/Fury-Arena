import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { MAPS } from '../src/data/maps.js';
import { FIGHTERS } from '../src/data/fighters.js';
import { MapWorld } from '../src/world/maps.js';
import { WeaponSystem } from '../src/world/weapons.js';
import { Fighter } from '../src/world/fighter.js';
import { FighterAI } from '../src/world/ai.js';
import { resolveCombat,separateFighters } from '../src/world/combat.js';
// Canvas text is mocked: these are simulation/geometry checks, not WebGL visual QA.
globalThis.document={createElement:()=>({getContext:()=>({fillText:()=>{}})})};
function arena(){const scene=new THREE.Scene(),environment=new THREE.Group();scene.background=new THREE.Color();scene.fog=new THREE.Fog(0,1,50);scene.add(environment);return {scene,environment,box(w,h,d,x,y,z,color,parent=environment){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;}};}
for(const map of MAPS)test(`${map.id}: geometry builds and two AI fighters complete a finite simulation`,()=>{
  const view=arena(),fighters=FIGHTERS.map((def,i)=>new Fighter(def,i?2.5:-2.5,i)),rigs=fighters.map(()=>({arms:[{hand:new THREE.Group()}]}));
  const weapons=new WeaponSystem(view.scene,rigs,()=>{},()=>{}),world=new MapWorld(view,()=>{},()=>{},weapons);world.load(map);
  let seed=1337;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const ais=[new FighterAI(random),new FighterAI(random)];
  assert.ok(view.environment.children.length>4);let hits=0;
  for(let tick=0;tick<2400&&fighters.every(f=>f.health>0);tick++){
    for(let i=0;i<2;i++){const f=fighters[i],input=ais[i].update(1/60,f,fighters[1-i],world,weapons,1);world.handle(f,input);weapons.handle(f,input);f.update(1/60,input,map.bound,fighters[1-i]);world.physics(f);}
    world.update(1/60,fighters);separateFighters(...fighters,map.bound);resolveCombat(...fighters,()=>hits++);weapons.update(1/60,fighters);
    for(const f of fighters){assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.y));assert.ok(f.health>=0);assert.ok(Math.abs(f.x)<=map.bound+.01);assert.ok(f.y>=0);}
  }
  assert.ok(fighters.some(f=>f.health<100)||hits>0,'AI combat must make progress');weapons.reset(fighters);
});

