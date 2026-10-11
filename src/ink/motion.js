// Angles are authored in fighter-local space: +X points toward the opponent.
// Elbows flex negatively, knees positively; neither chain switches IK branches.
const rad=Math.PI/180;
const ease=t=>t*t*(3-2*t);
const lerp=(a,b,t)=>a+(b-a)*t;
const stance={hip:[-8,-86],neck:[-2,-145],head:[4,-169],frontArm:[68,-122],backArm:[100,-143],frontFoot:[39,-4],backFoot:[-40,-4],twist:[0],headAngle:[0],frontFootAngle:[0],backFootAngle:[0]};
const pose=changes=>({...stance,...changes});
const clips={
 jab:[pose({hip:[-11,-86],neck:[-6,-145],frontArm:[75,-130]}),pose({hip:[2,-85],neck:[15,-145],head:[21,-167],frontArm:[1,-7],backArm:[77,-136],twist:[8]}),pose({hip:[0,-86],neck:[9,-145],head:[14,-168],frontArm:[45,-95],backArm:[84,-139],twist:[4]})],
 cross:[pose({hip:[-13,-87],neck:[-11,-145],backArm:[117,-133],frontArm:[58,-118],twist:[-10]}),pose({hip:[12,-83],neck:[27,-142],head:[30,-165],backArm:[-1,-8],frontArm:[95,-153],backFoot:[-33,-4],backFootAngle:[-.28],twist:[-19]}),pose({hip:[9,-84],neck:[19,-144],head:[23,-167],backArm:[58,-106],frontArm:[78,-133],backFoot:[-35,-4],twist:[-7]})],
 hook:[pose({hip:[-14,-81],neck:[-12,-141],head:[-6,-166],frontArm:[106,-102],backArm:[75,-124],twist:[-10]}),pose({hip:[13,-82],neck:[25,-139],head:[28,-164],frontArm:[38,-75],backArm:[77,-135],twist:[19]}),pose({hip:[16,-83],neck:[24,-141],head:[27,-165],frontArm:[23,-109],backArm:[81,-133],twist:[12]})],
 low:[pose({hip:[-20,-59],neck:[-6,-110],head:[2,-132],frontArm:[99,-115],backArm:[72,-128]}),pose({hip:[2,-54],neck:[24,-103],head:[27,-124],frontArm:[21,-8],backArm:[92,-140],twist:[10]}),pose({hip:[-5,-55],neck:[13,-106],head:[19,-129],frontArm:[68,-104]})],
 palm:[pose({hip:[-22,-80],neck:[-17,-139],head:[-10,-161],frontArm:[98,-110],backArm:[88,-132],twist:[-10]}),pose({hip:[18,-79],neck:[35,-133],head:[38,-157],frontArm:[7,-6],backArm:[76,-133],frontFoot:[49,-4],backFoot:[-35,-4],backFootAngle:[-.2],twist:[15]}),pose({hip:[20,-79],neck:[34,-135],head:[37,-158],frontArm:[30,-57],backArm:[80,-136],frontFoot:[49,-4],backFoot:[-35,-4],twist:[10]})],
 upper:[pose({hip:[-19,-56],neck:[-2,-113],head:[6,-137],frontArm:[86,-75],backArm:[71,-129]}),pose({hip:[7,-91],neck:[19,-149],head:[15,-172],frontArm:[-5,-65],backArm:[85,-137],backFoot:[-31,-4],backFootAngle:[-.25],twist:[13]}),pose({hip:[6,-85],neck:[14,-145],head:[17,-169],frontArm:[8,-107],backArm:[84,-137],twist:[7]})],
 kick:[pose({hip:[-21,-100],neck:[-29,-157],head:[-25,-181],frontLeg:[-66,128],frontArm:[78,-127],backArm:[101,-140],backFoot:[-40,-4]}),pose({hip:[-9,-100],neck:[-32,-154],head:[-33,-179],frontLeg:[-7,9],frontArm:[90,-133],backArm:[103,-125],backFoot:[-40,-4],frontFootAngle:[-1.2],twist:[-5]}),pose({hip:[-20,-100],neck:[-28,-156],head:[-25,-180],frontLeg:[-63,126],frontArm:[78,-127],backArm:[101,-140],backFoot:[-40,-4]})],
 round:[pose({hip:[-17,-98],neck:[-27,-151],head:[-24,-176],frontLeg:[-69,124],frontArm:[73,-124],backArm:[106,-135],backFoot:[-40,-4],twist:[-15]}),pose({hip:[-8,-96],neck:[-37,-143],head:[-40,-167],frontLeg:[-34,8],frontArm:[92,-124],backArm:[115,-110],backFoot:[-40,-4],frontFootAngle:[-.6],twist:[18]}),pose({hip:[-15,-98],neck:[-29,-150],head:[-29,-174],frontLeg:[-59,111],backFoot:[-40,-4],twist:[8]})],
 sweep:[pose({hip:[-28,-34],neck:[-12,-88],head:[-6,-112],frontLeg:[-45,134],frontArm:[70,-110],backArm:[123,-132],backFoot:[-45,-4]}),pose({hip:[-13,-31],neck:[-32,-82],head:[-35,-105],frontLeg:[4,6],frontArm:[80,-127],backArm:[128,-106],backFoot:[-45,-4],frontFootAngle:[.1],twist:[18]}),pose({hip:[-22,-34],neck:[-22,-85],head:[-18,-109],frontLeg:[-26,125],backFoot:[-45,-4],twist:[8]})],
 airjab:[pose({hip:[-7,-88],neck:[-5,-145],head:[1,-168],frontArm:[94,-130],frontLeg:[-25,100],backLeg:[115,65]}),pose({hip:[3,-85],neck:[24,-135],head:[32,-156],frontArm:[14,-9],backArm:[79,-130],frontLeg:[25,68],backLeg:[124,56],twist:[13]}),pose({hip:[0,-87],neck:[10,-143],head:[17,-165],frontLeg:[-15,101],backLeg:[109,67]})],
 airkick:[pose({hip:[-6,-88],neck:[-15,-145],head:[-13,-169],frontLeg:[-62,126],backLeg:[125,55]}),pose({hip:[-4,-88],neck:[-38,-134],head:[-46,-155],frontLeg:[2,8],backLeg:[138,79],frontArm:[105,-130],backArm:[130,-107],frontFootAngle:[-1.1],twist:[-8]}),pose({hip:[-4,-88],neck:[-16,-143],head:[-15,-167],frontLeg:[-54,126],backLeg:[115,62]})],
};
clips.special=[clips.palm[0],pose({...clips.palm[1],backArm:[4,-13],twist:[4]}),clips.palm[2]];
clips.throw=[stance,pose({hip:[4,-76],neck:[20,-132],head:[26,-155],frontArm:[9,-32],backArm:[26,-55]}),stance];
function blend(a,b,t){const out={};for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const av=a[key]??b[key],bv=b[key]??a[key];out[key]=av.map((v,i)=>lerp(v,bv[i],t));}return out;}
function arm(root,angles,l1=38,l2=38){const a=angles[0]*rad,b=(angles[0]+angles[1])*rad;const joint=[root[0]+Math.cos(a)*l1,root[1]+Math.sin(a)*l1];return{joint,end:[joint[0]+Math.cos(b)*l2,joint[1]+Math.sin(b)*l2]};}
export function strikePose(move,t){const [load,contact,recoil]=clips[move.pose]||clips.palm;const airborne=move.pose.startsWith('air'),baseline=['low','sweep'].includes(move.pose)?pose({hip:[-18,-52],neck:[-3,-107],head:[2,-131],frontArm:[63,-115],backArm:[101,-135]}):airborne?load:stance;const launch=move.start*.67,impact=move.start,follow=move.end,rechamber=follow+(move.duration-follow)*.43;let p;
 if(t<launch)p=blend(baseline,load,ease(t/launch));
 else if(t<impact){const u=(t-launch)/(impact-launch);p=blend(load,contact,u*u);}
 else if(t<follow)p=blend(contact,contact,0);
 else if(t<rechamber)p=blend(contact,recoil,ease((t-follow)/(rechamber-follow)));
 else p=blend(recoil,baseline,ease(Math.min(1,(t-rechamber)/(move.duration-rechamber))));
 // Preserve FK continuity into/out of a kick: solve the neutral foot as angles first.
 for(const side of ['front','back']){const key=side+'Leg';if(p[key]&&!airborne){const phase=t<launch?ease(t/launch):t>rechamber?1-ease(Math.min(1,(t-rechamber)/(move.duration-rechamber))):1;const root=p.hip,foot=stance[side+'Foot'],neutral=legAngles(root,foot);p[key]=neutral.map((v,i)=>lerp(v,p[key][i],phase));}}
 return articulate(p);
}
export function solveJoint(a,b,l1,l2,bend){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.01,Math.min(Math.hypot(dx,dy),l1+l2-.1)),angle=Math.atan2(dy,dx),q=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));return[a[0]+Math.cos(angle+q*bend)*l1,a[1]+Math.sin(angle+q*bend)*l1];}
function legAngles(root,foot){const knee=solveJoint(root,foot,51,51,-1),upper=Math.atan2(knee[1]-root[1],knee[0]-root[0]),lower=Math.atan2(foot[1]-knee[1],foot[0]-knee[0]);let flex=(lower-upper)/rad;while(flex<0)flex+=360;return[upper/rad,Math.min(150,flex)];}
export function articulate(source){const p={...source},twist=p.twist?.[0]||0;p.frontShoulder=[p.neck[0]+5+twist*.35,p.neck[1]+7];p.backShoulder=[p.neck[0]-5-twist*.35,p.neck[1]+8];
 for(const side of ['front','back']){const root=p[side+'Shoulder'],hand=p[side+'Hand'];if(p[side+'Arm']){const chain=arm(root,p[side+'Arm']);p[side+'Elbow']=chain.joint;p[side+'Hand']=chain.end;}else{const dx=hand[0]-root[0],dy=hand[1]-root[1],d=Math.hypot(dx,dy);p[side+'Hand']=d>75.9?[root[0]+dx/d*75.9,root[1]+dy/d*75.9]:hand;p[side+'Elbow']=solveJoint(root,p[side+'Hand'],38,38,1);}
 if(p[side+'Leg']){const chain=arm(p.hip,p[side+'Leg'],51,51);p[side+'Knee']=chain.joint;p[side+'Foot']=chain.end;}else{const foot=p[side+'Foot'],dx=foot[0]-p.hip[0],dy=foot[1]-p.hip[1],d=Math.hypot(dx,dy);if(d>101.9)p[side+'Foot']=[p.hip[0]+dx/d*101.9,p.hip[1]+dy/d*101.9];p[side+'Knee']=solveJoint(p.hip,p[side+'Foot'],51,51,-1);}
 }return p;}
export const MOTION_STANCE=stance;

export function strikePoint(move,t){const p=strikePose(move,t);return p[['kick','round','sweep','airkick'].includes(move.pose)?'frontFoot':move.pose==='cross'?'backHand':'frontHand'];}
export function reactionPose(f){const t=f.clock,amount=t<.065?ease(t/.065):1-ease(Math.min(1,(t-.065)/Math.max(.2,f.stun+t-.065)));const r=f.reaction==='body'?pose({hip:[-17,-70],neck:[16,-120],head:[30,-139],frontArm:[87,-79],backArm:[111,-100],headAngle:[.28]}):f.reaction==='leg'?pose({hip:[-20,-62],neck:[-6,-118],head:[0,-142],frontArm:[62,-98],backArm:[112,-113]}):pose({hip:[-13,-84],neck:[-25,-137],head:[-42,-158],frontArm:[50,-81],backArm:[122,-119],headAngle:[-.3]});return articulate(blend(stance,r,amount));}
