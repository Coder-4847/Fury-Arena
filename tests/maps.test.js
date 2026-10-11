import test from 'node:test';
import assert from 'node:assert/strict';
import { MapWorld } from '../src/world/maps.js';
import { MAPS } from '../src/data/maps.js';
import { Fighter } from '../src/world/fighter.js';
import { FIGHTERS } from '../src/data/fighters.js';
const idle={is:()=>false,consume:()=>false};
function world(){const w=new MapWorld({},()=>{},()=>{},{});w.definition=MAPS[0];w.objects=MAPS[0].objects.map(o=>({...o,active:true,cooldown:0,mesh:{visible:true}}));return w;}
test('descending fighter lands on platform, walking off falls to floor',()=>{const w=world(),f=new Fighter(FIGHTERS[0],3,0);f.previousY=1;f.y=.6;f.vy=-2;w.physics(f);assert.equal(f.y,.65);assert.equal(f.grounded,true);f.x=5;for(let i=0;i<120;i++){f.update(1/60,idle,9);w.physics(f);}assert.equal(f.y,0);});
test('climb and swing interactions finish and release the fighter',()=>{const w=world(),a=new Fighter(FIGHTERS[0],3,0),b=new Fighter(FIGHTERS[1],7,1);w.handle(a,{is:k=>k==='up',consume:()=>false});assert.equal(a.interaction.type,'climb');for(let i=0;i<40;i++)w.update(1/60,[a,b]);assert.equal(a.interaction,null);assert.equal(a.y,.65);a.x=-3;a.y=0;w.handle(a,{is:()=>false,consume:k=>k==='grab'});assert.equal(a.interaction.type,'swing');for(let i=0;i<60;i++)w.update(1/60,[a,b]);assert.equal(a.interaction,null);assert.equal(a.grounded,false);});
