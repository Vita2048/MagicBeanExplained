import {createRequire} from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/vacek/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const puppeteer=require('puppeteer-core');
const root=process.cwd();
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.join(root,pathname==='/'?'scene-template.txt':pathname);
 if(!file.startsWith(root)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',pathname==='/'?'text/html':({'.js':'text/javascript','.png':'image/png','.ttf':'font/ttf'}[path.extname(file)]||'text/plain'));res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080});
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'networkidle0',timeout:60000});
 await page.waitForFunction(()=>Boolean(window.puzzleReview),{timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 fs.mkdirSync('verification',{recursive:true});
 const times=[2,8,11,14,18,23,28.2,30.7,33.2,36.5,38,39.5,43];
 const samples=[];
 for(const t of times){
  const state=await page.evaluate(t=>window.puzzleReview.seek(t),t);
  await page.screenshot({path:`verification/frame-${t}.png`});
  samples.push({t,action:state.action,rotor:state.rotor,beads:state.beadCount});
 }
 const deterministic=await page.evaluate(()=>{const a=JSON.stringify(window.puzzleReview.seek(23.25));window.puzzleReview.seek(39);const b=JSON.stringify(window.puzzleReview.seek(23.25));return a===b;});
 const motion=await page.evaluate(()=>{
  const diff=(a,b)=>a.positions.filter((p,i)=>p.some((v,j)=>Math.abs(v-b.positions[i][j])>1e-7)).length;
  return [[7.05,7.35],[10.05,10.35],[13.05,13.35],[20.05,20.35],[27.3,28.1],[29.8,30.6],[32.3,33.1]].map(([a,b])=>({a,b,movingBeads:diff(window.puzzleReview.seek(a),window.puzzleReview.seek(b))}));
 });
 assert(deterministic);assert.deepEqual(motion.map(x=>x.movingBeads),[10,10,10,30,10,10,10]);
 const report={deterministic,motion,samples,stats:await page.evaluate(()=>window.puzzleReview.stats)};
 fs.writeFileSync('verification/runtime.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();server.close();}
