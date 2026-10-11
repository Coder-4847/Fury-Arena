import * as THREE from '../../vendor/three.module.js';
const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));

// Local +X is forward. Limbs rotate on Z; the root turns smoothly around Y.
export class FighterRig {
  constructor(definition) {
    this.definition=definition;
    this.root=new THREE.Group();
    this.pelvis=new THREE.Group(); this.pelvis.position.y=1.03; this.root.add(this.pelvis);
    this.materials={};
    for(const [id,color] of Object.entries({cloth:definition.dark,accent:definition.color,skin:definition.skin,boot:'#151c1b',metal:'#586360',visor:definition.visor}))this.materials[id]=new THREE.MeshStandardMaterial({color,roughness:id==='visor'?0.25:0.72,metalness:id==='metal'?0.5:0});
    this.part(this.pelvis,[0.39,0.22,0.47],[0,0,0],'cloth');
    this.torso=new THREE.Group();this.pelvis.add(this.torso);
    this.part(this.torso,[0.43,0.61,0.59],[0,0.38,0],'cloth',0.07);
    this.part(this.torso,[0.46,0.14,0.63],[0,0.53,0],'accent',0.035);
    this.part(this.torso,[0.44,0.08,0.51],[0,0.08,0],'accent',0.025);
    this.head=new THREE.Group();this.head.position.set(0,0.9,0);this.torso.add(this.head);
    this.part(this.head,[0.39,0.43,0.36],[0,0,0],'skin',0.08);
    this.part(this.head,[0.42,0.16,0.39],[0,-0.12,0],'cloth',0.04);
    this.part(this.head,[0.43,0.14,0.39],[-0.02,0.18,0],'cloth',0.04);
    this.part(this.head,[0.025,0.065,0.29],[0.206,0.065,0],'visor');
    this.part(this.head,[0.43,0.075,0.39],[0,0.13,0],'accent',0.015);
    if(definition.id==='nyx') {
      this.part(this.head,[0.23,0.3,0.24],[-0.23,0.16,0],'cloth',0.05);
      this.part(this.torso,[0.1,0.5,0.67],[-0.25,0.55,0],'accent',0.025);
    }
    this.scarf=new THREE.Group();this.scarf.position.set(-0.23,0.7,-0.2);this.torso.add(this.scarf);
    this.part(this.scarf,[0.1,0.45,0.16],[-0.07,-0.18,0],'accent',0.025);
    this.arms=[];this.legs=[];
    for(const side of [-1,1]) {
      const arm=new THREE.Group();arm.position.set(0,0.63,side*0.36);this.torso.add(arm);
      this.part(arm,[0.21,0.38,0.22],[0,-0.16,0],'cloth',0.065);
      this.part(arm,[0.23,0.16,0.24],[0,-0.045,0],'accent',0.04);
      const elbow=new THREE.Group();elbow.position.y=-0.35;arm.add(elbow);
      this.part(elbow,[0.17,0.32,0.18],[0,-0.14,0],'skin',0.045);
      this.part(elbow,[0.22,0.17,0.23],[0,-0.25,0],'accent',0.035);
      const hand=new THREE.Group();hand.position.y=-0.37;elbow.add(hand);
      this.part(hand,[0.25,0.23,0.24],[0,0,0],'boot',0.07);
      this.arms.push({arm,elbow,hand});
      const hip=new THREE.Group();hip.position.set(0,-0.04,side*0.19);this.pelvis.add(hip);
      this.part(hip,[0.27,0.43,0.27],[0,-0.21,0],'cloth',0.06);
      const knee=new THREE.Group();knee.position.y=-0.46;hip.add(knee);
      this.part(knee,[0.235,0.39,0.25],[0,-0.18,0],'cloth',0.05);
      this.part(knee,[0.26,0.16,0.26],[0,-0.03,0],'accent',0.035);
      const foot=new THREE.Group();foot.position.y=-0.46;knee.add(foot);
      this.part(foot,[0.4,0.17,0.27],[0.07,0.015,0],'boot',0.04);
      this.legs.push({hip,knee,foot});
    }
    this.phase=0;this.turn=0;this.land=0;this.lastGround=true;
    this.pose={hipY:1.03,lean:0,head:0,a0:0.35,a1:0.8,e0:1.8,e1:1.7,l0:-0.28,l1:0.34,k0:0.16,k1:0.22};
  }
  part(parent,size,position,material,radius=0) {
    // Rounded caps keep the deliberately low-poly silhouette soft under light.
    const geometry=radius?new THREE.CapsuleGeometry(1,1,3,6):new THREE.BoxGeometry(1,1,1);
    const mesh=new THREE.Mesh(geometry,this.materials[material]);
    mesh.scale.set(size[0]/(radius?2:1),size[1]/(radius?3:1),size[2]/(radius?2:1));
    mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  legIK(x,y) {
    const length=0.46,distance=Math.min(0.915,Math.hypot(x,y));
    const bend=Math.acos(distance/(2*length));
    return [Math.atan2(x,-y)-bend,bend*2];
  }
  render(fighter,alpha,dt) {
    this.root.position.set(fighter.previousX+(fighter.x-fighter.previousX)*alpha,fighter.previousY+(fighter.y-fighter.previousY)*alpha,0);
    const targetTurn=fighter.facing===1?0:Math.PI;
    this.turn=damp(this.turn,targetTurn,20,dt);this.root.rotation.y=this.turn;
    this.phase+=Math.abs(fighter.vx)*dt*Math.PI*2/1.28;
    const t=fighter.age,speed=Math.min(1,Math.abs(fighter.vx)/4),breath=Math.sin(t*2.6);
    const p={hipY:1.01+breath*0.012,lean:0.035,head:-0.04,a0:0.35+breath*.035,a1:.78-breath*.025,e0:1.8,e1:1.7,l0:-.32,l1:.38,k0:.22,k1:.2};
    if(fighter.grounded && speed>.08 && !['dodge','crouch','block'].includes(fighter.state)) {
      p.hipY=0.97+Math.abs(Math.sin(this.phase))*0.025;
      p.lean=-fighter.vx*fighter.facing*.035;
      for(let i=0;i<2;i++) {
        const phase=this.phase+i*Math.PI,cycle=(phase/(Math.PI*2))%1;
        const stance=cycle<.5,u=stance?cycle*2:(cycle-.5)*2;
        const travelSign=Math.sign(fighter.vx)*fighter.facing;
        const footX=(stance?.32-u*.64:-.32+u*.64)*travelSign;
        const [hip,knee]=this.legIK(footX,-.86+(stance?0:Math.sin(u*Math.PI)*.22));
        p['l'+i]=hip;p['k'+i]=knee;
        p['a'+i]=.45+Math.sin(phase)*.35;p['e'+i]=1.55;
      }
    }
    if(!fighter.grounded) {p.hipY=.97;p.l0=-.65;p.l1=.7;p.k0=.65;p.k1=1.1;p.a0=.85;p.a1=-.45;p.e0=1.2;p.e1=1.55;p.lean=-.1;}
    if(fighter.state==='crouch') {p.hipY=.61;p.l0=-1.25;p.l1=-.65;p.k0=1.65;p.k1=1.6;p.lean=-.28;}
    if(fighter.state==='block') {p.a0=1.1;p.a1=1.35;p.e0=1.55;p.e1=1.5;p.lean=.12;p.hipY=.93;}
    if(fighter.state==='dodge') {p.hipY=.63;p.lean=-.68;p.l0=-1;p.l1=.85;p.k0=1.3;p.k1=.55;p.a0=-.45;p.a1=-.7;}
    if(fighter.state==='hit') {p.lean=.4;p.head=.25;p.a0=-.2;p.a1=.4;}
    if(fighter.state==='knockdown') {p.hipY=.3;p.lean=1.25;p.head=.2;p.l0=-.6;p.l1=-.2;}
    if(fighter.state==='getup') {p.hipY=.6;p.lean=.55;p.l0=-1;p.k0=1.5;p.l1=.3;p.k1=.8;}
    if(fighter.state==='climb'){p.a0=2.7;p.a1=2.4;p.e0=.3;p.e1=.4;p.l0=-.7;p.k0=1.4;p.l1=.6;p.k1=1.2;}
    if(fighter.state==='swing'){p.a0=3;p.a1=3;p.e0=.1;p.e1=.1;p.l0=1.2;p.l1=1.5;p.k0=.2;p.k1=.1;p.lean=.2;}
    if(fighter.attack) this.attackPose(p,fighter);
    for(const material of Object.values(this.materials)){material.emissive.set(fighter.state==='hit'?'#7a321f':fighter.attack?.move.cost?'#334015':'#000000');material.emissiveIntensity=fighter.state==='hit'?.65:.3;}
    if(!this.lastGround && fighter.grounded)this.land=1;
    this.lastGround=fighter.grounded;this.land=Math.max(0,this.land-dt*7);
    p.hipY-=this.land*.1;
    for(const key of Object.keys(p))this.pose[key]=damp(this.pose[key],p[key],fighter.attack?28:18,dt);
    const q=this.pose;
    this.pelvis.position.y=q.hipY;this.torso.rotation.z=q.lean;this.head.rotation.z=q.head;
    this.scarf.rotation.z=.15+Math.sin(t*6)*.15+speed*.7;
    for(let i=0;i<2;i++) {
      this.arms[i].arm.rotation.z=q['a'+i];this.arms[i].elbow.rotation.z=q['e'+i];
      this.legs[i].hip.rotation.z=q['l'+i];this.legs[i].knee.rotation.z=q['k'+i];
      this.legs[i].foot.rotation.z=-q['l'+i]-q['k'+i];
    }
  }
  attackPose(p,fighter) {
    const move=fighter.attack.move,time=fighter.attack.time;
    const anticipation=Math.max(0,1-time/move.startup);
    const strike=Math.min(1,Math.max(0,(time-move.startup+.06)/.08));
    const recovery=Math.max(0,1-Math.max(0,time-move.startup-move.active)/move.recovery);
    const reach=strike*recovery;
    p.lean=.18*anticipation-.22*reach;
    if(move.pose==='slash'||move.pose==='slam'){p.a0=2.9*anticipation+1.1*reach;p.e0=.4;p.lean=-.3*reach;p.hipY=1-.12*reach;}
    else if(move.pose==='thrust'){p.a0=1.5*reach;p.e0=1.6*(1-reach);p.a1=1;p.e1=.8;p.lean=-.2*reach;}
    else if(move.pose==='kick') {p.l1=1.7*reach;p.k1=.2+1.25*anticipation;p.hipY=.96;p.a0=-.2;p.a1=.1;p.lean=.16*reach;}
    else if(move.pose==='uppercut') {p.a1=.4+2.1*reach;p.e1=1.2-.6*reach;p.hipY=1-.12*anticipation;}
    else if(move.pose==='spin') {p.l1=1.75*reach;p.k1=.15;p.lean=-.3*reach;this.root.rotation.y=this.turn+reach*Math.PI*2;}
    else {p.a0=.25+1.3*reach-.55*anticipation;p.e0=1.8*(1-reach)+.1*reach;p.a1=.8;p.e1=1.7;}
  }
}
