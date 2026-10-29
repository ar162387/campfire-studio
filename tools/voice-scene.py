"""Ordered scene speech, explicit billing, saved takes, strict alignment and portable media.

prepare is offline. generate calls ElevenLabs exactly once (no charged POST retries).
An existing response can be assembled again without regenerating speech.
"""
import argparse,base64,json,os,re,subprocess,sys,urllib.request,urllib.error
from pathlib import Path

DEFAULT_CAST={'human':{'voiceId':'bIHbv24MWmeRgasZH58o','name':'Will'},'creature':{'voiceId':'CwhRBWXzGAHq8TQ4Fs17','name':'Roger'}}

def speak(text,aliases):
    for written,spoken in sorted(aliases.items(),key=lambda x:-len(x[0])):
        text=re.sub(r'(?<!\w)'+re.escape(written)+r'(?!\w)',lambda _:spoken,text,flags=re.I)
    return text

def prepare(episode,model,aliases=None):
    aliases=aliases or {}
    if not model or not re.fullmatch(r'[\w.-]+',model): raise ValueError('Choose an explicit available dialogue model ID.')
    beats=sorted(episode['beats'],key=lambda b:b['start'])
    cast=episode.get('voices') or DEFAULT_CAST
    if len({x['voiceId'] for x in cast.values()})>10: raise ValueError('Use at most ten voices in one scene.')
    inputs=[];mapping=[]
    for b in beats:
        if not b['text'].strip():continue
        if re.search(r'\[[^]]*\]',b['text']):raise ValueError('Captions must contain spoken words only; move bracket tags to delivery.')
        cue=b.get('delivery','natural')
        if any(x in cue for x in '[]\r\n'):raise ValueError('Delivery is a cue without brackets or newlines.')
        text=f"[{cue}] {speak(b['text'],aliases)}"
        inputs.append({'text':text,'voice_id':cast[b['speaker']]['voiceId']})
        mapping.append({'beatId':b['id'],'caption':b['text'],'spoken':speak(b['text'],aliases),'delivery':cue})
    if sum(len(x['text']) for x in inputs)>2000:raise ValueError('Scene exceeds the provider’s 2000-character input limit; split at a complete turn.')
    if not inputs:raise ValueError('Episode has no spoken dialogue.')
    return {'request':{'model_id':model,'inputs':inputs},'mapping':mapping,'pronunciations':aliases,'cast':cast,'billing':'Generation consumes your provider credits; no fixed price is assumed. Prepare/assemble use no credits.','timing':'Validated provider alignment; estimates are never labelled measured.'}

def alignment_tokens(alignment,duration):
    chars=alignment.get('characters',[]);starts=alignment.get('character_start_times_seconds',[]);ends=alignment.get('character_end_times_seconds',[])
    if not chars or len(chars)!=len(starts) or len(chars)!=len(ends):raise ValueError('Alignment arrays are missing or mismatched.')
    out=[];tag=False;previous_start=previous_end=-1
    for c,s,e in zip(chars,starts,ends):
        if not isinstance(s,(int,float)) or not isinstance(e,(int,float)) or not (0<=s<=e<=duration+.05) or s+.001<previous_start or e+.001<previous_end:raise ValueError('Non-monotonic or out-of-range provider alignment. Keep the take; align this audio again.')
        previous_start,previous_end=s,e
        for letter in c:
            if letter=='[':tag=True
            elif letter==']':tag=False
            elif not tag and letter.isalnum():out.append((letter.casefold(),s,e))
    return out

def retime(episode,manifest,response,duration):
    alignment=response.get('normalized_alignment') or response.get('alignment')
    if not alignment:raise ValueError('No provider alignment. Use forced alignment on the saved take.')
    aligned=alignment_tokens(alignment,duration)
    expected=[]
    by_id={b['id']:b for b in episode['beats']}
    for item in manifest['mapping']:
        # Pronunciation aliases may turn one display word into several spoken words.
        b=by_id[item['beatId']]
        whole=speak(b['text'],manifest['pronunciations'])
        token_spoken=[speak(token,manifest['pronunciations']) for token in b['text'].split()]
        if ''.join(c.casefold() for c in whole if c.isalnum())!=''.join(c.casefold() for token in token_spoken for c in token if c.isalnum()):raise ValueError('Multiword pronunciation aliases need an explicit word mapping; use a single display token alias.')
        for i,token in enumerate(token_spoken):
            expected.extend((c.casefold(),b['id'],i) for c in token if c.isalnum())
    if ''.join(x[0] for x in aligned)!=''.join(x[0] for x in expected):raise ValueError('Aligned transcript differs from the exact spoken scene. Do not guess caption timing; force-align the saved audio with its exact spoken text.')
    timings={}
    for (_,s,e),(_,bid,idx) in zip(aligned,expected):timings.setdefault((bid,idx),[]).extend([s,e])
    segments=response.get('voice_segments') or []
    seen=set();previous=-1
    for segment in segments:
        index=segment.get('dialogue_input_index');start=segment.get('start_time_seconds');end=segment.get('end_time_seconds')
        if not isinstance(index,int) or index<0 or index>=len(manifest['mapping']) or segment.get('voice_id')!=manifest['request']['inputs'][index]['voice_id'] or not isinstance(start,(int,float)) or not isinstance(end,(int,float)) or not (0<=start<=end<=duration+.05) or start<previous-.001:raise ValueError('Invalid or misassigned provider voice segments.')
        previous=start;seen.add(index)
    if segments and seen!=set(range(len(manifest['mapping']))):raise ValueError('Provider voice segments omit a dialogue input.')
    beats=[]
    for item in manifest['mapping']:
        b=dict(by_id[item['beatId']]);words=[]
        for i,word in enumerate(b['text'].split()):
            times=timings.get((b['id'],i))
            if not times:raise ValueError('A display token has no measurable speech alignment.')
            words.append({'text':word,'start':min(times),'end':max(times)})
        b.update(start=words[0]['start'],end=words[-1]['end'],words=words)
        # Old cards carry obsolete timestamps after voice replacement.
        if b.get('captionChunks'):
            b['captionChunks']=[{'text':x['text']} for x in b['captionChunks']]
        beats.append(b)
    if any(a['end']>b['start']+.001 for a,b in zip(beats,beats[1:])):raise ValueError('Aligned speaker turns overlap; resolve before export.')
    # Do not erase intentionally scripted silence. A natural scene must actually leave that space.
    for b in episode['beats']:
        if b['text'].strip():continue
        previous=[x for x in beats if by_id[x['id']]['start']<b['start']];following=[x for x in beats if by_id[x['id']]['start']>b['start']]
        begin=max((x['end'] for x in previous),default=0);end=min((x['start'] for x in following),default=duration)
        if end-begin+1e-3<b['end']-b['start']:raise ValueError('Generated scene does not leave the scripted silence. Use the whole-turn assembler to place this pause deliberately.')
        beats.append({**b,'start':begin,'end':begin+b['end']-b['start']})
    beats.sort(key=lambda b:b['start'])
    out=dict(episode);out.update(beats=beats,duration=duration+episode.get('endingHold',1.2),audioStatus=None)
    # Events attached to lines already follow their new starts. Independent absolute events require explicit retiming.
    if episode.get('screenEvents'):raise ValueError('Retiming independent screenEvents needs manual review. Attach them to beats before replacing speech.')
    return out

def request_json(endpoint,payload,key):
    req=urllib.request.Request('https://api.elevenlabs.io'+endpoint,data=json.dumps(payload).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=240) as response:return json.load(response),response.headers.get('request-id')

def force_align(audio,transcript,key):
    boundary='campfire-'+os.urandom(12).hex()
    body=(f'--{boundary}\r\nContent-Disposition: form-data; name="text"\r\n\r\n{transcript}\r\n--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="take.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode()+audio.read_bytes()+f'\r\n--{boundary}--\r\n'.encode()
    req=urllib.request.Request('https://api.elevenlabs.io/v1/forced-alignment',data=body,headers={'xi-api-key':key,'Content-Type':'multipart/form-data; boundary='+boundary})
    with urllib.request.urlopen(req,timeout=240) as response:result=json.load(response)
    chars=result.get('characters',[])
    if not chars:raise ValueError('Forced alignment returned no character timing.')
    return {'alignment':{'characters':[x['text'] for x in chars],'character_start_times_seconds':[x['start'] for x in chars],'character_end_times_seconds':[x['end'] for x in chars]},'forced_alignment':result}

def discover(key):
    result={}
    for name,path in [('models','/v1/models'),('voices','/v2/voices?page_size=100')]:
        with urllib.request.urlopen(urllib.request.Request('https://api.elevenlabs.io'+path,headers={'xi-api-key':key}),timeout=30) as response:result[name]=json.load(response)
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['prepare','generate','assemble','align','discover']);p.add_argument('episode',type=Path);p.add_argument('--out',type=Path,required=True);p.add_argument('--model',required=True);p.add_argument('--pronunciations',type=Path);p.add_argument('--response',type=Path);p.add_argument('--audio',type=Path);p.add_argument('--spend-credits',action='store_true');a=p.parse_args()
    key=os.environ.get('ELEVENLABS_API_KEY')
    if a.command=='discover':
        if not key:raise ValueError('ELEVENLABS_API_KEY is unavailable.')
        a.out.mkdir(parents=True,exist_ok=True);(a.out/'available-cast-models.json').write_text(json.dumps(discover(key),indent=2));print('Saved available model and voice IDs. No generation.');return
    episode=json.loads(a.episode.read_text());aliases=json.loads(a.pronunciations.read_text()) if a.pronunciations else {}
    manifest=prepare(episode,a.model,aliases);a.out.mkdir(parents=True,exist_ok=True)
    (a.out/'voice-request.json').write_text(json.dumps(manifest,indent=2))
    if a.command=='prepare':print('Prepared ordered scene request. No credits spent.');return
    if a.command=='align':
        if not a.audio or not a.spend_credits:raise ValueError('Alignment uses the provider: supply an existing --audio and authorized --spend-credits.')
        if not key:raise ValueError('ELEVENLABS_API_KEY is unavailable.')
        if (a.out/'forced-response.json').exists():raise ValueError('A saved forced alignment exists. Assemble it using --response and --audio.')
        result=force_align(a.audio,' '.join(x['spoken'] for x in manifest['mapping']),key);(a.out/'forced-response.json').write_text(json.dumps(result))
    elif a.command=='generate':
        if not a.spend_credits:raise ValueError('Generation is chargeable. Use --spend-credits only with user authorization.')
        if not key:raise ValueError('ELEVENLABS_API_KEY is unavailable. The chat plugin does not share its private credentials with this script.')
        if (a.out/'response.json').exists():raise ValueError('A saved take already exists. Assemble it, or choose a new output directory for an authorized pickup.')
        available=discover(key)
        if not any(m.get('model_id')==a.model for m in available['models']):raise ValueError('Requested model is not available to this account; choose explicitly after discovery.')
        available_voices={v['voice_id'] for v in available['voices'].get('voices',[])}
        for item in manifest['request']['inputs']:
            if item['voice_id'] not in available_voices:
                with urllib.request.urlopen(urllib.request.Request('https://api.elevenlabs.io/v1/voices/'+item['voice_id'],headers={'xi-api-key':key}),timeout=30) as response:json.load(response)
        result,request_id=request_json('/v1/text-to-dialogue/with-timestamps',manifest['request'],key)
        # Save the billed take BEFORE any timing validation; never regenerate it to repair timestamps.
        (a.out/'response.json').write_text(json.dumps(result));(a.out/'provenance.json').write_text(json.dumps({'model':a.model,'requestId':request_id,'endpoint':'text-to-dialogue/with-timestamps','timingStatus':'not-yet-validated'},indent=2))
    else:
        if not a.response:raise ValueError('assemble requires --response; it never calls the provider.')
        result=json.loads(a.response.read_text())
    audio=a.audio or a.out/'dialogue.mp3'
    if not a.audio:
        audio.write_bytes(base64.b64decode(result['audio_base64'],validate=True))
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(audio)],text=True))
    out=retime(episode,manifest,result,duration);asset='scene-dialogue';mime='audio/wav' if audio.suffix.lower()=='.wav' else 'audio/mpeg';data='data:'+mime+';base64,'+base64.b64encode(audio.read_bytes()).decode()
    out.update(dialogueAssetId=asset,dialogueName='Scene dialogue · '+a.model,voiceTrack=None,media={**episode.get('media',{}),asset:{'type':mime,'data':data}})
    (a.out/'voiced.episode.json').write_text(json.dumps(out,indent=2));(a.out/'timing-report.json').write_text(json.dumps({'status':'validated','source':'provider-character-alignment','beats':len(out['beats']),'audioDuration':duration},indent=2))
    print('Saved portable voiced episode with validated timing. Existing performance direction preserved.')

if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,urllib.error.URLError) as e:print('Voice workflow: '+str(e),file=sys.stderr);sys.exit(2)
