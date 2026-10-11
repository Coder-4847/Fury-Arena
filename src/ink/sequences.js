const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
export const FINISH_THRESHOLD=25;
export function canFinish(a,b){return a.health>0&&b.health>0&&b.health<=FINISH_THRESHOLD&&a.ink>=50&&a.grounded&&b.grounded&&!a.sequence&&!b.sequence;}
export function beginSequence(a,b,kind,emit=()=>{}){
 if(a.sequence||b.sequence||!a.grounded||!b.grounded||b.invuln>0||Math.abs(a.x-b.x)>105)return false;
 const finish=kind==='finish'||kind==='finishLow';if(finish&&!canFinish(a,b))return false;
 const direction=a.x>310?-1:a.x < -310?1:a.facing,origin=clamp(a.x,-460,460);a.facing=direction;
 const s={a,b,kind,finish,t:0,prevT:0,duration:finish?1.9:1.15,origin,direction,startA:a.x,startB:b.x,impacted:false};
 for(const f of [a,b]){f.sequence=s;f.attack=null;f.vx=f.vy=0;f.guard=f.duck=false;f.stun=0;f.clock=0;}
 a.state='throwing';b.state='captured';if(finish)a.ink-=50;
 emit({type:'grapple',a,b,name:kind==='finish'?'THE SILENT BELL':kind==='finishLow'?'FALLING MOON':kind==='reap'?'REAPING THROW':'SHOULDER THROW'});return true;
}
export function stepSequences(fighters,dt,emit=()=>{}){
 for(const a of fighters){const s=a.sequence;if(!s||s.a!==a)continue;const b=s.b;s.prevT=s.t;s.t=Math.min(s.duration,s.t+dt);const t=s.t,d=s.direction,settle=smooth(t/.2);a.x=lerp(s.startA,s.origin,settle);b.x=lerp(s.startB,s.origin+d*48,settle);b.y=0;
  if(s.kind==='throw'){
   if(t>.2&&t<.8){const u=clamp((t-.2)/.6,0,1);b.x=s.origin+d*(48-68*Math.sin(u*Math.PI)+120*u);b.y=Math.sin(u*Math.PI)*125;}
   if(t>=.8)b.x=s.origin+d*168;
  }else if(s.kind==='reap'){
   const u=smooth((t-.25)/.42);b.x=s.origin+d*(48+72*u);b.y=Math.sin(u*Math.PI)*30;
  }else if(s.kind==='finish'){
   const u=clamp((t-.65)/.85,0,1);b.x=s.origin+d*(48+115*smooth(u));b.y=Math.sin(u*Math.PI)*155;
  }else{
   const u=smooth((t-.55)/.9);a.y=t>.55&&t<1.5?Math.sin((t-.55)/.95*Math.PI)*85:0;b.x=s.origin+d*(48+110*u);b.y=Math.sin(u*Math.PI)*72;
  }
  const impact=s.finish?1.5:s.kind==='reap'?.67:.8;
  if(t>=impact&&!s.impacted){s.impacted=true;const damage=s.finish?b.health:s.kind==='reap'?12:16;b.health=Math.max(0,b.health-damage);b.y=0;b.hitFlash=.1;b.knocked=true;a.ink=clamp(a.ink+8,0,100);b.ink=clamp(b.ink+4,0,100);emit({type:'slam',a,b,hy:15,damage,move:{damage,cost:s.finish?50:0,name:s.finish?'Finisher':'Throw'}});}
  if(s.impacted)b.y=0;
  a.grounded=a.y===0;b.grounded=b.y===0;
  if(t>=s.duration){a.sequence=b.sequence=null;a.state='idle';a.clock=0;b.clock=0;b.state=b.health<=0?'ko':'down';b.stun=b.health<=0?0:.55;b.invuln=.3;b.y=0;b.grounded=true;b.vx=0;a.px=a.x;b.px=b.x;a.py=a.y;b.py=b.y;if(b.health<=0)emit({type:'ko',a,b});}
 }
}
