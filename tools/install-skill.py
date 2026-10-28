"""Install only the portable agent skill; the studio can be bootstrapped afterwards."""
import argparse,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--agent',choices=['codex','claude','generic'],default='codex');p.add_argument('--destination',type=Path);p.add_argument('--force',action='store_true');a=p.parse_args()
source=Path(__file__).resolve().parent.parent/'skills/campfire-studio'
base={'codex':'.codex/skills','claude':'.claude/skills','generic':'.agents/skills'}[a.agent]
target=(a.destination.expanduser() if a.destination else Path.home()/base)/'campfire-studio'
if target.exists() and not a.force:p.error(f'{target} already exists; back it up or choose another destination. --force explicitly replaces it.')
if target.exists():shutil.rmtree(target)
target.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(source,target)
print(f'Installed {target}. Reload your agent or start a fresh session to discover it.')
