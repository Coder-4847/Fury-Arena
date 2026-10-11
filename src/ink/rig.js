import { strikePose, articulate, reactionPose } from './motion.js';
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
const base={hip:[-6,-83],neck:[1,-149],head:[4,-169],backHand:[17,-137],frontHand:[43,-129],backFoot:[-38,-4],frontFoot:[44,-4]};
const pose=(changes={})=>({...base,...changes});
const targets={
 jab:pose({neck:[12,-147],head:[17,-168],frontHand:[90,-137],backHand:[10,-125],hip:[0,-83]}),
 cross:pose({neck:[20,-146],head:[24,-166],backHand:[98,-130],frontHand:[31,-121],hip:[9,-84],backFoot:[-27,-4]}),
 hook:pose({neck:[22,-142],head:[26,-165],frontHand:[96,-113],backHand:[28,-139],hip:[15,-78]}),
 low:pose({hip:[-7,-50],neck:[21,-88],head:[25,-108],frontHand:[90,-65],backHand:[8,-83],backFoot:[-50,-4],frontFoot:[43,-4]}),
 palm:pose({hip:[14,-73],neck:[31,-133],head:[31,-155],frontHand:[107,-113],backHand:[55,-110],backFoot:[-37,-4],frontFoot:[63,-4]}),
 upper:pose({hip:[9,-79],neck:[14,-143],head:[5,-166],frontHand:[71,-195],backHand:[-13,-120],backFoot:[-26,-4],frontFoot:[35,-4]}),
 kick:pose({hip:[5,-99],neck:[-21,-157],head:[-25,-180],frontHand:[25,-128],backHand:[-42,-124],frontFoot:[106,-105],backFoot:[-13,-4]}),
 round:pose({hip:[5,-99],neck:[-26,-141],head:[-33,-164],frontHand:[4,-110],backHand:[-48,-101],frontFoot:[98,-141],backFoot:[-5,-4]}),
 sweep:pose({hip:[-6,-27],neck:[-22,-69],head:[-29,-91],frontHand:[37,-42],backHand:[-64,-5],frontFoot:[98,-19],backFoot:[-43,-4]}),
 airjab:pose({hip:[-12,-91],neck:[12,-141],head:[20,-162],frontHand:[105,-102],backHand:[-3,-134],frontFoot:[30,-53],backFoot:[-60,-48]}),
 airkick:pose({hip:[-3,-86],neck:[-41,-131],head:[-51,-151],frontHand:[16,-116],backHand:[-62,-100],frontFoot:[102,-75],backFoot:[-50,-53]}),
 throw:pose({hip:[3,-73],neck:[-7,-134],head:[-12,-155],frontHand:[-38,-174],backHand:[-64,-161],backFoot:[-38,-4],frontFoot:[47,-4]}),
 special:pose({hip:[23,-70],neck:[40,-128],head:[38,-151],frontHand:[111,-98],backHand:[106,-112],backFoot:[-40,-4],frontFoot:[67,-4]})
};
function blend(a,b,t){return Object.fromEntries(Object.keys(base).map(k=>[k,[mix(a[k][0],b[k][0],t),mix(a[k][1],b[k][1],t)]]));}
function joint(a,b,l1,l2,bend=1){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.min(Math.hypot(dx,dy),l1+l2-.1),angle=Math.atan2(dy,dx),q=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*Math.max(d,.1)))));return[a[0]+Math.cos(angle+q*bend)*l1,a[1]+Math.sin(angle+q*bend)*l1];}
function bone(c,a,b,w1,w2,color){const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),nx=Math.sin(ang),ny=-Math.cos(ang);c.fillStyle=color;c.beginPath();c.moveTo(a[0]+nx*w1,a[1]+ny*w1);c.lineTo(b[0]+nx*w2,b[1]+ny*w2);c.lineTo(b[0]-nx*w2,b[1]-ny*w2);c.lineTo(a[0]-nx*w1,a[1]-ny*w1);c.closePath();c.fill();c.beginPath();c.arc(b[0],b[1],w2,0,Math.PI*2);c.fill();}
function limb(c,a,b,l1,l2,w1,w2,color,bend,authored){const j=authored||joint(a,b,l1,l2,bend);bone(c,a,j,w1,w2,color);bone(c,j,b,w2,w2*.65,color);return j;}
export class InkRig {
 constructor(){this.current=pose();this.history=[];this.face=null;}
 sample(f,time){let p=pose();const breath=Math.sin(time*2.8)*2;
  p.neck=[1,-149+breath];p.head=[4,-169+breath];p.frontHand=[43+Math.sin(time*2)*2,-129+breath];p.backHand=[17,-137+breath];
  if(f.state==='walk'){const t=f.stride*Math.PI*2,step=Math.sin(t),back=Math.sin(t+Math.PI);p.hip=[-4,-82-Math.abs(Math.cos(t))*3];p.neck=[7,-145-Math.abs(Math.cos(t))*3];p.head=[11,-166-Math.abs(Math.cos(t))*3];p.frontFoot=walkFoot(f.stride);p.backFoot=walkFoot(f.stride+.5);p.frontHand=[32-step*9,-127];p.backHand=[14+step*8,-134];}
  if(f.duck||f.state==='duck'||f.state==='lowguard')p=pose({hip:[-18,-44],neck:[-3,-97],head:[3,-117],frontHand:[43,-92],backHand:[-12,-88],backFoot:[-45,-4],frontFoot:[46,-4]});
  if(f.guard){p.frontHand=[p.head[0]+26,p.head[1]+6];p.backHand=[p.head[0]+13,p.head[1]+22];p.neck[0]-=8;p.head[0]-=8;}
  if(!f.grounded){p=pose({hip:[-8,-87],neck:[-2,-148],head:[1,-170],frontHand:[31,-142],backHand:[-35,-124],frontFoot:[44,-42],backFoot:[-37,-32]});const air=Math.min(1,Math.max(0,-f.vy/500));p.frontFoot[1]=mix(-48,-15,air);p.backFoot[1]=mix(-37,-21,air);}
  if(f.attack)p=strikePose(f.attack.m,f.attack.t);
  if(f.state==='hit')p=reactionPose(f);
  if(f.state==='down'||f.state==='ko'){const k=Math.min(1,f.clock*5);p=blend(p,pose({hip:[-12,-18],neck:[-62,-24],head:[-89,-25],frontHand:[-20,-9],backHand:[-68,-7],frontFoot:[60,-6],backFoot:[31,-16]}),ease(k));}
  if(f.state==='rise'){p=blend(pose({hip:[-10,-30],neck:[-30,-70],head:[-33,-90],frontHand:[22,-4],backHand:[-48,-12],frontFoot:[40,-4],backFoot:[-37,-4]}),p,ease(Math.min(1,f.clock/.25)));}
  if(f.state==='dodge')p=pose({hip:[-6,-44],neck:[14,-79],head:[28,-96],frontHand:[51,-65],backHand:[-11,-73],frontFoot:[48,-4],backFoot:[-47,-5]});
  if(f.state==='dodge'){if(f.dodgeDir===f.facing)p=pose({hip:[-6,-39],neck:[10,-66],head:[21,-84],frontHand:[35,-48],backHand:[-10,-57],frontFoot:[29,-19],backFoot:[-27,-12]});else p=pose({hip:[-18,-80],neck:[-30,-140],head:[-34,-162],frontHand:[12,-130],backHand:[-9,-140],frontFoot:[32,-8],backFoot:[-48,-4]});}if(f.sequence)p=sequencePose(f);if(f.landTime>0&&!f.attack){const compression=Math.sin(f.landTime/.16*Math.PI)*11;for(const k of ['hip','neck','head','frontHand','backHand'])p[k]=[p[k][0],p[k][1]+compression];}return p.frontElbow?p:articulate(constrainPose(p));
 }
 draw(c,f,x,y,scale,time,dt,ghost=false){const target=this.sample(f,time);this.current=f.attack||f.state==='hit'?target:articulate(constrainPose(blend(this.current,target,1-Math.exp(-dt*24))));const p=this.current;c.save();c.translate(x,y);this.face=f.facing;c.scale(scale*this.face,scale);
  if(f.state==='dodge'&&f.dodgeDir===f.facing){c.translate(0,-43-Math.sin(f.clock/.46*Math.PI)*9);c.rotate(ease(Math.min(1,f.clock/.46))*Math.PI*2);c.translate(0,43);}if(f.sequence&&f.sequence.b.id===f.id){const rot=sequenceRotation(f);c.translate(0,-78);c.rotate(rot);c.translate(0,78);}
  const ink=ghost?'#342d29':f.hitFlash>0?'#776454':'#151615',rear=ghost?ink:'#252725',edge=f.id?'#bca27b':'#d2bca0';
  // Cloth ribbons follow the body with independent lagging waves.
  c.strokeStyle=ink;c.lineCap='round';for(let i=0;i<2;i++){c.lineWidth=5-i;c.beginPath();c.moveTo(p.head[0]-8,p.head[1]-5);c.bezierCurveTo(p.head[0]-36,p.head[1]+Math.sin(time*7)*9,p.head[0]-57,p.head[1]-14+Math.sin(time*6-i)*13,p.head[0]-71,p.head[1]+Math.sin(time*5+i)*11);c.stroke();}
  limb(c,p.backShoulder,p.backHand,38,38,8,6,rear,1,p.backElbow);limb(c,p.hip,p.backFoot,51,51,13,8,rear,-1,p.backKnee);
  c.fillStyle=rear;c.beginPath();c.ellipse(p.backFoot[0]+6,p.backFoot[1]+1,13,5,p.backFootAngle?.[0]||0,0,Math.PI*2);c.fill();
  // Curved tunic silhouette, shoulder flare and tapered waist.
  const hip=p.hip,n=p.neck;c.fillStyle=ink;c.beginPath();c.moveTo(n[0]-17,n[1]+1);c.quadraticCurveTo(n[0]-24,n[1]+29,hip[0]-17,hip[1]+8);c.lineTo(hip[0]+18,hip[1]+9);c.quadraticCurveTo(n[0]+26,n[1]+29,n[0]+17,n[1]+1);c.quadraticCurveTo(n[0],n[1]-9,n[0]-17,n[1]+1);c.fill();
  limb(c,p.hip,p.frontFoot,51,51,14,8,ink,-1,p.frontKnee);c.fillStyle=ink;c.beginPath();c.ellipse(p.frontFoot[0]+6,p.frontFoot[1]+1,14,5,p.frontFootAngle?.[0]||0,0,Math.PI*2);c.fill();
  bone(c,n,p.head,9,9,ink);c.save();c.translate(...p.head);c.rotate(p.headAngle?.[0]??(n[0]-hip[0])*.006);c.fillStyle=ink;c.beginPath();c.moveTo(-12,-14);c.quadraticCurveTo(5,-22,14,-10);c.lineTo(16,0);c.lineTo(20,4);c.lineTo(14,7);c.quadraticCurveTo(10,22,-6,16);c.quadraticCurveTo(-17,6,-12,-14);c.fill();c.beginPath();c.ellipse(-13,-15,8,7,-.4,0,Math.PI*2);c.fill();if(!ghost){c.strokeStyle=edge;c.globalAlpha=.65;c.lineWidth=2;c.beginPath();c.moveTo(-11,-4);c.lineTo(13,-2);c.stroke();c.globalAlpha=1;}c.restore();
  const elbow=limb(c,n,p.frontHand,40,39,11,8,ink,1);c.fillStyle=ink;c.beginPath();c.ellipse(...p.frontHand,8,6,Math.atan2(p.frontHand[1]-p.frontElbow[1],p.frontHand[0]-p.frontElbow[0]),0,Math.PI*2);c.fill();
  if(!ghost){c.strokeStyle=edge;c.lineWidth=2;c.globalAlpha=.45;for(let i=0;i<3;i++){const k=.62+i*.1;c.beginPath();const wx=mix(elbow[0],p.frontHand[0],k),wy=mix(elbow[1],p.frontHand[1],k);c.moveTo(wx-3,wy-5);c.lineTo(wx+3,wy+5);c.stroke();}c.globalAlpha=.65;c.lineWidth=5;c.beginPath();c.moveTo(hip[0]-14,hip[1]-2);c.lineTo(hip[0]+15,hip[1]-2);c.stroke();c.lineWidth=4;c.beginPath();c.moveTo(hip[0]+8,hip[1]);c.quadraticCurveTo(hip[0]+26,hip[1]+18,hip[0]+14+Math.sin(time*7)*6,hip[1]+33);c.stroke();c.globalAlpha=.13;c.strokeStyle='#fff2d2';c.lineWidth=1;c.beginPath();c.moveTo(n[0]+14,n[1]+6);c.quadraticCurveTo(n[0]+20,n[1]+32,hip[0]+13,hip[1]-8);c.stroke();}
  c.restore();
 }
}


function windup(kind,p){
 if(['kick','round','airkick'].includes(kind))return pose({hip:[-7,-91],neck:[-13,-150],head:[-15,-172],frontHand:[27,-136],backHand:[-27,-130],frontFoot:[37,-76],backFoot:[-27,-4]});
 if(kind==='sweep')return pose({hip:[-24,-39],neck:[-12,-83],head:[-7,-105],frontHand:[32,-74],backHand:[-43,-39],frontFoot:[18,-14],backFoot:[-57,-4]});
 if(kind==='upper'||kind==='low')return pose({hip:[-15,-54],neck:[-4,-112],head:[2,-134],frontHand:[-1,-76],backHand:[23,-116],frontFoot:[40,-4],backFoot:[-48,-4]});
 if(kind==='jab')return blend(p,pose({neck:[-3,-149],head:[0,-170],frontHand:[30,-137]}),.7);
 if(kind==='cross')return pose({hip:[-10,-84],neck:[-6,-150],head:[2,-170],backHand:[-29,-126],frontHand:[36,-141]});
 if(kind==='hook')return pose({hip:[-11,-79],neck:[-12,-145],head:[-5,-167],frontHand:[-45,-126],backHand:[25,-141]});
 return pose({hip:[-18,-77],neck:[-10,-139],head:[-3,-162],frontHand:[-18,-104],backHand:[15,-126],frontFoot:[36,-4],backFoot:[-47,-4]});
}
export function constrainPose(p){
 const out={};for(const k of Object.keys(base))out[k]=[...p[k]];
 for(const [key,root,length] of [['frontHand','neck',78],['backHand','neck',75],['frontFoot','hip',105],['backFoot','hip',102]]){const a=out[root],b=out[key],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);if(d>length)out[key]=[a[0]+dx/d*length,a[1]+dy/d*length];}return out;
}
const fallen=()=>pose({hip:[-12,-18],neck:[-62,-24],head:[-89,-25],frontHand:[-20,-9],backHand:[-68,-7],frontFoot:[60,-6],backFoot:[31,-16]});
function sequencePose(f){const s=f.sequence,t=f.sequenceTime??s.t,victim=s.b.id===f.id,impact=s.finish?1.5:s.kind==='reap'?.67:.8;
 if(victim){if(t>=impact)return blend(pose({hip:[-8,-50],neck:[-35,-91],head:[-48,-108],frontHand:[15,-81],backHand:[-53,-57],frontFoot:[46,-28],backFoot:[-42,-18]}),fallen(),ease(Math.min(1,(t-impact)/.14)));return pose({hip:[-4,-80],neck:[-16,-133],head:[-19,-153],frontHand:[32,-125],backHand:[-38,-108],frontFoot:[42,-41],backFoot:[-41,-29]});}
 const grab=pose({hip:[8,-76],neck:[20,-134],head:[24,-155],frontHand:[68,-121],backHand:[62,-103],frontFoot:[46,-4],backFoot:[-38,-4]});
 const load=pose({hip:[-3,-57],neck:[16,-106],head:[23,-128],frontHand:[9,-163],backHand:[-20,-154],frontFoot:[49,-4],backFoot:[-45,-4]});
 const slam=pose({hip:[11,-53],neck:[51,-91],head:[64,-106],frontHand:[103,-56],backHand:[94,-46],frontFoot:[57,-4],backFoot:[-44,-4]});
 if(t<.22)return blend(pose(),grab,ease(t/.22));
 if(s.kind==='finishLow'){if(t<.55)return blend(grab,targets.sweep,ease((t-.22)/.33));if(t<1.05)return blend(targets.sweep,targets.round,ease((t-.55)/.5));if(t<1.5)return blend(targets.round,slam,ease((t-1.05)/.45));return blend(slam,pose(),ease((t-1.5)/.4));}if(s.kind==='reap'){const at=s.finish?1.5:.67;return t<at?blend(grab,targets.sweep,ease((t-.22)/(at-.22))):blend(targets.sweep,pose(),ease((t-at)/(s.duration-at)));}
 if(s.finish){if(t<.65)return blend(grab,targets.upper,ease((t-.22)/.43));if(t<1.1)return blend(targets.upper,load,ease((t-.65)/.45));if(t<1.5)return blend(load,slam,ease((t-1.1)/.4));return blend(slam,pose(),ease((t-1.5)/.4));}
 if(t<.45)return blend(grab,load,ease((t-.22)/.23));if(t<.8)return blend(load,slam,ease((t-.45)/.35));return blend(slam,pose(),ease((t-.8)/.35));
}
function sequenceRotation(f){const s=f.sequence,t=f.sequenceTime??s.t,impact=s.finish?1.5:s.kind==='reap'?.67:.8;if(t>=impact)return 0;const start=s.finish?.65:.2,u=Math.max(0,Math.min(1,(t-start)/(impact-start)));return Math.sin(u*Math.PI)*(s.kind==='reap'||s.kind==='finishLow'?1.4:3.1);}

function walkFoot(stride){const p=((stride%1)+1)%1;if(p<.5)return[42-p*168,-4];const u=(p-.5)*2;return[-42+84*ease(u),-4-Math.sin(u*Math.PI)*25];}
