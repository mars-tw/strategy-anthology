"""Bounded local evidence cleanup and isolated verification, never touches initial untracked files."""
from pathlib import Path
import subprocess,json,hashlib,shutil,re,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/content/r13'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def gitfiles():return subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode('utf8').rstrip('\0').split('\0')
def protected():return read(ROOT/'.audit-tmp/r13/initial.json')['untracked']
def check_initial():
 for name,digest in protected().items():assert sha(ROOT/name)==digest,'Initial untracked changed: '+name
def superseded(name):
 return bool(re.match(r'^docs/(content/r(?:[1-9]|1[0-2])/(?!art/)|evidence/content-r(?:[1-9]|1[0-2])/|art/(?:compare/after/|r[1-7]/(?:screens|chapters|motion)/))',name)) and Path(name).suffix.lower() in ['.png','.jpg','.jpeg','.webp','.webm','.mp4']
def cleanup():
 check_initial();rows=[];kept=[]
 # Historical delivery checks read these originals and exact 15-image sets.
 # Keep their explicit binary inputs rather than weaken the old assertions.
 dependencies={}
 def paths(value,source):
  if isinstance(value,dict):
   for v in value.values():paths(v,source)
  elif isinstance(value,list):
   for v in value:paths(v,source)
  elif isinstance(value,str) and value.startswith('docs/') and Path(value).suffix.lower() in ['.png','.webp','.webm','.mp4','.jpg']:
   dependencies.setdefault(value,[]).append(source)
 for name in ['capture-index.json','review-index.json','regression-e2e.json','regression-proof-e2e.json','sluice-e2e.json']:
  source=ROOT/'docs/content/r12'/name
  if source.exists():paths(read(source),str(source.relative_to(ROOT)))
 # All art source/processed inputs and source-comparison baselines are retained.
 for name in gitfiles():
  p=ROOT/name
  if not p.is_file() or not superseded(name):continue
  if name in dependencies:
   kept.append({'path':name,'bytes':p.stat().st_size,'reason':'Required exact binary input of unchanged scripts/content-r12-delivery.py check().','referencedBy':sorted(set(dependencies[name]))});continue
  target=p.resolve();assert target.is_relative_to(ROOT.resolve()) and str(target)!=str(ROOT.resolve())
  assert name not in protected()
  rows.append({'path':name,'absolutePath':str(target),'bytes':p.stat().st_size,'sha256':sha(p),'reason':'Superseded review output; current proof is in r13. Art manifests, fixtures, source baseline and store images are excluded.'})
 plan={'status':'PREPARED','scope':str(ROOT),'files':rows,'count':len(rows),'bytes':sum(r['bytes'] for r in rows)}
 write(OUT/'cleanup-plan.json',plan)
 for row in rows:
  p=ROOT/row['path'];assert sha(p)==row['sha256'];p.unlink()
 check_initial();plan.update(status='EXECUTED',allAbsent=all(not (ROOT/r['path']).exists() for r in rows),initialUntrackedPreserved=len(protected()))
 write(OUT/'cleanup.json',plan);print('EXECUTED cleanup:',plan['count'],'files,',round(plan['bytes']/2**20,2),'MiB')
 write(OUT/'retained-legacy-test-inputs.json',{'status':'VERIFIED','files':kept,'count':len(kept),'reason':'User explicitly permits retaining old evidence that verification scripts read; no legacy assertion or input is removed.'})
def prepare():
 check_initial();dest=ROOT/'.audit-tmp/r13/verify';assert dest.resolve().is_relative_to(ROOT.resolve())
 # A fresh copy prevents historical tests from overwriting untracked art evidence
 # or store screenshots in the owner's workspace. No links share writable bytes.
 assert not dest.exists(),'Verification copy already exists; do not overwrite a run'
 extras=['docs/OPTIM_PLAN_CONTENT_R13.md','src/content-r13.js','src/content-r13.css','scripts/content-r13-e2e.mjs','scripts/content-r13-perf.mjs','scripts/content-r13-delivery.py','scripts/source-integrity.mjs','scripts/freeze-test-clock.mjs','scripts/content-r13-finalize.py','tests/content-r13.test.js']
 count=0
 for name in set(gitfiles()+extras):
  source=ROOT/name
  if not source.is_file():continue
  target=dest/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target);count+=1
 (dest/'docs/content/r13').mkdir(parents=True,exist_ok=True)
 write(OUT/'verification/input.json',{'status':'PREPARED','path':str(dest),'files':count,'buildSources':{n:sha(ROOT/n) for n in set(gitfiles()+extras) if (ROOT/n).is_file() and (n.startswith(('src/','scripts/','tests/')) or n in ['package.json','package-lock.json'])}})
 print('PREPARED isolated npm run verify:',count,'regular copies')
def archive():
 dest=ROOT/'.audit-tmp/r13/verify';receipts=[]
 current=read(dest/'docs/content/r13/e2e.json');assert current['status']=='VERIFIED' and not current['errors'] and 'scope' not in current
 for p in (dest/'docs/content/r13').rglob('*'):
  if p.is_file():
   target=OUT/p.relative_to(dest/'docs/content/r13');assert target.relative_to(ROOT).as_posix() not in protected();target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
 for shot in current['shots']:
  if shot['path'].startswith('docs/store/screenshots/'):
   source=dest/shot['path'];target=ROOT/shot['path'];assert '-content-r13-' in str(target) and not target.exists();shutil.copy2(source,target);assert sha(target)==shot['sha256']
 for p in (dest/'docs').rglob('*.json'):
  rel=p.relative_to(dest);original=ROOT/rel
  if original.exists() and p.read_bytes()==original.read_bytes():continue
  try:value=read(p)
  except (ValueError,UnicodeError):continue
  if isinstance(value,dict) and ('status' in value or rel.as_posix()=='docs/evidence/six-chapters.json'):
   target=OUT/'verification/receipts'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target);receipts.append(str(target.relative_to(ROOT)))
 # Full R11's current-build evidence supplies the five original exercises,
 # inherited frost, identical replay and four-wave return proof.
 for roundname,reportname in [('r11','e2e.json'),('r11','proof-e2e.json'),('r12','sluice-e2e.json')]:
  p=dest/'docs/content'/roundname/reportname;v=read(p);assert v['status']=='VERIFIED'
  for shot in v['shots']:
   source=dest/shot['path'];assert sha(source)==shot['sha256']
   target=OUT/('regression-'+roundname+'-'+Path(shot['path']).name);shutil.copy2(source,target);shot['path']=target.relative_to(ROOT).as_posix()
  write(OUT/('regression-'+roundname+'-'+reportname),v)
 check_initial();write(OUT/'verification/archived-receipts.json',{'status':'VERIFIED','receipts':receipts,'initialUntrackedPreserved':len(protected())});print('VERIFIED receipts archived:',len(receipts))
if __name__=='__main__':{'cleanup':cleanup,'prepare':prepare,'archive':archive,'check-initial':check_initial}[sys.argv[1]]()
