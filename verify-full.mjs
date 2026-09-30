import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
const require=createRequire('C:/Users/vacek/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const puppeteer=require('puppeteer-core');
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
let server;
try{
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3027/#project/opening',{waitUntil:'domcontentloaded',timeout:60000});
 let frame;
 for(let i=0;i<100;i++){
  for(const f of page.frames())if(await f.evaluate(()=>Boolean(window.TutorialRuntime&&window.__timelines?.['lesson-finish'])).catch(()=>false)){frame=f;break;}
  if(frame)break;await new Promise(r=>setTimeout(r,500));
 }
 assert(frame,'Full tutorial frame did not initialize');
 const report=await frame.evaluate(async()=>{
  await document.fonts.ready;
  const seek=async t=>{if(window.__hf?.seek)await window.__hf.seek(t);else{window.__timelines.main.seek(t,false);} };
  const samples=[];
  for(const t of [8,60,95,139,180,225,277,322,366,410,450,491]){await seek(t);samples.push({t,subtitle:document.getElementById('subtitle').textContent});}
  const snapshots=[];
  for(const [id,t] of [['parts',20],['regions',43],['extrusion',19],['pivots',9],['beads',24],['movement',12]]){
   const canvas=document.getElementById('lesson-'+id+'-canvas');const ctx=canvas.getContext('2d');
   window.TutorialRuntime.paint(id,ctx,t);const a=canvas.toDataURL();
   window.TutorialRuntime.paint('finish',ctx,20);window.TutorialRuntime.paint('pivots',ctx,8);window.TutorialRuntime.paint(id,ctx,t);
   snapshots.push({id,identical:a===canvas.toDataURL()});
  }
  const canvasTextFindings=[];const originalFill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(s,x,y,...rest){const measure=this.measureText(s);let left=x;if(this.textAlign==='center')left-=measure.width/2;if(this.textAlign==='right')left-=measure.width;const right=left+measure.width;if(left<-.5||right>this.canvas.width+.5||y<0||y>this.canvas.height)canvasTextFindings.push({text:s,left,right,y,width:this.canvas.width});return originalFill.call(this,s,x,y,...rest);};
  for(const s of window.TutorialRuntime.scenes){const c=document.getElementById('lesson-'+s.id+'-canvas').getContext('2d');for(const [t] of s.beats)window.TutorialRuntime.paint(s.id,c,Math.min(s.duration-.1,t+.5));}
  CanvasRenderingContext2D.prototype.fillText=originalFill;
  const cues=window.captionCues;const gaps=cues.slice(1).filter((c,i)=>Math.abs(c[0]-cues[i][1])>.00001);
  const timelines=Object.entries(window.__timelines).filter(([,tl])=>typeof tl?.duration==='function').map(([id,tl])=>({id,duration:tl.duration(),tweens:tl.getChildren(true,true,false).map(x=>({start:x.startTime(),duration:x.duration(),properties:Object.keys(x.vars).filter(k=>!['onUpdate','parent','ease','immediateRender','overwrite'].includes(k))}))}));
  return {samples,snapshots,canvasTextFindings,cueCount:cues.length,captionEnd:cues.at(-1)[1],gapCount:gaps.length,timelines};
 });
 assert.equal(report.timelines.length,14);assert.equal(report.captionEnd,505);assert.equal(report.gapCount,0);assert(report.samples.every(s=>s.subtitle.length>0));assert(report.snapshots.every(s=>s.identical));assert.equal(report.canvasTextFindings.length,0,JSON.stringify(report.canvasTextFindings));
 fs.mkdirSync('verification/full',{recursive:true});
 fs.writeFileSync('verification/full/runtime.json',JSON.stringify({...report,errors},null,2));
 fs.mkdirSync('.hyperframes/anim-map',{recursive:true});fs.writeFileSync('.hyperframes/anim-map/animation-map.json',JSON.stringify({source:'Live HyperFrames Studio timelines',duration:505,timelines:report.timelines},null,2));
 console.log('PASS: 14 registered timelines; captions cover 0–505s; six model/diagram states reproduce after non-sequential seeks.');
 const root=process.cwd();server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');const file=path.join(root,decodeURIComponent(url.pathname));if(!file.startsWith(root)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.ttf':'font/ttf'}[path.extname(file)]||'text/plain'));res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 await page.goto(`http://127.0.0.1:${server.address().port}/companion/index.html`,{waitUntil:'networkidle0',timeout:60000});await page.waitForFunction(()=>Boolean(window.labState));
 const lab=[];
 for(let i=0;i<5;i++){await page.evaluate(i=>document.querySelectorAll('#steps button')[i].click(),i);lab.push(await page.evaluate(()=>window.labState));}
 await page.evaluate(()=>{document.getElementById('r').value='1.02';document.getElementById('w').value='.32';document.getElementById('rebuild').click();});lab.push(await page.evaluate(()=>window.labState));
 assert(lab.every(s=>s.vertices>0&&s.shapes>0));assert.equal(lab.at(-1).R,1.02);
 await page.screenshot({path:'verification/full/companion.png',fullPage:true});fs.writeFileSync('verification/full/companion.json',JSON.stringify(lab,null,2));
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: companion builds all five stages and rebuilds modified parameters without JavaScript errors.');
}finally{await browser.close();server?.close();}
