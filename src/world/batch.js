import * as THREE from '../../vendor/three.module.js';
// Combine only static, opaque direct children. Interactive groups and textured
// signs retain their own transforms/materials; hazards opt out explicitly.
export function batchStaticGeometry(root){
  const groups=new Map();
  for(const mesh of [...root.children]){
    const m=mesh.material;
    if(!mesh.isMesh||mesh.userData.dynamic||Array.isArray(m)||m.map||m.transparent||!m.isMeshStandardMaterial)continue;
    const key=[m.color.getHex(),m.roughness,m.metalness,m.emissive.getHex(),m.emissiveIntensity].join(':');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
  }
  for(const meshes of groups.values()){
    if(meshes.length<2)continue;
    const parts=meshes.map(mesh=>{mesh.updateMatrix();const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrix);return g;});
    const count=parts.reduce((n,g)=>n+g.attributes.position.count,0),geometry=new THREE.BufferGeometry();
    for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
      const array=new Float32Array(count*size);let offset=0;
      for(const part of parts){const data=part.attributes[name]?.array;if(data)array.set(data,offset);offset+=part.attributes.position.count*size;}
      geometry.setAttribute(name,new THREE.BufferAttribute(array,size));
    }
    geometry.computeBoundingSphere();
    const merged=new THREE.Mesh(geometry,meshes[0].material.clone());merged.castShadow=meshes.some(m=>m.castShadow);merged.receiveShadow=true;root.add(merged);
    for(const mesh of meshes){root.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}for(const part of parts)part.dispose();
  }
}
