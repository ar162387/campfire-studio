import type {Project} from './types';
export type StoryFinding={level:'warning'|'error';code:string;message:string};
export function reviewStory(p:Project):StoryFinding[]{const out:StoryFinding[]=[];const warn=(code:string,message:string)=>out.push({level:'warning',code,message});const beats=[...p.beats].sort((a,b)=>a.start-b.start).filter(b=>b.text.trim());const first=beats[0],last=beats.at(-1);if(!first)return [{level:'error',code:'empty',message:'Add spoken dialogue.'}];
 if(first.start>0)warn('cold-open','Start speech and captions on the first frame.');
 if(!/^Claude\b/i.test(first.text))warn('hook-name','Series convention: address Claude in the opening.');
 if(!['Host','Claude'].includes(first.camera))warn('hook-face','Try a close face for the opening.');
 if(p.duration<45||p.duration>65)warn('length','The research brief targets roughly 50–60 seconds.');
 if(beats.length<20||beats.length>29)warn('line-count','The reference format uses 20–29 short lines.');
 if(!beats.some(b=>b.role==='twist'&&b.start<=10))warn('first-twist','Mark a first twist within ten seconds.');
 const sincere=beats.filter(b=>b.role==='sincere');if(sincere.length!==1)warn('sincere','Choose one sincere beat.');else if(sincere[0].start/p.duration<.6||sincere[0].start/p.duration>.75)warn('sincere-position','Try the sincere beat around 60–75% of the story.');
 if(!beats.some(b=>b.role==='payoff'&&b.start>=p.duration-12))warn('callback','Pay off an earlier planted detail near the ending.');
 if(last&&last.text.trim().split(/\s+/).length>4)warn('button','Try a final line of two to four words.');
 if(last&&!['Host','Claude'].includes(last.camera))warn('button-face','Consider finishing on the punchline face.');
 if(!p.endingHold||p.duration-(last?.end??0)<1)warn('ending-hold','Leave at least one second for the final pose.');
 if(beats.some(b=>b.text.trim().split(/\s+/).length>10))warn('long-line','Split long sentences into short spoken clauses.');
 if(beats.some(b=>/\[[^\]]+\]/.test(b.text)))out.push({level:'error',code:'direction-in-caption',message:'Move bracketed voice cues from dialogue to delivery.'});
 if((p.series?.funnel??'none')==='none'&&beats.some(b=>/link in (?:my |the )?bio|comment .{0,20} below|follow for more|buy now/i.test(b.text)))warn('story-cta','Keep this story’s sales ask in the post caption, or choose a keyword/tutorial funnel.');
 return out;
}
