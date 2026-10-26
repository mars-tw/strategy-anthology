from pathlib import Path
import subprocess,json,hashlib,re,sys,shutil,struct
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r17'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def names(args):return subprocess.check_output(['git',*args,'-z'],cwd=ROOT).decode('utf8').split('\0')
def initial():
 rows=read(OUT/'verification/baseline.json')['initialUntracked']
 for r in rows:assert (ROOT/r['path']).is_file() and sha(ROOT/r['path'])==r['sha256'],r['path']
 return rows
def old_media(n):
 return Path(n).suffix.lower() in {'.png','.webp','.jpg','.jpeg','.mp4','.webm'} and bool(re.match(r'^docs/(content/r(?:[1-9]|1[0-6])/(?!art/)|evidence/|art/compare/)',n))
def dependencies():
 # Historical hash verifier still reads these R12 originals. Preserve its
 # exact input contract rather than weakening the assertions.
 return {r['path']:r for r in read(ROOT/'docs/content/r16/retained-test-inputs.json')['files']}
def cleanup():
 initial();deps=dependencies();modified=set(names(['diff','--name-only']));rows=[];retained=[]
 for n in names(['ls-files']):
  p=ROOT/n
  if not n or not p.is_file() or not old_media(n):continue
  row={'path':n,'bytes':p.stat().st_size,'sha256':sha(p),'absolutePath':str(p.resolve())}
  if n in deps:retained.append({**row,'reason':'Exact historical media hash inputs still read by scripts/content-r12-delivery.py.'});continue
  assert n not in modified and p.resolve().is_relative_to((ROOT/'docs').resolve()),n
  rows.append(row)
 write(OUT/'cleanup-plan.json',{'status':'PREPARED','files':rows,'count':len(rows),'bytes':sum(r['bytes'] for r in rows)})
 for r in rows:
  p=ROOT/r['path'];assert str(p.resolve())==r['absolutePath'] and sha(p)==r['sha256'];p.unlink()
 write(OUT/'cleanup.json',{'status':'EXECUTED','files':rows,'count':len(rows),'bytes':sum(r['bytes'] for r in rows),'allAbsent':all(not (ROOT/r['path']).exists() for r in rows)})
 write(OUT/'retained-test-inputs.json',{'status':'VERIFIED','count':len(retained),'files':retained});print('EXECUTED old media',len(rows),sum(r['bytes'] for r in rows),'bytes')
def gallery(prepared=False):
 e=read(OUT/'e2e.json');assert (prepared or e['status']=='VERIFIED') and e['buildSHA256']==sha(ROOT/'dist/game.js') and e['styleSHA256']==sha(ROOT/'dist/style.css')
 selected=[('relay','relay-position-budget-preview'),('relay','relay-upstream-live'),('relay','relay-gate-inherited-hit'),('relay','relay-crystals-real-budget'),('relay','relay-320-summary'),('terrain','terrain-flood-cost-preview'),('terrain','terrain-barricade-turn-1'),('terrain','terrain-barricade-turn-2'),('terrain','terrain-flood-flow-1'),('terrain','terrain-flood-flow-2'),('exercise','sluice-closed'),('exercise','sluice-opening'),('exercise','sluice-open'),('exercise','sluice-ended-ledger'),('exercise','sluice-three-timing-summary')]
 d=OUT/'review-set';d.mkdir(exist_ok=True);rows=[]
 for i,(category,n) in enumerate(selected,1):
  src=OUT/f'phone-{n}.png';size=(320,568) if n=='relay-320-summary' else (430,932);assert struct.unpack('>II',src.read_bytes()[16:24])==size
  receipt=next(r for r in e['shots'] if r['path']==src.relative_to(ROOT).as_posix());assert sha(src)==receipt['sha256']
  target=d/f'{i:02d}-{n}.png';shutil.copy2(src,target);assert sha(src)==sha(target)
  rows.append({'category':category,'source':src.relative_to(ROOT).as_posix(),'path':target.relative_to(ROOT).as_posix(),'dimensions':list(size),'sha256':sha(target)})
 assert len(list(d.glob('*.png')))==15
 status='PREPARED' if prepared else 'VERIFIED'
 write(OUT/'review-index.json',{'status':status,'buildSHA256':e['buildSHA256'],'styleSHA256':e['styleSHA256'],'method':'Fifteen unchanged native phone portrait screenshots, five per content item; no resize, crop or montage.','images':rows});print(status,'15 native review screenshots')
def preserve():
 initial();base=read(OUT/'verification/baseline.json')['commit'];stores=[]
 for n in subprocess.check_output(['git','ls-tree','-r','--name-only',base,'--','docs/store/screenshots'],cwd=ROOT).decode().splitlines():
  assert (ROOT/n).read_bytes()==subprocess.check_output(['git','show',base+':'+n],cwd=ROOT),n;stores.append(n)
 assert all(not (ROOT/r['path']).exists() for r in read(OUT/'cleanup.json')['files'])
 for r in read(OUT/'retained-test-inputs.json')['files']:assert sha(ROOT/r['path'])==r['sha256']
 write(OUT/'verification/preservation.json',{'status':'VERIFIED','preexistingUntrackedAndIgnored':len(initial()),'existingStoreImages':len(stores),'oldMediaRemainAbsent':True,'retainedTestInputs':len(read(OUT/'retained-test-inputs.json')['files'])});print('VERIFIED protected files, store screenshots and test inputs')
def prune():
 initial_names={r['path'] for r in initial()};rows=[]
 # No old ignored directories are traversed or removed. All current outputs
 # are isolated under the current round, with verified absolute boundaries.
 allowed=[(OUT/'regression').resolve(),(ROOT/'.audit-tmp/r17').resolve()]
 for base in allowed:
  assert base.is_relative_to(ROOT.resolve())
  if not base.exists():continue
  for p in base.rglob('*'):
   removable=p.suffix.lower() in {'.png','.jpg','.webp','.jpeg','.mp4','.webm'} or p.name.startswith('attained-') and p.suffix.lower()=='.json'
   if not p.is_file() or base==(OUT/'regression').resolve() and not removable:continue
   n=p.relative_to(ROOT).as_posix();assert n not in initial_names and p.resolve().is_relative_to(base)
   rows.append({'path':n,'bytes':p.stat().st_size,'sha256':sha(p),'absolutePath':str(p.resolve())})
 for n in ['layout.txt','layout-execution.json','r17.txt','r17-execution.json','supplemental.txt','supplemental-execution.json']:
  p=OUT/'verification'/n
  if p.is_file():
   name=p.relative_to(ROOT).as_posix();assert name not in initial_names and p.resolve().is_relative_to((OUT/'verification').resolve())
   rows.append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p),'absolutePath':str(p.resolve())})
 for n in ['attained-relay-save.json','attained-sluice-save.json','e2e-supplemental.json']:
  p=OUT/n
  if p.is_file():
   name=p.relative_to(ROOT).as_posix();assert name not in initial_names and p.resolve().is_relative_to(OUT.resolve())
   rows.append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p),'absolutePath':str(p.resolve())})
 p=OUT/'regression/content-r15/e2e-layout.json'
 if p.is_file():
  name=p.relative_to(ROOT).as_posix();assert name not in initial_names and p.resolve().is_relative_to((OUT/'regression').resolve())
  rows.append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p),'absolutePath':str(p.resolve())})
 p=ROOT/'scripts/content-r17-baseline.py'
 if p.is_file():
  name=p.relative_to(ROOT).as_posix();assert name not in initial_names and p.resolve().is_relative_to((ROOT/'scripts').resolve()) and name not in set(names(['ls-files']))
  rows.append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p),'absolutePath':str(p.resolve()),'reason':'One-time baseline initializer; immutable baseline JSON is retained.'})
 # dist is an ignored, reproducible build; never touch its preexisting files.
 write(OUT/'temporary-cleanup-plan.json',{'status':'PREPARED','count':len(rows),'bytes':sum(r['bytes'] for r in rows),'files':rows})
 for r in rows:
  p=ROOT/r['path'];assert str(p.resolve())==r['absolutePath'] and sha(p)==r['sha256'];p.unlink()
 temp=ROOT/'.audit-tmp/r17'
 empty_dirs=[]
 if temp.exists():
  for p in sorted(temp.rglob('*'),key=lambda p:len(p.parts),reverse=True):
   if p.is_dir() and not any(p.iterdir()):
    assert p.resolve().is_relative_to(temp.resolve());empty_dirs.append(p.relative_to(ROOT).as_posix());p.rmdir()
  if not any(temp.iterdir()):empty_dirs.append(temp.relative_to(ROOT).as_posix());temp.rmdir()
 reg=OUT/'regression'
 for p in sorted(reg.rglob('*'),key=lambda p:len(p.parts),reverse=True):
  if p.is_dir() and not any(p.iterdir()):
   assert p.resolve().is_relative_to(reg.resolve());empty_dirs.append(p.relative_to(ROOT).as_posix());p.rmdir()
 write(OUT/'temporary-cleanup.json',{'status':'VERIFIED','count':len(rows),'bytes':sum(r['bytes'] for r in rows),'files':rows,'emptyDirectoriesRemoved':empty_dirs,'allAbsent':all(not (ROOT/r['path']).exists() for r in rows),'browserTempAbsent':not temp.exists()});print('VERIFIED removed current temporary files',len(rows),sum(r['bytes'] for r in rows),'bytes')
def compact():
 initial();execution=read(OUT/'verification/verify-execution.json');assert execution['exitCode']==0
 assert not (OUT/'metadata-cleanup.json').exists(),'Cleanup receipt already exists'
 reg=OUT/'regression';keep={'release-audit/release-audit.json','unit/six-chapters.json'};rows=[];reports=[]
 for p in sorted(reg.rglob('*.json')):
  if p.relative_to(reg).as_posix() in keep:continue
  assert p.resolve().is_relative_to(reg.resolve())
  blob=p.read_bytes();data=json.loads(blob.decode('utf-8-sig'));name=p.relative_to(ROOT).as_posix();row={'path':name,'absolutePath':str(p.resolve()),'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest()}
  if isinstance(data,dict):
   assert data.get('status') in {None,'VERIFIED'},(name,data.get('status'))
   report={**row,'status':data.get('status'),'checks':len(data['checks']) if isinstance(data.get('checks'),list) else None,'shots':len(data['shots']) if isinstance(data.get('shots'),list) else None,'videos':len(data['videos']) if isinstance(data.get('videos'),list) else None,'errors':data.get('errors'),'buildSHA256':data.get('buildSHA256'),'styleSHA256':data.get('styleSHA256')}
  else:report={**row,'status':None,'samples':len(data) if isinstance(data,list) else None}
  rows.append(row);reports.append(report)
 write(OUT/'verification/suite-results.json',{'status':'VERIFIED','method':'Counts, statuses and SHA-256 copied from completed actual reports after full npm run verify exit 0. Dense per-frame legacy output JSONs were intermediate; R17 full evidence, original test inputs, source audit and full execution log are retained.','execution':execution,'buildSHA256':sha(ROOT/'dist/game.js'),'styleSHA256':sha(ROOT/'dist/style.css'),'reports':reports})
 write(OUT/'metadata-cleanup-plan.json',{'status':'PREPARED','count':len(rows),'bytes':sum(r['bytes'] for r in rows),'files':rows})
 for r in rows:
  p=ROOT/r['path'];assert str(p.resolve())==r['absolutePath'] and sha(p)==r['sha256'];p.unlink()
 empty=[]
 for p in sorted(reg.rglob('*'),key=lambda p:len(p.parts),reverse=True):
  if p.is_dir() and not any(p.iterdir()):
   assert p.resolve().is_relative_to(reg.resolve());empty.append(p.relative_to(ROOT).as_posix());p.rmdir()
 write(OUT/'metadata-cleanup.json',{'status':'VERIFIED','count':len(rows),'bytes':sum(r['bytes'] for r in rows),'files':rows,'emptyDirectoriesRemoved':empty,'allAbsent':all(not (ROOT/r['path']).exists() for r in rows)})
 print('VERIFIED removed dense intermediate metadata:',len(rows),sum(r['bytes'] for r in rows),'bytes')
def release():
 preserve();build=sha(ROOT/'dist/game.js');style=sha(ROOT/'dist/style.css');e=read(OUT/'e2e.json')
 assert read(OUT/'verification/verify-execution.json')['exitCode']==0 and e['status']=='VERIFIED' and e['buildSHA256']==build and e['styleSHA256']==style
 perf=read(OUT/'performance.json');assert len(perf['runs'])==18 and len(perf['summary'])==6 and perf['buildSHA256']==build and perf['styleSHA256']==style and perf['status'] in {'VERIFIED','BLOCKED'}
 suites=read(OUT/'verification/suite-results.json');assert suites['status']=='VERIFIED' and suites['buildSHA256']==build and suites['styleSHA256']==style
 assert all(not (ROOT/r['path']).exists() for r in read(OUT/'metadata-cleanup.json')['files'])
 for r in e['shots']:assert sha(ROOT/r['path'])==r['sha256'],r['path']
 for r in read(OUT/'review-index.json')['images']:assert sha(ROOT/r['source'])==sha(ROOT/r['path'])==r['sha256']
 for name,size in [('iphone',(1290,2796)),('ipad',(2064,2752))]:
  p=ROOT/f'docs/store/screenshots/{name}-content-r17-water-{size[0]}x{size[1]}.png';assert struct.unpack('>II',p.read_bytes()[16:24])==size
 audit=read(OUT/'regression/release-audit/release-audit.json');assert audit['status']=='VERIFIED' and audit['version']=='0.23.2' and audit['secretScan']['matches']==0
 manual=read(OUT/'manual-review.json');assert manual['status']=='VERIFIED' and len(manual['images'])==15
 for r in manual['images']:assert r['result']=='VERIFIED' and sha(ROOT/r['path'])==r['sha256']
 # Preserve every pre-existing test assertion. Only the two expected output
 # destinations change in the existing R14 test; all others are byte-identical.
 for n in subprocess.check_output(['git','ls-tree','-r','--name-only',read(OUT/'verification/baseline.json')['commit'],'--','tests'],cwd=ROOT).decode().splitlines():
  old=subprocess.check_output(['git','show',read(OUT/'verification/baseline.json')['commit']+':'+n],cwd=ROOT).decode('utf8').replace('\r\n','\n')
  now=(ROOT/n).read_text('utf8').replace('docs/content/r17/regression/','docs/content/r16/regression/');assert now==old,n
 checked=[];base=read(OUT/'verification/baseline.json')['commit']
 for n in subprocess.check_output(['git','ls-tree','-r','--name-only',base,'--','scripts'],cwd=ROOT).decode().splitlines():
  if not n.endswith('.mjs') or not any(k in n for k in ['e2e','audit','capture','perf','proof','review','qa','touch']):continue
  old=subprocess.check_output(['git','show',base+':'+n],cwd=ROOT).decode('utf8').replace('\r\n','\n');now=(ROOT/n).read_text('utf8')
  if n in ['scripts/content-r2-e2e.mjs','scripts/content-r3-e2e.mjs']:now=now.replace('.audit-tmp/r17/','.audit-tmp/')
  if n=='scripts/content-r16-e2e.mjs':
   now=now.replace("import {evidenceDir,evidenceFile} from './current-evidence.mjs';\n",'').replace("out=evidenceDir('content-r16')","out='docs/content/r16'").replace('await p.screenshot({path:evidenceFile(path)});report.shots.push({path:evidenceFile(path),sha256:sha(await readFile(evidenceFile(path)))','await p.screenshot({path});report.shots.push({path,sha256:sha(await readFile(path))').replace('.audit-tmp/r17','.audit-tmp/r16')
  assert now==old,'Changed existing browser assertions: '+n
  if 'chromium.launch(' in now:assert "headless:true,channel:'chrome',args:['--mute-audio']" in now,n
  checked.append(n)
 write(OUT/'verification/test-contracts.json',{'status':'VERIFIED','existingBrowserScripts':checked,'assertionsRemoved':0,'assertionsWeakened':0,'permittedChanges':['Two R14 current evidence path expectations','R2/R3 intermediate frame destinations','R16 evidence and temporary destinations']})
 write(OUT/'verification/release.json',{'status':'VERIFIED','scope':'Local implementation, full functional suite and exact evidence hashes; performance is a concurrent reference only.','version':'0.23.2','buildSHA256':build,'styleSHA256':style,'secretScan':audit['secretScan'],'performanceReference':{'status':perf['status'],'summary':perf['summary']},'oldTestAssertionsPreserved':True,'headless':True,'browserArgs':['--mute-audio'],'physicalDevices':'BLOCKED','independentMuseRescore':'BLOCKED'});print('VERIFIED local release, assertions and evidence hashes')
if __name__=='__main__':globals()[sys.argv[1]]()
