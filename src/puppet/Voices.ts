import type {Beat, Project} from './types';

// IDs were retrieved from the connected ElevenLabs voice library.
export const VOICE_CAST = {
 human:{voiceId:'bIHbv24MWmeRgasZH58o',name:'Will',direction:'Casual, warm, expressive reactions'},
 creature:{voiceId:'CwhRBWXzGAHq8TQ4Fs17',name:'Roger',direction:'Calm, dry wit, understated confidence'},
};
export const DELIVERY = ['natural','curious','surprised','sarcastic','confident','tired','amused','softly','excited','sighs'] as const;
export function deliveryFor(beat:Beat):string {
 if(beat.delivery!==undefined)return beat.delivery;
 if(beat.emotion==='smug')return 'sarcastic';
 if(beat.emotion==='surprised')return 'surprised';
 if(beat.emotion==='angry')return 'frustrated';
 if(beat.emotion==='sad')return 'sad';
 if(beat.emotion==='happy')return 'happy';
 if(beat.emotion==='thinking')return 'curious';
 return beat.speaker==='human'?'curious':'confident';
}
export function voiceRecipe(project:Project){
 return {version:1,title:project.title,model:'eleven_v4',cast:project.voices??VOICE_CAST,
 lines:[...project.beats].sort((a,b)=>a.start-b.start).map(b=>({id:b.id,speaker:b.speaker,text:b.text,delivery:deliveryFor(b),prompt:(deliveryFor(b)==='natural'?'':`[${deliveryFor(b)}] `)+b.text}))};
}
export type VoicePackage={version:1;revision?:string;duration:number;audio:string;lines:{id:number;text:string;start:number;end:number;words?:{text:string;start:number;end:number}[]}[]};
export function applyVoiceTiming(project:Project,pack:VoicePackage):Project{
 if(pack.version!==1||!Number.isFinite(pack.duration)||pack.duration<=0||!Array.isArray(pack.lines)||pack.lines.length!==project.beats.length)throw Error('This voice track belongs to a different script.');
 const ids=new Set<number>();
 for(const l of pack.lines){const b=project.beats.find(b=>b.id===l.id);if(ids.has(l.id)||!b||b.text.trim()!==l.text.trim()||!Number.isFinite(l.start)||!Number.isFinite(l.end)||l.start<0||l.end<=l.start||l.end>pack.duration)throw Error('Your dialogue has changed. Export voice directions to generate matching voices.');ids.add(l.id);}
 return {...project,duration:pack.duration,voiceTrack:'elevenlabs-team-v1',voiceRevision:pack.revision,audioStatus:undefined,dialogueAssetId:undefined,dialogueName:undefined,beats:project.beats.map(b=>{const l=pack.lines.find(l=>l.id===b.id)!;return {...b,start:l.start,end:l.end,words:l.words};})};
}
