import * as THREE from '../../vendor/three.module.js';
import { FighterRig } from '../world/rig.js';
export function createPortraits(definitions){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(240,280);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const portraits={};
  for(const def of definitions){
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,240/280,.1,20),rig=new FighterRig(def);
    scene.add(new THREE.HemisphereLight('#ffffff','#415443',3));const light=new THREE.DirectionalLight('#fff7de',3);light.position.set(3,5,4);scene.add(light);scene.add(rig.root);
    rig.render({x:0,previousX:0,y:0,previousY:0,vx:0,facing:1,age:0,grounded:true,state:'idle'},1,1);
    camera.position.set(3,2.1,4);camera.lookAt(0,1.35,0);renderer.render(scene,camera);portraits[def.id]=renderer.domElement.toDataURL('image/png');
    rig.root.traverse(n=>n.geometry?.dispose());Object.values(rig.materials).forEach(m=>m.dispose());
  }
  renderer.dispose();return portraits;
}
