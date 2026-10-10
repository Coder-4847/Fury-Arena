import * as THREE from '../vendor/three.module.js';
import { FixedLoop } from './core/loop.js';
import { Input } from './core/input.js';
import { ArenaScene } from './world/scene.js';
import { Mover } from './world/mover.js';
import { FighterRig } from './world/rig.js';
import { FIGHTERS } from './data/fighters.js';

const scene=new ArenaScene(document.getElementById('arena'));
const input=new Input(scene.renderer.domElement);
const mover=new Mover(-2);
const rig=new FighterRig(FIGHTERS[0]);scene.scene.add(rig.root);
const rival=new Mover(2);rival.facing=-1;
const rivalRig=new FighterRig(FIGHTERS[1]);scene.scene.add(rivalRig.root);
let screen='title';
const ui=document.getElementById('ui');
function show(next) {
  screen=next; input.flush(); input.menu=screen!=='arena'; input.showTouch(screen==='arena');
  if(screen==='title') ui.innerHTML=`<header><a class="brand" href="./">FURY<span>ARENA</span><i>®</i></a><div class="build-tag"><b></b> FOUNDATION / 01</div></header><section class="title-screen"><div class="eyebrow">THE ARENA IS YOURS</div><h1>MAKE<br>YOUR<span>IMPACT.</span></h1><p>A new breed of arena fighter.<br>No limits. Just fight.</p><button class="primary" data-go="arena">ENTER THE ARENA <span>↗</span></button><button class="text-button" data-go="controls">CONTROLS & INFO <span>→</span></button></section><footer><span>01 / THE TRAINING FLOOR</span><span>3D FIGHTING. PURE INSTINCT.</span><span class="input-hint">ENTER TO START</span></footer>`;
  if(screen==='arena') ui.innerHTML=`<div class="practice-top"><div><span class="eyebrow">FOUNDATION / MOVEMENT LAB</span><h2>THE TRAINING FLOOR</h2></div><button class="small" data-go="pause" aria-label="Pause">Ⅱ</button></div><div class="practice-bottom"><span><kbd>A</kbd><kbd>D</kbd> MOVE <i>/</i> <kbd>SPACE</kbd> JUMP</span><span id="device">KEYBOARD READY</span></div>`;
  if(screen==='pause') ui.innerHTML=`<section class="overlay"><div class="menu-card"><span class="eyebrow">TAKE A BREATHER</span><h2>PAUSED.</h2><button class="primary" data-go="arena">RESUME <span>→</span></button><button data-go="controls">CONTROLS</button><button data-go="title">BACK TO TITLE</button></div></section>`;
  if(screen==='controls') ui.innerHTML=`<section class="overlay"><div class="menu-card wide"><span class="eyebrow">KNOW YOUR TOOLS</span><h2>CONTROLS.</h2><p>Movement is live in this foundation build. Combat actions are mapped for the next phases.</p><div class="controls-table"><div><b>A / D · ← / →</b><span>Move / menu navigation</span></div><div><b>Space · Pad A / ✕</b><span>Jump / confirm on gamepad</span></div><div><b>J / K / L</b><span>Light / heavy / kick</span></div><div><b>Shift / Q / E</b><span>Block / dodge / grab</span></div><div><b>R / F / G</b><span>Special / use / drop</span></div><div><b>Esc · Pad Menu</b><span>Pause / back</span></div></div><p>Gamepad: left stick or D-pad to move; X/□ light, Y/△ heavy, RB/R1 kick, LB/L1 guard, B/○ dodge, LT/L2 grab, RT/R2 special, View/Share use, L3 drop. Touch controls appear on touch devices.</p><button class="primary" data-go="${input.menu?'title':'arena'}">BACK <span>←</span></button></div></section>`;
  ui.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.go)));
  ui.querySelector('button')?.focus({preventScroll:true});
}
input.onPause=()=>{if(screen==='arena')show('pause');};
input.onDisconnect=()=>{if(screen==='arena')show('pause');};
function update(dt) {
  input.poll(dt);
  if(screen==='arena') {
    if(input.hit('pause')) show('pause'); else mover.update(dt,input);
    const device=document.getElementById('device'); if(device)device.textContent=input.device.toUpperCase()+' READY';
  } else {
    const buttons=[...ui.querySelectorAll('button')];
    const current=buttons.indexOf(document.activeElement);
    if(input.hit('down')||input.hit('right'))buttons[(current+1)%buttons.length]?.focus();
    if(input.hit('up')||input.hit('left'))buttons[(current-1+buttons.length)%buttons.length]?.focus();
    if(input.hit('confirm')||input.hit('jump')||input.hit('light'))document.activeElement?.click();
    if(input.hit('pause')||input.hit('back')||input.hit('dodge'))show(screen==='pause'?'arena':'title');
  }
  input.end();
}
new FixedLoop(update,(alpha,dt)=>{
  rig.render(mover,alpha,dt);rival.age+=dt;rivalRig.render(rival,alpha,dt);
  scene.render();
}).start();
show('title'); document.getElementById('loading').hidden=true;
