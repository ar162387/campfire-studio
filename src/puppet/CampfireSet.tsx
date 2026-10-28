import {CampfireEnvironment} from './CampfireEnvironment';
function Tree({x,z,s=1}:{x:number;z:number;s?:number}){
 return <group position={[x,0,z]} scale={s}><mesh position={[0,.65,0]}><cylinderGeometry args={[.11,.16,1.3,6]}/><meshStandardMaterial color="#2d2c29" flatShading/></mesh>{[0,1,2].map(i=><mesh key={i} position={[0,1.25+i*.64,0]} castShadow><coneGeometry args={[1.06-i*.22,1.8,6]}/><meshStandardMaterial color={i%2?'#203c42':'#17363b'} flatShading roughness={1}/></mesh>)}</group>;
}
function Fire({frame}:{frame:number}){
 const t=frame/30;
 return <group position={[0,0,.95]}>
  {Array.from({length:9},(_,i)=><mesh key={i} position={[Math.cos(i/9*Math.PI*2)*.64,.09,Math.sin(i/9*Math.PI*2)*.53]} rotation={[i*.2,i,0]} castShadow><icosahedronGeometry args={[.14,0]}/><meshStandardMaterial color="#42474d" flatShading/></mesh>)}
  {[0,1,2,3].map(i=><mesh key={i} position={[Math.sin(i*2)*.15,.17,Math.cos(i*2)*.13]} rotation={[Math.PI/2,0,i*.85]} castShadow><cylinderGeometry args={[.08,.11,.74,7]}/><meshStandardMaterial color="#573628" flatShading/></mesh>)}
  {Array.from({length:6},(_,i)=>{const s=.8+Math.sin(t*6+i*2)*.13;return <mesh key={i} position={[Math.sin(i*4)*.17,.48+Math.sin(t*7+i)*.035,Math.cos(i*4)*.12]} rotation={[.06*Math.sin(t*5+i),i,.08*Math.cos(t*6+i)]} scale={[s,(i%2?.63:.84)*s,s]}><coneGeometry args={[i%2?.15:.22,.96,5]}/><meshBasicMaterial color={i%2?'#ffe49a':'#ff9a36'} transparent opacity={.9}/></mesh>;})}
  {Array.from({length:38},(_,i)=>{const p=((t*.30+i*.137)%1);return <mesh key={i} position={[Math.sin(i*8+p*4)*(.15+p*.25),.58+p*2.2,Math.cos(i*4+p*3)*(.13+p*.18)]} scale={1-p*.65}><sphereGeometry args={[.014+(i%3)*.004,5,4]}/><meshBasicMaterial color={i%3?'#ffc264':'#fff0b5'} transparent opacity={Math.sin(p*Math.PI)*.85} depthWrite={false}/></mesh>;})}
  <pointLight position={[0,.78,0]} color="#ffb260" intensity={5.5+Math.sin(t*9)*.45} distance={7} decay={1.5} castShadow shadow-mapSize={[1024,1024]}/>
 </group>;
}
export function CampfireSet({frame}:{frame:number}){
 return <>
  <color attach="background" args={['#061b2c']}/><fog attach="fog" args={['#0a2638',10,34]}/>
  <hemisphereLight args={['#b7d6e9','#634227',1.35]}/><ambientLight intensity={.45}/><directionalLight position={[1,4,6]} color="#ffe2ba" intensity={1.45}/>
  <directionalLight position={[-4,7,-2]} color="#a1c6e4" intensity={1.25} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7}/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[28,64]}/><meshStandardMaterial color="#303a37" roughness={1}/></mesh>
  <mesh position={[0,-.018,.5]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[3.2,20]}/><meshStandardMaterial color="#78644d" roughness={1} flatShading/></mesh>
  <group position={[-1.3,.40,-.04]} rotation={[0,0,Math.PI/2]}><mesh castShadow receiveShadow><cylinderGeometry args={[.35,.39,1.65,9]}/><meshStandardMaterial color="#604634" flatShading/></mesh><mesh position={[0,.831,0]}><cylinderGeometry args={[.28,.28,.02,9]}/><meshStandardMaterial color="#96714d"/></mesh></group>
  <mesh position={[1.17,.27,0]} scale={[.67,.33,.52]} castShadow receiveShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#68705b" flatShading/></mesh>
  <CampfireEnvironment/>
  <Fire frame={frame}/>
  {Array.from({length:27},(_,i)=>{const a=i*2.399,x=Math.cos(a)*(5+i*.33),z=-4-Math.abs(Math.sin(a))*(3+i*.4);return <Tree key={i} x={x} z={z} s={.9+(i%5)*.23}/>;})}
  {Array.from({length:14},(_,i)=><mesh key={i} position={[Math.sin(i*8)*3.8,.10,Math.cos(i*4)*3]} scale={[.18+i%3*.06,.12,.18]} rotation={[i,i*2,0]} castShadow><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color="#444f52" flatShading/></mesh>)}
  {Array.from({length:11},(_,i)=><Tree key={'front'+i} x={-14+i*2.8} z={16+(i%3)*3} s={1.4+(i%3)*.2}/>)}
  {[[-7,9],[-4,13],[1,15],[6,12],[9,6],[-8,4]].map(([x,z],i)=><Tree key={'reverse-detail'+i} x={x} z={z} s={1.15+(i%3)*.2}/>)}
  <mesh position={[-4,9,-21]}><sphereGeometry args={[.48,16,12]}/><meshBasicMaterial color="#f4e5ba" fog={false}/></mesh>
 </>;
}
