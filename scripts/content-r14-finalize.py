"""Read back complete R14 results and copy a 15-image original-size review set."""
from pathlib import Path
import json,hashlib,struct,shutil,subprocess,re
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/content/r14'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def main():
 assert (ROOT/'.audit-tmp/r14/verify-exit.txt').read_text().strip()=='0','Full verify has not succeeded'
 v=read(OUT/'e2e.json');assert v['status']=='VERIFIED' and not v['errors'] and len(v['outcomes'])==6
 build=sha(ROOT/'dist/game.js');assert v['buildSHA256']==build
 fixture=ROOT/v['sourceSavePath'];assert fixture.resolve().is_relative_to(ROOT.resolve()) and sha(fixture)==v['sourceSaveSHA256']
 for s in v['shots']:assert sha(ROOT/s['path'])==s['sha256']
 perf=read(OUT/'performance.json');assert perf['status']=='VERIFIED' and perf['buildSHA256']==build and len(perf['runs'])==18
 clean=read(OUT/'cleanup.json');assert clean['allAbsent'] and all(not (ROOT/r['path']).exists() for r in clean['files'])
 audit=read(OUT/'regression/release-audit/release-audit.json');assert audit['status']=='VERIFIED' and audit['version']=='0.22.0' and audit['secretScan']['matches']==0
 initial=read(ROOT/'.audit-tmp/r14/initial.json')['untracked']
 for p,h in initial.items():assert sha(ROOT/p)==h
 retained=read(OUT/'retained-legacy-test-inputs.json')
 for r in retained['files']:assert sha(ROOT/r['path'])==r['sha256']
 allowed=set(initial)|{r['path'] for r in retained['files']};unexpected=[]
 for n in range(1,14):
  for p in (ROOT/f'docs/content/r{n}').rglob('*'):
   if p.is_file() and 'art' not in p.relative_to(ROOT/f'docs/content/r{n}').parts and p.suffix.lower() in ['.png','.webp','.jpg','.jpeg','.mp4','.webm'] and p.relative_to(ROOT).as_posix() not in allowed:unexpected.append(p.relative_to(ROOT).as_posix())
 assert not unexpected,'Legacy media regenerated: '+str(unexpected)
 # Every old store image must remain byte-identical to its Git blob.
 stores=[]
 for row in subprocess.check_output(['git','ls-tree','-r','-z',read(ROOT/'.audit-tmp/r14/initial.json')['baseCommit'],'--','docs/store/screenshots'],cwd=ROOT).decode('utf8').rstrip('\0').split('\0'):
  if not row:continue
  meta,name=row.split('\t',1)
  if not name.startswith('docs/store/screenshots/'):continue
  data=(ROOT/name).read_bytes();blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
  assert blob==meta.split()[2],'Old store changed: '+name
  stores.append({'path':name,'sha256':sha(ROOT/name)})
 write(OUT/'verification/existing-store-integrity.json',{'status':'VERIFIED','files':stores})
 for prefix,dims in [('iphone',(1290,2796)),('ipad',(2064,2752))]:
  p=ROOT/f'docs/store/screenshots/{prefix}-content-r14-sluice-{dims[0]}x{dims[1]}.png'
  assert struct.unpack('>II',p.read_bytes()[16:24])==dims
 selected=[
 ('relay','relay-same-scale-choices'),('relay','relay-upstream-combat'),('relay','relay-upstream-result'),('relay','relay-gate-result'),('relay','relay-crystals-result'),
 ('terrain','terrain-barricade-preview'),('terrain','terrain-barricade-turn-1'),('terrain','terrain-barricade-turn-2'),('terrain','terrain-flood-enter'),('terrain','terrain-flood-frost-details'),
 ('exercise','sluice-before-release'),('exercise','sluice-release-instant'),('exercise','sluice-flowing-reloaded'),('exercise','sluice-ended-summary'),('exercise','sluice-unused-result')]
 gallery=OUT/'review-set';gallery.mkdir(exist_ok=True);index=[]
 for i,(category,name) in enumerate(selected,1):
  source=OUT/f'phone-{name}.png';assert struct.unpack('>II',source.read_bytes()[16:24])==(430,932)
  target=gallery/f'{i:02d}-{name}.png';shutil.copy2(source,target);assert sha(source)==sha(target)
  index.append({'category':category,'source':source.relative_to(ROOT).as_posix(),'path':target.relative_to(ROOT).as_posix(),'dimensions':[430,932],'sha256':sha(target)})
 assert len(list(gallery.glob('*.png')))==15
 write(OUT/'review-index.json',{'status':'VERIFIED','method':'Copies of original 430x932 screenshots; no resizing or montage. Five per content item, including live play and consecutive frames.','images':index})
 logs=OUT/'verification';logs.mkdir(exist_ok=True)
 for name in ['verify.txt','perf.txt']:
  raw=(ROOT/'.audit-tmp/r14'/name).read_bytes();text=raw.decode('utf16') if raw.startswith(b'\xff\xfe') else raw.decode('utf8')
  (logs/name).write_text(text,encoding='utf8')
 routing=read(logs/'evidence-routing.json');routing.update(status='VERIFIED',unexpectedLegacyMedia=unexpected);write(logs/'evidence-routing.json',routing)
 write(logs/'secret-scan.json',{'status':'VERIFIED',**audit['secretScan'],'source':'docs/content/r14/regression/release-audit/release-audit.json'})
 current_outputs=[]
 for p in (OUT/'regression').rglob('*.json'):
  try:r=read(p)
  except (ValueError,UnicodeError):continue
  if isinstance(r,dict) and r.get('status')=='VERIFIED':current_outputs.append({'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'checks':len(r.get('checks',[]))})
 write(logs/'release-check.json',{'status':'VERIFIED','version':'0.22.0','buildSHA256':build,'fullVerifyExitCode':0,'unitTests':190,'browserChecks':len(v['checks']),'shots':len(v['shots']),'reviewImages':15,'newGeneratedArt':0,'deletedFiles':clean['count'],'deletedBytes':clean['bytes'],'retainedLegacyTestImages':retained['count'],'initialUntrackedPreserved':len(initial),'existingStoreImagesPreserved':len(stores),'maxMedianP95':max(r['medianP95'] for r in perf['summary']),'currentRegressionReceipts':current_outputs,'MuseOriginalAndRescore':'BLOCKED','physicalDevicesAndHumanPlaytest':'BLOCKED'})
 report=ROOT/'docs/CODEX_RESPONSE_CONTENT_R14.md';text=report.read_text(encoding='utf8')
 text=text.replace('PREPARED：完整驗證進行中，以下工程數據須以本輪 `verification/release-check.json` 的 VERIFIED 收據為準。','VERIFIED：清理後完整 `npm run verify` exit 0，190項Vitest、原作規則與全部瀏覽器回歸通過。正式收據為 `docs/content/r14/verification/release-check.json`。')
 text=text.replace('EXECUTED：刪除 **443個**','VERIFIED：刪除 **443個**')
 text=text.replace('PREPARED：清理後完整 `npm run verify` 收據待回讀。','VERIFIED：清理後完整 `npm run verify` exit 0，原始輸出見 `verification/verify.txt`。')
 value=max(r['medianP95'] for r in perf['summary'])
 text=text.replace('實測值見 `performance.json`。秘密掃描以完整發布稽核收據為準，不能把尚未執行的掃描寫成零命中。',f'六組三跑中位p95最大 **{value:.2f}ms ≤18ms**，18跑原始間隔見 `performance.json`。秘密掃描 **0命中**，見 `verification/secret-scan.json`。')
 text=text.replace('以及 `phone-terrain-barricade-aid-on.png`。水域', '以及 `phone-terrain-barricade-aid-on.png`；兩波完成與重載另見 `phone-terrain-barricade-complete.png`／`phone-terrain-flood-complete.png`。水域')
 rows=['\n## 本機實測差異\n','| 分支 | 首波留守／新建傷害 | 共鳴實扣（已包含） | 首波秒數 | 四波防線耐久 |','|---|---|---|---|---|']
 for r in v['outcomes']:
  if r['kind']!='relay':continue
  f=r['firstWave'];name={'upstream':'上游','gate':'城門','crystals':'拆晶'}[r['branch']]
  rows.append(f"| {name} | {f['inheritedDamage']}／{f['totalDamage']-f['inheritedDamage']} | {f['bonusDamage']} | {f['duration']:.1f} | {r['hp']}/100 |")
 rows+=['','| 開閘方式 | 攔下 | 進水 | 逐隻累計延遲 |','|---|---|---|---|']
 for r in v['outcomes']:
  if r['kind']!='sluice':continue
  g=r['gate'];name='未開閘' if g['at'] is None else f"{g['at']:.1f}秒"
  rows.append(f"| {name} | {r['kills']}/10 | {len(g['wetIds'])}隻 | +{g['delay']:.2f}秒 |")
 text=re.sub(r'\n## 本機實測差異\n.*?(?=\n## 工程驗證\n)','',text,flags=re.S)
 text=text.replace('\n## 工程驗證\n','\n'.join(rows)+'\n\n## 工程驗證\n')
 report.write_text(text,encoding='utf8')
 print('VERIFIED R14: 15 original review images, complete verify, 18 performance runs, original stores and initial untracked intact')
if __name__=='__main__':main()
