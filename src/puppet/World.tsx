import {CameraRig,type CameraPose} from './CameraRig';
import {Human,Mascot,defaultLook,type Look,type Performance} from './Characters';
import {sceneTemplate,templateCameras} from './SceneTemplates';
export const CAMERAS=['Wide','Host','Claude','Over laptop','Two-shot','Low angle'] as const;
export type CameraName=string;
export const idle:Performance={emotion:'neutral',action:'idle',talk:0,look:1};
export function CharacterWorld({frame,camera='Wide',host=idle,claude=idle,look=defaultLook,presets=[],templateId='campfire',cameraEditor,onCameraEdit}:{frame:number;camera?:CameraName;host?:Performance;claude?:Performance;look?:Look;presets?:CameraPose[];templateId?:string;cameraEditor?:{pose:CameraPose;revision:number};onCameraEdit?:(pose:CameraPose)=>void}){
 const {Set}=sceneTemplate(templateId);
 return <><Set frame={frame}/><CameraRig name={camera} frame={frame} presets={templateCameras(templateId,presets)} templateId={templateId} editor={cameraEditor} onEdit={onCameraEdit}/><Human frame={frame} pose={host} look={look}/><Mascot frame={frame} pose={claude} look={look} facing={camera==='Over laptop'?-1.65:-.35}/></>;
}
