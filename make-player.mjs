import fs from 'node:fs';
// Standalone GitHub-Pages player (mirrors BCDDecoder/make-player.mjs):
// audio-clock driven canvas player, no HyperFrames server needed.
const timing = JSON.parse(fs.readFileSync('timing.json', 'utf8'));
const DATA = {
  duration: timing.duration,
  chapters: timing.chapters.map(c => ({id: c.id, start: c.start, duration: c.duration, title: c.title, kicker: c.kicker || '', takeaway: c.takeaway || ''})),
  captions: timing.captions
};
const data = JSON.stringify(DATA);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>How Astra Created the Magic Bean Puzzle — Educational Video</title><style>
@font-face{font-family:'Teaching Sans';src:url('assets/teaching-sans.ttf')}@font-face{font-family:'Teaching Mono';src:url('assets/teaching-mono.ttf')}
*{box-sizing:border-box}html,body{margin:0;background:#070e19;color:#edf4fc;font-family:'Teaching Sans',sans-serif}body{display:flex;flex-direction:column;align-items:center;padding:20px;min-height:100vh}.viewer{width:min(100%,1440px)}#viewport{width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;background:#091321;box-shadow:0 12px 70px #0006;border:1px solid #33495e}#stage{width:1920px;height:1080px;position:absolute;left:0;top:0;transform-origin:0 0;background:#091321}
#opening-root{position:relative;width:100%;height:100%;font-family:'Teaching Sans',sans-serif;color:#edf4fc;background:#091321}
.scene-layer{position:absolute;inset:0;width:100%;height:100%}
#heading-wrap{position:absolute;top:42px;left:72px;right:72px}
.eyebrow{font:22px 'Teaching Mono',monospace;color:#77edcc;letter-spacing:2px;margin:0 0 14px}
#heading-wrap h1{font-size:54px;line-height:1.13;font-weight:400;letter-spacing:-1.3px;margin:0}
#main-layout{position:absolute;left:72px;right:72px;top:188px;height:716px;display:grid;grid-template-columns:548px 1188px;gap:40px}
#reference-content{position:relative;background:#101f30;border:1px solid #33495e;border-radius:20px;overflow:hidden}
.panel-heading{margin:0;font-size:30px;font-weight:400;line-height:1.2}
.panel-kicker{font:21px 'Teaching Mono',monospace;color:#a8b9cd;margin:7px 0 0}
#reference-head{padding:24px 30px 0}
#reference-image{position:absolute;left:119px;top:106px;width:310px;height:590px;object-fit:contain}
.state-outline{position:absolute;left:110px;width:328px;height:292px;border:3px solid transparent;border-radius:20px;pointer-events:none}
#upper-state{top:100px}#lower-state{top:405px}
.state-label{position:absolute;left:22px;font:20px 'Teaching Mono',monospace;color:#a8b9cd;writing-mode:vertical-rl;transform:rotate(180deg)}
#state-label-a{top:180px}#state-label-b{top:470px}
#model-content{position:relative;border-radius:20px;overflow:hidden;background:#e1e9ed}
#model-head{position:absolute;top:0;left:0;right:0;height:82px;z-index:2;background:#101f30;display:flex;align-items:center;justify-content:space-between;padding:0 30px}
#model-head .panel-kicker{margin:0;color:#77edcc}
#puzzle-view{position:absolute;left:0;top:42px;width:1188px;height:674px}
#model-content canvas{display:block}
#phasebar{position:absolute;left:30px;right:30px;bottom:22px;display:flex;align-items:center;justify-content:space-between;gap:22px;background:#101f30;border-radius:12px;padding:16px 22px;z-index:2}
#stage-index{font:19px 'Teaching Mono',monospace;color:#77edcc;max-width:300px;line-height:1.35}
#stage-title{font-size:30px;color:#edf4fc;text-align:right;line-height:1.2}
#opening-takeaway{position:absolute;left:72px;right:72px;top:921px;height:26px;text-align:center;color:#a8b9cd;font-size:22px;line-height:26px}
#opening-progress{position:absolute;left:72px;right:72px;bottom:16px;height:3px;background:#77edcc;transform-origin:left center}
#lesson-root{position:absolute;inset:0;background:#091321;color:#edf4fc;font-family:'Teaching Sans',sans-serif}
#lesson-header{position:absolute;left:72px;right:72px;top:42px}
#lesson-kicker{font:22px 'Teaching Mono',monospace;color:#77edcc;letter-spacing:2px;margin:0 0 15px}
#lesson-title{font-size:52px;letter-spacing:-1px;margin:0;line-height:1.15;font-weight:400}
#lesson-number{position:absolute;top:45px;right:72px;font:23px 'Teaching Mono',monospace;color:#a8b9cd}
#lesson-canvas{position:absolute;left:72px;top:208px;width:1776px;height:680px}
#lesson-takeaway{position:absolute;left:72px;right:72px;top:916px;margin:0;height:32px;text-align:center;font-size:27px;color:#a8b9cd;line-height:32px}
#lesson-progress{position:absolute;left:72px;right:72px;bottom:16px;height:3px;background:#77edcc;transform-origin:left center}
#caption-box{position:absolute;left:160px;right:160px;top:962px;height:80px;display:flex;align-items:center;justify-content:center;text-align:center;z-index:5;pointer-events:none}
#subtitle{font-size:34px;line-height:1.2;margin:0;max-width:1540px;color:#edf4fc}
.controls{display:flex;justify-content:center;margin:18px 0}audio{width:min(960px,94%)}
</style></head><body><main class="viewer"><div id="viewport"><div id="stage">
<div id="opening-root"><div id="visuals" class="scene-layer">
<div id="heading-wrap"><p class="eyebrow">MAGIC BEAN / FROM TWO IMAGES TO THREE.JS</p><h1 id="headline">I asked Astra how it created this puzzle</h1></div>
<div id="main-layout">
<section id="reference-content"><div id="reference-head"><h2 class="panel-heading">The starting reference</h2><p class="panel-kicker">Two images · two configurations</p></div>
<img id="reference-image" src="assets/reference-stacked.png" alt="Original puzzle reference showing separate circles above and a connected chamber below">
<div class="state-outline" id="upper-state"></div><div class="state-outline" id="lower-state"></div>
<div class="state-label" id="state-label-a">SEPARATE CIRCLES</div><div class="state-label" id="state-label-b">SINGLE CHAMBER</div></section>
<section id="model-content"><div id="model-head"><h2 class="panel-heading">Astra’s Three.js model</h2><p class="panel-kicker">THE FINISHED PUZZLE</p></div>
<div id="puzzle-view" aria-label="Animated procedural Magic Bean puzzle"></div>
<div id="phasebar"><span id="stage-index">FROM REFERENCE TO GEOMETRY</span><span id="stage-title">Two images. One working puzzle.</span></div></section>
</div><div id="opening-takeaway">Two images + a short explanation of the mechanism</div></div>
<div id="opening-progress"></div></div>
<div id="lesson-root" style="display:none"><div id="lesson-header"><p id="lesson-kicker"></p><h1 id="lesson-title"></h1></div><div id="lesson-number"></div><canvas id="lesson-canvas" width="1776" height="680"></canvas><p id="lesson-takeaway"></p><div id="lesson-progress"></div></div>
<div id="caption-box"><p id="subtitle"></p></div>
</div></div><div class="controls"><audio id="audio" controls preload="metadata" src="assets/voice.mp3"></audio></div></main>
<script type="module">
import {tutorialScenes} from './tutorial-scenes.js';
import {createTeachingModel} from './teaching-model.js';
import {maskImage} from './teaching-kit.js';
import {createPuzzle} from './assets/puzzle.js';
const DATA=${data};
const stages=[[0,'FROM REFERENCE TO GEOMETRY','Two images. One working puzzle.','Two images + a short explanation of the mechanism'],[7,'01 / INDEPENDENT RIMS','Top rim','Three separate circular tracks'],[10,'01 / INDEPENDENT RIMS','Lower-left rim','Three separate circular tracks'],[13,'01 / INDEPENDENT RIMS','Lower-right rim','Three separate circular tracks'],[16,'02 / CONNECT THE TRACKS','Turn the center · 60°','Three circles become one connected chamber'],[20,'03 / SINGLE CHAMBER','All marbles move together','One continuous route across all three lobes'],[26,'04 / FLIP THE HALF-RIMS','Return to separate circles','Each outer half-rim turns through 180°'],[27.2,'04 / FLIP THE HALF-RIMS','Top half-rim','Front-to-back transfer'],[29.7,'04 / FLIP THE HALF-RIMS','Lower-left half-rim','Front-to-back transfer'],[32.2,'04 / FLIP THE HALF-RIMS','Lower-right half-rim','Front-to-back transfer'],[35,'05 / INSPECT THE MODEL','Turn the whole puzzle','Front, edge, and back'],[41,'NEXT / THE CONSTRUCTION','How was this geometry built?','Let’s build it step by step in Three.js.']];
const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
const openingRoot=document.getElementById('opening-root'),lessonRoot=document.getElementById('lesson-root');
const stageIndex=document.getElementById('stage-index'),stageTitle=document.getElementById('stage-title'),openingTakeaway=document.getElementById('opening-takeaway');
const upper=document.getElementById('upper-state'),lower=document.getElementById('lower-state'),header=document.getElementById('headline');
const openingProgress=document.getElementById('opening-progress');
const lessonKicker=document.getElementById('lesson-kicker'),lessonTitle=document.getElementById('lesson-title'),lessonNumber=document.getElementById('lesson-number');
const lessonCanvas=document.getElementById('lesson-canvas'),lessonCtx=lessonCanvas.getContext('2d');
const lessonTakeaway=document.getElementById('lesson-takeaway'),lessonProgress=document.getElementById('lesson-progress');
const subtitle=document.getElementById('subtitle'),audio=document.getElementById('audio');
let model=null,puzzle=null,current=-1;
function paintOpening(t){
  puzzle.renderAt(t);
  const stage=stages.findLast(s=>s[0]<=t)||stages[0];
  setText(stageIndex,stage[1]);setText(stageTitle,stage[2]);setText(openingTakeaway,stage[3]);
  upper.style.borderColor=t>=7&&t<16||t>=26&&t<35?'#ffc878':'transparent';
  lower.style.borderColor=t>=16&&t<26?'#ffc878':'transparent';
  setText(header,t>=41?'How did Astra build this geometry?':'I asked Astra how it created this puzzle');
  openingProgress.style.transform='scaleX('+(t/45)+')';
}
window.renderAt=function(time){
  const t=Math.min(DATA.duration-.001,Math.max(0,time));
  let i=DATA.chapters.findIndex(s=>t>=s.start&&t<s.start+s.duration);if(i<0)i=DATA.chapters.length-1;
  const s=DATA.chapters[i],local=t-s.start;
  if(s.id==='opening'){openingRoot.style.display='block';lessonRoot.style.display='none';paintOpening(local);}
  else{openingRoot.style.display='none';lessonRoot.style.display='block';
    if(i!==current){setText(lessonKicker,s.kicker);setText(lessonTitle,s.title);setText(lessonNumber,String(i+1).padStart(2,'0')+' / 12');setText(lessonTakeaway,s.takeaway);current=i;}
    lessonCtx.clearRect(0,0,1776,680);lessonCtx.save();tutorialScenes.find(x=>x.id===s.id).draw(lessonCtx,local,model);lessonCtx.restore();
    lessonProgress.style.transform='scaleX('+(local/s.duration)+')';}
  const c=DATA.captions.find(c=>t>=c[0]&&t<c[1]);
  setText(subtitle,c?c[2]:'');
  return {index:i,local};
};
function resize(){document.getElementById('stage').style.transform='scale('+document.getElementById('viewport').clientWidth/1920+')';}
new ResizeObserver(resize).observe(document.getElementById('viewport'));resize();
function frame(){renderAt(audio.currentTime);if(!audio.paused)requestAnimationFrame(frame);}
audio.addEventListener('play',frame);
audio.addEventListener('pause',()=>renderAt(audio.currentTime));
audio.addEventListener('seeked',()=>renderAt(audio.currentTime));
audio.addEventListener('timeupdate',()=>{if(!audio.paused)renderAt(audio.currentTime);});
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();audio.paused?audio.play():audio.pause();}if(e.code==='ArrowRight')audio.currentTime=Math.min(DATA.duration,audio.currentTime+5);if(e.code==='ArrowLeft')audio.currentTime=Math.max(0,audio.currentTime-5);});
try{
  await document.fonts.ready;
  model=createTeachingModel();
  for(const mode of ['body','track','solid','regions','region-solid','rotor'])maskImage(mode);
  puzzle=createPuzzle(document.getElementById('puzzle-view'));
  const q=(new URLSearchParams(location.search)).get('t');
  renderAt(q===null?0:parseFloat(q));
}catch(err){console.error(err);subtitle.textContent='Player failed to start: '+err.message;}
<\/script></body></html>`;
fs.writeFileSync('player.html', html);
console.log('Wrote standalone player.html (audio-clock canvas player).');
