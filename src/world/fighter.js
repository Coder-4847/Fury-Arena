import { Mover } from './mover.js';
import { MOVES, duration } from '../data/moves.js';
const none={is:()=>false,consume:()=>false};
export class Fighter extends Mover {
  constructor(definition,x,team){
    super(x);this.definition=definition;this.speed=definition.speed;this.team=team;
    this.health=100;this.meter=0;this.attack=null;this.stun=0;this.downTime=0;
    this.invulnerable=0;this.combo=0;this.comboTime=0;this.blocking=false;this.onAttack=()=>{};
  }
  reset(x){
    this.x=this.previousX=x;this.y=this.previousY=0;this.vx=this.vy=0;this.health=100;this.attack=null;
    this.stun=this.downTime=this.invulnerable=this.combo=this.comboTime=0;this.grounded=true;this.setState('idle');
  }
  update(dt,input,bound,opponent){
    this.invulnerable=Math.max(0,this.invulnerable-dt);this.comboTime=Math.max(0,this.comboTime-dt);
    if(this.comboTime===0)this.combo=0;
    this.blocking=input.is('block')&&this.grounded&&!this.attack&&this.stun<=0;
    if(this.stun>0||this.downTime>0||this.health<=0){
      this.previousX=this.x;this.previousY=this.y;this.age+=dt;
      this.stun=Math.max(0,this.stun-dt);this.downTime=Math.max(0,this.downTime-dt);
      this.vx*=Math.exp(-8*dt);this.vy-=24*dt;
      this.x=Math.max(-bound,Math.min(bound,this.x+this.vx*dt));this.y=Math.max(0,this.y+this.vy*dt);
      this.grounded=this.y===0;if(this.grounded)this.vy=0;
      this.setState(this.health<=0||this.downTime>.35?'knockdown':this.downTime>0?'getup':'hit');return;
    }
    if(opponent&&!this.attack&&this.state!=='dodge')this.facing=opponent.x>=this.x?1:-1;
    if(this.attack){
      this.attack.time+=dt;
      const current=this.attack;
      if(current.connected&&current.move.chain&&current.time>current.move.cancel&&input.consume('light'))this.startAttack(MOVES[current.move.chain]);
      else if(current.time>=duration(current.move))this.attack=null;
    }
    if(!this.attack&&this.state!=='dodge'){
      let selected=null;
      if(input.consume('special')){const variant=input.is('up')||input.is('down')?2:1;selected=MOVES[this.definition.id+variant];if(this.meter<selected.cost)selected=null;}
      if(!selected&&input.consume('grab')&&this.grounded)selected=MOVES.grab;
      for(const action of ['heavy','kick','light'])if(!selected&&input.consume(action))selected=this.grounded?(this.weapon&&this.weapon.remaining>0&&action!=='kick'?this.weapon.definition.move:MOVES[action]):MOVES.air;
      if(selected)this.startAttack(selected);
    }
    super.update(dt,this.attack?none:input,bound);
    if(opponent&&!this.attack&&this.state!=='dodge')this.facing=opponent.x>=this.x?1:-1;
    if(this.attack){
      this.setState('attack');
      if(this.attack.move.lunge&&this.attack.time<this.attack.move.startup+.1)this.x=Math.max(-bound,Math.min(bound,this.x+this.facing*this.attack.move.lunge*dt));
    }
    if(this.state==='dodge'&&this.stateTime<.23)this.invulnerable=.035;
  }
  startAttack(move){this.attack={move,time:0,connected:false,hitTargets:new Set()};this.meter=Math.max(0,this.meter-(move.cost||0));this.onAttack(move);}
}
