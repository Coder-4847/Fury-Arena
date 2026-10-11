import { FixedLoop } from './core/loop.js';
import { Input, PLAYER_TWO_KEYS } from './core/input.js';
import { AudioSystem } from './core/audio.js';
import { MatchState } from './core/match.js';
import { loadSettings, saveSettings } from './core/settings.js';
import { ArenaScene } from './world/scene.js';
import { Fighter } from './world/fighter.js';
import { FighterRig } from './world/rig.js';
import { FighterAI } from './world/ai.js';
import { Effects } from './world/effects.js';
import { resolveCombat, separateFighters } from './world/combat.js';
import { WeaponSystem } from './world/weapons.js';
import { MapWorld } from './world/maps.js';
import { FIGHTERS } from './data/fighters.js';
import { MAPS } from './data/maps.js';
import { MODES } from './data/modes.js';
import { HUD } from './ui/hud.js';
import { Screens } from './ui/screens.js';
import { createPortraits } from './ui/portraits.js';

const scene=new ArenaScene(document.getElementById('arena'));
const input=new Input(scene.renderer.domElement),input2=new Input(scene.renderer.domElement,{keys:PLAYER_TWO_KEYS,padIndex:1,secondary:true});
const audio=new AudioSystem(),effects=new Effects(scene.scene),ai=new FighterAI();
const settings=loadSettings(),portraits=createPortraits(FIGHTERS);
const fighters=[],rigs=[],ui=document.getElementById('ui'),hud=new HUD(ui,portraits),screens=new Screens(ui,action,portraits);
let screen='title',returnScreen='title',dummy='idle',hitStop=0,timer=99,stage='intro',stageTime=0;
let mode=MODES[0],selectedMap=MAPS[0],selectedFighters=[0,1],selectPlayer=0,match=new MatchState(mode);
const neutral={is:()=>false,consume:()=>false};
const toast=(message)=>{const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.classList.remove('visible'),2200);};
const weapons=new WeaponSystem(scene.scene,rigs,impact,message=>{toast(message);audio.play('pickup');});
const world=new MapWorld(scene,impact,toast,weapons);
function buildFighters(){
  weapons.reset(fighters);
  for(const rig of rigs){rig.root.removeFromParent();rig.root.traverse(n=>n.geometry?.dispose());Object.values(rig.materials).forEach(m=>m.dispose());}
  fighters.length=rigs.length=0;
  selectedFighters.forEach((index,i)=>{const def=FIGHTERS[index],fighter=new Fighter(def,i?2.5:-2.5,i),rig=new FighterRig(def);fighter.facing=i?-1:1;fighter.onAttack=move=>audio.play(move.cost?'special':'swing');fighters.push(fighter);rigs.push(rig);scene.scene.add(rig.root);});
}
function applySettings(){
  audio.setVolume(settings.volume);audio.musicVolume=settings.music;
  input.touchEnabled=settings.touch==='on'||settings.touch==='auto'&&matchMedia('(pointer: coarse)').matches;
  input.showTouch(screen==='arena');
  scene.renderer.setPixelRatio(Math.min(devicePixelRatio,{low:1,medium:1.25,high:1.75}[settings.quality]));
  scene.renderer.shadowMap.enabled=settings.quality!=='low';scene.renderer.shadowMap.needsUpdate=true;scene.resize();
}
function begin(){match=new MatchState(mode);buildFighters();fighters.forEach(f=>f.meter=mode.id==='training'?100:20);weapons.interval=mode.spawnInterval;input.localVersus=mode.id==='local';newRound();show('arena');}
function newRound(){
  fighters.forEach((f,i)=>{f.reset(i?2.5:-2.5);f.health=match.nextHealth[i];f.facing=i?-1:1;});
  timer=mode.time;stage='intro';stageTime=hitStop=0;effects.clear();weapons.reset(fighters);world.load(selectedMap);ai.buffer.clear();ai.held.clear();ai.next=0;
}
function show(next){
  const old=screen,focused=document.activeElement?.dataset?.action;
  if((next==='controls'||next==='settings')&&next!==screen)returnScreen=screen;
  screen=next;input.flush();input2.flush();input.menu=input2.menu=screen!=='arena';input.showTouch(screen==='arena');
  if(screen==='arena'){hud.mount(fighters,mode);hud.announce(stage==='intro'?'ROUND '+match.round:stage==='ko'?'K.O.':'');}
  else screens.render(screen,{settings,mode,match,fighters,dummy,selectPlayer});
  if(screen!=='arena'){
    const focus=old===next&&focused?[...ui.querySelectorAll('button')].find(b=>b.dataset.action===focused):null;
    (focus||ui.querySelector('button'))?.focus({preventScroll:true});
  }else document.activeElement?.blur();
}
function action(command){
  audio.unlock();audio.play('menu');const [kind,value]=command.split(':');
  if(kind==='go'){if(value==='fighters')selectPlayer=0;show(value);}
  if(kind==='back')show(returnScreen);
  if(kind==='mode'){mode=MODES[Number(value)];selectPlayer=0;show('fighters');}
  if(kind==='fighter'){
    selectedFighters[selectPlayer]=Number(value);
    if(mode.id==='local'&&selectPlayer===0){selectPlayer=1;show('fighters');}
    else{if(mode.id!=='local')selectedFighters[1]=1-selectedFighters[0];show('maps');}
  }
  if(kind==='map'){selectedMap=MAPS[Number(value)];begin();}
  if(kind==='restart')begin();
  if(kind==='dummy'){dummy=['idle','block','attack'][(['idle','block','attack'].indexOf(dummy)+1)%3];show('pause');}
  if(kind==='setting'){
    const choices={difficulty:[0,1,2],volume:[0,.2,.4,.6,.8,1],music:[0,.125,.25,.375,.5],quality:['low','medium','high'],touch:['auto','on','off']}[value];
    settings[value]=choices[(choices.indexOf(settings[value])+1)%choices.length];saveSettings(settings);applySettings();show('settings');
  }
  if(kind==='fullscreen'){
    const request=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
    request?.catch(()=>toast('Fullscreen is unavailable in this browser.'));
  }
}
function pause(){if(screen==='arena')show('pause');}
input.onPause=input2.onPause=pause;
input.onDisconnect=input2.onDisconnect=()=>{if(screen==='arena'){show('pause');toast('Controller disconnected. Reconnect or use keyboard.');}};
scene.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();toast('Graphics context lost. Reload the page to restore the arena.');});
function impact({attacker,defender,move,blocked}){
  const heavy=move.damage>=16;effects.impact((attacker.x+defender.x)/2,defender.y+1.2,blocked,heavy);
  hitStop=Math.max(hitStop,blocked?.045:heavy?.095:.055);audio.play(blocked?'block':heavy?'heavy':'hit');
  navigator.vibrate?.(blocked?10:heavy?35:18);
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.index===defender.team);
  pad?.vibrationActuator?.playEffect?.('dual-rumble',{duration:heavy?90:45,strongMagnitude:heavy?.5:.2,weakMagnitude:.25}).catch(()=>{});
}
function back(){show(screen==='pause'?'arena':['settings','controls'].includes(screen)?returnScreen:screen==='maps'?'fighters':screen==='fighters'?'modes':'title');}
function update(dt){
  input.poll(dt);input2.poll(dt);
  if(screen==='arena'){
    if(input.hit('pause')||input2.hit('pause')){show('pause');endInput();return;}
    audio.update(dt,true);
    if(hitStop>0){hitStop-=dt;endInput();return;}
    stageTime+=dt;
    if(stage==='intro'){
      hud.announce(stageTime<1?(mode.id==='survival'?'WAVE ':'ROUND ')+match.round:'FIGHT!',stageTime<1?`${fighters[0].definition.name} / ${fighters[1].definition.name} · ${selectedMap.name}`:'');
      if(stageTime>1.8){stage='fight';stageTime=0;hud.announce('');input.flush();input2.flush();}
    }else if(stage==='fight'){
      timer=Math.max(0,timer-dt);
      const opponentInput=mode.id==='local'?input2:ai.update(dt,fighters[1],fighters[0],world,weapons,Math.min(2,settings.difficulty+(mode.id==='survival'&&match.round>3?1:0)),mode.id==='training'?dummy:'attack');
      const inputs=[input,opponentInput];
      for(let i=0;i<2;i++){const f=fighters[i];if(mode.id==='training')f.meter=100;world.handle(f,inputs[i]);weapons.handle(f,inputs[i]);f.update(dt,inputs[i],selectedMap.bound,fighters[1-i]);world.physics(f);}
      world.update(dt,fighters);separateFighters(...fighters,selectedMap.bound);resolveCombat(...fighters,impact);weapons.update(dt,fighters);
      const weapon=fighters[0].weapon;
      document.getElementById('match-caption').textContent=world.hint(fighters[0])||(weapon?`${weapon.definition.name} / ${weapon.remaining} ${weapon.definition.ammo?'AMMO':'USES'} · G THROW`:`${selectedMap.name} · F PICK UP · E INTERACT`);
      if(fighters.some(f=>f.health<=0)||timer===0){match.finish(fighters.map(f=>f.health));stage='ko';stageTime=0;audio.play('ko');hud.announce(timer===0?'TIME UP':'K.O.',match.winner<0?'DRAW':fighters[match.winner].definition.name+' TAKES THE ROUND');}
    }else if(stage==='ko'){
      fighters.forEach((f,i)=>{f.interaction=null;f.update(dt,neutral,selectedMap.bound,fighters[1-i]);world.physics(f);});
      if(stageTime>2.6){if(match.done)show('results');else{match.advance();newRound();hud.trail=[100,100];}}
    }
    if(screen==='arena')hud.update(fighters,timer,match.scores,dt);
  }else{
    const hit=key=>input.hit(key)||input2.hit(key),buttons=[...ui.querySelectorAll('button')],current=buttons.indexOf(document.activeElement);
    if(hit('down')||hit('right')){buttons[(current+1)%buttons.length]?.focus();audio.play('menu');}
    if(hit('up')||hit('left')){buttons[(current-1+buttons.length)%buttons.length]?.focus();audio.play('menu');}
    if(hit('confirm')||hit('jump')||hit('light'))document.activeElement?.click();
    if(hit('pause')||hit('back')||hit('dodge'))back();
  }
  endInput();
}
function endInput(){input.end();input2.end();}
new FixedLoop(update,(alpha,dt)=>{
  const running=screen==='arena'&&hitStop<=0,preview=['title','fighters','modes','maps'].includes(screen);
  if(preview)fighters.forEach(f=>f.age+=dt);
  rigs.forEach((rig,i)=>rig.render(fighters[i],running?alpha:1,running||preview?dt:0));
  effects.update(screen==='arena'?dt:0);
  const shake=screen==='arena'?effects.shake:0,fighting=!preview,gap=Math.abs(fighters[0].x-fighters[1].x),middle=fighting?(fighters[0].x+fighters[1].x)/2:0;
  const zoom=fighting?Math.max(9,(gap+4.2)/(2*Math.tan(scene.camera.fov*Math.PI/360)*scene.camera.aspect)):innerWidth/innerHeight<1?26:19.5;
  const blend=1-Math.exp(-dt*4);scene.camera.position.x+=(middle-scene.camera.position.x)*blend;scene.camera.position.y+=((fighting?3.5:5.8)-scene.camera.position.y)*blend;scene.camera.position.z+=(zoom-effects.punch-scene.camera.position.z)*blend;
  scene.camera.position.x+=(Math.random()-.5)*shake;scene.camera.position.y+=(Math.random()-.5)*shake;scene.camera.lookAt(scene.camera.position.x,1.1,0);scene.render();
}).start();
buildFighters();world.load(selectedMap);applySettings();show('title');document.getElementById('loading').hidden=true;
