const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
const base={hip:[-6,-83],neck:[1,-149],head:[4,-169],backHand:[17,-137],frontHand:[43,-129],backFoot:[-38,-4],frontFoot:[44,-4]};
const pose=(changes={})=>({...base,...changes});
const targets={
 jab:pose({neck:[12,-147],head:[17,-168],frontHand:[112,-137],backHand:[10,-125],hip:[0,-83]}),
 cross:pose({neck:[20,-146],head:[24,-166],backHand:[121,-130],frontHand:[31,-121],hip:[9,-84],backFoot:[-27,-4]}),
 hook:pose({neck:[22,-142],head:[26,-165],frontHand:[113,-113],backHand:[28,-139],hip:[15,-78]}),
 low:pose({hip:[-7,-50],neck:[21,-88],head:[25,-108],frontHand:[101,-65],backHand:[8,-83],backFoot:[-50,-4],frontFoot:[43,-4]}),
 palm:pose({hip:[14,-73],neck:[31,-133],head:[31,-155],frontHand:[126,-113],backHand:[55,-110],backFoot:[-37,-4],frontFoot:[63,-4]}),
 upper:pose({hip:[9,-79],neck:[14,-143],head:[5,-166],frontHand:[71,-195],backHand:[-13,-120],backFoot:[-26,-4],frontFoot:[35,-4]}),
 kick:pose({hip:[5,-99],neck:[-21,-157],head:[-25,-180],frontHand:[25,-128],backHand:[-42,-124],frontFoot:[148,-105],backFoot:[-13,-4]}),
 round:pose({hip:[5,-99],neck:[-26,-141],head:[-33,-164],frontHand:[4,-110],backHand:[-48,-101],frontFoot:[156,-151],backFoot:[-5,-4]}),
 sweep:pose({hip:[-6,-27],neck:[-22,-69],head:[-29,-91],frontHand:[37,-42],backHand:[-64,-5],frontFoot:[140,-19],backFoot:[-43,-4]}),
 airjab:pose({hip:[-12,-91],neck:[12,-141],head:[20,-162],frontHand:[105,-102],backHand:[-3,-134],frontFoot:[30,-53],backFoot:[-60,-48]}),
 airkick:pose({hip:[-3,-86],neck:[-41,-131],head:[-51,-151],frontHand:[16,-116],backHand:[-62,-100],frontFoot:[151,-75],backFoot:[-50,-53]}),
 throw:pose({hip:[3,-73],neck:[-7,-134],head:[-12,-155],frontHand:[-38,-174],backHand:[-64,-161],backFoot:[-38,-4],frontFoot:[47,-4]}),
 special:pose({hip:[23,-70],neck:[40,-128],head:[38,-151],frontHand:[134,-98],backHand:[126,-112],backFoot:[-40,-4],frontFoot:[67,-4]})
};
function blend(a,b,t){return Object.fromEntries(Object.keys(base).map(k=>[k,[mix(a[k][0],b[k][0],t),mix(a[k][1],b[k][1],t)]]));}
function joint(a,b,l1,l2,bend=1){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.min(Math.hypot(dx,dy),l1+l2-.1),angle=Math.atan2(dy,dx),q=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*Math.max(d,.1)))));return[a[0]+Math.cos(angle+q*bend)*l1,a[1]+Math.sin(angle+q*bend)*l1];}
function bone(c,a,b,w1,w2,color){const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),nx=Math.sin(ang),ny=-Math.cos(ang);c.fillStyle=color;c.beginPath();c.moveTo(a[0]+nx*w1,a[1]+ny*w1);c.lineTo(b[0]+nx*w2,b[1]+ny*w2);c.lineTo(b[0]-nx*w2,b[1]-ny*w2);c.lineTo(a[0]-nx*w1,a[1]-ny*w1);c.closePath();c.fill();c.beginPath();c.arc(b[0],b[1],w2,0,Math.PI*2);c.fill();}
function limb(c,a,b,l1,l2,w1,w2,color,bend){const j=joint(a,b,l1,l2,bend);bone(c,a,j,w1,w2,color);bone(c,j,b,w2,w2*.65,color);return j;}
export class InkRig {
 constructor(){this.current=pose();this.history=[];this.face=null;}
 sample(f,time){let p=pose();const breath=Math.sin(time*2.8)*2;
  p.neck=[1,-149+breath];p.head=[4,-169+breath];p.frontHand=[43+Math.sin(time*2)*2,-129+breath];p.backHand=[17,-137+breath];
  if(f.state==='walk'){const t=f.age*10,step=Math.sin(t),back=Math.sin(t+Math.PI);p.hip=[-4,-82-Math.abs(Math.cos(t))*3];p.neck=[7,-145-Math.abs(Math.cos(t))*3];p.head=[11,-166-Math.abs(Math.cos(t))*3];p.frontFoot=[step*46,-4-Math.max(0,Math.cos(t))*24];p.backFoot=[back*46,-4-Math.max(0,-Math.cos(t))*24];p.frontHand=[32-step*9,-127];p.backHand=[14+step*8,-134];}
  if(f.duck||f.state==='duck'||f.state==='lowguard')p=pose({hip:[-18,-44],neck:[-3,-97],head:[3,-117],frontHand:[43,-92],backHand:[-12,-88],backFoot:[-45,-4],frontFoot:[46,-4]});
  if(f.guard){p.frontHand=[p.head[0]+26,p.head[1]+6];p.backHand=[p.head[0]+13,p.head[1]+22];p.neck[0]-=8;p.head[0]-=8;}
  if(!f.grounded){p=pose({hip:[-8,-87],neck:[-2,-148],head:[1,-170],frontHand:[31,-142],backHand:[-35,-124],frontFoot:[44,-42],backFoot:[-37,-32]});const air=Math.min(1,Math.max(0,-f.vy/500));p.frontFoot[1]=mix(-48,-15,air);p.backFoot[1]=mix(-37,-21,air);}
  if(f.attack){const a=f.attack,m=a.m,t=a.t;const target=targets[m.pose];const wind=blend(p,pose({hip:[-18,-77],neck:[-18,-143],head:[-12,-165],frontHand:[-24,-130],backHand:[-36,-102],frontFoot:[40,-4],backFoot:[-44,-4]}),.65);if(t<m.start*.72)p=blend(p,wind,ease(t/(m.start*.72)));else if(t<m.start+.035)p=blend(wind,target,ease(Math.min(1,(t-m.start*.72)/(m.start*.28+.035))));else if(t<m.end+.04)p=target;else p=blend(target,p,ease(Math.min(1,(t-m.end-.04)/(m.duration-m.end-.04))));}
  if(f.state==='hit'){p=pose({hip:[-12,-80],neck:[-32,-139],head:[-49,-158],frontHand:[31,-104],backHand:[-55,-115],frontFoot:[38,-4],backFoot:[-47,-4]});}
  if(f.state==='down'||f.state==='ko'){const k=Math.min(1,f.clock*5);p=blend(p,pose({hip:[-12,-18],neck:[-62,-24],head:[-89,-25],frontHand:[-20,-9],backHand:[-68,-7],frontFoot:[60,-6],backFoot:[31,-16]}),ease(k));}
  if(f.state==='rise'){p=blend(pose({hip:[-10,-30],neck:[-30,-70],head:[-33,-90],frontHand:[22,-4],backHand:[-48,-12],frontFoot:[40,-4],backFoot:[-37,-4]}),p,ease(Math.min(1,f.clock/.25)));}
  if(f.state==='dodge')p=pose({hip:[-6,-44],neck:[14,-79],head:[28,-96],frontHand:[51,-65],backHand:[-11,-73],frontFoot:[48,-4],backFoot:[-47,-5]});
  if(f.landTime>0&&!f.attack){const compression=Math.sin(f.landTime/.16*Math.PI)*11;for(const k of ['hip','neck','head','frontHand','backHand'])p[k]=[p[k][0],p[k][1]+compression];}return p;
 }
 draw(c,f,x,y,scale,time,dt,ghost=false){const target=this.sample(f,time);this.current=blend(this.current,target,1-Math.exp(-dt*(f.attack?38:20)));const p=this.current;c.save();c.translate(x,y);this.face=this.face===null?f.facing:mix(this.face,f.facing,1-Math.exp(-dt*25));c.scale(scale*this.face,scale);
  if(f.state==='dodge'&&f.dodgeDir===f.facing){c.translate(0,-45);c.rotate(f.clock/.46*Math.PI*2);c.translate(0,45);}
  const ink=ghost?'#342d29':f.hitFlash>0?'#776454':'#151615',rear=ghost?ink:'#252725',edge=f.id?'#bca27b':'#d2bca0';
  // Cloth ribbons follow the body with independent lagging waves.
  c.strokeStyle=ink;c.lineCap='round';for(let i=0;i<2;i++){c.lineWidth=5-i;c.beginPath();c.moveTo(p.head[0]-8,p.head[1]-5);c.bezierCurveTo(p.head[0]-36,p.head[1]+Math.sin(time*7)*9,p.head[0]-57,p.head[1]-14+Math.sin(time*6-i)*13,p.head[0]-71,p.head[1]+Math.sin(time*5+i)*11);c.stroke();}
  limb(c,p.neck,p.backHand,38,38,10,7,rear,1);limb(c,p.hip,p.backFoot,52,51,14,10,rear,-1);
  c.fillStyle=rear;c.beginPath();c.ellipse(p.backFoot[0]+8,p.backFoot[1]+1,18,6,-.12,0,Math.PI*2);c.fill();
  // Curved tunic silhouette, shoulder flare and tapered waist.
  const hip=p.hip,n=p.neck;c.fillStyle=ink;c.beginPath();c.moveTo(n[0]-17,n[1]+1);c.quadraticCurveTo(n[0]-24,n[1]+29,hip[0]-17,hip[1]+8);c.lineTo(hip[0]+18,hip[1]+9);c.quadraticCurveTo(n[0]+26,n[1]+29,n[0]+17,n[1]+1);c.quadraticCurveTo(n[0],n[1]-9,n[0]-17,n[1]+1);c.fill();
  limb(c,p.hip,p.frontFoot,53,53,16,10,ink,-1);c.fillStyle=ink;c.beginPath();c.ellipse(p.frontFoot[0]+9,p.frontFoot[1]+1,20,6,-.12,0,Math.PI*2);c.fill();
  bone(c,n,p.head,9,9,ink);c.save();c.translate(...p.head);c.rotate((n[0]-hip[0])*.006);c.fillStyle=ink;c.beginPath();c.moveTo(-12,-14);c.quadraticCurveTo(5,-22,14,-10);c.lineTo(16,0);c.lineTo(20,4);c.lineTo(14,7);c.quadraticCurveTo(10,22,-6,16);c.quadraticCurveTo(-17,6,-12,-14);c.fill();c.beginPath();c.ellipse(-13,-15,8,7,-.4,0,Math.PI*2);c.fill();if(!ghost){c.strokeStyle=edge;c.globalAlpha=.65;c.lineWidth=2;c.beginPath();c.moveTo(-11,-4);c.lineTo(13,-2);c.stroke();c.globalAlpha=1;}c.restore();
  const elbow=limb(c,n,p.frontHand,40,39,11,8,ink,1);c.fillStyle=ink;c.beginPath();c.ellipse(...p.frontHand,10,8,-.3,0,Math.PI*2);c.fill();
  if(!ghost){c.strokeStyle=edge;c.lineWidth=2;c.globalAlpha=.45;for(let i=0;i<3;i++){const k=.62+i*.1;c.beginPath();const wx=mix(elbow[0],p.frontHand[0],k),wy=mix(elbow[1],p.frontHand[1],k);c.moveTo(wx-3,wy-5);c.lineTo(wx+3,wy+5);c.stroke();}c.globalAlpha=.65;c.lineWidth=5;c.beginPath();c.moveTo(hip[0]-14,hip[1]-2);c.lineTo(hip[0]+15,hip[1]-2);c.stroke();c.lineWidth=4;c.beginPath();c.moveTo(hip[0]+8,hip[1]);c.quadraticCurveTo(hip[0]+26,hip[1]+18,hip[0]+14+Math.sin(time*7)*6,hip[1]+33);c.stroke();c.globalAlpha=.13;c.strokeStyle='#fff2d2';c.lineWidth=1;c.beginPath();c.moveTo(n[0]+14,n[1]+6);c.quadraticCurveTo(n[0]+20,n[1]+32,hip[0]+13,hip[1]-8);c.stroke();}
  c.restore();
 }
}
