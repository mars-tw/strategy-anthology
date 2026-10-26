"""Read back actual R6 output, select original portrait PNGs, and enforce release gates."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda n: json.loads((root / n).read_text(encoding='utf-8'))
initial = read('.audit-tmp/content-r6/initial.json')
e2e = read('docs/content/r6/e2e.json')
assert e2e['status'] == 'VERIFIED', e2e.get('failure')
assert digest(root / 'dist/game.js') == e2e['buildSHA256']
ice = read('docs/content/r6/hit-proof.json')
assert ice['status'] == 'VERIFIED' and ice['buildSHA256'] == e2e['buildSHA256'] and ice['hit']['hpAfter'] > 0
verify = read('docs/content/r6/verification-artifacts/npm-verify.json')
assert verify['status'] == 'VERIFIED' and verify['exitCode'] == 0
assert verify['buildSHA256'] == e2e['buildSHA256']
perf = read('docs/content/r6/performance.json')
assert perf['status'] == 'VERIFIED'
assert perf['buildSHA256'] == e2e['buildSHA256']
assert len(e2e['exercises']) == 5 and all(v['win']['result'] == 'won' and v['loss']['result'] == 'lost'
    and v['win']['spent'] == v['loss']['spent'] and v['win']['budget'] == v['loss']['budget'] == 0
    for v in e2e['exercises'].values())
for row in e2e['shots']:
    p = root / row['path']
    assert digest(p) == row['sha256'], p
    assert Image.open(p).size == (row['viewport']['width'] * row['dpr'], row['viewport']['height'] * row['dpr'])

selected = [
    ('relay', 'relay-choice'),
    ('relay', 'relay-upstream-before'),
    ('relay', 'relay-upstream-hit'),
    ('relay', 'impact-frost-hit'),
    ('relay', 'report-relay-crystals'),
    ('terrain', 'terrain-flood-after'),
    ('terrain', 'terrain-flood-enter'),
    ('terrain', 'terrain-barricade-before'),
    ('terrain', 'terrain-barricade-after'),
    ('terrain', 'terrain-barricade-enter'),
    ('exercise', 'exercise-turn-combat'),
    ('exercise', 'exercise-levee-combat'),
    ('exercise', 'exercise-switchback-combat'),
    ('exercise', 'exercise-split-combat'),
    ('exercise', 'exercise-hollow-complete'),
]
dest = root / 'docs/content/r6/review-set'
dest.mkdir(parents=True, exist_ok=True)
rows = []
for i, (kind, name) in enumerate(selected, 1):
    p = root / f'docs/content/r6/phone-{name}.png'
    assert any(s['path'] == p.relative_to(root).as_posix() for s in e2e['shots'])
    assert Image.open(p).size == (430, 932)
    q = dest / f'{i:02d}-{name}.png'
    q.write_bytes(p.read_bytes())
    assert digest(q) == digest(p)
    rows.append(dict(category=kind, path=q.relative_to(root).as_posix(), source=p.relative_to(root).as_posix(), sha256=digest(q), size=[430, 932]))
assert len(list(dest.glob('*.png'))) == 15

for n, old in initial['untracked'].items():
    assert digest(root / n) == old, f'Initial untracked changed: {n}'
for n, old in initial['tracked'].items():
    if n.startswith('docs/') and n != 'docs/store/SCREENSHOTS.md':
        assert digest(root / n) == old, f'Historical documentation or screenshot changed: {n}'

art = read('docs/content/r6/art/ASSET_MANIFEST.json')
prompts = read('docs/content/r6/art/PROMPTS.json')
assert prompts['stylePrefix'] == read('docs/art/PROMPTS_R7.json')['stylePrefix']
assert art['actualTool'] == prompts['actualTool'] == 'image_gen__imagegen'
for a in art['samples']:
    assert digest(root / a['original']) == a['sha256']
    assert digest(root / a['runtime']) == a['runtimeSHA256']
    assert Image.open(root / a['original']).getchannel('A').getextrema() == (0, 255)

paths = [n.decode('utf-8') for n in subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).split(b'\0') if n]
pattern = re.compile('sk-proj-' + r'[A-Za-z0-9_-]{20,}|sk-' + r'[a-z0-9]{40}')
hits = []
for n in paths:
    p = root / n
    if not p.is_file() or p.suffix.lower() in {'.png', '.webp', '.jpg', '.zip', '.webm', '.mp4', '.woff2'}:
        continue
    if pattern.search(p.read_text(encoding='utf-8', errors='ignore')):
        hits.append(n)
assert not hits, hits
runtime_sources = {p.relative_to(root).as_posix(): digest(p) for p in (root / 'src').iterdir() if p.is_file()}
prior_sources = read('docs/content/r6/verification-artifacts/historical/docs/content/r5/e2e.json')['sourceSHA256']
assert runtime_sources == prior_sources, 'Runtime sources changed after the full verification build'
result = dict(runtimeSourceSHA256=runtime_sources, status='VERIFIED', version='0.14.0', headBefore=initial['head'],
    buildSHA256=e2e['buildSHA256'], checks=len(e2e['checks']), originalScreenshots=len(e2e['shots']),
    secretScan=dict(files=len(paths), matches=0), generatedMasters=2, runtimeAssets=2,
    reviewSet=rows, method='15 byte-identical original portrait gameplay screenshots; no collages, resampling, cropping or retouching.',
    physicalDevice='BLOCKED: requires real phones/tablets and a tester', museScore='BLOCKED: awaits independent Muse review')
(root / 'docs/content/r6/release.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
index = '# R6 審查精選原圖\n\nVERIFIED：15 張 430×932 手機直式原圖，三項內容各 5 張。逐位元組複製，沒有拼圖、裁切、縮放或補畫；02–03 為同一發火彈；04 是渡口繼承冰塔對存活敵軍的結霜命中。完整五項驗收與額外原圖見 CODEX_RESPONSE_CONTENT_R6.md。\n\n'
for row in rows:
    index += f"- `{Path(row['path']).name}` ← `{Path(row['source']).name}`\n"
(root / 'docs/content/r6/REVIEW_INDEX.md').write_text(index, encoding='utf-8')
print(f"VERIFIED: {len(e2e['checks'])} UI checks, {len(e2e['shots'])} original captures, 15 byte-identical selected portraits, zero secret hits.")
