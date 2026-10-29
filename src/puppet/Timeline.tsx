import {useRef,useState,type PointerEvent} from 'react';
import type {Beat} from './types';
export function retimeClip(beats:Beat[],id:number,start:number,end:number,duration:number,ripple:boolean){
 const sorted=[...beats].sort((a,b)=>a.start-b.start),index=sorted.findIndex(b=>b.id===id),old=sorted[index];if(!old)return {beats,duration};
 const previous=sorted[index-1],next=sorted[index+1],length=end-start;
 start=Math.max(previous?.end??0,Math.round(start*30)/30);end=Math.max(start+.1,Math.round(end*30)/30);
 if(!ripple){end=Math.min(end,next?.start??duration);start=Math.min(start,end-.1);}else if(end-start<length-.04){end=start+length;}
 const delta=end-old.end;
 const updated=beats.map(b=>{
  if(b.id===id){const moved=Math.abs((start-old.start)-(end-old.end))<.04;return {...b,start,end,captionChunks:moved?b.captionChunks?.map(c=>({...c,start:c.start===undefined?undefined:c.start+start-old.start,end:c.end===undefined?undefined:c.end+start-old.start})):undefined,words:moved?b.words?.map(w=>({...w,start:w.start+start-old.start,end:w.end+start-old.start})):undefined};}
  if(ripple&&b.start>=old.end){return {...b,start:b.start+delta,end:b.end+delta,captionChunks:b.captionChunks?.map(c=>({...c,start:c.start===undefined?undefined:c.start+delta,end:c.end===undefined?undefined:c.end+delta})),words:b.words?.map(w=>({...w,start:w.start+delta,end:w.end+delta}))};}
  return b;
 });
 return {beats:updated,duration:Math.max(3,ripple?duration+delta:duration,...updated.map(b=>b.end))};
}
type Props={beats:Beat[];duration:number;frame:number;selected:number;active?:number;onScrub:(frame:number)=>void;onSelect:(id:number)=>void;onEdit:(beats:Beat[],duration:number)=>void};
export function Timeline({beats,duration,frame,selected,active,onScrub,onSelect,onEdit}:Props){
 const track=useRef<HTMLDivElement>(null),drag=useRef<{x:number;mode:string;beat:Beat;beats:Beat[];duration:number;width:number}|null>(null);
 const [ripple,setRipple]=useState(true),[zoom,setZoom]=useState(1);
 function begin(e:PointerEvent<HTMLElement>,beat:Beat,mode:string){e.preventDefault();e.stopPropagation();onSelect(beat.id);onScrub(Math.round(beat.start*30));e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,mode,beat,beats,duration,width:track.current!.getBoundingClientRect().width};}
 function move(e:PointerEvent<HTMLElement>){const d=drag.current;if(!d)return;const delta=(e.clientX-d.x)/d.width*d.duration;let start=d.beat.start,end=d.beat.end;
  if(d.mode==='move'){start+=delta;end+=delta;}else if(d.mode==='start')start=Math.min(end-.1,start+delta);else end=Math.max(start+.1,end+delta);
  const result=retimeClip(d.beats,d.beat.id,start,end,d.duration,ripple);onEdit(result.beats,result.duration);
 }
 function end(){drag.current=null;}
 return <section className="timeline editor-timeline"><div className="timeline-top"><div><span className="eyebrow">TIMELINE</span><strong>{beats.length} clips</strong></div><input aria-label="Timeline playhead" type="range" min={0} max={Math.max(1,Math.round(duration*30)-1)} value={Math.min(frame,Math.round(duration*30)-1)} onPointerDown={()=>onScrub(frame)} onChange={e=>onScrub(+e.target.value)}/><span>{(frame/30).toFixed(2)}s</span></div>
  <div className="timeline-options"><label className="check"><input type="checkbox" checked={ripple} onChange={e=>setRipple(e.target.checked)}/> Ripple later clips</label><label>Timeline zoom <input aria-label="Timeline zoom" type="range" min={1} max={4} step={.5} value={zoom} onChange={e=>setZoom(+e.target.value)}/></label><span>Drag a clip to move it. Drag its edges to trim. Voice audio stays fixed.</span></div>
  <div className="timeline-scroll"><div className="tracks" style={{width:`${zoom*100}%`,marginLeft:0}}><div className="ruler" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();onScrub(Math.round((e.clientX-r.left)/r.width*duration*30));}}>{Array.from({length:Math.ceil(duration/5)},(_,i)=><span key={i} style={{left:`${i*5/duration*100}%`}}>{i*5}s</span>)}</div>
  <div className="track-row" ref={track} onPointerDown={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();onScrub(Math.round((e.clientX-r.left)/r.width*duration*30));}}}>{beats.map((b,i)=><div key={b.id} className={`clip ${b.speaker==='human'?'human':'ai'} ${selected===b.id?'clip-selected':''} ${active===b.id?'clip-playing':''}`} style={{left:`${b.start/duration*100}%`,width:`${(b.end-b.start)/duration*100}%`}} title={`${b.speaker==='human'?'Host':'Claude'}: ${b.text}`}>
   <button className="clip-edge left" aria-label={`Trim start of clip ${i+1}`} onPointerDown={e=>begin(e,b,'start')} onPointerMove={move} onPointerUp={end} onLostPointerCapture={end}/>
   <button className="clip-body" aria-label={`Select clip ${i+1}: ${b.text}`} aria-pressed={selected===b.id} onPointerDown={e=>begin(e,b,'move')} onPointerMove={move} onPointerUp={end} onLostPointerCapture={end} onClick={e=>{onSelect(b.id);if(e.detail===0)onScrub(Math.round(b.start*30));}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();onScrub(Math.round(b.start*30));const delta=(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?.5:1/30),r=retimeClip(beats,b.id,b.start+delta,b.end+delta,duration,ripple);onEdit(r.beats,r.duration);}}}>{b.speaker==='human'?'H':'✳'}</button>
   <button className="clip-edge right" aria-label={`Trim end of clip ${i+1}`} onPointerDown={e=>begin(e,b,'end')} onPointerMove={move} onPointerUp={end} onLostPointerCapture={end}/>
  </div>)}<div className="playhead" style={{left:`${frame/30/duration*100}%`}}/></div></div></div>
 </section>;
}
