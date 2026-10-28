import {useLayoutEffect,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
export type CameraPose={id:string;name:string;templateId:string;position:[number,number,number];target:[number,number,number];fov:number};
export const CAMERA_POSES:CameraPose[]=[
 {id:'Wide',name:'Wide',templateId:'campfire',position:[3,3.2,10.5],target:[0,1.1,0],fov:37},
 {id:'Host',name:'Host',templateId:'campfire',position:[-.05,2.5,3.8],target:[-1.23,1.75,0],fov:37},
 {id:'Claude',name:'Claude',templateId:'campfire',position:[.3,1.75,3.6],target:[1.17,1.23,0],fov:37},
 {id:'Over laptop',name:'Over laptop',templateId:'campfire',position:[-4.8,4.2,-3.8],target:[-.1,1.3,.3],fov:50},
 {id:'Two-shot',name:'Two-shot',templateId:'campfire',position:[0,2.5,9.35],target:[0,1.25,.1],fov:42},
 {id:'Low angle',name:'Low angle',templateId:'campfire',position:[.7,1.03,10.2],target:[0,1.25,0],fov:40},
];
export function cameraPose(id:string,custom:CameraPose[]=[],templateId='campfire'){const saved=custom.find(p=>p.id===id&&p.templateId===templateId);if(saved)return saved;const base=CAMERA_POSES.find(p=>p.id===id)??CAMERA_POSES[0];return base.templateId===templateId?base:{...base,templateId};}
export function validCamera(p:CameraPose){return typeof p?.templateId==='string'&&p.templateId.length>0&&typeof p.id==='string'&&typeof p.name==='string'&&p.position?.length===3&&p.target?.length===3&&[...p.position,...p.target,p.fov].every(Number.isFinite)&&p.fov>=15&&p.fov<=90&&new THREE.Vector3(...p.position).distanceTo(new THREE.Vector3(...p.target))>.1;}
function OrbitCamera({pose,revision,onChange}:{pose:CameraPose;revision:number;onChange:(pose:CameraPose)=>void}){
 const {camera,gl}=useThree(),callback=useRef(onChange);callback.current=onChange;
 useLayoutEffect(()=>{camera.position.set(...pose.position);if(camera instanceof THREE.PerspectiveCamera){camera.fov=pose.fov;camera.updateProjectionMatrix();}const controls=new OrbitControls(camera,gl.domElement);controls.target.set(...pose.target);controls.minDistance=.7;controls.maxDistance=35;controls.maxPolarAngle=Math.PI*.95;controls.update();const finish=()=>callback.current({...pose,position:camera.position.toArray() as [number,number,number],target:controls.target.toArray() as [number,number,number],fov:(camera as THREE.PerspectiveCamera).fov});controls.addEventListener('end',finish);return()=>{controls.removeEventListener('end',finish);controls.dispose();};},[camera,gl,revision]);
 return null;
}
function FixedCamera({pose,frame}:{pose:CameraPose;frame:number}){const {camera}=useThree();useLayoutEffect(()=>{camera.position.set(...pose.position);if(!pose.id.startsWith('custom:'))camera.position.x+=Math.sin(frame/30*.18)*.035;camera.lookAt(...pose.target);if(camera instanceof THREE.PerspectiveCamera){camera.fov=pose.fov;camera.updateProjectionMatrix();}},[camera,pose,frame]);return null;}
export function CameraRig({name,frame,presets=[],templateId='campfire',editor,onEdit}:{name:string;frame:number;presets?:CameraPose[];templateId?:string;editor?:{pose:CameraPose;revision:number};onEdit?:(pose:CameraPose)=>void}){return editor&&onEdit?<OrbitCamera pose={editor.pose} revision={editor.revision} onChange={onEdit}/>:<FixedCamera pose={cameraPose(name,presets,templateId)} frame={frame}/>;}
