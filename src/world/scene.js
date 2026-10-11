import * as THREE from '../../vendor/three.module.js';

export class ArenaScene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111916');
    this.scene.fog = new THREE.Fog('#111916', 18, 45);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 90);
    this.camera.position.set(0, 5.8, 19.5);
    this.camera.lookAt(0, 1.1, 0);
    this.scene.add(new THREE.HemisphereLight('#d9f8d1', '#293632', 2.6));
    const key = new THREE.DirectionalLight('#edffd9', 4);
    key.position.set(-4, 10, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 8, bottom: -8 });
    key.shadow.normalBias = 0.035;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#a7ccee', 2);
    rim.position.set(6, 5, -6);
    this.scene.add(rim);
    this.environment = new THREE.Group();
    this.scene.add(this.environment);
    this.build();
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }
  box(w, h, d, x, y, z, color, parent = this.environment) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
    mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  build() {
    this.box(23,0.5,8,0,-0.26,0,'#35443b');
    this.box(23.3,0.1,8.3,0,-0.52,0,'#131a17');
    this.box(22,0.015,0.055,0,0.004,2.8,'#c4d6a1');
    this.box(22,0.015,0.055,0,0.004,-2.8,'#c4d6a1');
    for (const x of [-10.5, 10.5]) this.box(0.055,0.015,5.6,x,0.004,0,'#c4d6a1');
    for (let x=-10;x<=10;x+=2) this.box(0.025,0.012,8,x,0.005,0,'#425448');
    const circle = new THREE.Mesh(new THREE.RingGeometry(1.55,1.59,64), new THREE.MeshBasicMaterial({color:'#718365',side:THREE.DoubleSide}));
    circle.rotation.x=-Math.PI/2; circle.position.y=0.014; this.environment.add(circle);
    this.box(40,0.3,32,0,-1.1,-4,'#141c18');
    for (let x=-18;x<=18;x+=6) {
      this.box(0.5,11,0.5,x,3.9,-7,'#24352c');
      this.box(0.07,7,0.07,x+0.3,4,-6.7,'#b0be79');
      this.box(5.6,0.15,0.25,x+3,5.5,-7,'#314436');
      this.box(5.6,0.15,0.25,x+3,1,-7,'#314436');
    }
    this.box(45,0.5,0.7,0,8,-7,'#2a3b2d');
    this.box(9,0.06,0.2,0,6.7,-5,'#d9efb7');
    this.box(7,2.3,0.16,0,3.7,-7.1,'#19221d');
    const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=320;
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#cbd5b4'; ctx.textAlign='center'; ctx.font='900 110px Arial'; ctx.fillText('FURY ARENA',512,145); ctx.font='500 28px Arial'; ctx.fillStyle='#78846e'; ctx.fillText('NO LIMITS. JUST FIGHT.',512,220);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(6.6,2.06),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true})); label.position.set(0,3.7,-6.99); this.environment.add(label);
  }
  resize() {
    const w=innerWidth,h=innerHeight;
    this.renderer.setSize(w,h,false); this.camera.aspect=w/h;
    this.camera.fov = w/h < 1 ? 48 : 34;
    this.camera.position.z = w/h < 1 ? 26 : 19.5;
    this.camera.updateProjectionMatrix();
  }
  render() {
    this.renderer.render(this.scene,this.camera);
    const now=performance.now();this.frames=(this.frames||0)+1;this.metricsSince??=now;
    if(now-this.metricsSince>=1000){this.renderer.domElement.dataset.fps=String(Math.round(this.frames*1000/(now-this.metricsSince)));this.renderer.domElement.dataset.drawCalls=String(this.renderer.info.render.calls);this.renderer.domElement.dataset.triangles=String(this.renderer.info.render.triangles);this.frames=0;this.metricsSince=now;}
  }
}
