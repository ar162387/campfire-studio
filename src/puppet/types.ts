import type {BodyState,Blocking,PropKind,PropAction,ScreenCue,ScreenEvent} from './Direction';
import type {CaptionStyle,CaptionChunk} from './Captions';
import type {Action,Emotion,Look,Performance} from './Characters';
import type {CameraName} from './World';
export type Beat={id:number;start:number;end:number;speaker:'human'|'creature';text:string;emotion:Emotion;action:Action;camera:CameraName;look?:number;bodyTurn?:number;expression?:string;words?:{text:string;start:number;end:number}[];delivery?:string;voiceDirection?:import('./SpeechDirection').VoiceDirection;state?:BodyState;listenerState?:BodyState;blocking?:Blocking;prop?:PropKind;propAction?:PropAction;propText?:string;screen?:ScreenCue;cameraMotion?:number;captionChunks?:CaptionChunk[];role?:'hook'|'twist'|'escalation'|'sincere'|'payoff'|'button'|'silence'};
export type Project={version:1;title:string;endCard?:{text:string;duration:number};captionStyle?:CaptionStyle;screenEvents?:ScreenEvent[];endingHold?:number;series?:{name:string;episode:number;motif?:string;anchor?:string;sincereBeatId?:number;coverLine?:string;coverAccent?:string;coverQuote?:string;coverNote?:string;coverBeatId?:number;postCaption?:string;funnel?:'none'|'question'|'keyword';continuityPlant?:string;continuityPayoff?:string};duration:number;look:Look;beats:Beat[];dialogueAssetId?:string;dialogueName?:string;audioStatus?:'pending';templateId?:string;cameraPresets?:import('./CameraRig').CameraPose[];expressions?:import('./Performance').Expression[];layers?:import('./SoundLayers').SoundLayer[];mix?:import('./SoundMixer').Mix;voiceRevision?:string;voiceTrack?:'elevenlabs-team-v1';voices?:Record<'human'|'creature',{voiceId:string;name:string;direction:string}>};
export function direct(frame:number,beats:Beat[],amplitude:number,expressions:import('./Performance').Expression[]=[]){
 const time=frame/30,beat=beats.find(b=>time>=b.start&&time<b.end);
 // Silence ends the dialogue, not the shot. Resolve from time so scrubbing
 // backwards and recording from the beginning produce the same camera cuts.
 const previous=beats.reduce<Beat|undefined>((last,b)=>b.start<=time&&(!last||b.start>last.start)?b:last,undefined);
 const first=beats.reduce<Beat|undefined>((earliest,b)=>!earliest||b.start<earliest.start?b:earliest,undefined);
 const cameraBeat=beat??previous??first;
 const rest:Performance={emotion:'neutral',action:'listen',talk:0,look:1};
 const host={...rest},claude={...rest,look:-1};
 for(const [speaker,pose] of [['human',host],['creature',claude]] as const){const past=beats.filter(b=>b.speaker===speaker&&b.start<=time).sort((a,b)=>a.start-b.start);const placement=[...past].reverse().find(b=>b.blocking);pose.blocking=placement?.blocking;pose.blockingPhase=placement?Math.max(0,Math.min(1,(time-placement.start)/(placement.end-placement.start))):1;const prop=[...past].reverse().find(b=>b.prop);pose.prop=prop?.prop;pose.propText=prop?.propText;}
 if(beat){const p=beat.speaker==='human'?host:claude;p.emotion=beat.emotion;p.action=beat.action;p.talk=amplitude;p.look=beat.look??(beat.action==='type'?-1:beat.speaker==='human'?1:-1);p.bodyTurn=beat.bodyTurn??0;p.expression=expressions.find(e=>e.id===beat.expression);p.state=beat.state;p.blocking=beat.blocking??p.blocking;p.prop=beat.prop??p.prop;p.propAction=beat.propAction;p.propText=beat.propText??p.propText;p.phase=Math.max(0,Math.min(1,(time-beat.start)/(beat.end-beat.start)));if(beat.listenerState)(beat.speaker==='human'?claude:host).state=beat.listenerState;}
 return {host,claude,beat,cameraBeat,camera:cameraBeat?.camera??'Wide'};
}
