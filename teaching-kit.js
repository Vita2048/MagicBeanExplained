export const C={bg:'#091321',panel:'#101f30',white:'#edf4fc',muted:'#a8b9cd',line:'#33495e',mint:'#77edcc',amber:'#ffc878',blue:'#8fc9ff',violet:'#b5a7fa',pink:'#f3abc5',red:'#ff9d92',pale:'#e1e9ed'};
export const TAU=Math.PI*2,R=.88,D=1.76,OUTER=1.5,HALF=.275,GAP=.012,RR=Math.hypot(D-R*Math.sin(TAU/10),R*Math.cos(TAU/10));
export const centers=[0,1,2].map(i=>{const a=Math.PI/2+i*TAU/3;return {x:D*Math.cos(a),y:D*Math.sin(a),a,nx:Math.cos(a),ny:Math.sin(a)};});
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export const mix=(a,b,p)=>a+(b-a)*p;
export const body=(x,y)=>Math.min(Math.hypot(x,y)-(RR+.06),...centers.map(c=>Math.hypot(x-c.x,y-c.y)-OUTER));
export const track=(x,y)=>Math.min(...centers.map(c=>Math.abs(Math.hypot(x-c.x,y-c.y)-R)-HALF));
export function region(type,i,x,y){const out=j=>(x-centers[j].x)*centers[j].nx+(y-centers[j].y)*centers[j].ny;if(type==='rotor')return Math.hypot(x,y)-(RR-GAP);if(type==='outer')return Math.max(Math.hypot(x-centers[i].x,y-centers[i].y)-OUTER,GAP-out(i));return Math.max(RR+GAP-Math.hypot(x,y),...centers.map((_,j)=>out(j)+GAP));}
export function text(c,s,x,y,size=28,color=C.white,align='left',mono=false){c.save();c.font=`${size}px "${mono?'Teaching Mono':'Teaching Sans'}"`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);c.restore();}
export function line(c,x1,y1,x2,y2,color=C.line,width=2,dash=[]){c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
export function circle(c,x,y,r,fill=null,stroke=null,width=2,start=0,end=TAU){c.save();c.beginPath();c.arc(x,y,r,start,end);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}c.restore();}
export function box(c,x,y,w,h,fill=C.panel,stroke=null,r=16){c.save();c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}c.restore();}
export function arrow(c,x1,y1,x2,y2,color=C.amber,width=3){line(c,x1,y1,x2,y2,color,width);const a=Math.atan2(y2-y1,x2-x1);line(c,x2,y2,x2-13*Math.cos(a-.45),y2-13*Math.sin(a-.45),color,width);line(c,x2,y2,x2-13*Math.cos(a+.45),y2-13*Math.sin(a+.45),color,width);}
export function wrap(c,s,x,y,w,size=28,color=C.white,step=38){c.save();c.font=`${size}px "Teaching Sans"`;let row='',yy=y;for(const word of s.split(' ')){const next=row?row+' '+word:word;if(c.measureText(next).width>w&&row){text(c,row,x,yy,size,color);row=word;yy+=step;}else row=next;}if(row)text(c,row,x,yy,size,color);c.restore();return yy+step;}
export function code(c,lines,x,y,w,highlight=-1,title='THREE.JS / JAVASCRIPT'){box(c,x,y,w,78+lines.length*39,C.panel,C.line);text(c,title,x+25,y+29,22,C.mint,'left',true);line(c,x+22,y+54,x+w-22,y+54);lines.forEach((s,i)=>{if(i===highlight)box(c,x+12,y+67+i*39,w-24,36,'#243a46',null,5);text(c,s,x+25,y+85+i*39,25,i===highlight?C.amber:C.white,'left',true);});}
export function note(c,s,x,y,w,color=C.muted){wrap(c,s,x,y,w,27,color,37);}
export function axes(c,x,y,scale=82,extent=3.5){for(let i=-3;i<=3;i++){line(c,x+i*scale,y-extent*scale,x+i*scale,y+extent*scale,'#1c3042',1);line(c,x-extent*scale,y+i*scale,x+extent*scale,y+i*scale,'#1c3042',1);}arrow(c,x-extent*scale,y,x+extent*scale,y,C.muted,2);arrow(c,x,y+extent*scale,x,y-extent*scale,C.muted,2);text(c,'x',x+extent*scale+20,y,26,C.muted);text(c,'y',x+15,y-extent*scale-18,26,C.muted);}
const maskCache=new Map();
export function maskImage(mode='body'){
 if(maskCache.has(mode))return maskCache.get(mode);
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=660;const ctx=canvas.getContext('2d'),im=ctx.createImageData(720,660);
 const palette=[C.mint,C.amber,C.blue,C.violet,C.pink].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
 for(let j=0;j<660;j++)for(let i=0;i<720;i++){
  const x=(i-360)/100,y=(350-j)/100;let color=null;
  if(mode==='body'&&body(x,y)<0)color=palette[0];
  if(mode==='track'&&track(x,y)<0)color=palette[1];
  if(mode==='solid'&&Math.max(body(x,y),-track(x,y))<0)color=palette[0];
  if(mode==='regions'||mode==='region-solid'){
   if(body(x,y)<0&&(mode==='regions'||track(x,y)>=0)){
    if(region('fixed',0,x,y)<0)color=palette[0];
    if(region('rotor',0,x,y)<0)color=palette[1];
    for(let k=0;k<3;k++)if(region('outer',k,x,y)<0)color=palette[k+2];
   }
  }
  if(mode==='rotor'&&Math.max(body(x,y),region('rotor',0,x,y),-track(x,y))<0)color=palette[1];
  if(color){const p=(j*720+i)*4;im.data[p]=color[0];im.data[p+1]=color[1];im.data[p+2]=color[2];im.data[p+3]=255;}
 }
 ctx.putImageData(im,0,0);maskCache.set(mode,canvas);return canvas;
}
export function mask(c,mode,x,y,w=720,h=660,alpha=1){c.save();c.globalAlpha=alpha;c.drawImage(maskImage(mode),x,y,w,h);c.restore();}
export function ring(c,x,y,r,width,color=C.amber,p=1){c.save();c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*p);c.stroke();c.restore();}
export function legend(c,items,x,y,step=47){items.forEach(([label,color],i)=>{circle(c,x+8,y+i*step,7,color);text(c,label,x+28,y+i*step,27,C.white);});}
