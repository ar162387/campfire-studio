"""Locate an existing checkout, or clone this engine once. Never overwrite a project."""
import argparse,os,subprocess,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--install',action='store_true',help='Run npm ci and npm run build after locating/cloning');a=p.parse_args()
near=Path(__file__).resolve().parents[3]
configured=os.environ.get('CAMPFIRE_STUDIO_HOME')
registered=Path(__file__).resolve().parents[1]/'.studio-location.json'
if not configured and registered.exists():
 try:
  candidate=Path(json.loads(registered.read_text())['path']).expanduser()
  if (candidate/'src/puppet/Studio.tsx').exists():configured=str(candidate)
 except (ValueError,KeyError,TypeError):pass
root=Path(configured).expanduser() if configured else near if (near/'src/puppet/Studio.tsx').exists() else Path.home()/'.local/share/campfire-studio'
if not root.exists():
 root.parent.mkdir(parents=True,exist_ok=True);subprocess.run(['git','clone','https://github.com/ar162387/campfire-studio.git',str(root)],check=True)
if not (root/'src/puppet/Studio.tsx').exists():p.error(f'{root} exists but is not a Campfire checkout. Set CAMPFIRE_STUDIO_HOME to a different path.')
if a.install:
 subprocess.run(['npm','ci'],cwd=root,check=True);subprocess.run(['npm','run','build'],cwd=root,check=True)
print(root)
