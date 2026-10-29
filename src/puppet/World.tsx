import {ActorEcho} from './Effects';
import type {ScreenCue} from './Direction';
import {CameraRig,cameraPose,type CameraPose} from './CameraRig';
import {Human,Mascot,defaultLook,type Look,type Performance} from './Characters';
import {sceneTemplate,templateCameras} from './SceneTemplates';
export const CAMERAS=['Wide','Host','Claude','Over laptop','Two-shot','Low angle'] as const;
export type CameraName=string;
export const idle:Performance={emotion:'neutral',action:'idle',talk:0,look:1};
export function CharacterWorld({frame,camera='Wide',host=idle,claude=idle,look=defaultLook,presets=[],templateId='campfire',cameraEditor,onCameraEdit,screen,screenElapsed=0,push=0}:{frame:number;camera?:CameraName;host?:Performance;claude?:Performance;look?:Look;presets?:CameraPose[];templateId?:string;screen?:ScreenCue;screenElapsed?:number;push?:number;cameraEditor?:{pose:CameraPose;revision:number};onCameraEdit?:(pose:CameraPose)=>void}){
 const {Set}=sceneTemplate(templateId);
 const scoped=templateCameras(templateId,presets),pose=cameraPose(camera,scoped,templateId),actor=camera==='Host'?host:camera==='Claude'?claude:undefined;
 let offset:[number,number,number]=[0,0,0];
 if(actor&&!camera.startsWith('custom:')){if(camera==='Host'){if(actor.blocking==='collapsed')offset=[-1.15,-1.2,0];else if(actor.blocking&&actor.blocking!=='seated')offset=[0,actor.blocking==='crouch'?0:.45,0];}else if(actor.blocking==='collapsed')offset=[-.65,-.8,0];else if(actor.blocking==='crouch')offset=[0,-.22,0];}
 const framed={...pose,position:pose.position.map((n,i)=>n+offset[i]) as [number,number,number],target:pose.target.map((n,i)=>n+offset[i]) as [number,number,number]};
 return <><CameraRig name={camera} frame={frame} presets={[framed,...scoped]} templateId={templateId} push={push} editor={cameraEditor} onEdit={onCameraEdit}/><Set frame={frame} screen={screen} elapsed={screenElapsed}/><ActorEcho frame={frame} enabled={host.state==='ghost'}><Human frame={frame} pose={host} look={look}/></ActorEcho><ActorEcho frame={frame} enabled={claude.state==='ghost'}><Mascot frame={frame} pose={claude} look={look} facing={camera==='Over laptop'?-1.65:-.35}/></ActorEcho></>;
}
