import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { batchStaticGeometry } from '../src/world/batch.js';
test('static batching preserves world bounds and leaves dynamic objects separate',()=>{
  const root=new THREE.Group();for(let i=0;i<8;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,2,3),new THREE.MeshStandardMaterial({color:0x445544}));mesh.position.set(i*2,1,0);if(i===7)mesh.userData.dynamic=true;root.add(mesh);}
  const before=new THREE.Box3().setFromObject(root),dynamic=root.children[7];batchStaticGeometry(root);const after=new THREE.Box3().setFromObject(root);
  assert.equal(root.children.length,2);assert.ok(root.children.includes(dynamic));assert.ok(before.min.distanceTo(after.min)<.00001);assert.ok(before.max.distanceTo(after.max)<.00001);
});
