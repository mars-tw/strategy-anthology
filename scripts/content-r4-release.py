"""Read back final R4 artifacts, meaningful frame differences and retained files."""
import hashlib,json,re,subprocess
from pathlib import Path
from PIL import Image,ImageChops

root=Path(__file__).resolve().parent.parent
out=root/'docs/content/r4'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,ok):
    checks.append({'name':name,'pass':bool(ok)})
    assert ok,name
report={'status':'EXECUTED','checks':checks,'screenshots':[],'secretScan':{},'humanAndPhysicalDevices':'BLOCKED: physical iPhone/iPad and new players required','museScore':'BLOCKED: independent re-review required; no self-assigned score'}
try:
    e=json.loads((out/'e2e.json').read_text(encoding='utf-8'))
    check('all public headless scenarios pass',e['status']=='VERIFIED' and not e['errors'])
    check('screenshots bound to final build and styles',e['buildSHA256']==sha(root/'dist/game.js') and e['styleSHA256']==sha(root/'dist/style.css'))
    report['buildSHA256']=e['buildSHA256'];report['styleSHA256']=e['styleSHA256']
    for name,digest in e['sourceSHA256'].items():check('final source bound to evidence '+name,sha(root/name)==digest)
    for item in e['shots']:
        p=root/item['path']
        with Image.open(p) as im:
            size=(item['viewport']['width']*item['dpr'],item['viewport']['height']*item['dpr'])
            check(item['path']+' original dimensions',im.size==size)
            report['screenshots'].append({'path':item['path'],'size':size,'sha256':sha(p)})
    frames=e['salvage']
    check('flight samples use 0/650/1300 milliseconds',[f['nominalMs'] for f in frames]==[0,650,1300])
    check('wallet changes only at arrival',[f['display'] for f in frames]==[411,411,501])
    check('actual crystal path positions differ',len({(f['x'],f['y']) for f in frames})==3)
    images=[Image.open(out/f'phone-ford-crystals-flight-{i}.png').convert('RGB') for i in [1,2,3]]
    for i in [0,1]:
        f=frames[i]
        box=(max(0,int(f['x']-22)),max(0,int(f['y']-26)),min(430,int(f['x']+22)),min(932,int(f['y']+26)))
        check(f'crystal source region itself changes in frame {i+1}',ImageChops.difference(images[i].crop(box),images[i+1].crop(box)).getbbox() is not None)
    for choice,stages in e['routes'].items():
        check(choice+' four actual different positions and arrival',len(stages)==4 and len({(s['x'],s['y']) for s in stages})==4 and stages[-1]['escaped'])
        if choice=='flood':check('water speed returns to normal after exit',stages[1]['wet'] and stages[1]['speed']==26 and not stages[2]['wet'] and stages[2]['speed']==50)
        images=[Image.open(out/f'phone-terrain-{choice}-{stage}.png').convert('RGB') for stage in ['before','inside','after','gate']]
        for i in range(3):check(choice+f' route frame {i+1} differs',ImageChops.difference(images[i],images[i+1]).getbbox() is not None)
    for id,title in [('turn','聚印轉角'),('levee','分守長堤'),('switchback','折返雙隘')]:
        budget=360 if id=='switchback' else 300
        check(title+' same full budget win and loss',e['exercises'][id]['winningSpend']==budget and e['exercises'][id]['losingSpend']==budget)
        for state in ['formation','combat','failed','complete','losing-formation','retry']:
            check(title+' '+state+' original phone image',(out/f'phone-exercise-{title}-{state}.png').is_file())
    initial=json.loads((root/'.audit-tmp/content-r4/initial.json').read_text(encoding='utf-8'))
    for name,digest in initial['untracked'].items():check('initial untracked retained '+name,sha(root/name)==digest)
    for name,digest in initial['tracked'].items():
        if name.startswith('docs/store/screenshots/'):check('old store screenshot unchanged '+name,sha(root/name)==digest)
    archive=json.loads((out/'verification-artifacts/receipt.json').read_text(encoding='utf-8'))
    check('historical verification archived and restored',archive['status']=='VERIFIED')
    for item in archive['archives']:check('archive hash '+item['path'],sha(root/item['path'])==item['sha256'])
    perf=json.loads((out/'performance.json').read_text(encoding='utf-8'))
    check('concurrent-load performance final build',perf['buildSHA256']==sha(root/'dist/game.js'))
    check('reference real RAF p95 <=18ms',perf['status']=='VERIFIED' and all(s['referencePass'] for s in perf['summary']))
    report['performance']=perf['summary']
    patterns=[re.compile('sk-proj-'+'[A-Za-z0-9_-]{20,}|sk-'+'[a-z0-9]{40}'),re.compile('gh'+'[pousr]_[A-Za-z0-9]{36,}'),re.compile('-----BEGIN '+r'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
    hits=[];scanned=0
    for p in root.rglob('*'):
        if not p.is_file() or any(s in {'.git','node_modules','.audit-tmp'} for s in p.relative_to(root).parts):continue
        if p.suffix.lower() in {'.png','.webp','.jpg','.jpeg','.zip','.mp4','.webm','.woff2'}:continue
        scanned+=1
        if any(pattern.search(p.read_text(encoding='utf-8',errors='replace')) for pattern in patterns):hits.append(p.relative_to(root).as_posix())
    report['secretScan']={'files':scanned,'matches':len(hits),'paths':hits};check('zero secret scan hits',not hits)
    version=json.loads((root/'package.json').read_text())['version'];report['version']=version
    check('version and offline cache 0.12.0',version=='0.12.0' and 'trine-frontier-0.12.0' in (root/'dist/sw.js').read_text())
    art=json.loads((out/'art/PROMPTS.json').read_text(encoding='utf-8'))
    manifest={'actualTool':art['actualTool'],'actualModelSlug':art['actualModelSlug'],'masters':1,'files':[]}
    for name in [art['master'],art['runtime']]:
        p=root/name
        with Image.open(p) as im:
            check('transparent art alpha '+name,im.mode=='RGBA' and im.getchannel('A').getextrema()==(0,255))
            manifest['files'].append({'path':name,'size':im.size,'mode':im.mode,'sha256':sha(p)})
    (out/'art/ASSET_MANIFEST.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    report['status']='VERIFIED'
except Exception as exc:
    report['status']='BLOCKED';report['failure']=str(exc)
finally:
    (out/'release.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(report['status'],len(checks),'readbacks;',report.get('failure',''))
if report['status']!='VERIFIED':raise SystemExit(1)
