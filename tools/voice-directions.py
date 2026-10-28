"""Export complete speaker takes and a casting manifest; captions stay untagged."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('episode',type=Path);p.add_argument('--out',type=Path,required=True);p.add_argument('--pronunciations',type=Path);a=p.parse_args()
e=json.loads(a.episode.read_text());aliases=json.loads(a.pronunciations.read_text()) if a.pronunciations else {};a.out.mkdir(parents=True,exist_ok=True)
for speaker in ['human','creature']:
 lines=[]
 for b in sorted(e['beats'],key=lambda b:b['start']):
  if b['speaker']!=speaker:continue
  text=b['text']
  for written,spoken in aliases.items():text=text.replace(written,spoken)
  lines.append(f"[{b.get('delivery','natural')}] {text}")
 (a.out/f'{speaker}.txt').write_text('\n\n'.join(lines))
(a.out/'manifest.json').write_text(json.dumps({'title':e['title'],'cast':e.get('voices',{}),'model_hint':'Use an available model that supports bracketed delivery tags. Discover live voices; never assume these IDs exist for the current account.','pronunciations':aliases},indent=2))
print(f'Voice directions saved in {a.out}. No provider called and no credits spent.')
