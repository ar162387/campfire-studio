"""Interleave whole speaker turns from generated takes and measured word timings.
Input: {"human":{"audio":"human.mp3","words":[{"text":"Hello","start":0,"end":.4}]},"creature":...}
Optional pronunciations map preserves one caption token over multiple spoken tokens.
"""
import argparse,array,base64,json,math,re,subprocess,sys,wave
from pathlib import Path
RATE=44100
def norm(text):return re.sub(r'[^\w]','',text.casefold()).replace('’','')
def run(project,manifest,out,aliases,gap):
 if gap<0:raise ValueError('Gap must be non-negative')
 beats=sorted(project['beats'],key=lambda b:b['start']);tracks={};by_id={};seen=set()
 for b in beats:
  if b['id'] in seen:raise ValueError('Duplicate beat id')
  seen.add(b['id'])
 for speaker in {b['speaker'] for b in beats}:
  info=manifest[speaker];audio=Path(info['audio']);pcm=array.array('h');pcm.frombytes(subprocess.check_output(['ffmpeg','-v','error','-i',str(audio),'-f','s16le','-ac','1','-ar',str(RATE),'-']))
  if sys.byteorder!='little':pcm.byteswap()
  words=info['words'];cursor=0;lines=[]
  for w in words:
   if not 0<=w['start']<=w['end']<=len(pcm)/RATE+.05:raise ValueError('Invalid source word timing')
  for b in [b for b in beats if b['speaker']==speaker]:
   aligned=[]
   for token in b['text'].split():
    spoken=aliases.get(token,token).split();part=words[cursor:cursor+len(spoken)]
    if len(part)!=len(spoken) or any(norm(t)!=norm(w.get('text',w.get('word',''))) for t,w in zip(spoken,part)):raise ValueError(f"Word mismatch for beat {b['id']}: {token!r}; inspect timing/transcript, do not silently guess")
    aligned.append(dict(text=token,start=part[0]['start'],end=part[-1]['end']));cursor+=len(spoken)
   lines.append({**b,'words':aligned});by_id[b['id']]=lines[-1]
  if cursor!=len(words):raise ValueError(f'Unused words in {speaker} take: {len(words)-cursor}')
  for i,b in enumerate(lines):
   b['_left']=(lines[i-1]['words'][-1]['end']+b['words'][0]['start'])/2 if i else 0
   b['_right']=(b['words'][-1]['end']+lines[i+1]['words'][0]['start'])/2 if i+1<len(lines) else len(pcm)/RATE
  tracks[speaker]=pcm
 groups=[]
 for b in beats:
  if not groups or groups[-1]['speaker']!=b['speaker']:groups.append({'speaker':b['speaker'],'lines':[]})
  groups[-1]['lines'].append(by_id[b['id']])
 output=array.array('h',[0]*round(.1*RATE));timed=[];edit=[];previous={}
 for group in groups:
  first,last=group['lines'][0],group['lines'][-1];start=max(first['_left'],first['words'][0]['start']-.08);end=min(last['_right'],last['words'][-1]['end']+.12);speaker=group['speaker']
  lo,hi=round(start*RATE),round(end*RATE)
  if lo<previous.get(speaker,0):raise ValueError('Source intervals overlap')
  previous[speaker]=hi;segment=tracks[speaker][lo:hi];fade=min(176,len(segment)//2)
  for i in range(fade):segment[i]=round(segment[i]*i/fade);segment[-1-i]=round(segment[-1-i]*i/fade)
  at=len(output)/RATE;output.extend(segment)
  for i,b in enumerate(group['lines']):
   words=[dict(text=w['text'],start=round(at+w['start']-lo/RATE,5),end=round(at+w['end']-lo/RATE,5)) for w in b['words']]
   begin=at if i==0 else words[0]['start'];finish=min(len(output)/RATE,words[-1]['end']+.08)
   if i+1<len(group['lines']):finish=min(finish,at+group['lines'][i+1]['words'][0]['start']-lo/RATE)
   if b.get('captionChunks'):b['captionChunks']=[{'text':c['text']} for c in b['captionChunks']]
   timed.append({k:v for k,v in b.items() if not k.startswith('_')}|dict(start=round(begin,5),end=round(finish,5),words=words))
  edit.append(dict(speaker=speaker,lineIds=[b['id'] for b in group['lines']],sourceStart=lo/RATE,sourceEnd=hi/RATE,outputStart=at,outputEnd=len(output)/RATE));output.extend([0]*round(gap*RATE))
 duration=max(project.get('duration',0),math.ceil((len(output)/RATE+.2)*30)/30);output.extend([0]*max(0,round(duration*RATE)-len(output)))
 out.mkdir(parents=True,exist_ok=True)
 with wave.open(str(out/'dialogue.wav'),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE)
  if sys.byteorder!='little':output.byteswap()
  f.writeframes(output.tobytes())
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'dialogue.wav'),'-af','loudnorm=I=-16:TP=-2:LRA=7','-b:a','192k',str(out/'dialogue.mp3')],check=True)
 asset='dialogue-'+__import__('hashlib').sha256((out/'dialogue.mp3').read_bytes()).hexdigest()[:12];p={**project,'duration':duration,'beats':timed,'dialogueAssetId':asset,'dialogueName':project['title']+' · generated dialogue'}
 for k in ['audioStatus','voiceTrack','voiceRevision']:p.pop(k,None)
 p['media']={**p.get('media',{}),asset:{'type':'audio/mpeg','data':'data:audio/mpeg;base64,'+base64.b64encode((out/'dialogue.mp3').read_bytes()).decode()}}
 (out/'episode.json').write_text(json.dumps(p,indent=2));(out/'edit-list.json').write_text(json.dumps(edit,indent=2));print(f'{len(timed)} beats, {len(groups)} continuous turns, {duration:.2f}s. Import {out}/episode.json.')
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('episode',type=Path);parser.add_argument('manifest',type=Path);parser.add_argument('--out',type=Path,required=True);parser.add_argument('--pronunciations',type=Path);parser.add_argument('--gap',type=float,default=.25);args=parser.parse_args();manifest=json.loads(args.manifest.read_text())
 for info in manifest.values():
  info['audio']=str((args.manifest.parent/info['audio']).resolve())
 run(json.loads(args.episode.read_text()),manifest,args.out,json.loads(args.pronunciations.read_text()) if args.pronunciations else {},args.gap)
