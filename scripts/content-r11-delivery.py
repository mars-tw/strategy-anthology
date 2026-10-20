"""Bind the 15 unmodified review originals and delivery checks to the tested build."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
from PIL import Image

root = Path(__file__).resolve().parents[1]
out = root / 'docs/content/r11'
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
build = sha(root / 'dist/game.js')
checks = []

def check(name, ok):
    assert ok, name
    checks.append(name)

reports = [read(out / n) for n in ['e2e.json', 'proof-e2e.json']]
for report in reports:
    check('current build passed browser evidence suite', report['status'] == 'VERIFIED' and report['buildSHA256'] == build and not report['errors'])
shots = {s['path']: s for r in reports for s in r['shots']}
for s in shots.values():
    check(s['path'] + ' original SHA256', sha(root / s['path']) == s['sha256'])
for item in read(out / 'before/manifest.json'):
    original = subprocess.check_output(['git','show',item.get('baselineCommit','HEAD')+':'+item['source']],cwd=root)
    check(item['path'] + ' genuine prior-round original', sha(root/item['path']) == item['sha256'] == hashlib.sha256(original).hexdigest())
for item in read(out / 'verification/input-fixtures/manifest.json'):
    original = subprocess.check_output(['git','show',item['baselineCommit']+':'+item['source']],cwd=root)
    check(item['path'] + ' unmodified attained-save fixture', sha(root/item['path']) == item['sha256'] == hashlib.sha256(original).hexdigest())
for report in reports:
    check('browser imported the archived fixture it identified', report['sourceSaveSHA256'] == sha(root/report['sourceSavePath']))
water = [shots[f'docs/content/r11/phone-terrain-flood-enter-{i}.png']['frame'] for i in [1,2]]
shared = set(w['id'] for w in water[0]['wetLabels']) & set(w['id'] for w in water[1]['wetLabels'])
check('consecutive water originals retain the same submerged enemy and increasing measured delay', any(next(u['waterDelay'] for u in water[1]['units'] if u['id']==i) > next(u['waterDelay'] for u in water[0]['units'] if u['id']==i) for i in shared))
selected = [
 ('relay', 'relay-upstream-hit', '留守身份及真實命中'),
 ('relay', 'relay-gate-hit', '城門留塔命中與內縮射程'),
 ('relay', 'relay-gate-same-run-compare', '兩場結果相同且仍有實測資料列'),
 ('relay', 'relay-crystals-spent-reloaded', '拆晶、付款、重載後收據與錢包一致'),
 ('relay', 'relay-ford-ice-hit', '渡口留守冰塔出手，敵軍本體可見'),
 ('terrain', 'terrain-barricade-proof-turn-1', '同一前鋒接近木柵，輔助關'),
 ('terrain', 'terrain-barricade-proof-turn-2', '同一前鋒北轉；腳底位於可見新路'),
 ('terrain', 'terrain-barricade-proof-turn-3', '北路推進且有實際火塔命中'),
 ('terrain', 'terrain-flood-enter-1', '水在路面與腳下，涉水延遲直接來自模擬'),
 ('terrain', 'terrain-flood-enter-2', '涉水連拍，水紋與延遲隨行進更新'),
 ('exercise', 'exercise-turn-formation', '單一編號、付款前預覽與同心完整射程'),
 ('exercise', 'exercise-levee-combat-2', '分散接力命中後，敵軍本體清楚可見'),
 ('exercise', 'exercise-switchback-combat', '底列6、4、5依左右位置排序且有連線'),
 ('exercise', 'exercise-split-combat-2', '雙岸命中後，敵軍本體在塔前可見'),
 ('exercise', 'exercise-hollow-failed-clear', '底列5、4依位置排序；真實首漏與自選提示'),
]
review = out / 'review-set'
review.mkdir(exist_ok=True)
rows = []
for i, (category, name, purpose) in enumerate(selected, 1):
    source = out / f'phone-{name}.png'
    evidence = shots[source.relative_to(root).as_posix()]
    target = review / f'{i:02d}-{name}.png'
    check(name + ' portrait original', Image.open(source).size == (430, 932))
    shutil.copyfile(source, target)
    check(name + ' byte-identical review original', sha(target) == evidence['sha256'])
    rows.append({'category': category, 'path': target.relative_to(root).as_posix(),
                 'source': source.relative_to(root).as_posix(), 'sha256': sha(target), 'purpose': purpose})
check('exactly 15 images, five per content', len(list(review.glob('*.png'))) == 15 and all(sum(r['category'] == c for r in rows) == 5 for c in ['relay', 'terrain', 'exercise']))
(out / 'review-index.json').write_text(json.dumps({'status': 'VERIFIED', 'buildSHA256': build, 'images': rows}, ensure_ascii=False, indent=2), encoding='utf8')
(out / 'REVIEW_INDEX.md').write_text('# R11 精選原圖\n\n每項5張，430×932原尺寸，無裁切、拼圖或文字後製。\n\n' + '\n'.join(f"- `{r['path']}`：{r['purpose']}。" for r in rows) + '\n', encoding='utf8')
(out / 'capture-index.md').write_text('# 原尺寸擷取索引\n\n' + '\n'.join(f"- `{s['path']}`；SHA-256 `{s['sha256']}`。" for s in shots.values()) + '\n', encoding='utf8')
qa = out / 'qa-64px'
qa.mkdir(exist_ok=True)
for name in ['terrain-barricade-proof-turn-3', 'terrain-flood-enter-1', 'exercise-switchback-combat']:
    s = shots[f'docs/content/r11/phone-{name}.png']; box = s['canvas']
    im = Image.open(root / s['path'])
    im = im.crop((round(box['x']), round(box['y']), round(box['x']+box['width']), round(box['y']+box['height'])))
    im.resize((64, round(im.height * 64 / im.width)), Image.Resampling.LANCZOS).save(qa / f'map-{name}.png')
for device, size in [('iphone', (1290,2796)), ('ipad', (2064,2752))]:
    path = root / f'docs/store/screenshots/{device}-content-r11-flood-{size[0]}x{size[1]}.png'
    check(device + ' store dimensions', Image.open(path).size == size)
for name in subprocess.check_output(['git','-c','core.quotepath=false','ls-files','docs/store/screenshots'],cwd=root,encoding='utf8').splitlines():
    original = subprocess.check_output(['git','show','HEAD:'+name],cwd=root)
    check(name + ' existing store original retained', (root/name).is_file() and (root/name).read_bytes() == original)
verification = read(out / 'verification/verification.json')
check('complete verify after cleanup', verification['verifyExitCode'] == 0 and verification['buildSHA256'] == build)
check('verified stylesheet', verification['styleSHA256'] == sha(root / 'dist/style.css'))
runtime = read(out / 'verification/runtime-sources.json')
check('unchanged tested runtime', runtime['unchangedDuringVerification'] and all(sha(root/p) == h for p,h in runtime['sources'].items()))
perf = read(out / 'performance.json')
check('12 real RAF runs', len(perf['runs']) == 12 and all(r['samples'] == 180 for r in perf['runs']))
check('parallel-load p95 reference', perf['status'] == 'VERIFIED' and perf['buildSHA256'] == build and all(s['medianP95'] <= 18 for s in perf['summary']))
cleanup = read(out / 'cleanup.json')
check('superseded tracked media removed', all(not (root/r['path']).exists() for r in cleanup['files']))
protected = read(root / '.audit-tmp/content-r11/protected.json')
check('pre-existing untracked files intact', all((root/p).is_file() and sha(root/p) == h for p,h in protected.items()))
for name in ['package.json', 'package-lock.json', 'src/campaign.js', 'src/version.js', 'README.md']:
    text = (root/name).read_text(encoding='utf8')
    check(name + ' runtime release identity', '0.19.0' in text and '0.18.0' not in text)
pattern = re.compile(r'sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}')
scanned = 0; matches = []
for p in root.rglob('*'):
    if not p.is_file() or any(n in {'.git','node_modules','.audit-tmp'} for n in p.relative_to(root).parts): continue
    try: text = p.read_text(encoding='utf8')
    except (OSError, UnicodeError): continue
    scanned += 1
    if pattern.search(text): matches.append(p.relative_to(root).as_posix())
check('secret scan zero', not matches)
(out / 'verification/secret-scan.json').write_text(json.dumps({'status':'VERIFIED', 'files':scanned, 'matches':len(matches)}, indent=2), encoding='utf8')
art = read(root / 'docs/content/r10/art/manifest.json')
art['method'] = 'Reuse the original generated artwork; map projection, road sampling, water composition and layer ordering only.'
art['newArtwork'] = 0; art['currentGenerationCalls'] = 0
check('retained original artwork unchanged', all(sha(root/s['path']) == s['sha256'] for s in art['sources']))
(out / 'art').mkdir(exist_ok=True)
(out / 'art/manifest.json').write_text(json.dumps(art, ensure_ascii=False, indent=2), encoding='utf8')
(out / 'verification/release-check.json').write_text(json.dumps({'status':'VERIFIED','version':'0.19.0','buildSHA256':build,'checks':checks}, ensure_ascii=False, indent=2), encoding='utf8')
print(f'VERIFIED {len(checks)} release checks, {len(shots)} original captures, 15 review images; secrets 0')
