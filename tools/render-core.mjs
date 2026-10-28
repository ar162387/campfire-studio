import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,stat,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import http from 'node:http';
import puppeteer from 'puppeteer';
export const FPS=30,WIDTH=1080,HEIGHT=1920;
export const hash=data=>createHash('sha256').update(data).digest('hex');
export async function exists(file){try{await stat(file);return true;}catch{return false;}}
export function command(bin,args,{binary=false,maxBytes=128*1024*1024}={}){return new Promise((yes,no)=>{const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});let chunks=[],errors=[],size=0;child.stdout.on('data',b=>{size+=b.length;if(size>maxBytes){child.kill();no(Error('Command output exceeded limit'));}else chunks.push(b);});child.stderr.on('data',b=>{errors.push(b);if(errors.length>100)errors.shift();});child.on('error',no);child.on('close',code=>{if(code!==0)no(Error(`${bin} exited ${code}: ${Buffer.concat(errors).toString().slice(-3000)}`));else yes(binary?Buffer.concat(chunks):Buffer.concat(chunks).toString());});});}
export function validateProject(p,models){
 if(p?.version!==1||!p.look||!Number.isFinite(p.duration)||p.duration<=0||!Array.isArray(p.beats)||!p.beats.length)throw Error('Expected a version-1 Campfire episode with look, duration and beats.');
 const ids=new Set();let end=0;
 for(const b of [...p.beats].sort((a,b)=>a.start-b.start)){
  if(!Number.isInteger(b.id)||ids.has(b.id)||!['human','creature'].includes(b.speaker)||typeof b.text!=='string'||!Number.isFinite(b.start)||!Number.isFinite(b.end)||b.start<0||b.end<=b.start||b.end>p.duration||b.start<end-.0001)throw Error(`Invalid/overlapping beat ${b.id}`);
  if(models&&(!models.ACTIONS.includes(b.action)||!models.EMOTIONS.includes(b.emotion)))throw Error(`Unknown action/emotion in beat ${b.id}`);
  ids.add(b.id);end=b.end;
  if(b.words?.some(w=>!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<b.start-.001||w.end<w.start||w.end>b.end+.001))throw Error(`Invalid word timing in beat ${b.id}`);
 }
 return p;
}
export function renderRange(project,{start=0,seconds,preview=false}={}){
 if(!Number.isFinite(start)||start<0||start>=project.duration)throw Error('--start must be inside the episode');
 if(seconds!==undefined&&(!Number.isFinite(seconds)||seconds<=0))throw Error('--seconds must be positive');
 const first=Math.round(start*FPS),last=Math.min(Math.ceil(project.duration*FPS),first+Math.ceil((seconds??(preview?3:project.duration))*FPS));
 return {first,count:last-first,start:first/FPS,duration:(last-first)/FPS};
}
export async function validFrame(file){try{const b=await readFile(file);return b.length>40&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.readUInt32BE(16)===WIDTH&&b.readUInt32BE(20)===HEIGHT&&b.subarray(-12,-8).equals(Buffer.alloc(4))&&b.subarray(-8,-4).toString()==='IEND';}catch{return false;}}
export async function atomicWrite(file,data){const temporary=file+'.tmp';await writeFile(temporary,data);await rename(temporary,file);}
export async function acquireJob(folder,signature){
 await mkdir(folder,{recursive:true});const manifest=join(folder,'job.json'),lock=join(folder,'lock.json');
 if(await exists(manifest)){const old=JSON.parse(await readFile(manifest,'utf8'));if(old.signature!==signature)throw Error('Job settings/source changed. Use a new --job directory; old frames will not be reused.');}
 try{await writeFile(lock,JSON.stringify({pid:process.pid}),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;const old=JSON.parse(await readFile(lock,'utf8'));try{process.kill(old.pid,0);throw Error('This render job is already running.');}catch(error){if(error.code!=='ESRCH')throw error;await unlink(lock);await writeFile(lock,JSON.stringify({pid:process.pid}),{flag:'wx'});}}
 await atomicWrite(manifest,JSON.stringify({signature,createdAt:new Date().toISOString()},null,2));
 return async()=>{try{await unlink(lock);}catch{}};
}
export async function startRenderer(dist,{software=false,browserPath}={}){
 const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const allowed={'/render.html':'text/html','/render.js':'text/javascript','/inter-latin-700-normal.woff2':'font/woff2'};if(!allowed[pathname]){res.writeHead(404);return res.end();}const data=await readFile(join(dist,pathname.slice(1)));res.writeHead(200,{'Content-Type':allowed[pathname],'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(500);res.end('Renderer asset unavailable');}});
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});let browser;
 try{
  const args=['--enable-webgl','--enable-gpu','--hide-scrollbars','--force-color-profile=srgb'];if(software)args.push('--use-angle=swiftshader','--enable-unsafe-swiftshader');
  browser=await puppeteer.launch({headless:true,pipe:true,timeout:30000,protocolTimeout:120000,executablePath:browserPath||process.env.PUPPETEER_EXECUTABLE_PATH||undefined,args});
  const page=await browser.newPage();await page.setViewport({width:WIDTH,height:HEIGHT,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/render.html`,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForFunction(()=>window.CampfireRenderer?.ready,{timeout:30000,polling:100});
  return {browser,page,errors,async close(){await browser.close();await new Promise(yes=>server.close(yes));}};
 }catch(e){if(browser)await browser.close();await new Promise(yes=>server.close(yes));throw Error(`Offline browser failed: ${e.message}\nLinux containers need Chrome system libraries and a working browser sandbox; use a non-root render worker. --software explicitly selects SwiftShader for trusted local scene rendering when no GPU is available.`);}
}
export function strippedProject(project){const {media,...p}=project;return p;}
async function evaluateRenderer(renderer,callback,arg){
 let timer,onError;
 try{return await Promise.race([renderer.page.evaluate(callback,arg),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Frame readiness timed out after 30s. Check scene errors and WebGL support; try --software on a CPU-only worker.')),30000);onError=e=>reject(Error(String(e)));renderer.page.once('pageerror',onError);})]);}
 finally{clearTimeout(timer);if(onError)renderer.page.off('pageerror',onError);}
}
export async function initRenderer(renderer,project,envelope,{captions=true,talkPreview=false}={}){return evaluateRenderer(renderer,config=>window.CampfireRenderer.init(config),{project:strippedProject(project),envelope,captions,talkPreview});}
export async function captureFrame(renderer,frame){const encoded=await evaluateRenderer(renderer,index=>window.CampfireRenderer.frame(index),frame);if(renderer.errors.length)throw Error(renderer.errors.join('\n'));return Buffer.from(encoded,'base64');}
export async function probe(file){return JSON.parse(await command('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file]));}
export function checkOutput(info,range,silent,hasAudio){const v=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.filter(s=>s.codec_type==='audio');if(!v||v.width!==WIDTH||v.height!==HEIGHT||v.avg_frame_rate!=='30/1'||Number(v.nb_read_frames)!==range.count)throw Error('Video verification failed: expected native 1080×1920, 30 fps and the exact frame count.');if((silent||!hasAudio)&&audio.length)throw Error('Silent export unexpectedly contains an audio stream.');if(!silent&&hasAudio&&!audio.length)throw Error('Expected mixed audio stream is missing.');if(Math.abs(Number(info.format.duration)-range.duration)>1/FPS+.005)throw Error('Export duration differs from the frame range.');return {width:v.width,height:v.height,fps:FPS,frames:Number(v.nb_read_frames),duration:Number(info.format.duration),audioTracks:audio.length};}
export function inferRenderer(info){return /swiftshader|llvmpipe|software|swrast/i.test(info.renderer)?'software':info.renderer==='unavailable'?'unknown':'GPU/driver reported (see renderer string)';}
export function frameFile(folder,index){return join(folder,`frame-${String(index).padStart(6,'0')}.png`);}
