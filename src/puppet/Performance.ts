import type {Beat,Project} from './types';
import type {Emotion} from './Characters';
export type Expression={id:string;name:string;base:Emotion;browTilt:number;eyeScale:number;smile:number;mouthWidth:number};
export function patchPerformance(project:Project,ids:number[],patch:Partial<Pick<Beat,'emotion'|'action'|'look'|'bodyTurn'|'expression'|'delivery'>>):Project{
 const selected=new Set(ids);return {...project,beats:project.beats.map(b=>selected.has(b.id)?{...b,...patch}:b)};
}
