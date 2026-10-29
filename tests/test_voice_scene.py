import importlib.util,unittest
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
if __name__=='__main__':unittest.main()
