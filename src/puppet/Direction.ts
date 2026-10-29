import type {Beat,Project} from './types';
export const BODY_STATES=['none','powered-down','blush','sweat','sick','hearts','dizzy','ghost'] as const;
export type BodyState=typeof BODY_STATES[number];
export const BLOCKING=['seated','standing','enter-left','enter-right','presenter','collapsed','crouch','profile','hands'] as const;
export type Blocking=typeof BLOCKING[number];
export const PROP_ACTIONS=['none','hold-up','hand-over','bite','scan'] as const;
export type PropAction=typeof PROP_ACTIONS[number];
export type PropKind='none'|'note'|'cup'|'phone'|'mushroom';
export type ScreenMode='chat'|'code'|'website'|'terminal'|'history'|'messages'|'calendar'|'verification'|'whiteboard';
export type ScreenCue={mode:ScreenMode;title?:string;lines?:string[];banner?:string;status?:'normal'|'error'|'success';counter?:number;counterLabel?:string;typeOn?:boolean;charsPerSecond?:number;cutAt?:number;cursor?:[number,number];cells?:string[];selectedCell?:number;timestamp?:string};
export type ScreenEvent={id:string;time:number;screen:ScreenCue};
export function screenAt(project:Project,time:number){
 const events=[...(project.screenEvents??[]),...project.beats.filter(b=>b.screen).map(b=>({id:'beat-'+b.id,time:b.start,screen:b.screen!}))].sort((a,b)=>a.time-b.time);
 const event=events.reduce<ScreenEvent|undefined>((last,e)=>e.time<=time?e:last,undefined);
 return {screen:event?.screen,elapsed:Math.max(0,time-(event?.time??0))};
}
export function heldPerformanceFrame(frame:number,project:Project){const last=project.beats.reduce<Beat|undefined>((a,b)=>!a||b.end>a.end?b:a,undefined);return last&&project.endingHold&&frame/30>=last.end?Math.max(Math.round(last.start*30),Math.round(last.end*30)-1):frame;}
export function beatPhase(frame:number,beat?:Beat){return beat?Math.max(0,Math.min(1,(frame/30-beat.start)/Math.max(.001,beat.end-beat.start))):0;}
