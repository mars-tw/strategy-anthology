"""Delete only tracked superseded media within this repository, with receipts."""
from pathlib import Path
import subprocess,json,hashlib,re,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/content/r15'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def tracked():return subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode('utf8').rstrip('\0').split('\0')
def check_initial():
 rows=read(ROOT/'.audit-tmp/r15/initial-untracked.json')
 for row in rows:assert (ROOT/row['path']).is_file() and sha(ROOT/row['path'])==row['sha256'],'Pre-existing untracked changed: '+row['path']
 return len(rows)
def superseded(n):
 return Path(n).suffix.lower() in ['.png','.webp','.jpg','.jpeg','.mp4','.webm'] and bool(re.match(r'^docs/(content/r(?:[1-9]|1[0-4])/(?!art/)|evidence/(?!content-r15/)|art/(?:compare/(?:r[1-7]/|after/|[^/]+\.(?:png|webp)$)|r[1-7]/(?:screens|chapters|motion)/))',n))
def dependencies():
 found={}
 def walk(v,source):
  if isinstance(v,dict):
   for item in v.values():walk(item,source)
  elif isinstance(v,list):
   for item in v:walk(item,source)
  elif isinstance(v,str) and v.startswith('docs/') and Path(v).suffix.lower() in ['.png','.jpg','.webp','.jpeg','.mp4','.webm']:found.setdefault(v,[]).append(source)
 # The historical R12 checker explicitly reads these exact image hashes.
 for name in ['capture-index.json','review-index.json','regression-e2e.json','regression-proof-e2e.json','sluice-e2e.json']:
  p=ROOT/'docs/content/r12'/name
  if p.exists():walk(read(p),p.relative_to(ROOT).as_posix())
 return found
def plan():
 check_initial();deps=dependencies();files=[];retained=[]
 modified=set(subprocess.check_output(['git','diff','--name-only','-z'],cwd=ROOT).decode('utf8').rstrip('\0').split('\0'))
 for n in tracked():
  p=ROOT/n
  if not p.is_file() or not superseded(n):continue
  if n in deps:
   retained.append({'path':n,'bytes':p.stat().st_size,'sha256':sha(p),'reason':'Exact input read by scripts/content-r12-delivery.py check(); original assertions retained.','referencedBy':sorted(set(deps[n]))});continue
  assert n not in modified,'Refusing modified media: '+n
  target=p.resolve();assert target.is_relative_to(ROOT.resolve()) and target.is_relative_to((ROOT/'docs').resolve())
  files.append({'path':n,'absolutePath':str(target),'bytes':p.stat().st_size,'sha256':sha(p),'reason':'Superseded screenshot, comparison or review media; current evidence is in r15.'})
 write(OUT/'cleanup-plan.json',{'status':'PREPARED','root':str(ROOT.resolve()),'files':files,'count':len(files),'bytes':sum(f['bytes'] for f in files)})
 write(OUT/'retained-legacy-test-inputs.json',{'status':'VERIFIED','count':len(retained),'files':retained})
 print('PREPARED',len(files),'files;',round(sum(f['bytes'] for f in files)/2**20,2),'MiB; retained',len(retained),'test inputs')
def apply():
 check_initial();v=read(OUT/'cleanup-plan.json');assert v['root']==str(ROOT.resolve())
 for r in v['files']:
  p=ROOT/r['path'];assert superseded(r['path']) and p.resolve()==Path(r['absolutePath']) and p.resolve().is_relative_to((ROOT/'docs').resolve()) and sha(p)==r['sha256']
 for r in v['files']:(ROOT/r['path']).unlink()
 v.update(status='EXECUTED',allAbsent=all(not (ROOT/r['path']).exists() for r in v['files']),initialUntrackedPreserved=check_initial())
 write(OUT/'cleanup.json',v);print('EXECUTED',v['count'],'files;',round(v['bytes']/2**20,2),'MiB')
if __name__=='__main__':{'plan':plan,'apply':apply,'check-initial':lambda:print('VERIFIED preserved',check_initial(),'initial untracked files')}[sys.argv[1]]()
