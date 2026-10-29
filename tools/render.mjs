import {parseArgs} from 'node:util';
import {readFile,mkdir,rename,statfs,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir,cpus} from 'node:os';
import {performance} from 'node:perf_hooks';
import {hash,command,validateProject,renderRange,validFrame,atomicWrite,acquireJob,startRenderer,initRenderer,captureFrame,probe,checkOutput,inferRenderer,frameFile,exists,FPS} from './render-core.mjs';
import {prepareAudio,mixAudio} from './render-audio.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {values,positionals}=parseArgs({allowPositionals:true,options:{doctor:{type:'boolean'},preview:{type:'boolean'},silent:{type:'boolean'},'talk-preview':{type:'boolean'},'no-captions':{type:'boolean'},software:{type:'boolean'},episode:{type:'string'},output:{type:'string'},job:{type:'string'},start:{type:'string'},seconds:{type:'string'},dialogue:{type:'string'},browser:{type:'string'},quality:{type:'string'},help:{type:'boolean'}}});
if(values.help){console.log(`Campfire offline export — native 1080×1920 / 30 fps\n\nnpm run doctor -- [episode.json] [--software]\nnpm run render -- episode.json [--preview] [--silent] [--talk-preview]\n  --output PATH       MP4 path (default output/<episode>[-preview].mp4)\n  --start SECONDS     Begin a preview/export at this episode time\n  --seconds SECONDS   Limit the range; no resolution/fps reduction\n  --job DIRECTORY     Use/resume a particular frame job\n  --dialogue PATH     Override or supply matching dialogue audio\n  --no-captions       Omit captions\n  --software          Explicit SwiftShader fallback for trusted local scenes\n  --browser PATH      Use an installed Chrome instead of the bundled browser\n\nSame command resumes valid frames. Settings/source changes get a new cache.\nNo interactive studio, shared localhost link, microphone or provider account is needed to render.\n--silent produces no audio stream; --talk-preview simulates mouth motion without speech.\nAll animation currently uses the engine's fixed 30 fps clock.`);process.exit(0);}
let renderer,release,temporary,interrupted=false;
process.on('SIGINT',()=>{interrupted=true;console.error('Interrupt requested; saving completed frames. Rerun the same command to resume.');});
process.on('SIGTERM',()=>{interrupted=true;});
try{
 if(values.quality&&values.quality!=='final')throw Error('Supported quality: final (native 1080×1920/30 fps). Use --preview for a short native-quality excerpt.');
 if(positionals.length>1)throw Error('Provide one episode JSON.');
 const episodePath=resolve(values.episode??positionals[0]??(values.doctor?join(root,'examples/starter.episode.json'):''));
 if(!values.doctor&&!positionals[0]&&!values.episode)throw Error('Provide episode.json, or use --help.');
 if(!await exists(join(root,'dist/render-data.mjs')))throw Error('Run npm run build first.');
 const models=await import('../dist/render-data.mjs');
 const project=validateProject(JSON.parse(await readFile(episodePath,'utf8')),models);const range=renderRange(project,{start:Number(values.start??0),seconds:values.seconds===undefined?undefined:Number(values.seconds),preview:values.preview});
 for(const bin of ['ffmpeg','ffprobe'])await command(bin,['-version']);
 for(const file of ['render.js','render-data.mjs','inter-latin-700-normal.woff2'])if(!await exists(join(root,'dist',file)))throw Error('Renderer not built. Run npm run build first.');
 const free=await statfs(dirname(episodePath));if(Number(free.bavail)*Number(free.bsize)<256*1024*1024)throw Error('Less than 256 MiB free: clear rebuildable caches or choose a disk with more space before rendering.');
 temporary=await mkdtemp(join(tmpdir(),'campfire-render-'));
 const audio=await prepareAudio(project,root,temporary,{silent:values.silent||values.doctor,dialogue:values.dialogue});
 console.log(`Launching local offline renderer; ${cpus().length} CPUs detected. No shared browser session required.`);
 renderer=await startRenderer(join(root,'dist'),{software:values.software,browserPath:values.browser});
 const info=await initRenderer(renderer,project,audio.envelope,{captions:!values['no-captions'],talkPreview:values['talk-preview']});
 console.log(`Renderer: ${info.renderer}\nMode: ${inferRenderer(info)}; native ${info.width}×${info.height}, ${FPS} fps.`);
 if(values.doctor){
  const samples=[...new Set([0,...project.beats.map(b=>Math.min(Math.ceil(project.duration*FPS)-1,Math.round((b.start+b.end)/2*FPS)))])].slice(0,6);const timings=[],sizes=[];
  for(const index of samples){const before=performance.now();const png=await captureFrame(renderer,index);timings.push((performance.now()-before)/1000);sizes.push(png.length);}
  const mean=timings.reduce((a,b)=>a+b,0)/timings.length,frames=Math.ceil(project.duration*FPS),report={...info,mode:inferRenderer(info),cpus:cpus().length,samples:timings.length,secondsPerFrame:mean,estimatedFrameRenderSeconds:Math.round(mean*frames),encodingTimeIncluded:false,nativeFrames:frames,estimatedFrameStorageBytes:Math.round(sizes.reduce((a,b)=>a+b,0)/sizes.length*frames),freeBytes:Number(free.bavail)*Number(free.bsize),browser:await renderer.browser.version()};
  const output=resolve(values.output??join(root,'output/doctor.json'));await mkdir(dirname(output),{recursive:true});await atomicWrite(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log(`Doctor passed. Measured ${mean.toFixed(3)} sec/frame. Estimate excludes encoding and is specific to this scene/device. Report: ${output}`);
 }else{
  const output=resolve(values.output??join(root,'output',basename(episodePath,'.json')+(values.preview?'-preview':'')+'.mp4'));await mkdir(dirname(output),{recursive:true});
  const signature=hash(JSON.stringify({project,range,silent:!!values.silent,captions:!values['no-captions'],talkPreview:!!values['talk-preview'],audio:audio.signature,renderer:info.renderer,browser:await renderer.browser.version(),code:hash(Buffer.concat(await Promise.all(['dist/render.js','dist/inter-latin-700-normal.woff2','tools/render.mjs','tools/render-core.mjs','tools/render-audio.mjs'].map(f=>readFile(join(root,f))))))}));
  const folder=resolve(values.job??join(dirname(output),'.campfire-jobs',signature.slice(0,20)));release=await acquireJob(folder,signature);
  let rendered=0,reused=0,totalBytes=0;const begin=performance.now();let lastLog=0;
  for(let i=0;i<range.count;i++){
   if(interrupted)throw Error('Render interrupted. Completed frames are saved in '+folder);
   const file=frameFile(folder,i);
   if(await validFrame(file)){reused++;continue;}
   const png=await captureFrame(renderer,range.first+i);await atomicWrite(file,png);if(!await validFrame(file))throw Error('Invalid rendered PNG at frame '+i);rendered++;totalBytes+=png.length;
   const now=performance.now();if(rendered===1||i===range.count-1||now-lastLog>10000){const average=(now-begin)/1000/rendered;console.log(`Frame ${i+1}/${range.count} | new ${rendered}, reused ${reused} | ${average.toFixed(3)} sec/new frame | approx ${Math.ceil((range.count-i-1)*average)}s frames remaining`);lastLog=now;}
   if(rendered===1){const disk=await statfs(folder),available=Number(disk.bavail)*Number(disk.bsize),needed=png.length*(range.count-i-1)+64*1024*1024;if(needed>available)throw Error(`Insufficient disk for lossless frames (approximately ${Math.ceil(needed/1024**2)} MiB needed). Saved frame retained; free space and resume.`);}
  }
  await renderer.close();renderer=undefined;
  if(interrupted)throw Error('Interrupted before encoding; frames are saved.');
  console.log(`Frames complete: ${rendered} rendered, ${reused} reused. Mixing audio and encoding.`);
  const mixed=await mixAudio(audio,project,range,folder,{silent:values.silent});const partial=output+'.partial.mp4';
  const args=['-v','error','-y','-framerate','30','-start_number','0','-i',join(folder,'frame-%06d.png')];if(mixed)args.push('-i',mixed);args.push('-map','0:v');if(mixed)args.push('-map','1:a','-c:a','aac','-b:a','192k','-ar','48000');else args.push('-an');
  args.push('-frames:v',String(range.count),'-t',String(range.duration),'-vf','scale=in_range=pc:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-crf','18','-color_range','tv','-r','30','-movflags','+faststart',partial);
  await command('ffmpeg',args);const verified=checkOutput(await probe(partial),range,values.silent,!!mixed);await rename(partial,output);
  const report={output,job:folder,signature,episodeHash:hash(JSON.stringify(project)),captions:!values['no-captions'],...verified,renderedFrames:rendered,reusedFrames:reused,renderer:info.renderer,elapsedSeconds:Math.round((performance.now()-begin)/1000),captionTiming:project.beats.every(b=>{const tokens=b.text.trim().split(/\s+/);return b.words?.length===tokens.length&&b.words.every((w,i)=>w.text.trim()===tokens[i]);})?'word timings supplied':'some captions use estimated timing',mouthSource:audio.envelope.length?'dialogue amplitude':values['talk-preview']?'synthetic preview':'none'};
  await atomicWrite(output+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log('Verified export ready: '+output);
 }
}catch(e){console.error(e.stack??e.message);process.exitCode=interrupted?130:1;}
finally{if(renderer)await renderer.close();if(release)await release();if(temporary)await rm(temporary,{recursive:true,force:true});}
