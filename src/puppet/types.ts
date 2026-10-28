import type {Action,Emotion,Look,Performance} from './Characters';
import type {CameraName} from './World';
export type Beat={id:number;start:number;end:number;speaker:'human'|'creature';text:string;emotion:Emotion;action:Action;camera:CameraName;look?:number;bodyTurn?:number;expression?:string;words?:{text:string;start:number;end:number}[];delivery?:string};
export type Project={version:1;title:string;duration:number;look:Look;beats:Beat[];dialogueAssetId?:string;dialogueName?:string;audioStatus?:'pending';templateId?:string;cameraPresets?:import('./CameraRig').CameraPose[];expressions?:import('./Performance').Expression[];layers?:import('./SoundLayers').SoundLayer[];mix?:import('./SoundMixer').Mix;voiceRevision?:string;voiceTrack?:'elevenlabs-team-v1';voices?:Record<'human'|'creature',{voiceId:string;name:string;direction:string}>};
export function direct(frame:number,beats:Beat[],amplitude:number,expressions:import('./Performance').Expression[]=[]){
 const time=frame/30,beat=beats.find(b=>time>=b.start&&time<b.end);
 // Silence ends the dialogue, not the shot. Resolve from time so scrubbing
 // backwards and recording from the beginning produce the same camera cuts.
 const previous=beats.reduce<Beat|undefined>((last,b)=>b.start<=time&&(!last||b.start>last.start)?b:last,undefined);
 const first=beats.reduce<Beat|undefined>((earliest,b)=>!earliest||b.start<earliest.start?b:earliest,undefined);
 const cameraBeat=beat??previous??first;
 const rest:Performance={emotion:'neutral',action:'listen',talk:0,look:1};
 const host={...rest},claude={...rest,look:-1};
 if(beat){const p=beat.speaker==='human'?host:claude;p.emotion=beat.emotion;p.action=beat.action;p.talk=amplitude;p.look=beat.look??(beat.action==='type'?-1:beat.speaker==='human'?1:-1);p.bodyTurn=beat.bodyTurn??0;p.expression=expressions.find(e=>e.id===beat.expression);}
 return {host,claude,beat,cameraBeat,camera:cameraBeat?.camera??'Wide'};
}
