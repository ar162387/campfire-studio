import {useLayoutEffect,useMemo,useRef,type ReactNode} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import type {Performance} from './Characters';
import type {PropKind,PropAction} from './Direction';
export function FaceEffects({pose,frame}:{pose:Performance;frame:number}){const t=frame/30;
 const heart=useMemo(()=>{const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.16,.12,-.12,.25,0,.14);s.bezierCurveTo(.12,.25,.16,.12,0,0);return s;},[]);
 const heartGeometry=useMemo(()=>new THREE.ShapeGeometry(heart),[heart]);useLayoutEffect(()=>()=>heartGeometry.dispose(),[heartGeometry]);
 return <>{pose.state==='blush'?[-1,1].map(x=><mesh key={x} position={[x*.24,-.025,.367]} scale={[.065,.035,1]}><circleGeometry args={[1,12]}/><meshBasicMaterial color="#f17e91" transparent opacity={.75} depthWrite={false}/></mesh>):null}
 {pose.state==='sweat'?[-1,1].map(x=><mesh key={x} position={[x*.36,.20-Math.sin(t*3+x)*.035,.22]} rotation={[0,0,Math.PI]}><coneGeometry args={[.025,.09,6]}/><meshBasicMaterial color="#93ddff"/></mesh>):null}
 {pose.state==='hearts'?[-1,1].map(x=><mesh key={x} geometry={heartGeometry} position={[x*.45,.13+Math.sin(t*2+x)*.04,.17]} scale={.55}><meshBasicMaterial color="#fa8cab" side={THREE.DoubleSide}/></mesh>):null}
 {pose.state==='dizzy'?Array.from({length:7},(_,i)=><mesh key={i} position={[Math.cos(t*2+i*.8)*.32,.50+i*.008,Math.sin(t*2+i*.8)*.15]}><sphereGeometry args={[.018,5,4]}/><meshBasicMaterial color={i%2?'#d5afff':'#ffdc8a'}/></mesh>):null}</>;
}
export function PropMesh({kind,action,phase=0,frame,text='REMEMBER THIS'}:{kind:PropKind;action?:PropAction;phase?:number;frame:number;text?:string}){
 const holder=useRef<THREE.Group>(null),camera=useThree(s=>s.camera);useLayoutEffect(()=>{if(kind==='note'&&action==='hold-up'&&holder.current?.parent){holder.current.parent.updateWorldMatrix(true,false);holder.current.quaternion.copy(holder.current.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(camera.quaternion));}},[kind,action,frame,camera]);
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=256;c.height=320;const d=c.getContext('2d')!;d.fillStyle='#fff0b8';d.fillRect(0,0,256,320);d.fillStyle='#36424c';d.font='bold 23px sans-serif';text.split(/\s+/).reduce((y,w)=>{d.fillText(w,18,y);return y+30;},45);return new THREE.CanvasTexture(c);},[text]);useLayoutEffect(()=>()=>texture.dispose(),[texture]);
 if(kind==='none')return null;
 return <group ref={holder} rotation={[0,0,Math.sin(frame*.05)*.025]} scale={action==='bite'&&phase>.55?.7:1}>
 {kind==='note'?<mesh><boxGeometry args={[.22,.29,.015]}/><meshStandardMaterial map={texture}/></mesh>:kind==='phone'?<group><mesh><boxGeometry args={[.13,.23,.025]}/><meshStandardMaterial color="#283b4b"/></mesh><mesh position={[0,0,.014]}><planeGeometry args={[.11,.19]}/><meshBasicMaterial color="#b3e5ee"/></mesh></group>:kind==='cup'?<group><mesh><cylinderGeometry args={[.08,.065,.18,10]}/><meshStandardMaterial color="#e3bc79"/></mesh><mesh position={[.08,0,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.055,.014,6,10]}/><meshStandardMaterial color="#e3bc79"/></mesh></group>:<group><mesh><cylinderGeometry args={[.025,.04,.13,6]}/><meshStandardMaterial color="#eadabd"/></mesh><mesh position={[0,.07,0]}><sphereGeometry args={[.095,8,5,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#dc805e"/></mesh></group>}
 {action==='scan'?<mesh position={[0,0,.35]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.22,.65,12,1,true]}/><meshBasicMaterial color="#82e9dd" transparent opacity={.14} side={THREE.DoubleSide} depthWrite={false}/></mesh>:null}
 </group>;
}
export function ActorEcho({enabled,frame,children}:{enabled:boolean;frame:number;children:ReactNode}){const source=useRef<THREE.Group>(null),echo=useRef<THREE.Group>(null);useLayoutEffect(()=>{if(!enabled||!source.current||!echo.current)return;const c=source.current.clone(true);c.position.x+=.8;c.position.z-=.25;c.traverse(o=>{if(o instanceof THREE.Mesh){const clone=(m:THREE.Material)=>{const n=m.clone();n.transparent=true;n.opacity=.22;n.depthWrite=false;return n;};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);}});const target=echo.current;target.add(c);return()=>{target.remove(c);c.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});};},[enabled,frame]);return <><group ref={source}>{children}</group><group ref={echo}/></>;}
