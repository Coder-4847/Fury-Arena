import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { WeaponSystem } from '../src/world/weapons.js';
import { WEAPONS } from '../src/data/weapons.js';
import { Fighter } from '../src/world/fighter.js';
import { FIGHTERS } from '../src/data/fighters.js';
function world(){const fighters=FIGHTERS.map((def,i)=>new Fighter(def,i?2:0,i));fighters[1].facing=-1;const rigs=fighters.map(()=>({arms:[{hand:new THREE.Group()}]}));return {fighters,system:new WeaponSystem(new THREE.Scene(),rigs,()=>{},()=>{})};}
for(const id of Object.keys(WEAPONS))test(`${id}: spawn, equip, spend a use, drop and preserve remaining capacity`,()=>{
  const {fighters,system}=world(),f=fighters[0];system.spawn(id,0,0);system.equip(f,system.drops[0]);const capacity=f.weapon.remaining;
  f.startAttack(f.weapon.definition.move);f.attack.time=f.attack.move.startup;system.update(1/60,fighters);assert.equal(f.weapon.remaining,capacity-1);
  system.update(1/60,fighters);assert.equal(f.weapon.remaining,capacity-1);f.attack=null;
  if(capacity>1){system.drop(f,false);assert.equal(f.weapon,null);system.equip(f,system.drops[0]);assert.equal(f.weapon.remaining,capacity-1);}
  system.reset(fighters);assert.equal(system.projectiles.length,0);assert.equal(system.drops.length,0);assert.equal(f.weapon,null);
});
test('projectile hits once even if owner turns after firing',()=>{const {fighters,system}=world();system.projectile(fighters[0],WEAPONS.pistol.move,'pistol');fighters[0].facing=-1;for(let i=0;i<30;i++)system.update(1/60,fighters);assert.equal(fighters[1].health,91);assert.equal(system.projectiles.length,0);});

test('new drops rotate the oldest pickup instead of stalling Weapon Rush',()=>{const {system}=world();for(const id of Object.keys(WEAPONS))system.spawn(id,0,0);assert.equal(system.drops.length,5);assert.equal(system.drops.at(-1).id,'grenade');assert.equal(system.drops[0].id,'knife');});
