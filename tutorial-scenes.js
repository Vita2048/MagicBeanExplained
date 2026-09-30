import {C,TAU,R,D,OUTER,HALF,GAP,RR,centers,clamp,smooth,ramp,mix,body,track,region,text,line,circle,box,arrow,wrap,code,note,axes,mask,ring,legend} from './teaching-kit.js';

const S=[];
const add=s=>S.push(s);
const diagramPanel=c=>box(c,0,0,990,680,C.panel,C.line);
const phase=(t,rows)=>rows.findLast(r=>t>=r[0])||rows[0];
const partLegend=[['Fixed frame',C.mint],['Central rotor',C.amber],['Top outer half',C.blue],['Lower-left outer half',C.violet],['Lower-right outer half',C.pink]];
function plotCenters(c,ox,oy,scale,n=3,paths=false){centers.slice(0,n).forEach((p,i)=>{const color=[C.blue,C.violet,C.pink][i];circle(c,ox+p.x*scale,oy-p.y*scale,6,color);if(paths)circle(c,ox+p.x*scale,oy-p.y*scale,R*scale,null,color,3);});}
function polyline(c,pts,color=C.mint,width=3,close=false){if(!pts.length)return;c.save();c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...pts[0]);pts.slice(1).forEach(p=>c.lineTo(...p));if(close)c.closePath();c.stroke();c.restore();}

add({id:'parts',title:'Start with the parts that move together',kicker:'01 / DECOMPOSE THE OBJECT',duration:30,takeaway:'Five structural groups. Separate beads. One shared coordinate system.',beats:[
 [0,'Before writing geometry code, decide which parts must move together.'],
 [5,'This puzzle has a fixed frame, a central rotor, and three outer halves that flip.'],
 [11,'We give those five structural groups temporary colors so their boundaries are easy to follow.'],
 [17,'The beads are separate meshes. Removing them reveals the channels underneath.'],
 [23,'The same layered construction appears on the front and the back.']
],draw(c,t,m){
 box(c,0,0,990,680,C.pale);m.draw(c,0,0,990,680,{colorParts:t>=5,beads:t<17,explode:.75*ramp(t,8,13),yaw:Math.PI*ramp(t,24,29),pitch:.25,halfHeight:4.8});
 text(c,'THE STRUCTURAL GROUPS',1040,38,23,C.mint,'left',true);legend(c,partLegend,1045,95,51);
 code(c,['const part = new THREE.Group();','part.add(core, bed, face);','puzzle.add(part);'],1035,390,735,t<17?0:1,'GROUP BY MECHANICAL MOTION');
}});

add({id:'centers',title:'Three centers, placed with sine and cosine',kicker:'02 / COORDINATES & SYMMETRY',duration:40,takeaway:'The bead-path radius R and the shell radius are different dimensions.',beats:[
 [0,'Build the flat drawing in the x-y plane. The z direction will become thickness.'],
 [6,'Place three lobe centers around the origin, one hundred and twenty degrees apart.'],
 [12,'Cosine gives the horizontal coordinate; sine gives the vertical coordinate.'],
 [18,'The angles are ninety, two hundred ten, and three hundred thirty degrees.'],
 [24,'Here the bead-path radius R is 0.88, and the center distance D is twice R.'],
 [31,'Draw a bead-path circle at each center. The outer shell will use its own larger radius.']
],draw(c,t){
 diagramPanel(c);const ox=470,oy=371,sc=85;axes(c,ox,oy,sc,3.45);
 const n=t<6?1:t<12?2:3;
 circle(c,ox,oy,D*sc,null,C.line,2);circle(c,ox,oy,5,C.white);text(c,'origin',ox+15,oy+23,24,C.muted);
 centers.slice(0,n).forEach((p,i)=>{const col=[C.blue,C.violet,C.pink][i],x=ox+p.x*sc,y=oy-p.y*sc;line(c,ox,oy,x,y,col,3);circle(c,x,y,7,col);text(c,`${[90,210,330][i]}°`,x+(i===1?-42:35),y-23,26,col,'center');if(t>=24)circle(c,x,y,R*sc,null,col,3,-Math.PI/2,-Math.PI/2+TAU*ramp(t,24+i,27+i));if(t>=31){c.save();c.setLineDash([7,7]);circle(c,x,y,OUTER*sc,null,C.muted,1.5);c.restore();}});
 if(t>=12&&t<24){const p=centers[2],x=ox+p.x*sc,y=oy-p.y*sc;line(c,ox,y,x,y,C.amber,2,[6,5]);line(c,x,oy,x,y,C.amber,2,[6,5]);text(c,'D cos θ',(ox+x)/2,oy-20,25,C.amber,'center');text(c,'D sin θ',x+20,(oy+y)/2,25,C.amber);}
 text(c,t>=31?'Solid: bead path   ·   Dashed: shell':'Three equally spaced lobe centers',495,638,27,C.muted,'center');
 code(c,['const R = 0.88;','const D = 2 * R;','const angle = Math.PI / 2','  + i * 2 * Math.PI / 3;','const x = D * Math.cos(angle);','const y = D * Math.sin(angle);'],1035,35,735,t<12?3:t<24?4:0);
 text(c,'CENTER DISTANCE',1060,425,23,C.mint,'left',true);text(c,'D = 1.76',1060,472,40,C.white);
 note(c,'Repeat the same construction for i = 0, 1, 2.',1060,548,640);
}});

add({id:'fields',title:'A function can describe the inside of a shape',kicker:'03 / IMPLICIT 2D MASKS',duration:45,takeaway:'Negative = inside. Zero = boundary. Positive = outside.',beats:[
 [0,'Instead of drawing every edge by hand, ask whether a point is inside the shape.'],
 [6,'For a circle, measure the distance from its center and subtract its radius.'],
 [12,'A negative result means inside. Zero is the boundary. Positive means outside.'],
 [19,'Move the test point across the circle and watch the sign change.'],
 [25,'To combine circles, take the minimum of their values at each point.'],
 [32,'The body combines three lobe disks with a central disk that connects them.'],
 [39,'We use the combined function as an inside-outside mask for later construction.']
],draw(c,t){
 diagramPanel(c);
 if(t<25){
  const cx=425,cy=310,rad=185;circle(c,cx,cy,rad,'#21483f',C.mint,4);circle(c,cx,cy,5,C.white);
  const d=mix(110,275,ramp(t,17,24)),x=cx+d;arrow(c,cx,cy,x,cy,C.amber);circle(c,x,cy,9,C.amber);
  text(c,'center',cx-25,cy+33,25,C.white,'right');text(c,'test point',x+15,cy-29,25,C.amber);
  text(c,'radius',cx-105,cy-150,25,C.mint);line(c,cx,cy,cx-131,cy-131,C.mint,2);
  const val=(d-rad)/100;box(c,135,542,720,90,C.bg);text(c,`distance − radius = ${val>=0?'+':''}${val.toFixed(2)}`,495,586,36,val>0?C.pink:C.mint,'center',true);
 }else{
  const fade=ramp(t,25,27);mask(c,'body',140,10,720,660,fade);
  if(t<38){centers.forEach(p=>circle(c,500+p.x*100,360-p.y*100,150,null,C.white,1.5));circle(c,500,360,(RR+.06)*100,null,C.amber,3);}
  text(c,'UNION OF FOUR DISKS',495,637,26,C.muted,'center',true);
 }
 code(c,t<25?['const d = Math.hypot(','  x - center.x,','  y - center.y',');','return d - radius;']:['let body = centerDisk(x, y);','for (const c of centers) {','  body = Math.min(body,','    disk(x, y, c, shellRadius));','}','return body;'],1035,35,735,t<12?0:t<25?4:2,t<25?'ONE CIRCLE':'UNION / EITHER INTERIOR');
 legend(c,[['f < 0   inside',C.mint],['f = 0   boundary',C.amber],['f > 0   outside',C.pink]],1060,415,62);
 note(c,t<25?'We care where the value crosses zero.':'The union is an implicit mask; its values need not be exact distances everywhere.',1060,606,660);
}});

add({id:'channels',title:'Cut a circular channel into the raised face',kicker:'04 / BANDS & SUBTRACTION',duration:40,takeaway:'Subtract the channel from the raised face; keep a lower layer as its floor.',beats:[
 [0,'A bead channel is a band around a circle, not a solid disk.'],
 [6,'Take the absolute difference between distance and the bead-path radius.'],
 [12,'Subtract the half-width. The negative region is now a circular band.'],
 [18,'Combine the bands from all three lobes to describe the complete track.'],
 [25,'Keep points inside the body and outside the track to form the raised face.'],
 [32,'This removes the upper material. A separate lower bed becomes the channel floor.']
],draw(c,t){
 diagramPanel(c);
 if(t<18){const x=485,y=325,r=175,w=HALF/R*r*ramp(t,7,13);ring(c,x,y,r,Math.max(3,w*2),C.amber);circle(c,x,y,5,C.white);line(c,x,y,x+r,y,C.white,2);text(c,'R',x+r/2,y-25,30,C.white,'center');if(t>10){arrow(c,x+r,y+105,x+r+w,y+105,C.mint);text(c,'halfWidth',x+r-20,y+145,27,C.mint,'center');}text(c,'A band around radius R',495,626,28,C.muted,'center');}
 else {mask(c,t<25?'track':'solid',140,0);text(c,t<25?'THREE CHANNEL BANDS':'RAISED FACE AFTER SUBTRACTION',495,637,25,C.muted,'center',true);}
 code(c,t<25?['const distance = Math.hypot(','  x - c.x, y - c.y);','const band = Math.abs(','  distance - R',') - halfWidth;']:['const face = Math.max(','  bodyField(x, y),','  -trackField(x, y)',');'],1035,35,735,t<12?3:t<25?4:2,t<25?'ONE ANNULAR BAND':'SUBTRACTION / BODY WITHOUT TRACK');
 if(t<32){text(c,'R = 0.88',1060,426,33,C.white);text(c,'halfWidth = 0.275',1060,479,33,C.amber);note(c,'Inside the band: |distance − R| < halfWidth',1060,567,635);}
 else {text(c,'CHANNEL CROSS-SECTION',1060,356,23,C.mint,'left',true);box(c,1080,520,640,32,'#516c86',null,0);box(c,1080,412,215,108,C.mint,null,0);box(c,1505,412,215,108,C.mint,null,0);circle(c,1400,473,49,C.amber);text(c,'lower bed',1400,589,26,C.white,'center');arrow(c,1400,561,1400,541,C.white,2);}
}});

add({id:'regions',title:'Split the body into regions that can move',kicker:'05 / MECHANICAL BOUNDARIES',duration:55,takeaway:'Intersect the body with each part’s region, then leave clearance at every seam.',beats:[
 [0,'The outer silhouette is not enough. We must decide which material belongs to each part.'],
 [7,'A circle around the origin defines the central rotor.'],
 [14,'A line through each lobe center separates its outer flipping half.'],
 [22,'A dot product tells us which side of that line a point lies on.'],
 [30,'Intersect each region with the body. The remaining inner material belongs to the fixed frame.'],
 [38,'Leave a small gap between neighboring parts so they can move independently.'],
 [46,'Choose the rotor radius so its boundary falls between beads, rather than cutting through them.']
],draw(c,t){
 diagramPanel(c);mask(c,t<7?'body':t<30?'regions':'region-solid',140,0);
 const ox=500,oy=350,sc=100;
 if(t>=7)circle(c,ox,oy,RR*sc,null,C.amber,4);
 if(t>=14&&t<38)centers.forEach((p,i)=>{if(t<14+i*2)return;const x=ox+p.x*sc,y=oy-p.y*sc,dx=-p.ny*155,dy=-p.nx*155;line(c,x-dx,y-dy,x+dx,y+dy,C.white,3,[9,6]);circle(c,x,y,5,C.white);if(t>=22)arrow(c,x,y,x+p.nx*82,y-p.ny*82,C.amber);});
 if(t<38){code(c,t<22?['const rotor = Math.hypot(x, y)','  - (rotorRadius - GAP);','','const partMask = Math.max(','  bodyField(x, y), region',');']:['const outward =','  (x - c.x) * normal.x','  + (y - c.y) * normal.y;','','const outerHalf = GAP - outward;'],1035,35,735,t<22?1:4,'REGION MASKS');legend(c,partLegend,1060,391,47);}
 else {
  text(c,'SEAM DETAIL',1060,38,23,C.mint,'left',true);
  // Actual circle and adjacent bead positions, enlarged in lobe-local coordinates.
  const bx=1390,by=255,scale=225;
  c.save();c.beginPath();c.rect(1040,75,700,330);c.clip();
  const shiftX=-.25,shiftY=1.15;
  const P=(x,y)=>[bx+(x-shiftX)*scale,by-(y-shiftY)*scale];
  const rotorCenter=P(0,0);circle(c,...rotorCenter,RR*scale,null,C.amber,4);
  for(let k=3;k<=4;k++){const a=Math.PI/2+k*TAU/10;const pos=P(R*Math.cos(a),D+R*Math.sin(a));circle(c,...pos,.265*scale,C.blue,C.white,2);}
  c.restore();
  // A readable magnified section of two inset boundaries.
  box(c,1080,445,286,66,C.mint,null,2);box(c,1386,445,315,66,C.amber,null,2);
  line(c,1376,427,1376,532,C.white,2,[5,4]);text(c,'fixed',1223,478,29,C.bg,'center');text(c,'rotor',1544,478,29,C.bg,'center');
  text(c,'GAP = 0.012 per side',1060,560,29,C.white,'left',true);note(c,'The clearance is magnified here so you can see it.',1060,616,650);
 }
}});

function marchingSegments(fn,n=9){
 const segments=[];const val=(x,y)=>fn(x/n,y/n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(const tri of [[[x,y],[x+1,y],[x+1,y+1]],[[x,y],[x+1,y+1],[x,y+1]]]){
  const hits=[];
  for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],fa=val(...a),fb=val(...b);if((fa<0)!==(fb<0)){const u=fa/(fa-fb);hits.push([mix(a[0],b[0],u)/n,mix(a[1],b[1],u)/n]);}}
  if(hits.length===2)segments.push(hits);
 }
 return segments;
}
const contourExample=(x,y)=>Math.hypot(x-.5,y-.5)-.35;
const contourSegments=marchingSegments(contourExample);
add({id:'contours',title:'Turn the zero boundary into a closed outline',kicker:'06 / CUSTOM CONTOUR EXTRACTION',duration:45,takeaway:'traceShapes is our helper. THREE.Shape and THREE.Path are Three.js classes.',beats:[
 [0,'Three.js needs an outline that it can turn into a mesh. Our traceShapes helper creates it.'],
 [6,'Sample the mask on a grid, then split every cell into two triangles.'],
 [13,'On each edge, compare the signs at its endpoints. A sign change means the boundary crosses.'],
 [20,'Interpolate between those values to estimate the zero crossing.'],
 [27,'Join the crossings into closed loops. A finer grid gives a more detailed approximation.'],
 [34,'Outer loops become Shapes. Enclosed empty loops become Paths in the shape’s holes array.'],
 [40,'Give hole boundaries the opposite winding direction to the outer contour.']
],draw(c,t){
 diagramPanel(c);
 if(t<34){
  const ox=200,oy=55,size=540,step=60;
  circle(c,ox+size/2,oy+size/2,size*.35,'#183d38',null);
  for(let i=0;i<=9;i++){line(c,ox+i*step,oy,ox+i*step,oy+size,C.line,1.5);line(c,ox,oy+i*step,ox+size,oy+i*step,C.line,1.5);}
  if(t>=6)for(let j=0;j<9;j++)for(let i=0;i<9;i++)line(c,ox+i*step,oy+j*step,ox+(i+1)*step,oy+(j+1)*step,'#2b4355',1);
  for(let j=0;j<=9;j++)for(let i=0;i<=9;i++)circle(c,ox+i*step,oy+j*step,4,contourExample(i/9,j/9)<0?C.mint:C.pink);
  const count=Math.floor(contourSegments.length*ramp(t,13,29));
  contourSegments.slice(0,count).forEach(s=>{const a=s[0].map((v,i)=>(i?oy:ox)+v*size),b=s[1].map((v,i)=>(i?oy:ox)+v*size);line(c,...a,...b,C.amber,4);if(t<27){circle(c,...a,4,C.amber);circle(c,...b,4,C.amber);}});
  text(c,t<13?'Sample → triangulate':t<27?'Find sign changes → interpolate':'Join the segments into a closed contour',495,640,28,C.muted,'center');
 }else{
  ring(c,495,315,185,100,C.mint);circle(c,495,315,235,null,C.amber,4);circle(c,495,315,135,null,C.pink,4);
  text(c,'OUTER CONTOUR',495,34,27,C.amber,'center');text(c,'HOLE',495,315,30,C.pink,'center');
  arrow(c,490,80,550,87,C.amber,4);arrow(c,480,180,422,202,C.pink,4);
  text(c,'Opposite winding directions',495,628,29,C.muted,'center');
 }
 if(t<27){
  code(c,['const t = fa / (fa - fb);','const crossing = a.clone()','  .lerp(b, t);'],1035,35,735,0,'LINEAR ZERO-CROSSING ESTIMATE');
  text(c,'fa = −0.6',1080,324,28,C.mint);text(c,'fb = +0.2',1530,324,28,C.pink);
  line(c,1100,395,1680,395,C.white,3);circle(c,1100,395,8,C.mint);circle(c,1680,395,8,C.pink);circle(c,1535,395,10,C.amber);
  text(c,'zero',1535,440,28,C.amber,'center');text(c,'t = −0.6 / (−0.6 − 0.2) = 0.75',1060,519,27,C.white,'left',true);
  note(c,'The crossing lies 75% of the way from a to b.',1060,594,650);
 }else{
  code(c,['const shapes = traceShapes(mask);','','const shape = new THREE.Shape(','  outerPoints',');','shape.holes.push(','  new THREE.Path(holePoints)',');'],1035,35,735,t<34?0:5,'FROM LOOPS TO THREE.JS');
  note(c,'traceShapes samples, connects and classifies loops. It is custom project code.',1060,472,650,C.amber);
  note(c,'Each disconnected filled island becomes its own Shape.',1060,589,650);
 }
}});

add({id:'extrusion',title:'Add thickness — without closing the seams',kicker:'07 / EXTRUSION & BEVEL CLEARANCE',duration:45,takeaway:'Inset first, bevel second, then correct small boundary overshoots.',beats:[
 [0,'Pass the traced shapes to ExtrudeGeometry to turn the flat outlines into solids.'],
 [7,'Depth creates the side walls. The front face now has real thickness.'],
 [14,'Bevel size controls the edge’s sideways extent; bevel thickness controls its depth.'],
 [21,'Rounded edges look molded, but the bevel can expand beyond the input outline.'],
 [28,'At a mechanical seam, that expansion can enter the neighboring part’s space.'],
 [34,'The project insets the mask before beveling, then clamps small boundary overshoots.'],
 [40,'Recompute the normals after adjusting vertices so the shading matches the final mesh.']
],draw(c,t,m){
 if(t<25){box(c,0,0,990,680,C.pale);m.draw(c,0,0,990,620,{beads:false,neutral:true,wireframe:t<5,thickness:mix(.015,1,ramp(t,4,13)),pitch:.7,yaw:-.35,halfHeight:3.75});text(c,t<7?'THE TRACED FACE':t<14?'EXTRUDE ALONG z':'ROUNDED, MOLDED EDGES',495,645,26,'#32485a','center',true);}
 else {
  diagramPanel(c);text(c,'MAGNIFIED SEAM / SIDE VIEW',495,40,26,C.muted,'center',true);
  const corrected=t>=34;const gap=corrected?34:-8;
  box(c,150,180,330,250,C.mint,null,28);box(c,480+gap,180,330,250,C.amber,null,28);
  line(c,497,130,497,480,C.white,3,[8,7]);
  text(c,corrected?'CLEARANCE PRESERVED':'BEVELS OVERLAP',495,536,36,corrected?C.mint:C.red,'center');
  note(c,corrected?'Inset each outline before extrusion. Clamp any small numerical overshoot.':'A rounded silhouette can cross its intended split boundary.',160,601,700);
 }
 code(c,['const shapes = traceShapes(','  (x, y) => mask(x, y) + bevel',');','const geometry = new THREE.ExtrudeGeometry(','  shapes, {','    depth: 0.205,','    bevelSize: 0.05,','    bevelThickness: 0.05,','    bevelSegments: 8','  }',');'],1035,20,735,t<7?3:t<14?5:t<21?6:t<34?7:1,'EXAMPLE / RAISED FACE SETTINGS');
 if(t>=40)text(c,'geometry.computeVertexNormals();',1060,579,26,C.amber,'left',true);
 else note(c,'Depth and bevel settings belong to the geometry, not to the material.',1060,579,650);
}});

add({id:'pivots',title:'Stack the layers around the correct pivot',kicker:'08 / LAYERS & LOCAL COORDINATES',duration:40,takeaway:'Local vertex = world vertex − pivot. Put the Group back at the pivot.',beats:[
 [0,'Each part combines a core, a dark channel bed, and raised face layers.'],
 [6,'Matching layers sit on both sides, so the puzzle has a front and a back.'],
 [13,'The pivot determines where a part rotates. It is not always the world origin.'],
 [20,'Subtract the pivot from the geometry’s vertices to make their coordinates local.'],
 [27,'Then place the Group at the pivot. Its meshes stay together when that Group rotates.'],
 [34,'The center turns around z. Each outer half flips around its outward-pointing axis.']
],draw(c,t,m){
 box(c,0,0,990,680,C.pale);
 m.draw(c,0,0,990,620,{beads:false,colorParts:t>=13,layers:t<13?1.2*ramp(t,1,6):1.2*(1-ramp(t,13,18)),pitch:t<20?1.05:.27,yaw:-.3,halfHeight:4.45,motionTime:t>=34?mix(27.2,29.3,ramp(t,34,39)):0});
 text(c,t<13?'FRONT / CORE / BACK':t<34?'ONE GROUP PER MOVING PART':'ROTATION AROUND THE LOCAL PIVOT',495,644,25,'#32485a','center',true);
 if(t<13){legend(c,[['Raised front face',C.blue],['Recessed channel bed',C.muted],['Structural core',C.mint],['Matching rear layers',C.pink]],1060,80,66);note(c,'The separation is exaggerated here to reveal how the layers stack.',1060,415,650);}
 else {
  code(c,['geometry.translate(','  -pivot.x, -pivot.y, -pivot.z',');','','const group = new THREE.Group();','group.position.copy(pivot);','group.add(mesh);'],1035,35,735,t<27?1:5,'WORLD COORDINATES → LOCAL COORDINATES');
  text(c,'world = pivot + local',1060,462,32,C.amber,'left',true);
  note(c,'Rotate the Group. Every child follows the same pivot and axis.',1060,549,650);
 }
}});

add({id:'beads',title:'One sphere geometry, many bead positions',kicker:'09 / ANGULAR SLOTS & SHARED GEOMETRY',duration:40,takeaway:'60 beads occupy 66 possible slots. The six vacancies move with the configuration.',beats:[
 [0,'Every bead reuses the same SphereGeometry. Materials supply the different colors.'],
 [6,'There are ten evenly spaced positions around each lobe, so the angular step is thirty-six degrees.'],
 [13,'Add the circular offset to the lobe center to place each bead.'],
 [20,'The z coordinate selects the front or the back of the puzzle.'],
 [27,'Three lobes, ten beads, and two faces give sixty beads altogether.'],
 [33,'There are also three central pocket slots per face. Some slots are empty in each configuration.']
],draw(c,t,m){
 diagramPanel(c);
 if(t<20){
  const x=480,y=324,r=209,n=Math.max(1,Math.min(10,Math.floor(1+9*ramp(t,4,11))));
  circle(c,x,y,r,null,C.line,3);circle(c,x,y,5,C.white);
  for(let k=0;k<n;k++){const a=-Math.PI/2+k*TAU/10,bx=x+r*Math.cos(a),by=y+r*Math.sin(a);circle(c,bx,by,31,[C.mint,C.pink,C.blue,C.amber,C.violet][k%5],C.white,1.5);text(c,String(k),x+(r+47)*Math.cos(a),y+(r+47)*Math.sin(a),24,C.muted,'center',true);}
  if(t>=6){line(c,x,y,x,y-r,C.amber,2);line(c,x,y,x+r*Math.cos(-Math.PI/2+TAU/10),y+r*Math.sin(-Math.PI/2+TAU/10),C.amber,2);circle(c,x,y,80,null,C.amber,3,-Math.PI/2,-Math.PI/2+TAU/10);text(c,'36°',x+35,y-105,30,C.amber,'center');}
  text(c,'TEN ANGULAR POSITIONS',495,642,25,C.muted,'center',true);
 }else{
  m.draw(c,0,0,990,618,{onlyBeads:true,yaw:Math.PI*ramp(t,20,25),pitch:.12,halfHeight:3.65,motionTime:t>=33?18.9:0});text(c,t<27?'FRONT AND BACK':t<33?'3 × 10 × 2 = 60 BEADS':'60 BEADS / 66 POSSIBLE SLOTS',495,646,28,C.white,'center',true);
 }
 code(c,['const step = 2 * Math.PI / 10;','const a = lobeAngle + k * step;','','const x = center.x + R * Math.cos(a);','const y = center.y + R * Math.sin(a);','const z = face === 0 ? +0.435 : -0.435;','','const mesh = new THREE.Mesh(','  sharedSphere, colorMaterial',');'],1035,30,735,t<13?0:t<20?3:t<27?5:8);
 note(c,t<33?'Each mesh has its own position, even when the geometry is shared.':'Pocket slots are transit positions, not six extra beads.',1060,557,650,t<33?C.muted:C.amber);
}});

add({id:'movement',title:'Movement is a test of the geometry',kicker:'10 / VALID STATES & CONTINUOUS MOTION',duration:50,takeaway:'Check the entire movement, not just its endpoints.',beats:[
 [0,'A model that looks correct at rest may still intersect when it moves.'],
 [6,'Turn the rotor sixty degrees. The plastic and its carried beads share the same rigid rotation.'],
 [14,'The channels now form a connected chamber. Beads circulate around a thirty-slot route on each face.'],
 [23,'Keep the discrete puzzle state separate from the animation between positions.'],
 [30,'When the move finishes, update which bead occupies each destination slot.'],
 [36,'Now inspect a half-rim flip. Watch the seam and the beads throughout the turn.'],
 [44,'This is a geometric, kinematic animation. A physics engine is not moving the beads.']
],draw(c,t,m){
 const motionTime=t<6?16:t<14?mix(16.3,18.9,ramp(t,6,13)):t<23?20+(t-14)*.6:t<36?25.6:t<38?mix(26,26.95,ramp(t,36,38)):mix(27.2,29.3,ramp(t,38,47));
 m.draw(c,0,0,990,640,{motionTime,pitch:t>=36?.24:0,yaw:t>=36?-.2:0,halfHeight:3.75});
 text(c,t<6?'SEPARATE CIRCLES':t<14?'CENTRAL ROTOR / 60°':t<36?'CONNECTED CHAMBER':'OUTER HALF-RIM / 180°',495,665,25,C.muted,'center',true);
 if(t<23){code(c,['const q = new THREE.Quaternion();','q.setFromAxisAngle(axis, angle * u);','','position.copy(start)','  .sub(pivot)','  .applyQuaternion(q)','  .add(pivot);'],1035,35,735,t<14?1:5,'RIGID ROTATION / CENTER OR FLIP');note(c,'The rotor uses one rotation for both the plastic and the beads it carries.',1060,427,650);}
 else {code(c,['// Animate first; commit at the end.','for (const [from, to] of mapping) {','  nextState[to] = state[from];','}','state = nextState;'],1035,35,735,2,'SLOT PERMUTATION');
  const u=ramp(t,24,30);const bx=mix(1150,1620,u);line(c,1150,408,1620,408,C.line,4);circle(c,1150,408,36,null,C.muted,2);circle(c,1620,408,36,null,C.muted,2);circle(c,bx,408,27,C.amber);text(c,'from',1150,470,27,C.muted,'center',true);text(c,'to',1620,470,27,C.muted,'center',true);
  note(c,t<36?'In chamber mode, the implementation interpolates between neighboring slot positions.':'Inspect intermediate poses for collisions, seam crossings and unwanted snapping.',1060,553,650);
 }
}});

add({id:'finish',title:'From flat regions to a finished puzzle',kicker:'11 / THE REUSABLE CONSTRUCTION METHOD',duration:30,takeaway:'Define → trace → extrude → group → test.',beats:[
 [0,'Materials, lighting, and small details give the model its finished appearance.'],
 [6,'But the reusable construction method is underneath: define flat regions and trace their boundaries.'],
 [12,'Extrude the outlines, round the edges, and organize the parts around the correct pivots.'],
 [18,'The companion example lets you inspect these stages and change the construction parameters.'],
 [24,'After every change, check that the channels align and the moving pieces still fit.']
],draw(c,t,m){
 box(c,0,0,990,680,C.pale);m.draw(c,0,0,990,680,{neutral:t<4,yaw:mix(-.3,.3,ramp(t,2,8)),pitch:.16,halfHeight:3.7});
 const labels=['Define flat masks','Trace closed outlines','Extrude and bevel','Place groups at pivots','Test every movement'];
 labels.forEach((s,i)=>{const active=t>i*3+4;circle(c,1184,152+i*94,21,active?C.mint:C.line);text(c,String(i+1),1184,152+i*94,25,active?C.bg:C.white,'center',true);text(c,s,1228,152+i*94,32,active?C.white:C.muted);if(i<4)line(c,1184,177+i*94,1184,219+i*94,C.line,2);});
}});

export {S as tutorialScenes};
