export class HUD {
  constructor(root){this.root=root;this.trail=[100,100];}
  mount(fighters){
    this.trail=[100,100];
    this.root.innerHTML=`<div class="fight-hud">${this.side(fighters[0],0)}<div class="clock"><b id="timer">99</b><span>BEST OF 3</span></div>${this.side(fighters[1],1)}</div><button class="pause-button small" data-go="pause" aria-label="Pause">Ⅱ</button><div id="announcement" class="announcement"></div><div id="combo" class="combo"></div><div class="fight-caption"><span id="match-caption">TRAINING / THE FLOOR</span><span>J · K · L ATTACK <i>/</i> SHIFT GUARD <i>/</i> R FURY</span></div>`;
    this.nodes=[0,1].map(i=>({health:document.getElementById(`health-${i}`),trail:document.getElementById(`trail-${i}`),meter:document.getElementById(`meter-${i}`),rounds:document.getElementById(`rounds-${i}`)}));
  }
  side(fighter,i){return `<div class="fighter-hud ${i?'opponent':''}" style="--fighter-color:${fighter.definition.color}"><div class="nameplate"><div class="portrait">${fighter.definition.name[0]}</div><div><span>${i?'TRAINING PARTNER':'PLAYER 01'}</span><b>${fighter.definition.name}</b></div><div class="round-pips" id="rounds-${i}">○ ○</div></div><div class="health-track"><div class="damage-trail" id="trail-${i}"></div><div class="health" id="health-${i}"></div></div><div class="meter-track"><div id="meter-${i}"></div></div><div class="meter-label">FURY <span>40 / 50 TO UNLEASH</span></div></div>`;}
  update(fighters,timer,rounds,dt){
    fighters.forEach((f,i)=>{this.trail[i]=Math.max(f.health,this.trail[i]-dt*23);const n=this.nodes[i];n.health.style.width=f.health+'%';n.trail.style.width=this.trail[i]+'%';n.meter.style.width=f.meter+'%';n.rounds.textContent='● '.repeat(rounds[i])+'○ '.repeat(Math.max(0,2-rounds[i]));});
    document.getElementById('timer').textContent=String(Math.ceil(timer)).padStart(2,'0');
    const combo=document.getElementById('combo'),fighter=fighters.find(f=>f.combo>=2&&f.comboTime>0);
    combo.innerHTML=fighter?`<b>${fighter.combo}</b><span>HIT COMBO</span>`:'';
    combo.classList.toggle('right',fighter?.team===1);
  }
  announce(title,subtitle=''){const node=document.getElementById('announcement'),markup=title?`<b>${title}</b><span>${subtitle}</span>`:'';if(node.innerHTML!==markup)node.innerHTML=markup;}
}
