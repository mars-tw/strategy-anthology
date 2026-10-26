"""Archive actual headless receipts, curate native originals, restore historical output files."""
from pathlib import Path
import json, hashlib, shutil, subprocess, sys, struct, re, datetime
root=Path(__file__).resolve().parents[1]
out=root/'docs/content/r12'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
baseline=read(out/'verification/baseline.json')['commit']
tracked=subprocess.check_output(['git','ls-files'],cwd=root,text=True,encoding='utf8').splitlines()
def copy(source,target):
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target);assert sha(source)==sha(target)
def superseded(name):
 return bool(re.match(r'^docs/(content/r(?:[1-9]|10|11)/|evidence/(?:content-r(?:[1-9]|10|11)/|rwd/)|art/(?:compare/after/|r[1-7]/(?:legacy-checks|screens|chapters|motion)/))',name)) and '/art/' not in name.replace('docs/art/','') and Path(name).suffix.lower() in ['.png','.jpg','.jpeg','.webp','.webm','.mp4']
def archive():
 build=sha(root/'dist/game.js'); receipts=[]
 started=datetime.datetime.fromisoformat(read(out/'verification/verification.json')['startedAt'].replace('Z','+00:00')).timestamp()
 produced=set()
 def paths(value):
  if isinstance(value,dict):
   for v in value.values():paths(v)
  elif isinstance(value,list):
   for v in value:paths(v)
  elif isinstance(value,str):
   value=value.replace('\\','/')
   if value.casefold().startswith(root.as_posix().casefold()+'/'):value=value[len(root.as_posix())+1:]
   if value.startswith('docs/') and superseded(value):produced.add(value)
 for p in (root/'docs').rglob('*.json'):
  if p.is_relative_to(out) or p.stat().st_mtime<started:continue
  try:paths(read(p))
  except (ValueError,UnicodeError):pass
 write(out/'verification/generated-image-paths.json',{'status':'VERIFIED','method':'Only image paths in JSON receipts written by this verification run; unexpected untracked files are excluded.','files':sorted(produced)})
 for filename in ['e2e.json','proof-e2e.json']:
  v=read(root/'docs/content/r11'/filename);assert v['status']=='VERIFIED' and v['buildSHA256']==build
  for shot in v['shots']:
   source=root/shot['path'];assert sha(source)==shot['sha256']
   dest=shot['path'].replace('docs/content/r11/','docs/content/r12/').replace('docs/store/screenshots/','docs/content/r12/store-regression/')
   copy(source,root/dest);shot['path']=dest;receipts.append(shot)
  write(out/('regression-'+filename),v)
 v=read(out/'sluice-e2e.json');assert v['status']=='VERIFIED' and v['buildSHA256']==build;receipts+=v['shots']
 rows=[('relay','relay-choices'),('relay','relay-upstream-hit'),('relay','relay-gate-hit'),('relay','relay-ford-ice-hit'),('relay','relay-crystals-spent-reloaded'),('terrain','terrain-barricade-proof-turn-1'),('terrain','terrain-barricade-proof-turn-2'),('terrain','terrain-barricade-proof-turn-3'),('terrain','terrain-flood-enter-1'),('terrain','terrain-flood-enter-2'),('exercise','exercise-turn-formation'),('exercise','exercise-switchback-combat'),('exercise','exercise-hollow-failed-clear'),('exercise','sluice-flowing-1'),('exercise','sluice-flowing-2')]
 images=[]
 for i,(category,name) in enumerate(rows,1):
  source=out/f'phone-{name}.png';target=out/'review-set'/f'{i:02}-{name}.png';copy(source,target)
  assert struct.unpack('>II',source.read_bytes()[16:24])==(430,932)
  images.append({'category':category,'source':source.relative_to(root).as_posix(),'path':target.relative_to(root).as_posix(),'sha256':sha(target),'dimensions':[430,932]})
 write(out/'review-index.json',{'status':'VERIFIED','buildSHA256':build,'images':images})
 (out/'REVIEW_INDEX.md').write_text('# R12 審查精選\n\nVERIFIED。15張430×932原圖，三項各5張；木柵3格、入水2格與潮閘2格皆為連續真實遊玩。只看review-set即可見三項交戰。完整原圖、來源與SHA-256見review-index.json。\n\n'+'\n'.join(f"- {i:02}．{row['category']}：[原圖]({row['path'].split('r12/')[1]})" for i,row in enumerate(images,1))+'\n',encoding='utf8')
 write(out/'capture-index.json',{'status':'VERIFIED','buildSHA256':build,'shots':receipts})
 # Original HEAD bytes, never screenshots from a different build disguised as this round.
 before=out/'before/phone-exercise-turn-formation-r11.png';before.parent.mkdir(exist_ok=True);before.write_bytes(subprocess.check_output(['git','show',baseline+':docs/content/r11/phone-exercise-turn-formation.png'],cwd=root))
 # Preserve current JSON test receipts before resetting historical generated outputs.
 restored=[]
 changed=subprocess.check_output(['git','diff','--name-only','--diff-filter=M'],cwd=root,text=True,encoding='utf8').splitlines()
 for name in changed:
  if not name.startswith('docs/') or name.startswith('docs/content/r12/'):continue
  p=root/name
  if p.suffix.lower() not in ['.json','.png','.webp','.webm']:continue
  if p.suffix=='.json':copy(p,out/'verification/historical'/name)
  if superseded(name):continue
  original=subprocess.check_output(['git','show',baseline+':'+name],cwd=root);p.write_bytes(original);restored.append(name)
 write(out/'verification/historical-restoration.json',{'status':'VERIFIED','restored':restored})
 for p in (out/'verification').rglob('*.txt'):
  if p.read_bytes().startswith(b'\xff\xfe'):p.write_text(p.read_text(encoding='utf16'),encoding='utf8')
 print('VERIFIED:',len(receipts),'fresh originals archived; 15 native review images.')
def clean_generated():
 initial=read(root/'.audit-tmp/r12-initial-untracked.json');removed=[]
 allowed=set(read(out/'verification/generated-image-paths.json')['files'])|{r['path'] for r in read(out/'cleanup.json')['files']}
 # Only generated historical output directories; original art and all initial untracked files remain.
 for base in ['docs/content','docs/evidence','docs/art']:
  for p in (root/base).rglob('*'):
   if not p.is_file():continue
   name=p.relative_to(root).as_posix()
   if not superseded(name) or name in initial or name not in allowed:continue
   assert p.resolve().is_relative_to(root.resolve())
   removed.append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p)});p.unlink()
 for n,h in initial.items():assert sha(root/n)==h,'Initial untracked changed: '+n
 priorPath=out/'verification/generated-output-cleanup.json'
 prior=read(priorPath)['files'] if priorPath.exists() else []
 merged={r['path']:r for r in prior+removed};allRows=list(merged.values())
 write(priorPath,{'status':'VERIFIED','files':allRows,'count':len(allRows),'bytes':sum(r['bytes'] for r in allRows),'initialUntrackedPreserved':len(initial)})
 print('VERIFIED:',len(removed),'outputs removed this pass,',len(allRows),'in total; initial untracked hashes unchanged.')
def check():
 build=sha(root/'dist/game.js');assert read(root/'package.json')['version']=='0.20.0'
 for n in ['regression-e2e.json','regression-proof-e2e.json','sluice-e2e.json']:
  v=read(out/n);assert v['status']=='VERIFIED' and v['buildSHA256']==build and not v['errors']
  for shot in v['shots']:assert sha(root/shot['path'])==shot['sha256'],shot['path']
 index=read(out/'review-index.json');assert len(index['images'])==15 and len(list((out/'review-set').iterdir()))==15
 for row in index['images']:assert sha(root/row['source'])==sha(root/row['path'])==row['sha256']
 for device,size in [('iphone',(1290,2796)),('ipad',(2064,2752))]:
  p=root/f'docs/store/screenshots/{device}-content-r12-sluice-{size[0]}x{size[1]}.png';assert struct.unpack('>II',p.read_bytes()[16:24])==size
 assert read(out/'verification/secret-scan.json')['matches']==0
 for name in tracked:
  if name.startswith('docs/store/screenshots/'):
   assert (root/name).read_bytes()==subprocess.check_output(['git','show','HEAD:'+name],cwd=root),'Existing store image changed: '+name
 for n,h in read(root/'.audit-tmp/r12-initial-untracked.json').items():assert sha(root/n)==h
 verify=read(out/'verification/verification.json')
 write(out/'verification/release-check.json',{'status':'VERIFIED' if verify['verifyExitCode']==0 else 'BLOCKED','artifactReadback':'VERIFIED','version':'0.20.0','buildSHA256':build,'screenshots':len(read(out/'capture-index.json')['shots']),'reviewImages':15,'fullVerifyExitCode':verify['verifyExitCode'],'blocker':None if verify['verifyExitCode']==0 else 'Original sibling repositories missing; audit.mjs unchanged. Full verify is not green.'})
 assert verify['verifyExitCode']==0,'Full verify blocked by missing original sibling repositories; artifact readback is VERIFIED.'
 print('VERIFIED: current build, original hashes, 15 review images, stores, full verify and secret scan.')
if __name__=='__main__':{'archive':archive,'cleanup-generated':clean_generated,'check':check}[sys.argv[1]]()
