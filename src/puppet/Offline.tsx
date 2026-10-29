import {useLayoutEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useThree} from '@react-three/fiber';
import {CharacterWorld} from './World';
import {direct,type Project} from './types';
import {heldPerformanceFrame,screenAt,beatPhase} from './Direction';
import {paintCaptions} from './Captions';
import {SCENE_TEMPLATES} from './SceneTemplates';

type Configuration={project:Project;envelope:number[];captions:boolean;talkPreview:boolean};
type Request=Configuration&{frame:number;sequence:number;resolve:()=>void;reject:(e:Error)=>void};
let submit:((request:Request)=>void)|undefined,configuration:Configuration|undefined,sequence=0;
const output=document.createElement('canvas');output.width=1080;output.height=1920;output.id='output';
output.style.cssText='position:absolute;inset:0;width:1080px;height:1920px;pointer-events:none';document.body.append(output);
const context=output.getContext('2d');if(!context)throw Error('2D caption compositor unavailable');
function CommitFrame({request}:{request:Request}){
 const {gl,scene,camera}=useThree();
 useLayoutEffect(()=>{try{
  gl.render(scene,camera);gl.getContext().finish();
  context!.clearRect(0,0,1080,1920);context!.drawImage(gl.domElement,0,0,1080,1920);
  const captionFrame=heldPerformanceFrame(request.frame,request.project),beat=direct(captionFrame,request.project.beats,0).beat;
  if(request.captions&&beat)paintCaptions(context!,beat,captionFrame/30,'Campfire Sans',request.project.captionStyle);
  request.resolve();
 }catch(e){request.reject(e instanceof Error?e:Error(String(e)));}},[request,gl,scene,camera]);
 return null;
}
function App(){
 const [request,setRequest]=useState<Request>();
 useLayoutEffect(()=>{submit=setRequest;return()=>{submit=undefined;};},[]);
 if(!request)return null;
 const amplitude=request.envelope[request.frame]??(request.talkPreview?.25+Math.abs(Math.sin(request.frame*.35))*.5:0);
 const poseFrame=heldPerformanceFrame(request.frame,request.project);
 const perf=direct(poseFrame,request.project.beats,request.frame===poseFrame?amplitude:0,request.project.expressions);
 const screen=screenAt(request.project,request.frame/30);
 return <Canvas frameloop="never" dpr={1} shadows gl={{antialias:true,preserveDrawingBuffer:true,alpha:false}} camera={{near:.05,far:70}}>
  <CharacterWorld frame={poseFrame} screen={screen.screen} screenElapsed={screen.elapsed} push={(perf.beat?.cameraMotion??0)*beatPhase(poseFrame,perf.beat)} host={perf.host} claude={perf.claude} camera={perf.camera} look={request.project.look} presets={request.project.cameraPresets} templateId={request.project.templateId}/>
  <CommitFrame request={request}/>
 </Canvas>;
}
createRoot(document.getElementById('root')!).render(<App/>);
async function frame(index:number){
 if(!configuration||!submit)throw Error('Renderer has not been initialised');
 if(!Number.isInteger(index)||index<0||index>=Math.ceil(configuration.project.duration*30))throw Error('Frame outside episode');
 await new Promise<void>((resolve,reject)=>submit!({...configuration!,frame:index,sequence:++sequence,resolve,reject}));
 // One local IPC call returns a fully painted, lossless native-resolution frame.
 return output.toDataURL('image/png').slice('data:image/png;base64,'.length);
}
window.CampfireRenderer={get ready(){return !!submit;},async init(config:Configuration){
 if(!SCENE_TEMPLATES[config.project.templateId??'campfire'])throw Error('Unknown scene template: '+config.project.templateId);
 await document.fonts.load('700 51px "Campfire Sans"');await document.fonts.ready;
 configuration=config;await frame(0);
 const canvas=document.querySelector<HTMLCanvasElement>('#root canvas'),gl=canvas?.getContext('webgl2');
 const ext=gl?.getExtension('WEBGL_debug_renderer_info');
 return {width:output.width,height:output.height,templates:Object.keys(SCENE_TEMPLATES),renderer:ext?String(gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unavailable',vendor:ext?String(gl!.getParameter(ext.UNMASKED_VENDOR_WEBGL)):'unavailable'};
},frame};
declare global{interface Window{CampfireRenderer:{readonly ready:boolean;init:(config:Configuration)=>Promise<{width:number;height:number;templates:string[];renderer:string;vendor:string}>;frame:(index:number)=>Promise<string>}}}
