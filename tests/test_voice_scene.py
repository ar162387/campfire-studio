import importlib.util,unittest,tempfile,wave,copy
from pathlib import Path
spec=importlib.util.spec_from_file_location('voice_scene',Path('tools/voice-scene.py'));v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
class VoiceSceneTests(unittest.TestCase):
 def episode(self):return {'beats':[{'id':1,'start':0,'end':1,'speaker':'human','text':'Vibecoderzz helps.','emotion':'happy','action':'wave','camera':'Host','delivery':'curious','screen':{'mode':'chat'}},{'id':2,'start':1,'end':2,'speaker':'creature','text':'Good.','emotion':'smug','action':'nod','camera':'Claude'}],'endingHold':1.2,'duration':3}
 def test_order_pronunciation_and_tags(self):
  m=v.prepare(self.episode(),'eleven_v4',{'vibecoderzz':'vibe coderz'});self.assertEqual(m['request']['inputs'][0]['text'],'[curious] vibe coderz helps.');self.assertEqual(m['mapping'][0]['caption'],'Vibecoderzz helps.');self.assertEqual(m['request']['inputs'][1]['voice_id'],v.DEFAULT_CAST['creature']['voiceId'])
 def test_alignment_maps_pronunciation_to_display(self):
  e=self.episode();m=v.prepare(e,'eleven_v4',{'vibecoderzz':'vibe coderz'});text='vibe coderz helps. Good.';a={'characters':list(text),'character_start_times_seconds':[i*.08 for i in range(len(text))],'character_end_times_seconds':[(i+1)*.08 for i in range(len(text))]};out=v.retime(e,m,{'alignment':a},3);self.assertEqual(out['beats'][0]['words'][0]['text'],'Vibecoderzz');self.assertEqual(out['beats'][0]['words'][0]['end'],.88);self.assertEqual(out['beats'][0]['action'],'wave');self.assertEqual(out['beats'][0]['screen'],e['beats'][0]['screen']);self.assertEqual(out['duration'],4.2)
 def test_ignore_bounded_final_punctuation_padding(self):
  a={'characters':['a','.'],'character_start_times_seconds':[0,.8],'character_end_times_seconds':[.8,1.08]};self.assertEqual(v.alignment_tokens(a,1),[('a',0,.8)])
  a['characters'][-1]='x'
  with self.assertRaises(ValueError):v.alignment_tokens(a,1)
 def test_reject_duplicate_reset_times(self):
  with self.assertRaisesRegex(ValueError,'Non-monotonic'):v.alignment_tokens({'characters':['a','b'],'character_start_times_seconds':[61,0],'character_end_times_seconds':[61.2,.2]},90)
 def test_never_guess_wrong_transcript(self):
  with self.assertRaisesRegex(ValueError,'differs'):v.retime(self.episode(),v.prepare(self.episode(),'eleven_v4'),{'alignment':{'characters':['x'],'character_start_times_seconds':[0],'character_end_times_seconds':[.2]}},3)
 def test_input_limit_and_caption_tags(self):
  e=self.episode();e['beats'][0]['text']='word '*500
  with self.assertRaisesRegex(ValueError,'2000'):v.prepare(e,'eleven_v4')
  e['beats'][0]['text']='[happy] Hello'
  with self.assertRaisesRegex(ValueError,'Captions'):v.prepare(e,'eleven_v4')
 def test_contextual_voice_direction(self):
  b={'text':'Fine. Keep it.','voiceDirection':{'emotion':'resigned','delivery':'softly','vocalization':{'tag':'sighs','after':'Fine.'}}}
  self.assertEqual(v.voice_text(b,{}),'[resigned] [softly] Fine. [sighs] Keep it.')
  b['voiceDirection']['vocalization']['tag']='phone ringing'
  with self.assertRaises(ValueError):v.voice_text(b,{})
 def test_silence_is_local_and_shifts_measured_timing(self):
  e=self.episode();e['beats'][0]['text']='Hi';e['beats'][1]['text']='Bye';e['beats'][1].update(start=3,end=4)
  e['beats'].insert(1,{'id':3,'start':1,'end':2.5,'speaker':'human','text':''})
  text='Hi Bye';a={'characters':list(text),'character_start_times_seconds':[0,.1,.2,.3,.4,.5],'character_end_times_seconds':[.1,.2,.3,.4,.5,.6]};response={'alignment':a};original=copy.deepcopy(response)
  with tempfile.TemporaryDirectory() as td:
   folder=Path(td);audio=folder/'input.wav'
   with wave.open(str(audio),'wb') as f:f.setparams((2,2,48000,0,'NONE','not compressed'));f.writeframes(bytes(48000*4))
   shifted,duration,timed,edits=v.insert_silent_beats(e,v.prepare(e,'eleven_v4'),response,1,audio,folder)
   self.assertEqual(response,original);self.assertAlmostEqual(edits[0]['duration'],1.4);self.assertAlmostEqual(duration,2.4)
   final=v.retime(e,v.prepare(e,'eleven_v4'),shifted,duration)
   pause=next(b for b in final['beats'] if b['id']==3);self.assertAlmostEqual(pause['end']-pause['start'],1.5)
   with wave.open(str(timed),'rb') as f:self.assertEqual(f.getnframes(),115200)
if __name__=='__main__':unittest.main()
