import {useMemo} from 'react';
import * as THREE from 'three';
export const EMOTIONS=['neutral','happy','sad','angry','surprised','thinking','smug'] as const;
export const ACTIONS=['idle','talk','nod','shake','shrug','wave','point','type','listen','celebrate','facepalm','lean','bounce'] as const;
export type Emotion=typeof EMOTIONS[number];export type Action=typeof ACTIONS[number];
export type Performance={emotion:Emotion;action:Action;talk:number;look:number;strength?:number;bodyTurn?:number;expression?:import('./Performance').Expression};
export type Look={skin:string;shirt:string;hair:string;mascot:string};
export const defaultLook:Look={skin:'#ce9362',shirt:'#66734a',hair:'#30241f',mascot:'#d7815d'};
const dark='#2b211e';
function Curve({points,color=dark,radius=.012}:{points:number[][];color?:string;radius?:number}){
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),[points]);
 return <mesh><tubeGeometry args={[curve,16,radius,6,false]}/><meshStandardMaterial color={color} roughness={1}/></mesh>;
}
function Ball({p=[0,0,0],s=[1,1,1],color,detail=12,shadow=true}:{p?:[number,number,number];s?:[number,number,number];color:string;detail?:number;shadow?:boolean}){
 return <mesh position={p} scale={s} castShadow={shadow} receiveShadow><sphereGeometry args={[1,detail,8]}/><meshStandardMaterial color={color} roughness={.95} flatShading/></mesh>;
}
function Segment({from,to,width,color}:{from:[number,number,number];to:[number,number,number];width:number;color:string}){
 const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a);
 return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize())} castShadow><cylinderGeometry args={[width,width*.94,delta.length(),8]}/><meshStandardMaterial color={color} flatShading roughness={1}/></mesh>;
}
function blink(frame:number,offset:number){const c=(frame+offset)%139;return c<2?1-c*.47:c<3?.055:c<7?.055+(c-3)*.236:1;}
export function Face({frame,pose,scale=1}:{frame:number;pose:Performance;scale?:number}){
 const eye=blink(frame,scale>1?45:0),amp=Math.max(0,Math.min(1,pose.talk));
 const gaze=Math.sin(frame*.015)*.009+pose.look*.015;
 const angry=pose.emotion==='angry',sad=pose.emotion==='sad',happy=pose.emotion==='happy';
 const surprise=pose.emotion==='surprised';
 const expression=pose.expression;
 const mouthWidth=(surprise?.045:.080)*(expression?.mouthWidth??1)+amp*.025;
 const mouthHeight=surprise?.065:amp*.047;
 const smile=expression?.smile??(pose.emotion==='smug'?.035:happy?.025:sad?-.025:0);
 return <group scale={scale}>
  {[-1,1].map((side,i)=><group key={side} position={[side*.145,.075,.385]}>
   {happy&&amp<.2?<Curve radius={.012} points={[[-.035,-.005,.008],[0,.025,.014],[.035,-.005,.008]]}/>:<group position={[gaze,0,0]} scale={[1,Math.max(.055,eye*(surprise?1.28:1)*(expression?.eyeScale??1)),1]}><Ball shadow={false} s={[.032,.052,.026]} color={dark}/><Ball shadow={false} p={[-.007,.015,.022]} s={[.009,.010,.005]} color="#fff4d9" detail={8}/></group>}
   <Curve radius={.011} points={[[-.046,.095+(angry?side*.022:sad?-side*.02:0)+(expression?.browTilt??0)*side,-.01],[0,.105+(pose.emotion==='thinking'&&i===1?.035:0),-.01],[.046,.095-(angry?side*.022:sad?-side*.02:0)-(expression?.browTilt??0)*side,-.01]]}/>
  </group>)}
  {mouthHeight>.012?<group position={[0,-.125,.403]}><mesh scale={[mouthWidth,mouthHeight,1]}><circleGeometry args={[1,24]}/><meshBasicMaterial color={dark}/></mesh>{amp>.35?<mesh position={[0,-mouthHeight*.55,.001]} scale={[mouthWidth*.55,mouthHeight*.25,1]}><circleGeometry args={[1,16]}/><meshBasicMaterial color="#b86b60"/></mesh>:null}</group>:<Curve radius={.012} points={[[-mouthWidth,-.12,.4],[0,-.12-smile,.411],[mouthWidth,-.12+(pose.emotion==='smug'?.014:0),.4]]}/>}
 </group>;
}
function Arm({side,frame,pose,look}:{side:number;frame:number;pose:Performance;look:Look}){
 const action=pose.action,t=frame/30;
 let z=side*.08,x=-.22,elbow=-1.15,foreZ=0;
 if(action==='wave'&&side===1){z=2.25+Math.sin(t*5)*.12;x=0;elbow=-.15;foreZ=.35+Math.sin(t*7)*.25;}
 if(action==='point'&&side===1){z=1.35;x=-.15;elbow=-.15;foreZ=.14;}
 if(action==='shrug'){z=side*.8;x=-.12;elbow=-1;foreZ=side*.3;}
 if(action==='celebrate'){z=side*2.2;x=0;elbow=-.25;}
 if(action==='facepalm'&&side===1){z=-.42;x=-2.1;elbow=-1.0;}
 if(action==='type'){elbow=-1.2+Math.sin(t*10+side)*.07;}
 if(action==='talk'&&side===1){z=.2+Math.sin(t*2.5)*.12;elbow=-1.0+Math.sin(t*3)*.15;}
 const strength=pose.strength??1;z=side*.08+(z-side*.08)*strength;x=-.22+(x+.22)*strength;elbow=-1.15+(elbow+1.15)*strength;foreZ*=strength;
 return <group position={[side*.36,.68,.01]} rotation={[x,0,z]}>
  <Segment from={[0,0,0]} to={[0,-.35,0]} width={.105} color={look.shirt}/>
  <group position={[0,-.35,0]} rotation={[elbow,0,foreZ]}><Segment from={[0,0,0]} to={[0,-.30,0]} width={.085} color={look.shirt}/><Ball p={[0,-.34,.01]} s={[.091,.11,.075]} color={look.skin}/></group>
 </group>;
}
function Hair({color}:{color:string}){
 const geometry=useMemo(()=>{
  const positions:number[]=[],indices:number[]=[],segments=24,rings=10;
  for(let row=0;row<=rings;row++)for(let col=0;col<=segments;col++){
   const phi=col/segments*Math.PI*2,c=Math.cos(phi);
   // High forehead, coverage above the ears, and a lower back/nape edge.
   const edge=c>0?.08+.19*c*c:.08+.25*c;
   const theta=row/rings*Math.acos((edge-.025)/.49);
   positions.push(Math.sin(phi)*Math.sin(theta)*.454,.025+Math.cos(theta)*.49,Math.cos(phi)*Math.sin(theta)*.402);
   if(row<rings&&col<segments){const n=row*(segments+1)+col;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[]);
 return <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={1} flatShading side={THREE.DoubleSide}/></mesh>;
}
export function Human({frame,pose,look=defaultLook}:{frame:number;pose:Performance;look?:Look}){
 const t=frame/30,act=pose.action;
 const nod=act==='nod'?Math.sin(t*5)*.12:0,shake=act==='shake'?Math.sin(t*5)*.2:0;
 const bounce=act==='bounce'||act==='celebrate'?Math.abs(Math.sin(t*4))*.06:0;
 const headDown=Math.max(0,-pose.look)*.32,headTurn=Math.max(0,pose.look)*.50;
 return <group position={[-1.28,.82+bounce,0]} rotation={[0,.10+(pose.bodyTurn??0),act==='lean'?-.08:0]}>
  {[-1,1].map(side=><group key={side}><Segment from={[side*.17,.02,.06]} to={[side*.21,-.06,.57]} width={.13} color="#303940"/><Segment from={[side*.21,-.06,.57]} to={[side*.23,-.66,.66]} width={.115} color="#303940"/><Ball p={[side*.23,-.70,.76]} s={[.145,.095,.235]} color="#e1ddc9"/></group>)}
  <group position={[0,Math.sin(t*1.5)*.009,0]}>
   <mesh position={[0,.39,0]} castShadow><boxGeometry args={[.57,.72,.34]}/><meshStandardMaterial color="#e5dfc7" roughness={1}/></mesh>
   {[-1,1].map(side=><mesh key={side} position={[side*.20,.41,.015]} castShadow><boxGeometry args={[.24,.77,.39]}/><meshStandardMaterial color={look.shirt} roughness={1}/></mesh>)}
   {[-1,1].map(side=><Arm key={side} side={side} frame={frame} pose={pose} look={look}/>)}
   <Segment from={[0,.75,0]} to={[0,.96,0]} width={.13} color={look.skin}/>
   <group position={[0,1.20,0]} rotation={[headDown+nod+.014*Math.sin(t*1.7),headTurn+shake,pose.emotion==='thinking'?-.07:pose.emotion==='sad'?.055:0]}>
    <Ball s={[.43,.46,.38]} color={look.skin}/>
    <Ball p={[-.425,-.015,0]} s={[.08,.12,.07]} color={look.skin}/><Ball p={[.425,-.015,0]} s={[.08,.12,.07]} color={look.skin}/>
    <mesh position={[0,-.015,.403]} rotation={[Math.PI*.5,0,0]}><coneGeometry args={[.055,.12,3]}/><meshStandardMaterial color={look.skin} flatShading/></mesh>
    <Hair color={look.hair}/>
    {Array.from({length:6},(_,i)=><mesh key={i} position={[-.34+i*.12,.34+Math.sin(i*.9)*.05,.18]} rotation={[.1,0,-.3]} castShadow><coneGeometry args={[.115,.28,5]}/><meshStandardMaterial color={look.hair} flatShading/></mesh>)}
    <Face frame={frame} pose={pose}/>
   </group>
  </group>
  <group position={[0,.12,.48]} rotation={[-.035,0,0]}>
   <mesh castShadow receiveShadow><boxGeometry args={[.79,.035,.48]}/><meshStandardMaterial color="#4a5960" roughness={.65} metalness={.15}/></mesh>
   <mesh position={[0,.019,-.12]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.26,.13]}/><meshStandardMaterial color="#718086" roughness={.7}/></mesh>
   {Array.from({length:4},(_,row)=>Array.from({length:10},(_,col)=><mesh key={row*10+col} position={[-.31+col*.068,.021,.015+row*.04]}><boxGeometry args={[.048,.007,.026]}/><meshStandardMaterial color="#263139"/></mesh>))}
   <group position={[0,.02,.225]} rotation={[.20,0,0]}>
    <mesh position={[0,.245,0]} castShadow><boxGeometry args={[.79,.49,.035]}/><meshStandardMaterial color="#34444d" roughness={.65} metalness={.2}/></mesh>
    <mesh position={[0,.245,-.0185]} rotation={[0,Math.PI,0]}><planeGeometry args={[.71,.41]}/><meshBasicMaterial color="#b9e0dc"/></mesh>
    {[0,1,2,3].map(i=><mesh key={i} position={[-.08,.34-i*.06,-.0195]} rotation={[0,Math.PI,0]}><planeGeometry args={[.40-(i%2)*.12,.012]}/><meshBasicMaterial color={i%2?'#5a9da4':'#7ab7b4'}/></mesh>)}
    <mesh position={[0,.245,.019]}><circleGeometry args={[.035,12]}/><meshStandardMaterial color="#87999c" metalness={.3}/></mesh>
   </group>
  </group>
 </group>;
}
function starShape(){const shape=new THREE.Shape();const rays=12;for(let i=0;i<rays*4;i++){const a=i/(rays*4)*Math.PI*2;const k=i%4;const r=k===0||k===3?.38:.53;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();return shape;}
export function Mascot({frame,pose,look=defaultLook,facing=-.35}:{frame:number;pose:Performance;look?:Look;facing?:number}){
 const shape=useMemo(starShape,[]),t=frame/30;
 const bounce=pose.action==='bounce'||pose.action==='celebrate'?.07*Math.abs(Math.sin(t*5)):.014*Math.sin(t*1.8);
 const tilt=pose.action==='shake'?.12*Math.sin(t*5):pose.action==='lean'?.13:pose.emotion==='thinking'?.08:.018*Math.sin(t*1.3);
 const pitch=(pose.action==='nod'?.13*Math.sin(t*5):pose.action==='listen'?.035:0)+Math.max(0,-pose.look)*.06;
 const wave=pose.action==='wave'||pose.action==='celebrate';
 return <group position={[1.17,.60,0]} rotation={[0,facing+(pose.bodyTurn??0),0]}>
  {[-1,1].map(side=><Ball key={side} p={[side*.17,.075,.09]} s={[.14,.075,.18]} color={look.mascot}/>)}
  <group position={[0,.66+bounce,0]} rotation={[pitch,pose.look*.18,tilt]}>
   <mesh castShadow receiveShadow position={[0,0,-.12]}><extrudeGeometry args={[shape,{depth:.24,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.045,bevelThickness:.045}]}/><meshStandardMaterial color={look.mascot} roughness={.9} flatShading/></mesh>
   <group position={[0,0,-.137]}><Face frame={frame+45} pose={pose} scale={.84}/></group>
   {[-1,1].map(side=>{
    const waveThis=wave&&(pose.action==='celebrate'||side===-1);
    const gesture=waveThis?1.5+Math.sin(t*6)*.15:pose.action==='shrug'?.7:pose.action==='point'&&side===-1?1.1:pose.action==='talk'?.22+Math.sin(t*3+side)*.10:pose.action==='type'?.25+Math.sin(t*10+side)*.05:.1;
    return <group key={side} position={[side*.42,-.18,0]} rotation={[pose.action==='facepalm'&&side===-1?-1.8:pose.action==='type'?-1:0,0,side*(pose.action==='facepalm'&&side===-1?-.5:gesture)]}><Segment from={[0,0,0]} to={[side*.04,-.23,.03]} width={.06} color={look.mascot}/><Ball p={[side*.04,-.25,.03]} s={[.084,.09,.074]} color={look.mascot}/></group>;
   })}
  </group>
 </group>;
}
