// Native render smoke test: every registered set plus each extended direction state.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {startRenderer,initRenderer,captureFrame,validateProject} from './render-core.mjs';
import * as models from '../dist/render-data.mjs';
const project=JSON.parse(await readFile('examples/one-tiny-change.episode.json','utf8')),folder=process.argv.slice(2).find(x=>!x.startsWith('--'))??'output/v2-gallery';await mkdir(folder,{recursive:true});
const renderer=await startRenderer('dist',{software:process.argv.includes('--software')});
try{for(const templateId of Object.keys(models.SCENE_TEMPLATES)){const p={...project,templateId,beats:[{...project.beats[0],end:4,camera:'Two-shot',screen:undefined}],duration:5,endingHold:1};validateProject(p,models);await initRenderer(renderer,p,[],{captions:true,talkPreview:true});await writeFile(folder+'/'+templateId+'.png',await captureFrame(renderer,30));console.log('Rendered '+templateId);if(process.argv.includes('--cameras'))for(const camera of [...models.CAMERA_POSES.map(c=>c.id),...(models.SCENE_TEMPLATES[templateId].cameras??[]).map(c=>c.id)]){const shot={...p,beats:[{...p.beats[0],camera}]};await initRenderer(renderer,shot,[],{captions:true,talkPreview:true});await writeFile(folder+'/'+templateId+'-'+camera.replaceAll(' ','-')+'.png',await captureFrame(renderer,30));}}
 const lab=JSON.parse(await readFile('examples/direction-lab.episode.json','utf8'));await initRenderer(renderer,lab,[],{captions:true,talkPreview:true});for(const b of lab.beats){await writeFile(folder+'/state-'+b.state+'.png',await captureFrame(renderer,Math.round((b.start+1)*30)));console.log('Rendered '+b.state);}
}finally{await renderer.close();}
