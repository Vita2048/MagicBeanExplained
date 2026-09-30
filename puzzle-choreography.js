  // Color layout is deliberately mixed so a circular movement is visible.
  // Reuse the original six materials; no geometry or mechanical rule changes.
  const palettes=[[4,4,4,0,2,2,2,0,4,4],[3,3,3,0,0,0,1,1,3,3],[5,5,5,2,1,1,1,2,5,5]];
  for(let f=0;f<2;f++)for(let l=0;l<3;l++)for(let k=0;k<10;k++){
    const bean=state[slotID(f,l,k)];const color=(palettes[l][k]+f*3)%6;
    bean.mesh.material=beanMaterials[color];bean.color=color;
  }
  const beans=state.filter(Boolean),partList=Object.values(parts);
  const capture=()=>({positions:beans.map(b=>b.mesh.position.clone()),quaternions:partList.map(p=>p.group.quaternion.clone()),slots:state.map(b=>b?beans.indexOf(b):-1),rotor:rotorRotation});
  const restore=s=>{beans.forEach((b,i)=>b.mesh.position.copy(s.positions[i]));partList.forEach((p,i)=>p.group.quaternion.copy(s.quaternions[i]));};
  const actions=[];
  const add=(at,duration,type,lobe=0,dir=1,face=0)=>actions.push({at,duration,type,lobe,dir,face});
  // Five 36-degree increments show half a circuit, with distinct color travel.
  for(let l=0;l<3;l++)for(let k=0;k<5;k++)add(7+l*3+k*.51,.46,'ring',l);
  add(16.3,2.6,'center');
  // Ten linked steps visibly carry beads from one lobe into the next.
  for(let k=0;k<10;k++)add(20+k*.56,.52,'ring');
  add(26,.95,'center',0,-1);
  for(let l=0;l<3;l++)add(27.2+l*2.5,2.1,'flip',l);
  const q=new THREE.Quaternion();
  for(const a of actions){
    a.before=capture();a.definition=movementDefinition(a);
    const d=a.definition;
    a.moving=d.mappings.map(([from,to])=>({bean:state[from],from,to,start:slots[from].position.clone(),end:slots[to].position.clone()}));
    if(d.part)a.partStart=d.part.group.quaternion.clone();
    q.setFromAxisAngle(d.axis,d.angle||0);
    for(const m of a.moving){if(!m.bean)continue;m.bean.mesh.position.copy(m.start);if(d.lerp)m.bean.mesh.position.copy(m.end);else m.bean.mesh.position.sub(d.pivot).applyQuaternion(q).add(d.pivot);}
    if(d.part)d.part.group.quaternion.copy(a.partStart).multiply(q);
    for(const m of a.moving)state[m.to]=m.bean;
    if(a.type==='center'){
      rotorRotation=(rotorRotation+a.dir+6)%6;
      parts.rotor.group.quaternion.setFromAxisAngle(layoutAxis,rotorRotation*TAU/6);
      layoutCarriedSlots();
    }
    snapBeans();a.after=capture();
  }
  const initial=actions[0].before;
  const haloMaterial=new THREE.MeshBasicMaterial({color:'#ffc878',transparent:true,opacity:.8,depthTest:false});
  const halos=centers.map(c=>{const h=new THREE.Mesh(new THREE.TorusGeometry(1.54,.013,8,128),haloMaterial);h.position.set(c.x,c.y,.7);h.renderOrder=9;root.add(h);return h;});
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  camera.aspect=1188/674;
  const halfHeight=4.25;
  camera.position.set(0,root.position.y,halfHeight/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
  camera.lookAt(0,root.position.y,0);camera.updateProjectionMatrix();
  renderer.setSize(1188,674,false);
  renderer.domElement.style.cssText='width:100%;height:100%;display:block';
  // Preserve front/rear lighting during the inspection turn; the original flat
  // shadow receiver would slice through the rotated model, so fade it first.
  function renderAt(time){
    const t=Math.max(0,Math.min(45,time));
    let current=null;
    for(const a of actions){if(a.at<=t)current=a;else break;}
    restore(current?current.before:initial);
    let u=0;
    if(current){
      u=Math.min(1,(t-current.at)/current.duration);
      if(u>=1)restore(current.after);
      else{
        const d=current.definition,e=smooth(u);
        q.setFromAxisAngle(d.axis,(d.angle||0)*e);
        for(const m of current.moving){
          if(!m.bean)continue;
          m.bean.mesh.position.copy(m.start);
          if(d.lerp)m.bean.mesh.position.lerp(m.end,e);
          else m.bean.mesh.position.sub(d.pivot).applyQuaternion(q).add(d.pivot);
        }
        if(d.part)d.part.group.quaternion.copy(current.partStart).multiply(q);
      }
    }
    const tilt=smooth((t-26.2)/.8)*(1-smooth((t-34.4)/.6));
    const turn=smooth((t-35)/6);
    root.rotation.set(.19*tilt+.14*Math.sin(turn*Math.PI),-.23*tilt+turn*TAU,0,'YXZ');
    floor.material.opacity=.18*(1-smooth((t-26)/.7));
    halos.forEach((h,i)=>h.visible=t>=7+i*3&&t<9.8+i*3);
    renderer.render(scene,camera);
    return {time:t,action:current?.type||'hold',progress:u,rotor:current?(u>=1?current.after.rotor:current.before.rotor):0,beadCount:beans.length,positions:beans.map(b=>b.mesh.position.toArray()),partQuaternions:partList.map(p=>p.group.quaternion.toArray()),rootQuaternion:root.quaternion.toArray()};
  }
  renderAt(0);
  return {renderAt,renderer,teaching:{THREE,scene,root,camera,parts,beans,halos,floor,centers,normals,traceShapes,bodyField,trackField,regionField},actions:actions.map(({at,duration,type,lobe,dir})=>({at,duration,type,lobe,dir})),getGeometryStats:()=>{let meshes=0,vertices=0;root.traverse(n=>{if(n.isMesh){meshes++;vertices+=n.geometry.attributes.position.count;}});return {meshes,vertices,beads:beans.length,parts:partList.length};}};
