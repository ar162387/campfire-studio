import {readFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {hash,command,FPS,atomicWrite} from './render-core.mjs';
const SAMPLE_RATE=48000;
export function activeIntervals(values,predicate){const out=[];let start;for(let i=0;i<=values.length;i++){const active=i<values.length&&predicate(values[i]);if(active&&start===undefined)start=i/FPS;if(!active&&start!==undefined){out.push([start,i/FPS]);start=undefined;}}return out;}
export function intervalExpression(intervals){return intervals.length?intervals.map(([a,b])=>`gte(t,${a.toFixed(6)})*lt(t,${b.toFixed(6)})`).join('+'):'0';}
export async function prepareAudio(project,base,folder,{silent=false,dialogue}={}){
 if(silent&&!dialogue&&!project.media?.[project.dialogueAssetId])return {voice:undefined,envelope:[],layers:[],mix:{duck:true},signature:'silent'};
 await mkdir(folder,{recursive:true});
 async function asset(id){const item=project.media?.[id];if(!item||!/^data:audio\/[\w.+-]+;base64,/.test(item.data??''))throw Error(`Missing embedded audio ${id}. Export the project with media from the studio, or provide --dialogue PATH.`);const bytes=Buffer.from(item.data.slice(item.data.indexOf(',')+1),'base64');if(!bytes.length||bytes.length>80*1024*1024)throw Error('Audio asset is empty or exceeds 80 MB');const file=join(folder,hash(bytes)+'.audio');await atomicWrite(file,bytes);return file;}
 const voice=dialogue?resolve(dialogue):project.dialogueAssetId?await asset(project.dialogueAssetId):undefined;
 if(project.voiceTrack&&!voice)throw Error('Legacy voice track is not embedded. Export matching audio or pass --dialogue PATH.');
 const envelope=[];
 if(voice){const pcm=await command('ffmpeg',['-v','error','-i',voice,'-f','f32le','-ac','1','-ar',String(SAMPLE_RATE),'-'],{binary:true});const perFrame=SAMPLE_RATE/FPS;for(let frame=0;frame<Math.ceil(project.duration*FPS);frame++){let sum=0,n=0;for(let j=frame*perFrame;j<Math.min((frame+1)*perFrame,pcm.length/4);j++){const v=pcm.readFloatLE(j*4);sum+=v*v;n++;}envelope.push(n?Math.min(1,Math.sqrt(sum/n)*8):0);}}
 const {DEFAULT_MIX,defaultLayers}=await import('../dist/render-data.mjs');const mix={...DEFAULT_MIX,...project.mix};const layers=[];
 if(!silent)for(const layer of project.layers??defaultLayers(mix)){
  if(!layer.enabled||!(layer.volume>0))continue;
  if(!['ambience','music','action'].includes(layer.kind)||!Number.isFinite(layer.volume)||layer.volume>1)throw Error('Invalid sound layer '+layer.id);
  let file;
  if(layer.assetId)file=await asset(layer.assetId);
  else if(layer.url==='builtin:typing'){
   const samples=Buffer.alloc(Math.round(SAMPLE_RATE*1.6)*2);let seed=12345;
   for(let k=0;k<12;k++){const start=Math.floor((k*.125+(k%3)*.014)*SAMPLE_RATE);for(let j=0;j<SAMPLE_RATE*.023&&start+j<samples.length/2;j++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const t=j/SAMPLE_RATE,v=(seed/4294967296*2-1)*Math.exp(-t*180)*.19+Math.sin(t*2*Math.PI*(500+k*37))*Math.exp(-t*260)*.1;samples.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),(start+j)*2);}}
   const raw=join(folder,'typing.s16');file=join(folder,'typing.wav');await atomicWrite(raw,samples);await command('ffmpeg',['-v','error','-y','-f','s16le','-ar',String(SAMPLE_RATE),'-ac','1','-i',raw,file]);
  }else if(['./campfire-fire.mp3','./campfire-night.mp3','./campfire-music.mp3'].includes(layer.url))file=join(base,'public',layer.url.slice(2));
  else throw Error(`Unsupported sound source for ${layer.name}. Use an embedded uploaded asset.`);
  await readFile(file);layers.push({...layer,file});
 }
 const sourceHashes=[];for(const f of [voice,...layers.map(l=>l.file)].filter(Boolean))sourceHashes.push(hash(await readFile(f)));
 return {voice,envelope,layers,mix,signature:hash(JSON.stringify(sourceHashes))};
}
export async function mixAudio(audio,project,range,folder,{silent=false}={}){
 if(silent||!audio.voice&&!audio.layers.length)return undefined;
 const inputs=[],filters=[],labels=[];let index=0;
 if(audio.voice){inputs.push('-i',audio.voice);filters.push(`[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=${Math.max(0,Math.min(1,audio.mix.dialogue))},apad[v]`);labels.push('[v]');index++;}
 for(const layer of audio.layers){
  const gain=join(folder,'gain-'+index+'.f32');await atomicWrite(gain,gainCurve(layer,project,audio));
  inputs.push('-stream_loop','-1','-i',layer.file,'-f','f32le','-ar','48000','-ac','1','-i',gain);
  const label='l'+index;filters.push(`[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[b${index}];[${index+1}:a]pan=stereo|c0=c0|c1=c0[g${index}];[b${index}][g${index}]amultiply[${label}]`);labels.push(`[${label}]`);index+=2;
 }
 filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest:dropout_transition=0,alimiter=limit=0.891:level=false:latency=true,atrim=start=${range.start}:duration=${range.duration},asetpts=PTS-STARTPTS[mix]`);
 const output=join(folder,'mix.wav');await command('ffmpeg',['-v','error','-y',...inputs,'-filter_complex',filters.join(';'),'-map','[mix]','-t',String(range.duration),'-c:a','pcm_s16le',output]);return output;
}

// Match the interactive mixer's gentle gain transitions without live playback.
export function gainCurve(layer,project,audio){
 const count=Math.ceil(project.duration*SAMPLE_RATE),bytes=Buffer.alloc(count*4),attack=1-Math.exp(-1/(SAMPLE_RATE*.055)),release=1-Math.exp(-1/(SAMPLE_RATE*.22));let current=0;
 const actions=Array.from({length:Math.ceil(project.duration*FPS)},(_,i)=>layer.kind!=='action'||project.beats.some(b=>i/FPS>=b.start&&i/FPS<b.end&&b.action===layer.action));
 for(let i=0;i<count;i++){const time=i/SAMPLE_RATE,frame=Math.min(actions.length-1,Math.floor(time*FPS)),speaking=(audio.envelope[frame]??0)>.035,fade=Math.max(0,Math.min(1,time/.65,(project.duration-time)/1.15)),duck=audio.mix.duck&&speaking?(layer.kind==='music'?.38:.72):1,target=actions[frame]?layer.volume*fade*duck:0;current+=(target-current)*(speaking?attack:release);bytes.writeFloatLE(current,i*4);}
 return bytes;
}
