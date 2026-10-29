import type {ComponentType} from 'react';
import type {CameraPose} from './CameraRig';
import {WorkingRoom,AfterHours,KeypadSet,GauntletSet,ClassroomSet,DaylightSet,PhoneWorld,type SetProps} from './StudioSets';
import {CampfireSet} from './CampfireSet';
export type SceneTemplate={id:string;name:string;Set:ComponentType<SetProps>;cameras?:CameraPose[]};
// Extend the existing renderer: register a new set, not a new animation app.
const screenCamera=(templateId:string):CameraPose=>({id:'Screen',name:'Working screen',templateId,position:[0,3.0,9.0],target:[0,2.8,-3.4],fov:42});
export const SCENE_TEMPLATES:Record<string,SceneTemplate>={
 campfire:{id:'campfire',name:'Campfire at night',Set:CampfireSet},
 'working-room':{id:'working-room',name:'Working Screen room',Set:WorkingRoom,cameras:[screenCamera('working-room')]},
 'after-hours':{id:'after-hours',name:'Office after hours',Set:AfterHours,cameras:[screenCamera('after-hours')]},
 keypad:{id:'keypad',name:'Giant phone keypad',Set:KeypadSet,cameras:[{...screenCamera('keypad'),position:[0,3.3,8],target:[0,3.3,-5]}]},
 gauntlet:{id:'gauntlet',name:'Verification gauntlet',Set:GauntletSet,cameras:[screenCamera('gauntlet')]},
 classroom:{id:'classroom',name:'Teaching corner',Set:ClassroomSet,cameras:[screenCamera('classroom')]},
 daylight:{id:'daylight',name:'Daylight park',Set:DaylightSet},
 'phone-world':{id:'phone-world',name:'Phone world',Set:PhoneWorld,cameras:[{...screenCamera('phone-world'),position:[0,3.0,6],target:[0,2.8,-2],fov:40}]},
};
export function sceneTemplate(id:string){return SCENE_TEMPLATES[id]??SCENE_TEMPLATES.campfire;}
export function templateCameras(id:string,custom:CameraPose[]=[]){return [...custom,...(sceneTemplate(id).cameras??[])];}
