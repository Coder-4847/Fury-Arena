import { FixedLoop } from './core/loop.js';
import { Input } from './core/input.js';
import { AudioSystem } from './core/audio.js';
import { ArenaScene } from './world/scene.js';
import { Fighter } from './world/fighter.js';
import { FighterRig } from './world/rig.js';
import { Effects } from './world/effects.js';
import { resolveCombat, separateFighters } from './world/combat.js';
import { FIGHTERS } from './data/fighters.js';
import { HUD } from './ui/hud.js';

const scene=new ArenaScene(document.getElementById('arena'));
const input=new Input(scene.renderer.domElement),audio=new AudioSystem(),effects=new Effects(scene.scene);
const fighters=FIGHTERS.map((definition,i)=>new Fighter(definition,i?2:-2,i));
const rigs=FIGHTERS.map(def=>new FighterRig(def));rigs.forEach(rig=>scene.scene.add(rig.root));
fighters[1].facing=-1;
fighters.forEach(f=>f.onAttack=move=>audio.play(move.cost?'special':'swing'));
let screen='title',returnScreen='title',dummy='attack',hitStop=0,timer=99,rounds=[0,0],stage='intro',stageTime=0,winner=0;
const ui=document.getElementById('ui'),hud=new HUD(ui);
const neutral={is:()=>false,consume:()=>false};
const toast=(message)=>{const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.classList.remove('visible'),2200);};
function begin(){rounds=[0,0];fighters.forEach(f=>f.meter=20);newRound();show('arena');}
function newRound(){fighters.forEach((f,i)=>f.reset(i?2.5:-2.5));fighters[0].facing=1;fighters[1].facing=-1;timer=99;stage='intro';stageTime=0;hitStop=0;effects.clear();}
function show(next){
  if(next==='controls')returnScreen=screen;
  screen=next;input.flush();input.menu=screen!=='arena';input.showTouch(screen==='arena');
  if(screen==='title')ui.innerHTML=`<header><a class="brand" href="./">FURY<span>ARENA</span><i>®</i></a><div class="build-tag"><b></b> COMBAT LAB / 03</div></header><section class="title-screen"><div class="eyebrow">THE ARENA IS YOURS</div><h1>MAKE<br>YOUR<span>IMPACT.</span></h1><p>A new breed of arena fighter.<br>No limits. Just fight.</p><button class="primary" data-command="start">ENTER THE ARENA <span>↗</span></button><button class="text-button" data-go="controls">CONTROLS & INFO <span>→</span></button></section><footer><span>01 / THE TRAINING FLOOR</span><span>3D FIGHTING. PURE INSTINCT.</span><span class="input-hint">ENTER TO START</span></footer>`;
  if(screen==='arena'){hud.mount(fighters);hud.announce(stage==='intro'?'ROUND '+(rounds[0]+rounds[1]+1):'');}
  if(screen==='pause')ui.innerHTML=`<section class="overlay"><div class="menu-card"><span class="eyebrow">TAKE A BREATHER</span><h2>PAUSED.</h2><button class="primary" data-go="arena">RESUME <span>→</span></button><button data-command="dummy">PARTNER: ${dummy.toUpperCase()} <span>→</span></button><button data-go="controls">CONTROLS</button><button data-command="start">RESTART MATCH</button><button data-go="title">BACK TO TITLE</button></div></section>`;
  if(screen==='results')ui.innerHTML=`<section class="overlay results"><div class="menu-card"><span class="eyebrow">THE ARENA HAS SPOKEN</span><h2>${winner<0?'DRAW':fighters[winner].definition.name+' WINS.'}</h2><p>${rounds[0]} — ${rounds[1]} / BEST OF THREE</p><button class="primary" data-command="start">RUN IT BACK <span>↗</span></button><button data-go="title">BACK TO TITLE</button></div></section>`;
  if(screen==='controls')ui.innerHTML=`<section class="overlay"><div class="menu-card wide"><span class="eyebrow">KNOW YOUR TOOLS</span><h2>CONTROLS.</h2><div class="controls-table"><div><b>A / D · ← / →</b><span>Move / menu navigation</span></div><div><b>Space · S / ↓</b><span>Jump · crouch</span></div><div><b>J / K / L · Mouse L / R / M</b><span>Light / heavy / kick</span></div><div><b>Shift / Q / E</b><span>Guard / dodge / throw</span></div><div><b>R · ↑ or ↓ + R</b><span>50-meter special · 40-meter special</span></div><div><b>J → J → J</b><span>Chain on hit during recovery</span></div><div><b>Esc · Pad Menu</b><span>Pause / back</span></div></div><p>Gamepad: stick or D-pad move; A/✕ jump; X/□ light; Y/△ heavy; RB/R1 kick; LB/L1 guard; B/○ dodge; LT/L2 grab; RT/R2 special. Hold stick up/down for your alternate special. A confirms menus; B returns. Touch controls appear on touch devices. Pause to change the training partner between idle, block and attack.</p><button class="primary" data-command="back">BACK <span>←</span></button></div></section>`;
  ui.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{audio.unlock();audio.play('menu');show(button.dataset.go);}));
  ui.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{
    audio.unlock();audio.play('menu');const command=button.dataset.command;
    if(command==='start')begin();if(command==='back')show(returnScreen);
    if(command==='dummy'){dummy=['attack','idle','block'][(['attack','idle','block'].indexOf(dummy)+1)%3];show('pause');}
  }));
  if(screen!=='arena')ui.querySelector('button')?.focus({preventScroll:true});else document.activeElement?.blur();
}
input.onPause=()=>{if(screen==='arena')show('pause');};
input.onDisconnect=()=>{if(screen==='arena'){show('pause');toast('Controller disconnected. Reconnect or use keyboard.');}};
let aiClock=0;
function dummyInput(dt){
  const me=fighters[1],you=fighters[0],distance=Math.abs(me.x-you.x);aiClock+=dt;
  const attackNow=aiClock>.85;if(attackNow)aiClock=0;
  const attack=attackNow?['light','light','kick','heavy','special'][Math.floor(Math.random()*5)]:null;
  return {is:action=>dummy==='block'?action==='block':dummy==='attack'&&((action==='left'&&me.x>you.x&&distance>1.1)||(action==='right'&&me.x<you.x&&distance>1.1)||(action==='block'&&you.attack&&distance<2&&Math.sin(me.age*3)>.25)),consume:action=>dummy==='attack'&&distance<1.9&&action===attack};
}
function impact(event){
  const {attacker,defender,move,blocked}=event,heavy=move.damage>=16;
  effects.impact((attacker.x+defender.x)/2,defender.y+1.2,blocked,heavy);
  hitStop=blocked?.045:heavy?.095:.055;audio.play(blocked?'block':heavy?'heavy':'hit');
  navigator.vibrate?.(blocked?10:heavy?35:18);
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected);
  pad?.vibrationActuator?.playEffect?.('dual-rumble',{duration:heavy?90:45,strongMagnitude:heavy?.5:.2,weakMagnitude:.25}).catch(()=>{});
}
function update(dt){
  input.poll(dt);
  if(screen==='arena'){
    if(input.hit('pause')){show('pause');input.end();return;}
    audio.update(dt,true);
    if(hitStop>0){hitStop-=dt;input.end();return;}
    stageTime+=dt;
    if(stage==='intro'){
      hud.announce(stageTime<1?'ROUND '+(rounds[0]+rounds[1]+1):'FIGHT!',stageTime<1?'THE TRAINING FLOOR':'');
      if(stageTime>1.8){stage='fight';stageTime=0;hud.announce('');input.flush();}
    } else if(stage==='fight'){
      timer=Math.max(0,timer-dt);
      fighters[0].update(dt,input,10,fighters[1]);fighters[1].update(dt,dummyInput(dt),10,fighters[0]);
      separateFighters(...fighters,10);resolveCombat(fighters[0],fighters[1],impact);
      if(fighters.some(f=>f.health<=0)||timer===0){
        stage='ko';stageTime=0;winner=fighters[0].health===fighters[1].health?-1:fighters[0].health>fighters[1].health?0:1;
        if(winner>=0)rounds[winner]++;audio.play('ko');hud.announce(timer===0?'TIME UP':'K.O.',winner<0?'DRAW':fighters[winner].definition.name+' TAKES THE ROUND');
      }
    } else if(stage==='ko'){
      fighters.forEach((f,i)=>f.update(dt,neutral,10,fighters[1-i]));
      if(stageTime>2.6){if(rounds.some(r=>r>=2))show('results');else{newRound();hud.trail=[100,100];}}
    }
    if(screen==='arena')hud.update(fighters,timer,rounds,dt);
  } else {
    const buttons=[...ui.querySelectorAll('button')],current=buttons.indexOf(document.activeElement);
    if(input.hit('down')||input.hit('right')){buttons[(current+1)%buttons.length]?.focus();audio.play('menu');}
    if(input.hit('up')||input.hit('left')){buttons[(current-1+buttons.length)%buttons.length]?.focus();audio.play('menu');}
    if(input.hit('confirm')||input.hit('jump')||input.hit('light'))document.activeElement?.click();
    if(input.hit('pause')||input.hit('back')||input.hit('dodge'))show(screen==='pause'?'arena':screen==='controls'?returnScreen:'title');
  }
  input.end();
}
new FixedLoop(update,(alpha,dt)=>{
  const running=screen==='arena'&&hitStop<=0;
  if(screen==='title')fighters.forEach(f=>f.age+=dt);
  rigs.forEach((rig,i)=>rig.render(fighters[i],running?alpha:1,running||screen==='title'?dt:0));
  effects.update(screen==='arena'?dt:0);
  const shake=screen==='arena'?effects.shake:0;
  const fighting=screen!=='title',gap=Math.abs(fighters[0].x-fighters[1].x);
  const middle=fighting?(fighters[0].x+fighters[1].x)/2:0;
  const zoom=fighting?Math.max(9,(gap+4.2)/(2*Math.tan(scene.camera.fov*Math.PI/360)*scene.camera.aspect)):innerWidth/innerHeight<1?26:19.5;
  const blend=1-Math.exp(-dt*4);
  scene.camera.position.x+=(middle-scene.camera.position.x)*blend;
  scene.camera.position.y+=((fighting?3.5:5.8)-scene.camera.position.y)*blend;
  scene.camera.position.z+=(zoom-effects.punch-scene.camera.position.z)*blend;
  scene.camera.position.x+=(Math.random()-.5)*shake;scene.camera.position.y+=(Math.random()-.5)*shake;
  scene.camera.lookAt(scene.camera.position.x,1.1,0);
  scene.render();
}).start();
show('title');document.getElementById('loading').hidden=true;
