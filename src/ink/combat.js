import { strikePoint, RISE_TIME, DODGE_TIME } from './motion.js';
import { beginSequence, stepSequences, canFinish } from './sequences.js';
export const MOVES = {
 jab:{name:'Straight fist',duration:.36,start:.10,end:.15,range:105,height:137,damage:5,stun:.26,push:45,pose:'jab',chain:'cross'},
 cross:{name:'Cross',duration:.42,start:.13,end:.20,range:116,height:131,damage:7,stun:.29,push:70,pose:'cross',chain:'hook'},
 hook:{name:'Turning palm',duration:.5,start:.16,end:.24,range:115,height:121,damage:10,stun:.32,push:130,pose:'hook'},
 low:{name:'Body blow',duration:.38,start:.12,end:.2,range:96,height:66,damage:6,stun:.24,push:55,pose:'low'},
 palm:{name:'Iron palm',duration:.62,start:.23,end:.32,range:126,height:110,damage:15,stun:.4,push:200,pose:'palm'},
 upper:{name:'Rising fist',duration:.63,start:.19,end:.29,range:99,height:125,damage:12,stun:.43,push:65,lift:360,pose:'upper'},
 kick:{name:'Front kick',duration:.62,start:.20,end:.25,range:148,height:103,damage:9,stun:.45,push:125,pose:'kick',chain:'round'},
 round:{name:'Wheel kick',duration:.74,start:.28,end:.35,range:162,height:151,damage:14,stun:.4,push:200,pose:'round'},
 sweep:{name:'Reaping sweep',duration:.66,start:.23,end:.33,range:150,height:25,damage:10,stun:.7,push:140,knock:true,pose:'sweep',low:true},
 airjab:{name:'Falling fist',duration:.4,start:.1,end:.2,range:105,height:104,damage:7,stun:.25,push:80,pose:'airjab'},
 airkick:{name:'Flying side kick',duration:.58,start:.13,end:.31,range:156,height:75,damage:12,stun:.36,push:180,pose:'airkick'},
 throw:{name:'Shoulder throw',duration:.76,start:.2,end:.28,range:66,height:75,damage:14,stun:.8,push:210,lift:220,knock:true,unblock:true,grapple:true,pose:'throw'},
 reap:{name:'Reaping throw',duration:.5,start:.17,end:.25,range:66,height:65,damage:12,stun:.8,pose:'throw',unblock:true,grapple:true},
 finish:{name:'The Silent Bell',duration:.55,start:.18,end:.28,range:80,height:80,damage:0,pose:'palm',unblock:true,grapple:true},
 finishLow:{name:'Falling Moon',duration:.55,start:.18,end:.28,range:80,height:65,damage:0,pose:'sweep',unblock:true,grapple:true},
 special:{name:'Thousand winds',duration:.92,start:.29,end:.48,range:220,height:98,damage:24,stun:.7,push:350,lift:180,knock:true,cost:60,pose:'special'},
};
export const neutral={is:()=>false,consume:()=>false};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class InkFighter {
 constructor(x,id){this.id=id;this.reset(x);}
 reset(x){Object.assign(this,{x,y:0,px:x,py:0,vx:0,vy:0,facing:this.id?-1:1,health:100,ink:20,state:'idle',clock:0,age:0,stun:0,invuln:0,attack:null,duck:false,guard:false,guardAge:1,combo:0,lastHit:-10,hitFlash:0,grounded:true,knocked:false,landTime:0,dodgeDir:1,trail:[],wins:0,sequence:null,stride:0,prevStride:0,renderPrevious:null});}
 start(key,emit){const m=MOVES[key];if(!m||this.ink<(m.cost||0))return false;this.ink-=m.cost||0;this.attack={key,m,t:0,hit:false,connected:false};this.state='attack';this.clock=0;emit?.({type:'swing',f:this,move:m});return true;}
 tick(dt,input,other,emit=()=>{}){
  this.renderPrevious={state:this.state,x:this.x,y:this.y,clock:this.clock,age:this.age,stride:this.stride,attackT:this.attack?.t,attackKey:this.attack?.key};this.px=this.x;this.py=this.y;this.prevStride=this.stride;this.stride+=this.vx*dt/168;this.age+=dt;this.clock+=dt;this.landTime=Math.max(0,this.landTime-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.invuln=Math.max(0,this.invuln-dt);this.stun=Math.max(0,this.stun-dt);
  if(this.sequence)return;const wasGround=this.grounded;
  if(this.y>0||this.vy>0){this.fallSpeed=Math.max(0,-this.vy);this.vy-=1450*dt;this.y+=this.vy*dt;if(this.y<=0){this.y=0;this.fallSpeed=Math.max(this.fallSpeed,-this.vy);this.vy=0;if(!wasGround){this.landTime=.16;this.landPower=clamp(this.fallSpeed/700,.3,1.5);emit({type:'land',f:this});}}}this.grounded=this.y===0;
  if(this.health<=0){this.state='ko';this.attack=null;this.vx*=Math.exp(-5*dt);this.x+=this.vx*dt;this.x=clamp(this.x,-495,495);return;}
  if(this.stun>0){this.state=this.knocked?'down':'hit';this.attack=null;this.duck=false;this.guard=false;this.vx*=Math.exp(-5*dt);this.x=clamp(this.x+this.vx*dt,-495,495);return;}
  if(this.knocked){this.knocked=false;this.state='rise';this.clock=0;this.invuln=.3;}
  if(this.state==='rise'&&this.clock<RISE_TIME)return;
  if(this.state==='dodge'&&this.clock<DODGE_TIME){this.vx=this.dodgeDir*460*Math.sin(Math.PI*this.clock/DODGE_TIME);this.x=clamp(this.x+this.vx*dt,-495,495);return;}
  if(this.attack){this.attack.t+=dt;const a=this.attack;const chain=a.connected&&a.t>a.m.end+.04&&a.t>a.m.duration*.55;if(chain&&input.consume(a.m.pose==='kick'?'kick':'light')&&a.m.chain){this.start(a.m.chain,emit);return;}if(a.t<a.m.duration){this.vx*=Math.exp(-9*dt);this.x=clamp(this.x+this.vx*dt,-495,495);return;}this.attack=null;}
  if(Math.abs(other.x-this.x)>8)this.facing=other.x>this.x?1:-1;
  this.duck=input.is('down')&&this.grounded;this.guard=input.is('block')&&this.grounded;this.guardAge=this.guard?this.guardAge+dt:0;
  const axis=Number(input.is('right'))-Number(input.is('left'));
  if(input.consume('dodge')&&this.grounded){this.state='dodge';this.clock=0;this.dodgeDir=axis||-this.facing;this.invuln=.29;this.guard=false;emit({type:'dodge',f:this});return;}
  if(input.consume('jump')&&this.grounded){this.vy=680;this.grounded=false;this.duck=false;this.guard=false;emit({type:'jump',f:this});}
  let move=null;
  if(input.consume('use')&&canFinish(this,other))move=this.duck?'finishLow':'finish';
  else if(input.consume('special'))move='special';
  else if(input.consume('grab')&&this.grounded)move=this.duck?'reap':'throw';
  else if(input.consume('heavy'))move=this.grounded?(this.duck||input.is('up')?'upper':'palm'):'airjab';
  else if(input.consume('kick'))move=this.grounded?(this.duck?'sweep':'kick'):'airkick';
  else if(input.consume('light'))move=this.grounded?(this.duck?'low':input.is('up')?'upper':'jab'):'airjab';
  if(move&&this.start(move,emit)){this.guard=false;this.vx=axis*60;return;}
  const speed=this.duck?85:this.guard?65:245;const target=axis*speed;this.vx+=(target-this.vx)*(1-Math.exp(-22*dt));this.x=clamp(this.x+this.vx*dt,-495,495);
  const next=this.grounded?(this.duck?(this.guard?'lowguard':'duck'):this.guard?'guard':Math.abs(this.vx)>15?'walk':'idle'):(this.vy>0?'jump':'fall');if(this.state!==next){this.state=next;this.clock=0;}
 }
}
export function resolveInkCombat(fighters,time,emit=()=>{}){
 stepSequences(fighters,1/60,emit);const contacts=[];
 for(const a of fighters){const b=fighters.find(f=>f!==a),s=a.attack;if(a.sequence||b.sequence||!s||s.hit||s.t<s.m.start||s.t>s.m.end||b.health<=0||b.invuln>0)continue;
  const m=s.m,point=m.grapple?[m.range,-m.height]:strikePoint(m,s.t),dx=(b.x-a.x)*a.facing,hy=a.y-point[1],hurtTop=b.y+(b.state==='down'||b.state==='ko'?42:b.duck?87:180),hurtBottom=b.y+12;
  if(dx<0||dx>point[0]+20||hy<hurtBottom-15||hy>hurtTop+12)continue;
  contacts.push({a,b,s,m,hy});
 }
 for(const {a,b,s,m,hy} of contacts){if(a.sequence||b.sequence)continue;s.hit=true;s.connected=true;if(m.grapple){beginSequence(a,b,s.key,emit);continue;}const facing=(a.x-b.x)*b.facing>0;const guarded=b.guard&&facing&&!m.unblock&&(!m.low||b.duck);const parry=guarded&&b.guardAge<.14;
  if(parry){a.stun=.35;a.stunTotal=.35;a.reaction='recoil';a.clock=0;a.attack=null;a.vx=-a.facing*100;b.ink=clamp(b.ink+12,0,100);emit({type:'parry',a,b,hy,move:m});continue;}
  const chained=b.stun>0;const damage=guarded?Math.max(1,Math.floor(m.damage*.12)):m.damage;b.health=Math.max(0,b.health-damage);b.hitFlash=.07;b.reaction=hy-b.y>125?'head':hy-b.y<55?'leg':'body';b.clock=0;b.stun=guarded?.12:m.stun;b.stunTotal=b.stun;b.vx=a.facing*m.push*(guarded?.35:1);b.guard=guarded;b.attack=null;
  if(!guarded){b.knocked=!!m.knock;b.vy=m.lift||b.vy;b.duck=false; a.combo=chained&&time-a.lastHit<.85?a.combo+1:1;a.lastHit=time;}
  a.ink=clamp(a.ink+(guarded?3:8),0,100);b.ink=clamp(b.ink+4,0,100);
  emit({type:guarded?'block':'hit',a,b,x:b.x-a.facing*16,hy,move:m,damage});
  if(b.health===0){b.clock=0;emit({type:'ko',a,b});}
 }
 // Bodies separate only while both stand on the same plane; jumping can cross over.
 const [a,b]=fighters,dx=b.x-a.x;if(!a.sequence&&!b.sequence&&Math.abs(a.y-b.y)<115&&Math.abs(dx)<49&&a.state!=='dodge'&&b.state!=='dodge'){const push=(49-Math.abs(dx))/2,sign=dx>=0?1:-1;a.x=clamp(a.x-push*sign,-495,495);b.x=clamp(b.x+push*sign,-495,495);}
}
export class InkAI {
 constructor(random=Math.random){this.random=random;this.timer=0;this.intent='idle';this.held=new Set();this.presses=new Set();}
 update(dt,self,foe,difficulty=1,passive=false){this.presses.clear();this.timer-=dt;if(passive){this.held.clear();return this;}if(this.timer<=0){this.timer=.12+this.random()*(.23-difficulty*.05);this.held.clear();const d=Math.abs(foe.x-self.x),toward=foe.x>self.x?'right':'left';
  if(foe.attack&&d<185&&this.random()<.38+difficulty*.2){if(foe.attack.m.low)this.held.add('down');this.held.add('block');if(this.random()<.17)this.presses.add('dodge');}
  else if(d>102){this.held.add(toward);if(d>230&&this.random()<.08)this.presses.add('jump');}
  else {const r=this.random();if(r<.10)this.presses.add('dodge');else if(r<.18){this.presses.add('jump');this.presses.add('kick');}else if(r<.3){this.held.add('down');this.presses.add('kick');}else if(r<.38&&self.ink>=60)this.presses.add('special');else if(r<.46&&d<65)this.presses.add('grab');else if(r<.6)this.presses.add('heavy');else if(r<.78)this.presses.add('kick');else this.presses.add('light');}
 }return this;}
 is(a){return this.held.has(a);}consume(a){if(this.presses.has(a)){this.presses.delete(a);return true;}return false;}
}
