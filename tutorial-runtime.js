import {tutorialScenes} from './tutorial-scenes.js';
import {createTeachingModel} from './teaching-model.js';
import {maskImage} from './teaching-kit.js';
try{
 await document.fonts.ready;
 const model=createTeachingModel();
 for(const mode of ['body','track','solid','regions','region-solid','rotor'])maskImage(mode);
 window.TutorialRuntime={scenes:tutorialScenes,model,paint(id,c,t){const s=tutorialScenes.find(s=>s.id===id);c.clearRect(0,0,1776,680);c.save();s.draw(c,t,model);c.restore();}};
 window.dispatchEvent(new Event('tutorial-ready'));
 window.__hfForceTimelineRebind?.();
 window.resolveTutorial();
}catch(error){console.error(error);window.rejectTutorial(error);}
