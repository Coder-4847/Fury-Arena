import * as THREE from '../../vendor/three.module.js';
export class Effects {
  constructor(scene){
    this.scene=scene;this.particles=[];this.limit=64;this.shake=0;this.punch=0;this.matrix=new THREE.Matrix4();
    const geometry=new THREE.SphereGeometry(.035,4,3);
    this.meshes=['#eaffab','#c9d8ff'].map(color=>{const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({color}),100);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);return mesh;});
  }
  impact(x,y,blocked,heavy){
    this.shake=blocked?.035:heavy?.14:.07;this.punch=heavy?.35:.12;
    for(let i=0;i<(blocked?9:heavy?22:14)&&this.particles.length<this.limit;i++){
      const angle=Math.random()*Math.PI*2,speed=2+Math.random()*4;
      this.particles.push({x,y,z:.3,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed+2,vz:(Math.random()-.5)*3,gravity:12,life:.2+Math.random()*.2,color:blocked?1:0,size:heavy?1.4:1});
    }
  }
  trail(position,color=0){if(this.particles.length<this.limit)this.particles.push({x:position.x,y:position.y,z:position.z,vx:0,vy:0,vz:0,gravity:0,life:.14,color,size:.8});}
  update(dt){
    this.shake=Math.max(0,this.shake-dt*.8);this.punch=Math.max(0,this.punch-dt*2);
    const counts=[0,0];
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}
      p.vy-=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
      const size=Math.min(1,p.life*6)*p.size;this.matrix.makeScale(size,size,size);this.matrix.setPosition(p.x,p.y,p.z);this.meshes[p.color].setMatrixAt(counts[p.color]++,this.matrix);
    }
    this.meshes.forEach((mesh,i)=>{mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=true;});
  }
  clear(){this.particles=[];this.meshes.forEach(mesh=>mesh.count=0);this.shake=this.punch=0;}
}
