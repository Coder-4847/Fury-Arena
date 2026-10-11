const lerp=(a,b,t)=>a+(b-a)*t;
/** Render between simulation samples instead of repeating 60 Hz positions. */
export function interpolateFighter(f,alpha=1,frozen=false){
 const p=f.renderPrevious;if(!p||frozen)return f;
 const t=Math.max(0,Math.min(1,alpha)),v={...f,x:lerp(p.x,f.x,t),y:lerp(p.y,f.y,t),age:lerp(p.age,f.age,t),stride:lerp(p.stride,f.stride,t)};
 if(p.state===f.state)v.clock=lerp(p.clock,f.clock,t);
 if(f.attack&&p.attackKey===f.attack.key)v.attack={...f.attack,t:lerp(p.attackT,f.attack.t,t)};
 if(f.sequence)v.sequenceTime=lerp(f.sequence.prevT,f.sequence.t,t);
 return v;
}
