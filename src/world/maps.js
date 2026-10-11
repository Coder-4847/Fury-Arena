import * as THREE from '../../vendor/three.module.js';
import { resolveAttack } from './combat.js';
import { batchStaticGeometry } from './batch.js';

export class MapWorld {
  constructor(arena,onImpact,onToast,weapons){this.arena=arena;this.onImpact=onImpact;this.onToast=onToast;this.weapons=weapons;this.time=0;this.objects=[];this.hazards=[];}
  load(def){
    const group=this.arena.environment;group.traverse(n=>{n.geometry?.dispose();n.material?.map?.dispose();n.material?.dispose();});group.clear();
    this.definition=def;this.time=0;this.objects=def.objects.map(o=>({...o,cooldown:0,active:true}));this.hazards=def.hazards.map(h=>({...h,hits:[0,0]}));
    this.arena.scene.background.set(def.sky);this.arena.scene.fog.color.set(def.sky);
    this.weapons.bound=def.bound;this.weapons.spawnPoints=def.spawns;
    const box=(w,h,d,x,y,z,c)=>this.arena.box(w,h,d,x,y,z,c);
    box(def.bound*2+2,.5,7,0,-.26,0,def.floor);box(60,.3,50,0,-1.1,-7,def.sky);
    for(const z of [-2.6,2.6])box(def.bound*2,.016,.04,0,.015,z,def.color);
    for(const x of [-def.bound,def.bound])box(.04,.016,5.2,x,.015,0,def.color);
    for(let x=-def.bound;x<=def.bound;x+=1)box(.015,.014,7,x,.006,0,def.theme==='dojo'?'#89715b':'#56604d');
    for(const p of def.platforms){box(p.width,p.y,1.6,p.x,p.y/2,0,def.floor);box(p.width+.1,.06,1.7,p.x,p.y,0,def.color);}
    if(def.theme==='gym'){
      for(let x=-12;x<=12;x+=4){box(.25,8,.3,x,3,-5,'#304334');box(3.7,3,.12,x+2,3,-5.2,'#1d3028');}
      for(const x of [-7,6]){box(2.3,.15,.3,x,1.4,-3.3,'#899483');for(const dx of [-.9,.9]){box(.18,1.4,.4,x+dx,.7,-3.3,'#424e44');for(const y of [.65,1.15])box(.55,.4,.5,x+dx,y,-3.3,'#222b26');}}
    }else if(def.theme==='dojo'){
      for(let x=-10;x<=10;x+=2){box(.12,5,.2,x,2.5,-4.5,'#362922');box(1.85,4,.12,x+1,2.5,-4.6,'#aa9977');box(1.85,.07,.15,x+1,2.5,-4.4,'#49382e');}
      box(23,.4,1,0,5,-4.5,'#32261f');
    }else if(def.theme==='rooftop'){
      for(let i=0;i<18;i++){const x=i*2.8-24,height=2+(i*7%11);box(2.3,height,3,x,height/2-2,-12-(i%3)*3,'#1c3043');for(let y=0;y<height-1;y+=1.2)box(1.4,.07,.02,x,y-1,-10.48-(i%3)*3,i%2?'#678a98':'#b59e71');}
      for(let x=-12;x<=12;x+=2)box(.08,1.5,.08,x,.5,-3,'#758b93');box(26,.08,.08,0,1.25,-3,'#758b93');
    }else if(def.theme==='junkyard'){
      for(let i=0;i<9;i++){const x=i*3-12,y=.6+(i%3)*.45;box(2.7,1.1,1.8,x,y,-4-(i%2),i%2?'#75634a':'#4d574c');box(1.3,.7,1.65,x,y+.75,-4-(i%2),'#343c34');for(const dx of [-.85,.85])box(.55,.55,2,x+dx,y-.3,-4-(i%2),'#222b24');}
      for(let x=-12;x<=12;x+=2)box(.08,4,.08,x,2,-7,'#5a6756');
    }else if(def.theme==='warehouse'){
      for(let i=0;i<9;i++){const x=i*3-12,height=1.5+(i%3)*1.2;box(2.8,height,2.5,x,height/2,-5,i%2?'#4f5360':'#535342');for(let dx=-1;dx<=1;dx+=.35)box(.06,height,.05,x+dx,height/2,-3.72,'#737875');}
      for(let x=-12;x<=12;x+=6){box(.3,9,.3,x,3.5,-7,'#383749');box(5.8,.2,.3,x+3,6,-7,'#595666');}box(18,.06,.15,0,7,-4,'#bdb1d8');
    }else if(def.theme==='subway'){
      box(28,7,.3,0,2.5,-7,'#263e38');for(let x=-12;x<=12;x+=4){box(.5,5,.6,x,2.5,-4,'#446457');box(2.8,.06,.12,x+1.5,4.7,-3.8,'#c6e3bb');box(2.6,1.8,.04,x+1.5,2.7,-6.8,'#567f6c');}
      box(27,.1,1,0,-.3,-3.4,'#9f9e66');for(let x=-12;x<=12;x+=1)box(.3,.04,1,x,-.24,-3.4,'#303d2e');
    }else if(def.theme==='dock'){
      box(70,.08,40,0,-.55,-15,'#284650');for(let x=-13;x<=13;x+=2){box(.3,3,.3,x,.3,-3.2,'#625d4a');box(1.8,.065,.065,x+1,.95,-3.2,'#a49c7b');}
      for(let i=0;i<5;i++)box(6,.025,.05,i*9-18,-.49,-6-i*2,'#6c9196');box(7,1.3,3,8,.1,-12,'#303c46');box(.15,9,.15,8,4.3,-12,'#7a9298');
    }else if(def.theme==='ruins'){
      for(let i=0;i<13;i++){const x=i*2.7-16;box(.5,7,.6,x,2.5,-7-(i%3)*2,'#364635');const crown=new THREE.Mesh(new THREE.ConeGeometry(2.3,5,7),new THREE.MeshStandardMaterial({color:i%2?'#3d593c':'#334f35',roughness:1}));crown.position.set(x,6,-7-(i%3)*2);group.add(crown);}
      for(const x of [-6,6]){box(.8,3.8,.8,x,1.9,-3,'#707762');box(2, .4,1.1,x,3.8,-3,'#818670');}box(12,.4,.8,0,4.2,-5,'#59634e');
    }else if(def.theme==='temple'){
      for(let i=0;i<8;i++){const mountain=new THREE.Mesh(new THREE.ConeGeometry(5,8+i%3*3,4),new THREE.MeshStandardMaterial({color:i%2?'#b4c6cb':'#889fa9',roughness:1}));mountain.position.set(i*6-20,2,-17-i%2*4);group.add(mountain);}
      for(const x of [-7,7]){box(.5,4,.5,x,2,-4,'#5b5552');box(2,.15,2,x,4,-4,'#d4dddd');}box(15,.4,.8,0,4.3,-4,'#585957');box(16,.18,1,0,4.55,-4,'#d9e1df');
    }else{
      for(let x=-14;x<=14;x+=4){box(.65,8,.7,x,3,-5,'#443229');box(3.8,.6,.7,x+2,5,-5,'#594236');box(.12,5,.15,x+.45,3,-4.6,'#b17544');}
      for(const x of [-6,6])box(2,2.4,2,x,1.1,-3,'#352922');
    }
    this.sign(def.name,def.tag,def.color);
    for(const o of this.objects){
      const root=new THREE.Group();root.position.set(o.x,0,0);group.add(root);o.mesh=root;
      const part=(w,h,d,x,y,z,c)=>this.arena.box(w,h,d,x,y,z,c,root);
      if(o.type==='swing'){for(const z of [-.85,.85])part(.12,o.y,.12,0,o.y/2,z,'#8b9991');part(.14,.14,1.9,0,o.y,0,def.color);}
      if(o.type==='throwable'){part(.6,.3,.4,0,.35,0,'#242e28');part(.85,.08,.08,0,.35,0,def.color);}
      if(o.type==='breakable'){part(.15,2.3,1.8,0,1.15,0,'#b19d78');part(.2,.12,2,0,2.3,0,'#493e2f');}
      if(o.type==='trigger'){part(.35,1,.35,0,.5,.5,'#313d38');part(.38,.18,.38,0,1.05,.5,def.color);}
    }
    for(const h of this.hazards){h.mesh=box(h.width,.04,2.1,h.x,.04,0,['wave','frost'].includes(h.id)?'#adcfd6':'#e7a253');h.mesh.material.emissive=new THREE.Color(['wave','frost'].includes(h.id)?'#7dcbeb':'#f97430');h.mesh.material.emissiveIntensity=0;h.mesh.userData.dynamic=true;if(h.id==='press'){h.press=box(h.width,1.2,2.1,h.x,5,0,'#6f7469');h.press.userData.dynamic=true;box(.4,4,.4,h.x,5,-1.4,'#555f54');}}
    batchStaticGeometry(group);
  }
  sign(title,subtitle,color){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.fillStyle=color;ctx.font='900 100px Arial';ctx.fillText(title,512,115);ctx.font='24px Arial';ctx.fillStyle='#b0b6a6';ctx.fillText(subtitle,512,180);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(7,1.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true}));mesh.position.set(0,3.25,-4.2);this.arena.environment.add(mesh);
  }
  handle(f,input){
    if(f.stun>0||f.downTime>0||f.attack||f.interaction||f.health<=0)return;
    const o=this.objects.find(o=>o.active&&o.cooldown<=0&&Math.abs(o.x-f.x)<1.2&&o.type!=='breakable');
    if(o&&input.consume('grab')){
      if(o.type==='swing'){f.interaction={type:'swing',object:o,time:0,direction:f.facing,fromX:f.x,fromY:f.y};o.cooldown=2;f.attack=null;}
      if(o.type==='throwable'){const drop=this.weapons.spawn(o.weapon,f.x,0);this.weapons.equip(f,drop);o.active=false;o.mesh.visible=false;}
      if(o.type==='trigger'){
        o.cooldown=8;
        if(o.effect==='meter'){f.meter=Math.min(100,f.meter+30);this.onToast('GONG / +30 FURY');}
        else {this.time=this.hazards[0].period-this.hazards[0].active-.8;this.onToast('PRESS ARMED / CLEAR THE CENTER');}
      }
    }
    const platform=this.definition.platforms.find(p=>Math.abs(f.x-p.x)<p.width/2+.45&&f.y<p.y-.1);
    if(platform&&input.is('up')&&f.grounded)f.interaction={type:'climb',time:0,fromX:f.x,fromY:f.y,targetX:Math.max(platform.x-platform.width/2+.2,Math.min(platform.x+platform.width/2-.2,f.x)),targetY:platform.y};
  }
  physics(f){
    if(f.interaction)return;
    for(const o of this.objects){if(o.active&&o.type==='breakable'&&f.y<2.3&&Math.abs(f.x-o.x)<.43){const side=f.previousX<o.x?-1:1;f.x=o.x+side*.43;f.vx=0;}}
    for(const p of this.definition.platforms){
      if(Math.abs(f.x-p.x)<p.width/2+.15&&f.vy<=0&&f.previousY>=p.y-.03&&f.y<=p.y){
        const landed=!f.grounded;f.y=p.y;f.vy=0;f.grounded=true;
        if(landed)f.onEvent('land');if(f.state==='fall')f.setState(f.blocking?'block':Math.abs(f.vx)>.1?'run':'idle');
      }
    }
  }
  place(f){f.y=f.previousY=Math.max(0,...this.definition.platforms.filter(p=>Math.abs(f.x-p.x)<p.width/2+.15).map(p=>p.y));f.grounded=true;}
  update(dt,fighters){
    this.time+=dt;
    for(const o of this.objects){
      o.cooldown=Math.max(0,o.cooldown-dt);
      if(o.type==='breakable'&&o.active){for(const f of fighters){const a=f.attack;if(a&&a.time>=a.move.startup&&a.time<a.move.startup+a.move.active&&Math.abs(o.x-f.x)<a.move.range+.2&&!a.hitTargets.has(o.id)){a.hitTargets.add(o.id);o.health-=a.move.damage;if(o.health<=0){o.active=false;o.mesh.visible=false;this.onToast('SCREEN BROKEN / +15 FURY');f.meter=Math.min(100,f.meter+15);}}}}
    }
    for(const f of fighters){
      const action=f.interaction;if(!action)continue;
      if(f.stun>0||f.health<=0){f.interaction=null;continue;}
      action.time+=dt;f.previousX=f.x;f.previousY=f.y;f.vx=f.vy=0;
      if(action.type==='climb'){
        const t=Math.min(1,action.time/.45),ease=t*t*(3-2*t);f.x=action.fromX+(action.targetX-action.fromX)*ease;f.y=action.fromY+(action.targetY-action.fromY)*ease;f.setState('climb');
        if(t===1){f.interaction=null;f.grounded=true;}
      }else{
        const reach=Math.min(1,action.time/.22),blend=reach*reach*(3-2*reach),t=Math.max(0,Math.min(1,(action.time-.22)/.75)),arc=Math.sin(t*Math.PI);
        f.x=action.fromX+(action.object.x-action.fromX)*blend+arc*1.3*action.direction;f.y=action.fromY+(action.object.y-2-action.fromY)*blend+arc*.65;f.setState('swing');f.grounded=false;
        if(t>.35&&!action.hit){action.hit=true;const move={name:'SWING KICK',startup:0,active:1,range:2,damage:18,stun:.45,push:7,meter:10,pose:'kick'};resolveAttack(f,fighters[1-f.team],this.onImpact,{move,time:.1,hitTargets:new Set()});}
        if(t===1){f.interaction=null;f.vy=1;}
      }
    }
    for(const h of this.hazards){
      const phase=this.time%h.period,active=phase>h.period-h.active,warning=phase>h.period-h.active-.9;
      h.mesh.material.emissiveIntensity=active?2:warning?(Math.sin(this.time*24)+1)*.6:0;
      if(h.press)h.press.position.y+=((active?.8:warning?3.2:5)-h.press.position.y)*(1-Math.exp(-dt*18));
      for(const f of fighters){h.hits[f.team]=Math.max(0,h.hits[f.team]-dt);if(active&&h.hits[f.team]===0&&Math.abs(f.x-h.x)<h.width/2+.2&&f.y<1){h.hits[f.team]=1.5;f.health=Math.max(0,f.health-h.damage);f.stun=.3;f.vy=h.launch;f.attack=null;this.onImpact({attacker:f,defender:f,move:{damage:h.damage},blocked:false});}}
    }
  }
  hint(f){const o=this.objects.find(o=>o.active&&o.cooldown<=0&&Math.abs(o.x-f.x)<1.3);if(o)return o.label;const p=this.definition.platforms.find(p=>Math.abs(p.x-f.x)<p.width/2+.45&&f.y<p.y-.1);return p?'↑ · CLIMB':'';}
}
