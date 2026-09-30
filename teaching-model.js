import {createPuzzle} from './assets/puzzle.js';
import {C,smooth} from './teaching-kit.js';

export function createTeachingModel(){
 const p=createPuzzle(document.createElement('div'));
 const {THREE,scene,root,camera,parts,beans,halos,floor}=p.teaching;
 const original=[];root.traverse(n=>{if(n.isMesh)original.push({n,position:n.position.clone(),scale:n.scale.clone(),material:n.material});});
 const partColors=[C.mint,C.amber,C.blue,C.violet,C.pink];
 const mats=partColors.map(color=>new THREE.MeshStandardMaterial({color,roughness:.5}));
 const neutral=new THREE.MeshStandardMaterial({color:'#bdcbd4',roughness:.64});
 const layerMaterials=[C.mint,C.muted,C.blue,C.pink].map(color=>new THREE.MeshStandardMaterial({color,roughness:.55}));
 const wire=new THREE.MeshBasicMaterial({color:'#446277',wireframe:true});
 const partEntries=Object.entries(parts);
 function draw(ctx,x,y,w,h,options={}){
  for(const o of original){o.n.position.copy(o.position);o.n.scale.copy(o.scale);o.n.material=o.material;o.n.visible=true;}
  partEntries.forEach(([,v])=>{v.group.position.copy(v.pivot);v.group.visible=true;});
  p.renderAt(options.motionTime??0);
  halos.forEach(h=>h.visible=false);floor.visible=false;
  root.scale.set(1,1,options.thickness??1);
  root.rotation.set(options.pitch??.15,options.yaw??0,options.roll??0,'YXZ');
  const beadSet=new Set(beans.map(b=>b.mesh));
  for(const [i,[name,part]] of partEntries.entries()){
   part.group.visible=!options.onlyPart||name===options.onlyPart;
   if(options.onlyBeads)part.group.visible=false;
   if(options.explode){
    if(name.startsWith('outer'))part.group.position.addScaledVector(p.teaching.normals[Number(name.at(-1))],options.explode);
    else if(name==='rotor')part.group.position.z+=options.explode*.9;
   }
   part.group.traverse(n=>{
    if(!n.isMesh)return;
    if(options.colorParts)n.material=mats[i];
    if(options.neutral)n.material=neutral;
    if(options.wireframe)n.material=wire;
    if(options.layers){
     const index=part.group.children.indexOf(n),structuralCount=name.startsWith('outer')?7:5;
     if(index>=structuralCount){n.visible=false;return;}
     n.material=index===0?layerMaterials[0]:index<=2?layerMaterials[1]:n.position.z>0?layerMaterials[2]:layerMaterials[3];
     if(index>0)n.position.z+=Math.sign(n.position.z)*options.layers*(index<=2?.7:1.5);
    }
   });
  }
  beans.forEach((b,i)=>{b.mesh.visible=options.beads!==false&&(!Number.isFinite(options.beadCount)||i<options.beadCount);});
  const hw=options.halfHeight??(options.explode?4.8:3.8);
  camera.aspect=w/h;camera.position.set(0,root.position.y,hw/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));camera.lookAt(0,root.position.y,0);camera.updateProjectionMatrix();
  if(p.renderer.domElement.width!==w||p.renderer.domElement.height!==h)p.renderer.setSize(w,h,false);
  scene.background=new THREE.Color(options.dark?C.panel:C.pale);
  p.renderer.render(scene,camera);ctx.drawImage(p.renderer.domElement,x,y,w,h);
 }
 return {draw,puzzle:p};
}
