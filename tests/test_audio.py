import importlib.util,json,tempfile,unittest,wave
from pathlib import Path
spec=importlib.util.spec_from_file_location('assembler',Path('tools/assemble-episode.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AudioTest(unittest.TestCase):
 def test_continuous_turns_and_mismatch(self):
  with tempfile.TemporaryDirectory() as folder:
   d=Path(folder);audio=d/'take.wav'
   with wave.open(str(audio),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(44100);f.writeframes(b'\0\0'*44100*3)
   beats=[{'id':i,'start':i,'end':i+.8,'speaker':s,'text':t,'emotion':'neutral','action':'talk','camera':'Host'} for i,(s,t) in enumerate([('human','Hello'),('human','again.'),('creature','Yes.'),('human','Bye.')])]
   p={'version':1,'title':'Test','duration':4,'look':{},'audioStatus':'pending','beats':beats}
   manifest={'human':{'audio':str(audio),'words':[{'text':t,'start':s,'end':e} for t,s,e in [('Hello',.1,.4),('again.',.8,1.1),('Bye.',2.2,2.5)]]},'creature':{'audio':str(audio),'words':[{'text':'Yes.','start':.1,'end':.4}]}}
   m.run(p,manifest,d/'out',{},.2);edits=json.loads((d/'out/edit-list.json').read_text());result=json.loads((d/'out/episode.json').read_text())
   self.assertEqual(len(edits),3);self.assertEqual(edits[0]['lineIds'],[0,1]);self.assertLessEqual(edits[0]['sourceEnd'],edits[2]['sourceStart']);self.assertEqual(len(result['beats']),4);self.assertNotIn('audioStatus',result);self.assertIn(result['dialogueAssetId'],result['media'])
   manifest['human']['words'][1]['text']='wrong'
   with self.assertRaisesRegex(ValueError,'Word mismatch'):m.run(p,manifest,d/'bad',{},.2)
if __name__=='__main__':unittest.main()
