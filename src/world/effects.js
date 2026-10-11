import * as THREE from '../../vendor/three.module.js';
export class Effects {
  constructor(scene){this.scene=scene;this.particles=[];this.geometry=new THREE.SphereGeometry(.035,4,3);this.material=new THREE.MeshBasicMaterial({color:'#eaffab'});this.guardMaterial=new THREE.MeshBasicMaterial({color:'#c9d8ff'});this.shake=0;this.punch=0;}
  impact(x,y,blocked,heavy){
    this.shake=blocked?.035:heavy?.14:.07;this.punch=heavy?.35:.12;
    for(let i=0;i<(blocked?9:heavy?22:14);i++){
      if(this.particles.length>=100)break;
      const mesh=new THREE.Mesh(this.geometry,blocked?this.guardMaterial:this.material);mesh.position.set(x,y,.3);
      const angle=Math.random()*Math.PI*2,speed=2+Math.random()*4;
      this.particles.push({mesh,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed+2,vz:(Math.random()-.5)*3,life:.2+Math.random()*.2});this.scene.add(mesh);
    }
  }
  update(dt){
    this.shake=Math.max(0,this.shake-dt*.8);this.punch=Math.max(0,this.punch-dt*2);
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1);continue;}p.vy-=12*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.scale.setScalar(Math.min(1,p.life*6));}
  }
  clear(){for(const p of this.particles)this.scene.remove(p.mesh);this.particles=[];}
}
