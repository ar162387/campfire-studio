import {useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';

// Set dressing belongs to this campfire template. Positions are stable on
// every frame, and shared by rehearsal, playback and recording.
const random=(i:number)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
type Instance={position:[number,number,number];scale:[number,number,number];rotation:[number,number,number];color:string};
function Scatter({items,kind}:{items:Instance[];kind:'stone'|'leaf'|'grass'}){
 const ref=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{if(!ref.current)return;const object=new THREE.Object3D(),color=new THREE.Color();items.forEach((item,i)=>{object.position.set(...item.position);object.scale.set(...item.scale);object.rotation.set(...item.rotation);object.updateMatrix();ref.current!.setMatrixAt(i,object.matrix);ref.current!.setColorAt(i,color.set(item.color));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();},[items]);
 return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow={kind==='leaf'} receiveShadow>
  {kind==='grass'?<coneGeometry args={[1,1,3]}/>:<icosahedronGeometry args={[1,kind==='leaf'?1:0]}/>}
  <meshStandardMaterial roughness={1} flatShading/>
 </instancedMesh>;
}
function groundDetails(){
 const stones:Instance[]=[],leaves:Instance[]=[],grass:Instance[]=[];
 // Small pebbles and loose gravel, including the visible foreground.
 for(let i=0;i<150;i++){const angle=random(i+1)*Math.PI*2,r=1.65+random(i+201)*5.5,x=Math.cos(angle)*r,z=Math.sin(angle)*r;if(Math.hypot(x,z-.95)<.98)continue;const s=.035+random(i+401)*.085;stones.push({position:[x,s*.35,z],scale:[s,s*.48,s*(.7+random(i+601))],rotation:[random(i+801),angle,random(i+1001)],color:['#56605b','#667068','#8a8270','#414e50'][i%4]});}
 // Irregular bush groups, kept away from faces, hands and the fire ring.
 const bushes=[[-1.6,-2.5],[.3,-3.0],[1.7,2.7],[-3.5,-1.9],[3,-1.7],[-2.5,-3.4],[2,-3.8],[4,1.2],[-4.5,1.7],[2.7,4.5],[-2.9,5.3],[.2,6.6],[5.3,-4.2],[-5.4,-4.7]];
 bushes.forEach(([x,z],i)=>{for(let j=0;j<6;j++){const angle=j*2.4,dx=Math.cos(angle)*(.12+j*.055),dz=Math.sin(angle)*(.12+j*.05),s=.22+random(i*6+j+1201)*.17;leaves.push({position:[x+dx,.13+s*.35,z+dz],scale:[s*1.3,s*.85,s],rotation:[0,angle,.1],color:['#344f40','#3d5d45','#486748','#29483e'][j%4]});}});
 for(let i=0;i<170;i++){const angle=random(i+1401)*Math.PI*2,r=2.4+random(i+1601)*5.2,x=Math.cos(angle)*r,z=Math.sin(angle)*r;for(let j=0;j<3;j++){const height=.10+random(i*3+j+1801)*.18;grass.push({position:[x+(j-1)*.055,height*.5,z+Math.sin(j*2)*.05],scale:[.025,height,.025],rotation:[.12,angle,(j-1)*.28],color:['#526448','#64744d','#3a5946'][j]});}}
 return {stones,leaves,grass};
}
export function CampfireEnvironment(){
 const details=useMemo(groundDetails,[]);
 const stars=useMemo(()=>{const points:number[]=[];for(let i=0;i<2400;i++){const angle=random(i+2501)*Math.PI*2,y=1.5+Math.pow(random(i+3001),2)*23,r=Math.sqrt(30*30-y*y);points.push(Math.cos(angle)*r,y,Math.sin(angle)*r);}return new Float32Array(points);},[]);
 return <group>
  <Scatter items={details.stones} kind="stone"/><Scatter items={details.leaves} kind="leaf"/><Scatter items={details.grass} kind="grass"/>
  <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars,3]}/></bufferGeometry><pointsMaterial color="#d5e5f3" size={.12} sizeAttenuation transparent opacity={.85} fog={false} depthWrite={false}/></points>
  {/* A distant ridge gives the clearing depth in reverse camera angles. */}
  {Array.from({length:15},(_,i)=>{const a=i/15*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*22,.1,Math.sin(a)*22]} scale={[4.5,1.0+(i%4)*.28,3.7]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#203746':'#1b3040'} roughness={1} flatShading/></mesh>;})}
  {/* Moss patches break up the ground without adding a flat texture. */}
  {[[-3,2.7,1.0],[3.8,-2,.8],[-2,-3.3,1.1],[2,3.7,.7]].map(([x,z,s],i)=><mesh key={i} position={[x,.006,z]} rotation={[-Math.PI/2,0,i]} scale={[s,s*.65,1]} receiveShadow><circleGeometry args={[1,9]}/><meshStandardMaterial color="#394638" roughness={1}/></mesh>)}
 </group>;
}
