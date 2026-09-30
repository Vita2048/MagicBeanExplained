import {createPuzzle} from './assets/puzzle.js';
const subtitles=[
 [0,3.4,'I started with these two images'],
 [3.4,7,'and a simple prompt explaining how the puzzle works.'],
 [7,9.7,'This is what Astra created.'],
 [9.7,13,'The marbles can circulate around each'],
 [13,16,'of the three rims independently.'],
 [16,20,'Turn the center, and the separate tracks become one connected chamber,'],
 [20,26,'where all the marbles circulate together.'],
 [26,30.2,'Each outer half-rim can flip,'],
 [30.2,35,'transferring marbles between the front and back.'],
 [35,41,'And we can turn the whole model to inspect it from any angle.'],
 [41,43.3,'So I asked Astra: how did you construct this geometry?'],
 [43.3,45,'Let’s build it step by step in Three.js.']
];
const stages=[
 [0,'FROM REFERENCE TO GEOMETRY','Two images. One working puzzle.','Two images + a short explanation of the mechanism'],
 [7,'01 / INDEPENDENT RIMS','Top rim','Three separate circular tracks'],
 [10,'01 / INDEPENDENT RIMS','Lower-left rim','Three separate circular tracks'],
 [13,'01 / INDEPENDENT RIMS','Lower-right rim','Three separate circular tracks'],
 [16,'02 / CONNECT THE TRACKS','Turn the center · 60°','Three circles become one connected chamber'],
 [20,'03 / SINGLE CHAMBER','All marbles move together','One continuous route across all three lobes'],
 [26,'04 / FLIP THE HALF-RIMS','Return to separate circles','Each outer half-rim turns through 180°'],
 [27.2,'04 / FLIP THE HALF-RIMS','Top half-rim','Front-to-back transfer'],
 [29.7,'04 / FLIP THE HALF-RIMS','Lower-left half-rim','Front-to-back transfer'],
 [32.2,'04 / FLIP THE HALF-RIMS','Lower-right half-rim','Front-to-back transfer'],
 [35,'05 / INSPECT THE MODEL','Turn the whole puzzle','Front, edge, and back'],
 [41,'NEXT / THE CONSTRUCTION','How was this geometry built?','Let’s build it step by step in Three.js.']
];
try {
 const puzzle=createPuzzle(document.getElementById('viewport'));
 const driver={time:0};
 const stageIndex=document.getElementById('stage-index'),stageTitle=document.getElementById('stage-title'),takeaway=document.getElementById('takeaway'),upper=document.getElementById('upper-state'),lower=document.getElementById('lower-state'),header=document.getElementById('headline');
 const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
 function paint(t){
   window.puzzleState=puzzle.renderAt(t);
   window.paintSubtitles?.(t);
   const stage=stages.findLast(s=>s[0]<=t)||stages[0];
   setText(stageIndex,stage[1]);setText(stageTitle,stage[2]);setText(takeaway,stage[3]);
   upper.style.borderColor=t>=7&&t<16||t>=26&&t<35?'#ffc878':'transparent';
   lower.style.borderColor=t>=16&&t<26?'#ffc878':'transparent';
   setText(header,t>=41?'How did Astra build this geometry?':'I asked Astra how it created this puzzle');
 }
 const tl=gsap.timeline({paused:true});
 tl.to(driver,{time:45,duration:45,ease:'none',onUpdate:()=>paint(driver.time)},0);
 tl.fromTo('#heading-wrap',{opacity:.2,y:10},{opacity:1,y:0,duration:.65,ease:'power2.out'},0);
 tl.fromTo('#reference-content',{opacity:.2},{opacity:1,duration:.8,ease:'power1.out'},0);
 tl.fromTo('#model-content',{opacity:.2},{opacity:1,duration:.9,ease:'power1.out'},.2);
 tl.fromTo('#progress',{scaleX:0},{scaleX:1,duration:45,ease:'none'},0);
 window.__timelines=window.__timelines||{};window.__timelines.opening=tl;
 window.__hfForceTimelineRebind?.();
 window.puzzleReview={seek:t=>{tl.seek(t,false);paint(t);return window.puzzleState;},stats:puzzle.getGeometryStats(),actions:puzzle.actions,subtitles};
 window.addEventListener('hf-seek',e=>{if(e.detail.time<=45)paint(e.detail.time);});
 paint(0);window.resolvePuzzleReady();
}catch(error){window.rejectPuzzleReady(error);console.error(error);}
