"""Validate this build's evidence and copy fifteen untouched portrait captures."""
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parent.parent
read=lambda n:json.loads((root/n).read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
initial=read('.audit-tmp/content-r7/initial.json')
e2e=read('docs/content/r7/e2e.json')
verify=read('docs/content/r7/verification-artifacts/npm-verify.json')
perf=read('docs/content/r7/performance.json')
build=sha(root/'dist/game.js')
assert e2e['status']=='VERIFIED',e2e.get('failure')
assert verify['status']=='VERIFIED' and verify['exitCode']==0
assert e2e['buildSHA256']==verify['buildSHA256']==perf['buildSHA256']==build
input_copy=root/'docs/content/r7/verification-artifacts/historical/docs/content/r6/attained-quarry-save.json'
assert sha(input_copy)==e2e['sourceSaveSHA256'],'The actual imported save must remain available after historical restore'
sources={p.relative_to(root).as_posix():sha(p) for p in (root/'src').iterdir() if p.is_file()}
assert sources==verify['runtimeSources'],'Source changed after verification'
assert len(e2e['exercises'])==5
for row in e2e['exercises'].values():
    assert row['win']['result']=='won' and row['loss']['result']=='lost'
    assert row['win']['spent']==row['loss']['spent']
    assert row['win']['budget']==row['loss']['budget']==0 and row['loss']['firstLeak']['hp']>0
for row in e2e['shots']:
    p=root/row['path'];assert sha(p)==row['sha256']
    assert Image.open(p).size==(row['viewport']['width']*row['dpr'],row['viewport']['height']*row['dpr'])
selected=[
 ('relay','relay-choices'),('relay','relay-upstream-hit'),('relay','relay-gate-hit'),
 ('relay','relay-crystals-hit'),('relay','relay-replay-compare'),
 ('terrain','terrain-barricade-after'),('terrain','terrain-flood-enter-1'),
 ('terrain','terrain-flood-enter-2'),('terrain','terrain-flood-enter-3'),('terrain','terrain-replay-compare'),
 ('exercise','exercise-hollow-formation'),('exercise','exercise-hollow-combat'),
 ('exercise','exercise-hollow-complete'),('exercise','exercise-hollow-losing-formation'),('exercise','exercise-hollow-failed'),
]
out=root/'docs/content/r7/review-set';out.mkdir(parents=True,exist_ok=True)
assert not [p for p in out.iterdir() if p.suffix.lower()!='.png']
rows=[]
for i,(content,name) in enumerate(selected,1):
    source=root/f'docs/content/r7/phone-{name}.png';target=out/f'{i:02}-{name}.png'
    shutil.copyfile(source,target);assert sha(source)==sha(target)
    size=Image.open(target).size;assert size[0]<size[1]
    rows.append({'content':content,'source':source.relative_to(root).as_posix(),'path':target.relative_to(root).as_posix(),'size':size,'sha256':sha(target)})
assert len(list(out.glob('*.png')))==15
for name,h in initial['untracked'].items():assert sha(root/name)==h,name
for name,h in initial['tracked'].items():
    if name.startswith('docs/') and name not in {'docs/art/ART_DIRECTION.md','docs/store/SCREENSHOTS.md'}:
        assert sha(root/name)==h,'Historical evidence changed: '+name
    if name.startswith('docs/store/screenshots/'):
        assert sha(root/name)==h,'Existing store screenshot changed: '+name
for name,size in [('iphone',(1290,2796)),('ipad',(2064,2752))]:
    assert Image.open(root/f'docs/store/screenshots/{name}-content-r7-flood-{size[0]}x{size[1]}.png').size==size
paths=[n.decode('utf-8') for n in subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).split(b'\0') if n]
pattern=re.compile('sk-proj-'+r'[A-Za-z0-9_-]{20,}|sk-'+r'[a-z0-9]{40}')
hits=[]
for name in paths:
    p=root/name
    if p.is_file() and p.suffix.lower() not in {'.png','.webp','.jpg','.zip','.webm','.mp4','.woff2'}:
        if pattern.search(p.read_text(encoding='utf-8',errors='ignore')):hits.append(name)
assert not hits,hits
manifest=read('docs/content/r7/art/ASSET_MANIFEST.json')
for a in manifest['assets']:
    assert sha(root/a['original'])==a['originalSHA256'] and sha(root/a['runtime'])==a['sha256']
release={'status':'VERIFIED','version':read('package.json')['version'],'headBefore':initial['head'],
 'buildSHA256':build,'runtimeSourceSHA256':sources,'uiChecks':len(e2e['checks']),'originalScreenshots':len(e2e['shots']),
 'actualInputCopy':input_copy.relative_to(root).as_posix(),'actualInputSHA256':e2e['sourceSaveSHA256'],
 'generatedMasters':len(manifest['assets']),'secretScan':{'files':len(paths),'matches':0},'reviewSet':rows,
 'performanceStatus':perf['status'],'performanceSummary':perf['summary'],
 'method':'15 byte-identical original portrait captures, five per content. No retouching, resizing or collages.',
 'physicalDevice':'BLOCKED: needs physical phones and tablets plus a tester',
 'audioListening':'BLOCKED: still screenshots cannot prove audible timbre; requires actual listening',
 'museScore':'BLOCKED: awaits independent Muse reassessment'}
(root/'docs/content/r7/release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2),encoding='utf-8')
index='# R7 審查精選原圖\n\nVERIFIED：15 張 430×932 手機直式原圖，三項各 5 張；逐位元組複製，無縮放、裁切、拼圖或補畫。07–09 是同一段入水過程的連續三格。12 含雷印命中、折線及實扣明細。完整五項驗收證據見 CODEX_RESPONSE_CONTENT_R7.md。\n\n'
for row in rows:index+=f"- `{Path(row['path']).name}` ← `{Path(row['source']).name}`\n"
(root/'docs/content/r7/REVIEW_INDEX.md').write_text(index,encoding='utf-8')
print(f"VERIFIED: {len(e2e['checks'])} UI checks; {len(e2e['shots'])} original captures; 15 selected; zero secret hits; perf {perf['status']}")
