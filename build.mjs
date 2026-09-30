import fs from 'node:fs';
import {tutorialScenes} from './tutorial-scenes.js';
const source=fs.readFileSync('C:/Temp/MagicBean/index.html','utf8');
const take=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);if(i<0||j<0)throw Error('Source marker missing '+a);return source.slice(i,j);};
let geometry=take('  const TAU =','  let state = solvedState.slice();');
geometry=geometry.replace(/const reducedMotion =\s*matchMedia\([^;]+;/,'const reducedMotion = false;');
geometry=geometry.replace('renderer.setPixelRatio(Math.min(devicePixelRatio, 2));','renderer.setPixelRatio(1);');
geometry=geometry.replace("  $('viewport').appendChild(renderer.domElement);",'  container.appendChild(renderer.domElement);');
const logic=take('  function snapBeans()','  function updateUI()')+take('  function bigLoopOrder(face)','  function startMove(move, now)');
const header=`import * as THREE from './three.module.js';\nimport {RoomEnvironment} from './RoomEnvironment.js';\nimport {mergeVertices} from './BufferGeometryUtils.js';\nexport function createPuzzle(container) {\n`;
const tail=fs.readFileSync('puzzle-choreography.js','utf8');
fs.writeFileSync('assets/puzzle.js',header+geometry+'\n  let state=solvedState.slice();\n'+logic+'\n'+tail+'\n}\n');
for(const f of ['RoomEnvironment.js','BufferGeometryUtils.js']) {
 const file='assets/'+f;fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll("from 'three'","from './three.module.js'"));
}
console.log('Extracted actual source geometry and movement definitions into assets/puzzle.js');
fs.mkdirSync('companion',{recursive:true});
const tracing=take('  function polygonArea(points)','  function addPart(type, lobe = -1)');
fs.writeFileSync('companion/trace-shapes.js',"import * as THREE from '../assets/three.module.js';\n"+tracing.replace('function traceShapes(field)','export function traceShapes(field)').replace('const extent = D + OUTER_RADIUS + 0.15;','const extent = 4.1;').replace('/ 0.024','/ 0.04'));
let html=fs.readFileSync('scene-template.txt','utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
const hold=html.match(/<script>window\.__hf[\s\S]*?<\/script>/)[0];
let body=html.match(/<body>([\s\S]*?)<script type="module"/)[1];
body=body.replaceAll('id="root"','id="opening-root"');
body=body.replace(/ class="clip" id="visuals"[^>]+/, ' id="visuals" class="scene-layer"');
body=body.replace(/ class="clip" id="captions"[^>]+/, ' id="captions" class="scene-layer" data-layout-allow-caption-zone');
const sceneCode=fs.readFileSync('scene.js','utf8');
fs.mkdirSync('compositions',{recursive:true});
const captionMarkup=body.match(/<div id="captions"[\s\S]*?<\/p><\/div><\/div>/)[0];
body=body.replace(captionMarkup,'');
const captionCSS=css.match(/#captions\{[\s\S]*?(?=#progress)/)[0];
const cues=sceneCode.match(/const subtitles=\[[\s\S]*?\n\];/)[0];
fs.writeFileSync('compositions/captions.html',`<!doctype html><html><body><template><style>@font-face{font-family:'Teaching Sans';src:url('assets/teaching-sans.ttf')}#captions-root{position:absolute;inset:0;width:100%;height:100%;font-family:'Teaching Sans',sans-serif;pointer-events:none}#captions{position:absolute;inset:0}${captionCSS}</style><div id="captions-root" data-composition-id="captions-track" data-width="1920" data-height="1080" data-duration="45" data-layout-allow-caption-zone>${captionMarkup}</div><script>(function(){${cues}const clock={t:0};window.paintSubtitles=function(t){const el=document.getElementById('subtitle');const cue=subtitles.find(c=>t>=c[0]&&t<c[1]);const text=cue?cue[2]:'';if(el.textContent!==text)el.textContent=text;};const tl=gsap.timeline({paused:true});tl.to(clock,{t:45,duration:45,ease:'none',onUpdate:()=>window.paintSubtitles(clock.t)},0);window.__timelines['captions-track']=tl;window.paintSubtitles(0);})();</script></template></body></html>`);
fs.writeFileSync('compositions/opening.html','<!doctype html><html><body><template><style>'+css.replaceAll('#root','#opening-root').replaceAll('.clip{','.scene-layer{')+'</style>'+hold+body+'<script type="module">'+sceneCode+'</script></template></body></html>');
fs.writeFileSync('index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Magic Bean — visual opening</title><script src="assets/gsap.min.js"></script><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#091321}#root{width:100%;height:100%;position:relative}.clip{position:absolute;inset:0;width:100%;height:100%}</style></head><body><div id="root" data-composition-id="main" data-width="1920" data-height="1080" data-duration="45" data-fps="30"><div class="clip" id="opening" data-composition-id="opening" data-composition-src="compositions/opening.html" data-start="0" data-duration="45" data-track-index="0" data-track-kind="graphics" data-width="1920" data-height="1080"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines.main=gsap.timeline({paused:true});</script></body></html>`);
const main=fs.readFileSync('index.html','utf8').replace('</div></div><script>','</div><div class="clip" id="captions-track" data-composition-id="captions-track" data-composition-src="compositions/captions.html" data-start="0" data-duration="45" data-track-index="1" data-track-kind="captions" data-width="1920" data-height="1080"></div></div><script>');
fs.writeFileSync('index.html',main);

// Extend the approved opening; each lesson remains an independent Studio scene.
if(!process.argv.includes('--opening-only')){
 let start=45;const chapters=tutorialScenes.map((s,i)=>{const meta={id:s.id,title:s.title,kicker:s.kicker,duration:s.duration,takeaway:s.takeaway,start,index:i+2};start+=s.duration;return meta;});
 const total=start;
 const openCues=Function(cues+'return subtitles;')();
 const fullCues=[...openCues];
 tutorialScenes.forEach((s,i)=>s.beats.forEach((b,j)=>fullCues.push([chapters[i].start+b[0],chapters[i].start+(s.beats[j+1]?.[0]??s.duration),b[1]])));
 for(const s of chapters){
  const id='lesson-'+s.id;
  fs.writeFileSync(`compositions/${s.id}.html`,`<!doctype html><html lang="en"><body><template><style>@font-face{font-family:'Teaching Sans';src:url('assets/teaching-sans.ttf')}@font-face{font-family:'Teaching Mono';src:url('assets/teaching-mono.ttf')}#${id}-root{position:relative;width:100%;height:100%;background:#091321;color:#edf4fc;font-family:'Teaching Sans',sans-serif}#${id}-header{position:absolute;left:72px;right:72px;top:42px}#${id}-kicker{font:22px 'Teaching Mono',monospace;color:#77edcc;letter-spacing:2px;margin:0 0 15px}#${id}-title{font:52px 'Teaching Sans',sans-serif;letter-spacing:-1px;margin:0;line-height:1.15}#${id}-number{position:absolute;top:45px;right:72px;font:23px 'Teaching Mono',monospace;color:#a8b9cd}#${id}-canvas{position:absolute;left:72px;top:208px;width:1776px;height:680px}#${id}-takeaway{position:absolute;left:72px;right:72px;top:916px;margin:0;height:32px;text-align:center;font-size:27px;color:#a8b9cd;line-height:32px}#${id}-progress{position:absolute;left:72px;right:72px;bottom:16px;height:3px;background:#77edcc;transform-origin:left center}</style><div id="${id}-root" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${s.duration}"><div id="${id}-header"><p id="${id}-kicker">${s.kicker}</p><h1 id="${id}-title">${s.title}</h1></div><div id="${id}-number">${String(s.index).padStart(2,'0')} / 12</div><canvas id="${id}-canvas" width="1776" height="680" aria-label="${s.title}"></canvas><p id="${id}-takeaway">${s.takeaway}</p><div id="${id}-progress"></div></div><script>(function(){function install(){const c=document.getElementById('${id}-canvas').getContext('2d');const driver={t:0};const paint=()=>window.TutorialRuntime.paint('${s.id}',c,driver.t);const tl=gsap.timeline({paused:true});tl.to(driver,{t:${s.duration},duration:${s.duration},ease:'none',onUpdate:paint},0);tl.fromTo('#${id}-progress',{scaleX:0},{scaleX:1,duration:${s.duration},ease:'none'},0);paint();window.__timelines['${id}']=tl;}if(window.TutorialRuntime)install();else window.addEventListener('tutorial-ready',install,{once:true});})();</script></template></body></html>`);
 }
 const allCaptionMarkup=captionMarkup.replace('I started with these two images','I started with these two images');
 fs.writeFileSync('compositions/captions.html',`<!doctype html><html><body><template><style>@font-face{font-family:'Teaching Sans';src:url('assets/teaching-sans.ttf')}#captions-root{position:absolute;inset:0;width:100%;height:100%;font-family:'Teaching Sans',sans-serif;pointer-events:none}#captions{position:absolute;inset:0}${captionCSS}</style><div id="captions-root" data-composition-id="captions-track" data-width="1920" data-height="1080" data-duration="${total}" data-layout-allow-caption-zone>${allCaptionMarkup}</div><script>(function(){const subtitles=${JSON.stringify(fullCues)};const clock={t:0};window.captionCues=subtitles;window.paintSubtitles=function(t){const el=document.getElementById('subtitle');const cue=subtitles.find(c=>t>=c[0]&&t<c[1]);const text=cue?cue[2]:'';if(el.textContent!==text)el.textContent=text;};const tl=gsap.timeline({paused:true});tl.to(clock,{t:${total},duration:${total},ease:'none',onUpdate:()=>window.paintSubtitles(clock.t)},0);window.__timelines['captions-track']=tl;window.paintSubtitles(0);})();</script></template></body></html>`);
 let full=main.replace('data-duration="45" data-fps','data-duration="'+total+'" data-fps').replace('<title>Magic Bean — visual opening</title>','<title>How Astra created the Magic Bean puzzle</title>');
 const hosts=chapters.map(s=>`<div class="clip" id="lesson-${s.id}" data-composition-id="lesson-${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${s.duration}" data-track-index="0" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`).join('\n');
 full=full.replace('<div class="clip" id="captions-track"',hosts+'<div class="clip" id="captions-track"').replace('data-duration="45" data-track-index="1"','data-duration="'+total+'" data-track-index="1"');
 full=full.replace('</head>','<script>window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};window.__hf.buildReady.tutorial=new Promise((resolve,reject)=>{window.resolveTutorial=resolve;window.rejectTutorial=reject;});</script></head>');
 full=full.replace('</body>','<script type="module">'+fs.readFileSync('tutorial-runtime.js','utf8')+'</script></body>');
 fs.writeFileSync('index.html',full);
 fs.writeFileSync('timing.json',JSON.stringify({duration:total,chapters:[{id:'opening',start:0,duration:45,title:'Two images become a working puzzle'},...chapters],captions:fullCues},null,2));
 fs.writeFileSync('script.txt',fullCues.map(c=>`${c[0].toFixed(1)}–${c[1].toFixed(1)}  ${c[2]}`).join('\n\n'));
 fs.writeFileSync('STORYBOARD.md','# Full tutorial — visual review\n\nApproved opening preserved; all remaining scenes built. Audio and MP4 deferred. Detailed narrative plan: ../STORYBOARD.md.\n\n## Frame 1\n\nstatus: animated\nsrc: compositions/opening.html\nstart: 0\nduration: 45\nrules: discrete-text-sequence; Three.js adapter with source-derived rigid rotations\n\nTwo reference states become the animated puzzle.\n\n'+chapters.map((s,i)=>`## Frame ${s.index}\n\nstatus: animated\nsrc: compositions/${s.id}.html\nstart: ${s.start}\nduration: ${s.duration}\nrules: discrete-text-sequence; svg-path-draw adapted to Canvas path reveal; center-outward-expansion for part/layer separation; deterministic Three.js adapter\n\n${s.title}\n\n${tutorialScenes[i].beats.map(b=>b[1]).join(' ')}\n\nTakeaway: ${s.takeaway}`).join('\n\n'));
 fs.writeFileSync('index.motion.json',JSON.stringify({duration:total,assertions:[{kind:'staysInFrame',selector:'#subtitle'}]},null,2));
 fs.writeFileSync('compositions/opening.motion.json',JSON.stringify({duration:45,assertions:[{kind:'appearsBy',selector:'#reference-image',bySec:1},{kind:'staysInFrame',selector:'#viewport'}]},null,2));
 console.log(`Assembled ${chapters.length+1} scenes, ${total} seconds, ${fullCues.length} script cues.`);
}
