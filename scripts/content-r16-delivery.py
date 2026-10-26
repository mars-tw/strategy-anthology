"""Scoped media cleanup and native review-set assembly; never touch initial untracked files."""
from pathlib import Path
import subprocess, json, hashlib, re, sys, shutil, struct
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r16'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
def write(p, v):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(v, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
def initial():
    rows=read(OUT/'verification/baseline.json')['initialUntracked']
    for r in rows: assert (ROOT/r['path']).is_file() and sha(ROOT/r['path'])==r['sha256'], r['path']
    return rows
def superseded(n):
    return Path(n).suffix.lower() in {'.png','.webp','.jpg','.jpeg','.mp4','.webm'} and bool(re.match(r'^docs/(content/r(?:[1-9]|1[0-5])/(?!art/)|evidence/|art/compare/)', n))
def dependencies():
    found={}
    def walk(v, source):
        if isinstance(v,dict):
            for item in v.values():walk(item,source)
        elif isinstance(v,list):
            for item in v:walk(item,source)
        elif isinstance(v,str) and v.startswith('docs/') and Path(v).suffix.lower() in {'.png','.jpg','.webp','.jpeg','.mp4','.webm'}:
            found.setdefault(v,[]).append(source)
    for name in ['capture-index.json','review-index.json','regression-e2e.json','regression-proof-e2e.json','sluice-e2e.json']:
        p=ROOT/'docs/content/r12'/name
        if p.exists():walk(read(p),p.relative_to(ROOT).as_posix())
    return found
def plan():
    initial();deps=dependencies();files=[];retained=[]
    modified=set(subprocess.check_output(['git','diff','--name-only','-z'],cwd=ROOT).decode().split('\0'))
    for n in subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0'):
        p=ROOT/n
        if not p.is_file() or not superseded(n):continue
        row={'path':n,'bytes':p.stat().st_size,'sha256':sha(p)}
        if n in deps:
            retained.append({**row,'reason':'R12 exact hash inputs remain read by scripts/content-r12-delivery.py; assertions preserved.','referencedBy':sorted(set(deps[n]))});continue
        assert n not in modified, 'Refusing to delete modified evidence '+n
        assert p.resolve().is_relative_to((ROOT/'docs').resolve())
        files.append({**row,'absolutePath':str(p.resolve())})
    write(OUT/'cleanup-plan.json',{'status':'PREPARED','root':str(ROOT),'count':len(files),'bytes':sum(r['bytes'] for r in files),'files':files})
    write(OUT/'retained-test-inputs.json',{'status':'VERIFIED','count':len(retained),'files':retained})
    print('PREPARED',len(files),'files,',sum(r['bytes'] for r in files),'bytes; retain',len(retained))
def apply():
    initial();v=read(OUT/'cleanup-plan.json');assert v['root']==str(ROOT)
    tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0'))
    for r in v['files']:
        p=ROOT/r['path'];assert r['path'] in tracked and superseded(r['path']) and p.resolve().is_relative_to((ROOT/'docs').resolve()) and str(p.resolve())==r['absolutePath'] and sha(p)==r['sha256']
    for r in v['files']:(ROOT/r['path']).unlink()
    v.update(status='EXECUTED',allAbsent=all(not (ROOT/r['path']).exists() for r in v['files']),initialUntrackedPreserved=len(initial()))
    write(OUT/'cleanup.json',v);print('EXECUTED',v['count'],'files,',v['bytes'],'bytes')
def gallery():
    old=read(OUT/'regression/content-r15/e2e.json');new=read(OUT/'e2e.json')
    assert old['status']==new['status']=='VERIFIED'
    assert old['buildSHA256']==new['buildSHA256']==sha(ROOT/'dist/game.js')
    assert old['styleSHA256']==new['styleSHA256']==sha(ROOT/'dist/style.css')
    names=[
        ('relay','regression/content-r15/phone-relay-upstream-combat.png'),
        ('relay','regression/content-r15/phone-relay-gate-inherited-hit.png'),
        ('relay','regression/content-r15/phone-relay-crystals-spent.png'),
        ('relay','regression/content-r15/phone-relay-crystals-result.png'),
        ('relay','regression/content-r15/phone-relay-three-branch-comparison.png'),
        ('terrain','regression/content-r15/phone-terrain-barricade-turn-1.png'),
        ('terrain','regression/content-r15/phone-terrain-barricade-turn-2.png'),
        ('terrain','phone-flood-430-flow-1.png'),('terrain','phone-flood-430-flow-2.png'),('terrain','phone-flood-430-exit-details.png'),
        ('exercise','regression/content-r15/phone-sluice-before-release.png'),('exercise','regression/content-r15/phone-sluice-release-instant.png'),('exercise','regression/content-r15/phone-sluice-delay-increments.png'),
        ('exercise','regression/content-r15/phone-sluice-ended-summary.png'),('exercise','regression/content-r15/phone-sluice-unused-trials.png')]
    d=OUT/'review-set';d.mkdir(exist_ok=True);images=[]
    for i,(category,n) in enumerate(names,1):
        src=OUT/n;assert struct.unpack('>II',src.read_bytes()[16:24])==(430,932)
        dst=d/f'{i:02d}-{src.name.removeprefix("phone-")}';shutil.copy2(src,dst);assert sha(src)==sha(dst)
        images.append({'category':category,'source':src.relative_to(ROOT).as_posix(),'path':dst.relative_to(ROOT).as_posix(),'sha256':sha(dst),'dimensions':[430,932]})
    assert len(list(d.glob('*.png')))==15
    write(OUT/'review-index.json',{'status':'VERIFIED','buildSHA256':sha(ROOT/'dist/game.js'),'styleSHA256':sha(ROOT/'dist/style.css'),'method':'Native originals copied without crop, resizing or montage; five per content item.','images':images})
    print('VERIFIED 15 native portrait review screenshots')
def verify():
    initial();clean=read(OUT/'cleanup.json');assert all(not (ROOT/r['path']).exists() for r in clean['files'])
    for r in read(OUT/'retained-test-inputs.json')['files']:assert sha(ROOT/r['path'])==r['sha256']
    base=read(OUT/'verification/baseline.json')['commit'];stores=[]
    for name in subprocess.check_output(['git','ls-tree','-r','--name-only',base,'--','docs/store/screenshots'],cwd=ROOT).decode().splitlines():
        assert (ROOT/name).read_bytes()==subprocess.check_output(['git','show',base+':'+name],cwd=ROOT);stores.append(name)
    write(OUT/'verification/preservation.json',{'status':'VERIFIED','initialUntrackedFiles':len(initial()),'existingStoreImages':len(stores),'oldMediaRemainAbsent':True,'retainedExactTestInputs':len(read(OUT/'retained-test-inputs.json')['files'])})
    print('VERIFIED untracked, existing store images and retained inputs unchanged')
def water():
    from PIL import Image, ImageDraw
    rows=[];tmp=ROOT/'.audit-tmp/r16';tmp.mkdir(parents=True,exist_ok=True)
    for s in read(OUT/'e2e.json')['shots']:
        if 'flood-430-flow-' not in s['path']:continue
        p=ROOT/s['path'];im=Image.open(p).convert('RGB');scale=64/im.width
        small=im.resize((64,round(im.height*scale)),Image.Resampling.LANCZOS)
        mask=Image.new('1',small.size);draw=ImageDraw.Draw(mask);c=s['canvas']
        polygon=s['frame']['contentR2']['waterPainting']['polygon']
        draw.polygon([((v['x']+c['x'])*scale,(v['y']+c['y'])*scale) for v in polygon],fill=1)
        colors=[rgb for rgb,m in zip(small.getdata(),mask.getdata()) if m]
        cyan=sum(g>r*1.2 and b>r*1.07 and b>80 for r,g,b in colors)
        assert cyan>=12 and cyan/len(colors)>=.15, (p,cyan,len(colors))
        dest=tmp/(p.stem+'-64.png');small.save(dest)
        rows.append({'path':s['path'],'sha256':sha(p),'thumbnailWidth':64,'waterPixels':len(colors),'distinctCyanWaterPixels':cyan,'distinctFraction':cyan/len(colors),'status':'VERIFIED'})
    assert len(rows)==3
    write(OUT/'water-visibility.json',{'status':'VERIFIED','method':'Whole native phone screenshot downsampled to width64 with Lanczos; projected actual water polygon mask, count cyan pixels inside it. Numeric check supplements manual visual inspection.','shots':rows})
    print('VERIFIED whole-phone 64px water visibility',[(r['distinctCyanWaterPixels'],r['waterPixels']) for r in rows])
def contracts():
    base=read(OUT/'verification/baseline.json')['commit'];units=[];browsers=[]
    original_scripts=set(subprocess.check_output(['git','ls-tree','-r','--name-only',base,'--','scripts'],cwd=ROOT).decode().splitlines())
    def original(n):return subprocess.check_output(['git','show',base+':'+n],cwd=ROOT).decode('utf8').replace('\r\n','\n')
    for n in subprocess.check_output(['git','ls-tree','-r','--name-only',base,'--','tests'],cwd=ROOT).decode().splitlines():
        now=(ROOT/n).read_text(encoding='utf8').replace('docs/content/r16/regression/','docs/content/r15/regression/')
        assert now==original(n), 'Existing test assertions changed: '+n
        units.append(n)
    for p in (ROOT/'scripts').glob('*.mjs'):
        n=p.relative_to(ROOT).as_posix()
        if n not in original_scripts:continue
        if n=='scripts/content-r16-e2e.mjs' or not any(w in p.name for w in ['e2e','audit','capture','perf','proof','review','qa','touch']):continue
        try:old=original(n)
        except subprocess.CalledProcessError:continue
        now=p.read_text(encoding='utf8').replace(",args:['--mute-audio']",'')
        if p.name=='content-r15-e2e.mjs':
            now=now.replace("out=evidenceDir('content-r15')","out='docs/content/r15'").replace('await p.screenshot({path:evidenceFile(path)});report.shots.push({path:evidenceFile(path),','await p.screenshot({path});report.shots.push({path,').replace('sha(await readFile(evidenceFile(path))),frame:v','sha(await readFile(path)),frame:v')
            debug="if((await view(p)).snapshot){await writeFile('.audit-tmp/r15/debug-result.json',JSON.stringify({frame:await view(p),save:await saved(p)}));await p.screenshot({path:'.audit-tmp/r15/debug-result.png'});}"
            old=old.replace(debug,'')
        assert now==old,'Existing browser assertions changed: '+n
        if 'chromium.launch(' in p.read_text(encoding='utf8'):
            assert "headless:true,channel:'chrome',args:['--mute-audio']" in p.read_text(encoding='utf8'),n
        browsers.append(n)
    write(OUT/'verification/test-contracts.json',{'status':'VERIFIED','existingUnitTestFiles':units,'existingBrowserAndAuditFiles':browsers,'permittedChanges':['All Chromium launches headless and muted','Two R14 expected current evidence paths','R15 evidence destination paths and removal of temporary debug copies'],'assertionsRemoved':0,'assertionsWeakened':0})
    print('VERIFIED original assertions preserved:',len(units),'unit files,',len(browsers),'browser/audit scripts')
def prune():
    # Only files created by this round, under explicit project-owned output roots.
    # Existing ignored frame files have old creation times and are retained.
    keep={r['source'] for r in read(OUT/'review-index.json')['images']}
    initial_names={r['path'] for r in initial()}
    started=(OUT/'verification/baseline.json').stat().st_birthtime
    generated=[]
    for p in (OUT/'regression').rglob('*'):
        if p.is_file() and p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.webm','.mp4'} and p.relative_to(ROOT).as_posix() not in keep:
            generated.append(p)
    # Full verification supersedes focused preflight captures and their receipts.
    # Those captures were replaced in place; retaining old hashes would mislead.
    for name in ['e2e-layout.json','e2e-maximum.json']+[f'verification/{kind}{suffix}' for kind in ['preflight','layout','small','flood'] for suffix in ['.txt','-execution.json']]:
        p=OUT/name
        if p.is_file():generated.append(p)
    for base in [ROOT/'.audit-tmp/r16', ROOT/'.audit-tmp/content-r2/frames', ROOT/'.audit-tmp/content-r3/frames']:
        if not base.exists():continue
        for p in base.rglob('*'):
            if p.is_file() and (base==ROOT/'.audit-tmp/r16' or p.stat().st_birthtime>=started):generated.append(p)
    rows=[]
    allowed=[OUT.resolve(),(ROOT/'.audit-tmp/r16').resolve(),(ROOT/'.audit-tmp/content-r2/frames').resolve(),(ROOT/'.audit-tmp/content-r3/frames').resolve()]
    for p in generated:
        n=p.relative_to(ROOT).as_posix();assert n not in initial_names and p.resolve().is_relative_to(ROOT.resolve()) and any(p.resolve().is_relative_to(a) for a in allowed)
        rows.append({'path':n,'absolutePath':str(p.resolve()),'sha256':sha(p),'bytes':p.stat().st_size})
    write(OUT/'temporary-cleanup-plan.json',{'status':'PREPARED','files':rows,'count':len(rows),'bytes':sum(r['bytes'] for r in rows)})
    for r in rows:
        p=ROOT/r['path'];assert str(p.resolve())==r['absolutePath'] and sha(p)==r['sha256'];p.unlink()
    # Empty only the isolated directory this round created; never remove old frame roots.
    temp=ROOT/'.audit-tmp/r16'
    if temp.exists():
        for p in sorted(temp.rglob('*'),key=lambda p:len(p.parts),reverse=True):
            if p.is_dir() and not any(p.iterdir()):p.rmdir()
        if not any(temp.iterdir()):temp.rmdir()
    write(OUT/'temporary-cleanup.json',{'status':'VERIFIED','files':rows,'count':len(rows),'bytes':sum(r['bytes'] for r in rows),'allAbsent':all(not (ROOT/r['path']).exists() for r in rows),'isolatedBrowserTempAbsent':not temp.exists(),'policy':'Retain native selected source screenshots, current R16 direct evidence, fifteen review copies and final receipts. Remove intermediate regression media, superseded focused preflight receipts and own isolated temp. Existing ignored frame names are preserved.'})
    print('VERIFIED removed own intermediates:',len(rows),'files,',sum(r['bytes'] for r in rows),'bytes')
def release():
    verify();build=sha(ROOT/'dist/game.js');style=sha(ROOT/'dist/style.css')
    assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip()=='main'
    execution=read(OUT/'verification/verify-execution.json');assert execution['exitCode']==0
    e=read(OUT/'e2e.json');old=read(OUT/'regression/content-r15/e2e.json')
    for v in [e,old]:assert v['status']=='VERIFIED' and v['buildSHA256']==build and v['styleSHA256']==style and not v['errors']
    perf=read(OUT/'performance.json');assert perf['status']=='VERIFIED' and len(perf['runs'])==18 and perf['buildSHA256']==build and perf['styleSHA256']==style
    audit=read(OUT/'regression/release-audit/release-audit.json');assert audit['status']=='VERIFIED' and audit['version']=='0.23.1' and audit['secretScan']['matches']==0
    write(OUT/'verification/secret-scan.json',{'status':'VERIFIED',**audit['secretScan']})
    for r in read(OUT/'review-index.json')['images']:
        assert sha(ROOT/r['path'])==sha(ROOT/r['source'])==r['sha256']
    for prefix,size in [('iphone',(1290,2796)),('ipad',(2064,2752))]:
        p=ROOT/f'docs/store/screenshots/{prefix}-content-r16-ledger-{size[0]}x{size[1]}.png';assert struct.unpack('>II',p.read_bytes()[16:24])==size
    for s in e['shots']:assert sha(ROOT/s['path'])==s['sha256']
    for n in ['package.json','package-lock.json','src/campaign.js','src/version.js']:
        assert '0.23.0' not in (ROOT/n).read_text(encoding='utf8')
    manual=read(OUT/'manual-review.json');assert manual['status']=='VERIFIED' and len(manual['images'])==15
    for r in manual['images']:assert sha(ROOT/r['path'])==r['sha256'] and r['result']=='VERIFIED'
    temp=read(OUT/'temporary-cleanup.json');assert temp['status']=='VERIFIED' and temp['allAbsent'] and temp['isolatedBrowserTempAbsent']
    clean=read(OUT/'cleanup.json');clean.update(status='VERIFIED',fullVerifyExitCode=0);write(OUT/'cleanup.json',clean)
    log=(OUT/'verification/verify.txt').read_text(encoding='utf8');assert re.search(r'Tests\s+202 passed',log)
    result={'status':'VERIFIED','version':'0.23.1','branch':'main','fullVerifyExitCode':0,'buildSHA256':build,'styleSHA256':style,'unitTests':202,'newBrowserChecks':len(e['checks']),'retainedR15BrowserChecks':len(old['checks']),'newDirectOriginals':len(e['shots']),'reviewImages':15,'manualReviewImages':15,'newGeneratedArt':0,'secretMatches':0,'performanceRuns':18,'maxMedianP95':max(r['medianP95'] for r in perf['summary']),'performanceCaveat':'Concurrent-load headless emulation, reference only','deletedOldMedia':clean['count'],'deletedOldMediaBytes':clean['bytes'],'deletedIntermediates':temp['count'],'deletedIntermediateBytes':temp['bytes'],'retainedExactLegacyInputs':198,'initialUntrackedPreserved':len(initial()),'MuseRescore':'BLOCKED','physicalDevicesAndHumanPlaytest':'BLOCKED'}
    write(OUT/'verification/release-check.json',result)
    print('VERIFIED',json.dumps(result,ensure_ascii=False))
if __name__=='__main__':{'plan':plan,'apply':apply,'gallery':gallery,'verify':verify,'water':water,'contracts':contracts,'prune':prune,'release':release}[sys.argv[1]]()
