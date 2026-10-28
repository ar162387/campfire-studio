import type {Mix} from './SoundMixer';
export type SoundLayer={id:string;name:string;kind:'ambience'|'music'|'action';volume:number;enabled:boolean;url?:string;assetId?:string;action?:string};
export function defaultLayers(mix:Mix):SoundLayer[]{return [
 {id:'fire',name:'Campfire',kind:'ambience',volume:mix.fire,enabled:true,url:'./campfire-fire.mp3'},
 {id:'night',name:'Night ambience',kind:'ambience',volume:mix.night,enabled:true,url:'./campfire-night.mp3'},
 {id:'music',name:'Light music',kind:'music',volume:mix.music,enabled:true,url:'./campfire-music.mp3'},
 {id:'typing',name:'Light keyboard taps',kind:'action',action:'type',volume:.14,enabled:true,url:'builtin:typing'},
 ];}
