"""Build the bounded review set from this build's unmodified browser screenshots."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import re
import shutil

root = Path(__file__).resolve().parents[1]
out = root / 'docs/content/r10'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
build = sha(root / 'dist/game.js')
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)

reports = [read(out / n) for n in ['e2e.json', 'proof-e2e.json']]
for r in reports:
    check('test actually verifies final build', r['status'] == 'VERIFIED' and r['buildSHA256'] == build and not r['errors'])
shots = {s['path']: s for r in reports for s in r['shots']}
for s in shots.values():
    check(s['path'] + ' original hash', sha(root / s['path']) == s['sha256'])
selected = [
    ('relay', 'relay-upstream-hit', '上游工事真實命中，R8／R9 留塔回歸'),
    ('relay', 'relay-gate-hit', '城門工事真實命中與短摘要'),
    ('relay', 'relay-gate-same-run-compare', '同場首波及同配置重演；相同列收合'),
    ('relay', 'relay-crystals-spent-reloaded', '390＋90＝480，建三塔後180，重載收據及塔卡一致'),
    ('relay', 'relay-ford-ice-hit', '渡口冰塔接力及結霜回歸'),
    ('terrain', 'terrain-barricade-proof-turn-1', '同一前鋒接近；完整木柵、無橫越地圖的錨線'),
    ('terrain', 'terrain-barricade-proof-turn-2', '同一前鋒北轉，位移至少一個身寬'),
    ('terrain', 'terrain-barricade-proof-turn-3', '同一前鋒走北路，真實命中'),
    ('terrain', 'terrain-flood-enter-1', '原畫水岸、行速×52%及新增秒數、真實冰塔命中同框'),
    ('terrain', 'terrain-replay-compare', 'R8／R9 同預算回顧、全隊時間、關鍵差值'),
    ('exercise', 'exercise-turn-formation', '地圖實際塔位、預覽射程同心、確認付款'),
    ('exercise', 'exercise-levee-complete', '零共鳴／留空通關回歸'),
    ('exercise', 'exercise-switchback-combat', '地圖塔體與三印共鳴，甲犬避塔、無重疊小圓'),
    ('exercise', 'exercise-split-combat', '雙岸原畫與橋樑、道路柔邊、直接塔位交火'),
    ('exercise', 'exercise-hollow-failed-clear', '輔助關閉的真正首漏，塔體完整、提示尚未展開'),
]
(out / 'review-set').mkdir(exist_ok=True)
images = []
for n, (category, name, purpose) in enumerate(selected, 1):
    source = out / ('phone-' + name + '.png')
    target = out / 'review-set' / (f'{n:02d}-' + name + '.png')
    check(name + ' belongs to current executed captures', source.relative_to(root).as_posix() in shots)
    check(name + ' native phone dimensions', Image.open(source).size == (430, 932))
    if name=='terrain-flood-enter-1':
        frame=shots[source.relative_to(root).as_posix()]['frame']
        check('selected water frame proves actual slowdown and frost impact together',bool(frame['wetLabels']) and any(f['type']=='frost' and f['damage']>0 for f in frame['impacts']))
    if category=='exercise':
        frame=shots[source.relative_to(root).as_posix()]['frame']
        for t in frame['towers']:
            check(name+' tower matches map base',abs(t['x']-t['anchorX'])<.01 and abs(t['y']-t['anchorY'])<.01)
        for u in frame['units']:
            a={'x':u['x']-u['width']/2,'y':u['y']-u['poseHeight'],'w':u['width'],'h':u['poseHeight']}
            for t in frame['towers']:
                b={'x':t['x']-t['h']*.4,'y':t['y']-t['h'],'w':t['h']*.8,'h':t['h']}
                area=max(0,min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x']))*max(0,min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y']))
                check(name+' selected original has <=20percent tower occlusion',area<=b['w']*b['h']*.2)
    shutil.copy2(source, target)
    check(name + ' byte-identical copy', sha(source) == sha(target))
    images.append({'category': category, 'source': source.relative_to(root).as_posix(), 'path': target.relative_to(root).as_posix(), 'sha256': sha(target), 'purpose': purpose})
check('exactly15 files, three categories each5', len(list((out / 'review-set').iterdir())) == 15 and all(sum(i['category'] == c for i in images) == 5 for c in ['relay', 'terrain', 'exercise']))
(out / 'review-set-manifest.json').write_text(json.dumps({'status': 'VERIFIED', 'buildSHA256': build, 'images': images}, ensure_ascii=False, indent=2), encoding='utf-8')
(out / 'REVIEW_INDEX.md').write_text('# R10 審查精選集\n\nVERIFIED：15張430×932原尺寸圖，三項各5張，全部逐位元組複製，未裁切／縮放／拼圖。\n\n' + '\n'.join(f"- {Path(i['path']).name}：{i['purpose']}" for i in images) + '\n\n完整五題各態、三分支決策及下一場、展開明細、施工前後與回歸圖均列於 capture-index.md；精選集受15張限制。\n', encoding='utf-8')
(out / 'capture-index.md').write_text('# R10 當次原圖\n\n' + '\n'.join(f"- `{s['path']}`，{s['viewport']}，DPR {s['dpr']}，SHA-256 `{s['sha256']}`" for s in shots.values()) + '\n', encoding='utf-8')
extra=read(out/'supplementary-regression.json')
check('alternative and resumed captures belong to current build',extra['status']=='VERIFIED' and extra['buildSHA256']==build)
for row in extra['images']:
    check(row['path']+' supplemental original hash',sha(root/row['path'])==row['sha256'])
with (out/'capture-index.md').open('a',encoding='utf8') as index:
    index.write('\n## R3 當次替代解與重載回歸\n\n'+'\n'.join(f"- `{s['path']}`，來源 `{s['source']}`，SHA-256 `{s['sha256']}`" for s in extra['images'])+'\n')
art = ['public/assets/content-r7/flood.webp', 'public/assets/content-r6/barricade.webp', 'public/assets/content-r7/legacy-cannon.webp', 'public/assets/r7/ford.webp', 'public/assets/r7/hound-walk.png', 'public/assets/r7/hound-frames.json', 'public/assets/r5/structure-frames.json', 'public/assets/r4/pine.webp', 'public/assets/r3/chapter-quarry.webp', 'public/assets/r4/road.webp', *[f'public/assets/r4/tower-{s}.png' for s in ['cannon','frost','tesla']], *[f'public/assets/r7/bridge-{s}.png' for s in ['main','old','military']]]
(out / 'art').mkdir(exist_ok=True)
prompts=read(root / 'docs/art/PROMPTS_R7.json')
prefix=prompts['stylePrefix']
check('retained artwork has recorded style and actual tool',bool(prefix) and bool(prompts['actualTool']))
(out / 'art/manifest.json').write_text(json.dumps({'status':'VERIFIED','newArtwork':0,'currentGenerationCalls':0,'historicalGenerator':prompts['actualTool'],'stylePrefix':prefix,'method':'Reuse authored mineral-pigment artwork. Canvas2D edge alpha and shared map projection only. No generated placeholder art.','sources':[{'path':p,'sha256':sha(root/p)} for p in art]}, ensure_ascii=False, indent=2),encoding='utf-8')
for name, size in [('iphone-content-r10-flood-1290x2796.png',(1290,2796)),('ipad-content-r10-flood-2064x2752.png',(2064,2752))]:
    check(name+' store size',Image.open(root/'docs/store/screenshots'/name).size==size)
# Explicitly requested 64px inspection derivatives are kept outside the review set.
(out/'qa-64px').mkdir(exist_ok=True)
for name in ['terrain-barricade-proof-turn-3','terrain-flood-enter-1','exercise-split-combat']:
    s=shots[(out/('phone-'+name+'.png')).relative_to(root).as_posix()]
    box=s.get('canvas')
    if box:
        im=Image.open(root/s['path']);im=im.crop((round(box['x']),round(box['y']),round(box['x']+box['width']),round(box['y']+box['height'])))
        im.resize((64,round(im.height*64/im.width)),Image.Resampling.LANCZOS).save(out/'qa-64px'/('map-'+name+'.png'))
verification=read(out/'verification/verification.json')
check('npm run verify exit0',verification['verifyExitCode']==0 and verification['buildSHA256']==build)
check('stylesheet matches the verified release',sha(root/'dist/style.css')==verification['styleSHA256'])
perf=read(out/'performance.json')
check('real RAF benchmark covers twelve180sample runs',len(perf['runs'])==12 and all(r['samples']==180 for r in perf['runs']))
check('parallel-load reference p95 gate',perf['status']=='VERIFIED' and perf['buildSHA256']==build and all(r['medianP95']<=18 for r in perf['summary']))
check('physical-device performance remains explicitly untested',perf['physicalDeviceGate']=='BLOCKED' and bool(perf['warning']))
runtime=read(out/'verification/runtime-sources.json')
check('same runtime sources as the running verification build',runtime['buildSHA256']==build and all(sha(root/p)==value for p,value in runtime['sources'].items()))
runtime['status']='VERIFIED'
(out/'verification/runtime-sources.json').write_text(json.dumps(runtime,indent=2),encoding='utf8')
check('historical evidence restored',read(out/'verification/historical-readback.json')['changed']==[])
evidence=read(root/'docs/evidence/content-r10/manifest.json')
check('before/after originals and three viewport copies retained',len(evidence)==9 and sum(r['stage']=='before' for r in evidence)==3)
for row in evidence:
    check(row['path']+' is a byte-identical source copy',sha(root/row['path'])==sha(root/row['source'])==row['sha256'])
    if row['stage']=='after':check(row['path']+' belongs to verified build',row['buildSHA256']==build)
for name,dimensions in [('viewport-phone-430x932.png',(430,932)),('viewport-ipad-1032x1376.png',(1032,1376)),('viewport-desktop-1366x600.png',(1366,600))]:
    check(name+' viewport dimensions',Image.open(root/'docs/evidence/content-r10'/name).size==dimensions)
check('runtime release identity',all('0.18.0' in (root/p).read_text(encoding='utf8') and '0.17.0' not in (root/p).read_text(encoding='utf8') for p in ['package.json','package-lock.json','src/campaign.js','src/version.js','README.md']))
pattern=re.compile(r'sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}')
scanned=0;matches=[]
for p in root.rglob('*'):
    if not p.is_file() or any(n in {'.git','node_modules','.audit-tmp'} for n in p.relative_to(root).parts):continue
    try:text=p.read_text(encoding='utf8')
    except (UnicodeError,OSError):continue
    scanned+=1
    if pattern.search(text):matches.append(p.relative_to(root).as_posix())
(out/'verification/secret-scan.json').write_text(json.dumps({'status':'VERIFIED' if not matches else 'BLOCKED','files':scanned,'matches':len(matches),'paths':matches},indent=2),encoding='utf8')
check('secret scan zero',not matches)
(out/'verification/release-check.json').write_text(json.dumps({'status':'VERIFIED','version':'0.18.0','buildSHA256':build,'checks':checks},ensure_ascii=False,indent=2),encoding='utf8')
print(f'VERIFIED {len(checks)} delivery checks, 15 byte-identical phone originals, {len(shots)} current captures; secret matches0.')
