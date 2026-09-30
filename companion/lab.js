import * as THREE from '../assets/three.module.js';
import {traceShapes} from './trace-shapes.js';
const canvas=document.getElementById('mask'),ctx=canvas.getContext('2d'),view=document.getElementById('view');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(640,640);renderer.setPixelRatio(1);view.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e1e9ed');scene.add(new THREE.HemisphereLight('#ffffff','#607b91',2));const light=new THREE.DirectionalLight('#ffffff',2.8);light.position.set(-3,5,7);scene.add(light);
const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,0,14);camera.lookAt(0,0,0);
let stage=0,mesh=null,yaw=0,builds=0;
const names=['1 · Centers','2 · Body mask','3 · Remove channels','4 · Extrude','5 · Bevel'];
names.forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{stage=i;build();};document.getElementById('steps').appendChild(b);});
for(const id of ['r','w','d'])document.getElementById(id).addEventListener('input',()=>document.getElementById(id+'-value').textContent=document.getElementById(id).value);
function build(){
 const R=+document.getElementById('r').value,D=2*R,half=+document.getElementById('w').value,depth=+document.getElementById('d').value;
 const centers=[0,1,2].map(i=>{const a=Math.PI/2+i*Math.PI*2/3;return {x:D*Math.cos(a),y:D*Math.sin(a)};});
 const rr=Math.hypot(D-R*Math.sin(Math.PI/5),R*Math.cos(Math.PI/5));
 const body=(x,y)=>Math.min(Math.hypot(x,y)-(rr+.06),...centers.map(c=>Math.hypot(x-c.x,y-c.y)-1.5));
 const track=(x,y)=>Math.min(...centers.map(c=>Math.abs(Math.hypot(x-c.x,y-c.y)-R)-half));
 const field=stage<2?body:(x,y)=>Math.max(body(x,y),-track(x,y));
 ctx.fillStyle='#101f30';ctx.fillRect(0,0,640,640);const im=ctx.getImageData(0,0,640,640),scale=75;
 if(stage>0){for(let j=0;j<640;j++)for(let i=0;i<640;i++){if(field((i-320)/scale,(340-j)/scale)<0){const k=(j*640+i)*4;im.data[k]=119;im.data[k+1]=237;im.data[k+2]=204;im.data[k+3]=255;}}ctx.putImageData(im,0,0);}
 if(stage===0){ctx.strokeStyle='#33495e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(35,340);ctx.lineTo(605,340);ctx.moveTo(320,35);ctx.lineTo(320,605);ctx.stroke();centers.forEach((c,i)=>{ctx.strokeStyle=['#8fc9ff','#b5a7fa','#f3abc5'][i];ctx.lineWidth=3;ctx.beginPath();ctx.arc(320+c.x*scale,340-c.y*scale,R*scale,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(320+c.x*scale,340-c.y*scale,5,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();});}
 if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}
 const bevel=stage===4?.04:0;
 const shapes=traceShapes((x,y)=>field(x,y)+bevel);
 const geometry=stage<3?new THREE.ShapeGeometry(shapes):new THREE.ExtrudeGeometry(shapes,{depth,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:5});
 mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#5cade3',roughness:.4,side:THREE.DoubleSide}));mesh.rotation.set(stage>=3?.8:0,yaw,0);scene.add(mesh);renderer.render(scene,camera);
 const snippets=[`const D = 2 * R;\nconst angle = Math.PI / 2 + i * 2 * Math.PI / 3;\nconst center = { x: D * Math.cos(angle), y: D * Math.sin(angle) };`,`const disk = Math.hypot(x - c.x, y - c.y) - shellRadius;\nconst body = Math.min(centerDisk, disk0, disk1, disk2);`,`const band = Math.abs(distance - R) - halfWidth;\nconst track = Math.min(band0, band1, band2);\nconst face = Math.max(body, -track);`,`const shapes = traceShapes(face);\nconst geometry = new THREE.ExtrudeGeometry(shapes, {\n  depth: ${depth}, bevelEnabled: false\n});`,`const shapes = traceShapes((x, y) => face(x, y) + 0.04);\nconst geometry = new THREE.ExtrudeGeometry(shapes, {\n  depth: ${depth}, bevelEnabled: true,\n  bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 5\n});`];
 document.getElementById('code').textContent=snippets[stage];document.querySelectorAll('#steps button').forEach((b,i)=>b.classList.toggle('active',i===stage));
 document.getElementById('status').textContent=`${shapes.length} filled shape(s), ${shapes.reduce((s,x)=>s+x.holes.length,0)} hole(s), ${geometry.attributes.position.count.toLocaleString()} vertices. Rebuild ${++builds}.`;
 window.labState={stage,R,D,half,depth,shapes:shapes.length,vertices:geometry.attributes.position.count,builds};
}
document.getElementById('rebuild').onclick=build;document.getElementById('turn').onclick=()=>{yaw+=Math.PI/4;build();};document.getElementById('reset').onclick=()=>{for(const [id,v] of [['r',.88],['w',.275],['d',.205]]){document.getElementById(id).value=v;document.getElementById(id+'-value').textContent=v;}yaw=0;build();};build();
