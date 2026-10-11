import * as THREE from '../../vendor/three.module.js';
import { WEAPONS } from '../data/weapons.js';
import { resolveAttack } from './combat.js';

export function weaponModel(id){
  const group=new THREE.Group(),def=WEAPONS[id];
  const material=new THREE.MeshStandardMaterial({color:def.color,roughness:.45,metalness:.35});
  const grip=new THREE.MeshStandardMaterial({color:'#252e29',roughness:.85});
  const box=(x,y,z,px,py,pz,mat=material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),mat);mesh.position.set(px,py,pz);mesh.castShadow=true;group.add(mesh);};
  box(.1,.25,.1,0,-.05,0,grip);
  if(id==='sword'){box(.12,.85,.045,0,-.62,0);box(.36,.06,.08,0,-.23,0);}
  if(id==='staff')box(.075,1.85,.075,0,-.46,0);
  if(id==='hammer'){box(.09,.6,.09,0,-.4,0,grip);box(.5,.26,.28,0,-.78,0);}
  if(id==='knife')box(.09,.32,.04,0,-.33,0);
  if(id==='pistol'){box(.18,.43,.16,0,-.26,0);box(.16,.2,.14,.13,-.07,0,grip);}
  if(id==='shotgun'){box(.14,.85,.17,0,-.38,0);box(.18,.36,.2,0,-.02,0,grip);}
  if(id==='bottle'){box(.16,.3,.16,0,-.3,0);box(.065,.16,.065,0,-.1,0);}
  if(id==='grenade'){box(.2,.28,.2,0,-.25,0);box(.1,.08,.1,0,-.08,0,grip);}
  return group;
}
function dispose(group){group.traverse(node=>{node.geometry?.dispose();if(node.material)node.material.dispose();});}

export class WeaponSystem {
  constructor(scene,rigs,onImpact,onToast){this.scene=scene;this.rigs=rigs;this.onImpact=onImpact;this.onToast=onToast;this.drops=[];this.projectiles=[];this.timer=3;this.sequence=0;this.bound=10;this.interval=9;this.spawnPoints=[-6,0,6];}
  reset(fighters){
    for(const drop of this.drops){this.scene.remove(drop.root);dispose(drop.root);}this.drops=[];
    for(const p of this.projectiles){this.scene.remove(p.mesh);dispose(p.mesh);}this.projectiles=[];
    fighters.forEach(f=>this.unequip(f));this.timer=2;
  }
  unequip(fighter){if(fighter.weaponMesh){fighter.weaponMesh.removeFromParent();dispose(fighter.weaponMesh);}fighter.weapon=null;fighter.weaponMesh=null;}
  spawn(id,x,delay=1.5,remaining){
    if(this.drops.length>=5)return;
    const root=new THREE.Group(),mesh=weaponModel(id);root.add(mesh);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.4,24),new THREE.MeshBasicMaterial({color:'#d9fc66',side:THREE.DoubleSide,transparent:true,opacity:.75}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;root.add(ring);
    root.position.x=x;mesh.position.y=1.25;mesh.rotation.z=.6;this.scene.add(root);
    this.drops.push({id,x,root,mesh,ring,delay,age:0,remaining});
  }
  equip(fighter,drop){
    if(fighter.weapon)this.drop(fighter,false);
    const def=WEAPONS[drop.id];fighter.weapon={id:drop.id,definition:def,remaining:drop.remaining??def.ammo??def.durability};
    fighter.weaponMesh=weaponModel(drop.id);this.rigs[fighter.team].arms[0].hand.add(fighter.weaponMesh);
    this.scene.remove(drop.root);dispose(drop.root);this.drops.splice(this.drops.indexOf(drop),1);
    this.onToast(`${fighter.definition.name} / ${def.name}`);
  }
  drop(fighter,throwing){
    const weapon=fighter.weapon;if(!weapon)return;
    if(throwing)this.projectile(fighter,{...weapon.definition.move,name:'THROWN '+weapon.definition.name,damage:12,speed:10,gravity:8,explosive:false},weapon.id);
    else this.spawn(weapon.id,Math.max(-this.bound,Math.min(this.bound,fighter.x+fighter.facing*.65)),0,weapon.remaining);
    this.unequip(fighter);
  }
  handle(fighter,input){
    if(fighter.stun>0||fighter.downTime>0||fighter.health<=0||fighter.attack)return;
    if(input.consume('drop'))this.drop(fighter,!input.is('down'));
    if(input.consume('use')){
      const drop=this.drops.filter(d=>d.delay<=0&&Math.abs(d.x-fighter.x)<1.6).sort((a,b)=>Math.abs(a.x-fighter.x)-Math.abs(b.x-fighter.x))[0];
      if(drop)this.equip(fighter,drop);else if(fighter.weapon)fighter.startAttack(fighter.weapon.definition.move);
    }
  }
  projectile(fighter,move,id){
    const mesh=move.projectile&&['pistol','shotgun'].includes(id)?new THREE.Mesh(new THREE.BoxGeometry(.24,.045,.045),new THREE.MeshBasicMaterial({color:'#f1ffd0'})):weaponModel(id);
    mesh.position.set(fighter.x+fighter.facing*.5,fighter.y+1.25,.1);this.scene.add(mesh);
    this.projectiles.push({mesh,owner:fighter,move,id,x:mesh.position.x,y:mesh.position.y,startX:mesh.position.x,vx:move.speed*fighter.facing,vy:move.gravity?4:0,age:0});
  }
  update(dt,fighters){
    this.timer-=dt;
    if(this.timer<=0){const ids=Object.keys(WEAPONS);this.spawn(ids[this.sequence%ids.length],this.spawnPoints[this.sequence%this.spawnPoints.length]);this.sequence++;this.timer=this.interval;}
    for(const d of this.drops){d.age+=dt;d.delay-=dt;d.mesh.position.y=d.delay>0?1.2+d.delay*1.8:1.05+Math.sin(d.age*2.8)*.08;d.mesh.rotation.y=d.age*.6;d.ring.scale.setScalar(d.delay>0?1+Math.sin(d.age*10)*.12:1);}
    for(const f of fighters){
      const a=f.attack,w=f.weapon;
      if(a&&w&&a.move===w.definition.move&&a.time>=a.move.startup&&!a.weaponUsed){
        a.weaponUsed=true;w.remaining--;if(a.move.projectile)this.projectile(f,a.move,w.id);
      }
      if(w&&w.remaining<=0&&!a)this.unequip(f);
    }
    for(let i=this.projectiles.length-1;i>=0;i--){
      const p=this.projectiles[i],target=fighters[1-p.owner.team];p.age+=dt;
      const oldX=p.x;p.x+=p.vx*dt;p.vy-=(p.move.gravity||0)*dt;p.y+=p.vy*dt;
      p.mesh.position.set(p.x,Math.max(.1,p.y),.1);if(p.move.gravity)p.mesh.rotation.z+=dt*8;
      const crossing=target.x>=Math.min(oldX,p.x)-.35&&target.x<=Math.max(oldX,p.x)+.35;
      const impact=crossing&&Math.abs(target.y+1-p.y)<.9;
      const detonates=p.move.explosive&&(p.y<=.1||impact);
      let done=p.y<0||p.age>3||Math.abs(p.x-p.startX)>(p.move.maxDistance||25)||Math.abs(p.x)>this.bound+2;
      if((impact&&!p.move.explosive)||detonates){
        const facing=Math.sign(p.vx),fake={...p.owner,facing,x:p.x-facing*.1,y:p.y-1,combo:p.owner.combo,meter:p.owner.meter};
        const move={...p.move,range:detonates?2.8:.8,startup:0,active:1,height:detonates?3:1};
        if(detonates){fake.x=target.x;fake.y=target.y;move.damage=Math.abs(p.x-target.x)<2.8?p.move.damage:0;}
        if(move.damage>0){resolveAttack(fake,target,event=>this.onImpact({...event,attacker:p.owner}),{move,time:.1,hitTargets:new Set()});p.owner.meter=fake.meter;p.owner.combo=fake.combo;p.owner.comboTime=fake.comboTime;}
        if(detonates)this.onToast('DETONATION');done=true;
      }
      if(done){this.scene.remove(p.mesh);dispose(p.mesh);this.projectiles.splice(i,1);}
    }
  }
}
