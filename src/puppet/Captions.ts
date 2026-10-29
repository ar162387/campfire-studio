import type {Beat} from './types';
export type CaptionWord={text:string;start:number;end:number};
export type CaptionChunk={text:string;start?:number;end?:number};
export type CaptionStyle={mode:'chunks'|'karaoke';hostColor?:string;creatureColor?:string;maxWords?:number;y?:number;fontSize?:number;box?:boolean;fadeMs?:number};
export const DEFAULT_CAPTIONS:CaptionStyle={mode:'chunks',hostColor:'#ffffff',creatureColor:'#ffc575',maxWords:6,y:290,fontSize:53,box:false,fadeMs:80};
export function captionWords(beat:Beat):CaptionWord[]{
 const tokens=beat.text.trim().split(/\s+/).filter(Boolean);
 if(beat.words?.length===tokens.length&&beat.words.every((w,i)=>w.text.trim()===tokens[i]))return beat.words;
 const weights=tokens.map(w=>Math.max(2,w.replace(/[^\p{L}\p{N}]/gu,'').length));const total=weights.reduce((a,b)=>a+b,0);let cursor=beat.start;
 return tokens.map((text,i)=>{const start=cursor;cursor+=(beat.end-beat.start)*weights[i]/total;return {text,start,end:cursor};});
}
export function captionCards(beat:Beat,style:CaptionStyle=DEFAULT_CAPTIONS){
 const words=captionWords(beat),limit=Math.max(1,Math.min(8,style.maxWords??6)),cards:{text:string;start:number;end:number}[]=[];let index=0;
 if(beat.captionChunks?.length){if(beat.captionChunks.map(c=>c.text.trim()).join(' ').split(/\s+/).join(' ')!==beat.text.trim().split(/\s+/).join(' '))throw Error('Caption chunks must match the spoken line exactly.');for(const chunk of beat.captionChunks){const count=chunk.text.trim().split(/\s+/).length,part=words.slice(index,index+count);if(!part.length)break;const start=chunk.start??(index===0?beat.start:part[0].start),end=chunk.end??(index+count>=words.length?beat.end:words[index+count].start);if(!Number.isFinite(start)||!Number.isFinite(end)||start<beat.start||end>beat.end||end<=start||start<(cards.at(-1)?.end??beat.start))throw Error('Invalid or overlapping caption card timing.');cards.push({text:chunk.text,start,end});index+=count;}return cards;}
 while(index<words.length){let n=0;while(index+n<words.length&&n<limit){n++;if(/[.!?;:]$/.test(words[index+n-1].text)&&n>=2)break;if(n>=2&&/,\s*$/.test(words[index+n-1].text))break;}
 const part=words.slice(index,index+n);cards.push({text:part.map(w=>w.text).join(' '),start:index===0?beat.start:part[0].start,end:index+n>=words.length?beat.end:words[index+n].start});index+=n;}
 return cards;
}
export function captionDisplay(beat:Beat,time:number,style:CaptionStyle=DEFAULT_CAPTIONS){const settings={...DEFAULT_CAPTIONS,...style},card=captionCards(beat,settings).find(c=>time>=c.start&&time<c.end);return {text:settings.mode==='karaoke'?beat.text:card?.text??'',color:beat.speaker==='human'?settings.hostColor!:settings.creatureColor!,start:card?.start??beat.start};}
export function paintCaptions(ctx:CanvasRenderingContext2D,beat:Beat,time:number,fontFamily='Arial',style:CaptionStyle=DEFAULT_CAPTIONS){
 const settings={...DEFAULT_CAPTIONS,...style},display=captionDisplay(beat,time,settings);if(!display.text)return;
 ctx.save();ctx.font=`700 ${settings.fontSize}px ${fontFamily}`;ctx.textAlign='left';ctx.textBaseline='top';ctx.shadowColor='#000b';ctx.shadowBlur=9;
 const tokens=settings.mode==='karaoke'?captionWords(beat):display.text.split(/\s+/).map(text=>({text,start:beat.start,end:beat.end}));const space=ctx.measureText(' ').width;let x=86,y=settings.y!;
 ctx.globalAlpha=settings.mode==='chunks'?Math.min(1,(time-display.start)/Math.max(.001,(settings.fadeMs??80)/1000)):1;
 // A card is visible on its first frame, then gently settles to full opacity.
 ctx.globalAlpha=Math.max(.55,ctx.globalAlpha);
 if(settings.box){ctx.shadowBlur=0;ctx.fillStyle='#06131fd4';let lines=1,row=0;for(const word of tokens){const width=ctx.measureText(word.text).width;if(row+width>764){lines++;row=0;}row+=width+space;}ctx.fillRect(70,y-12,790,lines*(settings.fontSize??53)*1.22+24);ctx.shadowBlur=9;}
 for(const word of tokens){const width=ctx.measureText(word.text).width;if(x+width>850){x=86;y+=(settings.fontSize??53)*1.22;}ctx.fillStyle=settings.mode==='karaoke'&&time<word.start?'#6d7e99':display.color;ctx.fillText(word.text,x,y);x+=width+space;}ctx.restore();
}
