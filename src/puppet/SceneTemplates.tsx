import type {ComponentType} from 'react';
import type {CameraPose} from './CameraRig';
import {CampfireSet} from './CampfireSet';
export type SceneTemplate={id:string;name:string;Set:ComponentType<{frame:number}>;cameras?:CameraPose[]};
// Extend the existing renderer: register a new set, not a new animation app.
export const SCENE_TEMPLATES:Record<string,SceneTemplate>={campfire:{id:'campfire',name:'Campfire at night',Set:CampfireSet}};
export function sceneTemplate(id:string){return SCENE_TEMPLATES[id]??SCENE_TEMPLATES.campfire;}
export function templateCameras(id:string,custom:CameraPose[]=[]){return [...custom,...(sceneTemplate(id).cameras??[])];}
