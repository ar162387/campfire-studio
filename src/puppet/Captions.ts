import type {Beat} from './types';
export type CaptionWord={text:string;start:number;end:number};
export function captionWords(beat:Beat):CaptionWord[]{
 const tokens=beat.text.trim().split(/\s+/).filter(Boolean);
 if(beat.words?.length===tokens.length&&beat.words.every((w,i)=>w.text.trim()===tokens[i]))return beat.words;
 // Edited lines have no alignment yet. Use estimated timing until new voices
 // are loaded, rather than accidentally reusing old word timestamps.
 const weights=tokens.map(w=>Math.max(2,w.replace(/[^\p{L}\p{N}]/gu,'').length));
 const total=weights.reduce((a,b)=>a+b,0);let cursor=beat.start;
 return tokens.map((text,i)=>{const start=cursor;cursor+=(beat.end-beat.start)*weights[i]/total;return {text,start,end:cursor};});
}
export function paintCaptions(ctx:CanvasRenderingContext2D,beat:Beat,time:number){
 ctx.save();ctx.font='700 51px Arial';ctx.textAlign='left';ctx.textBaseline='top';ctx.shadowColor='#0009';ctx.shadowBlur=9;
 const words=captionWords(beat),space=ctx.measureText(' ').width;let x=86,y=222;
 for(const word of words){const width=ctx.measureText(word.text).width;if(x+width>994){x=86;y+=63;}ctx.fillStyle=time>=word.start?'#ffffff':'#6d7e99';ctx.fillText(word.text,x,y);x+=width+space;}
 ctx.restore();
}
