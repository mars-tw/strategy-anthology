"""Archive current regression receipts, restore historical non-media outputs, clean regenerated old media."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
out = root / 'docs/content/r11'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
verification = read(out / 'verification/verification.json')
assert verification['status'] == 'VERIFIED' and verification['verifyExitCode'] == 0
assert sha(root / 'dist/game.js') == verification['buildSHA256']
archive = out / 'verification/regression-receipts'
archive.mkdir(exist_ok=True)
for item in read(out / 'verification/regressions.json'):
    p = root / item['path']
    assert sha(p) == item['sha256']
    shutil.copyfile(p, archive / item['path'].replace('/', '--'))

protected = read(root / '.audit-tmp/content-r11/protected.json')
for name, digest in protected.items():
    assert (root/name).is_file() and sha(root/name) == digest, name

current_art = []
for label in ['r2','r7']:
    report_path = root / f'docs/art/{label}/visual-audit.json'
    if not report_path.is_file(): continue
    art_report = read(report_path)
    shutil.copyfile(report_path, archive / f'art-{label}-visual-audit.json')
    video = art_report.get('video')
    if not video: continue
    source = Path(video)
    if not source.is_absolute(): source = root / source
    source = source.resolve()
    assert source.is_relative_to(root)
    name = source.relative_to(root).as_posix()
    if name in protected or not source.is_file(): continue
    target = out / 'verification' / f'art-{label}-current-motion.webm'
    assert target.resolve().is_relative_to(root)
    shutil.copyfile(source,target)
    current_art.append({'source':name,'path':target.relative_to(root).as_posix(),'sha256':sha(target)})
    source.unlink() # This exact new video was created by this verification run.
(out / 'verification/art-motion.json').write_text(json.dumps(current_art,indent=2),encoding='utf8')
owned_path = root / '.audit-tmp/content-r11/owned-temporary-media.json'
removed_temporary = []
if owned_path.is_file():
    for item in read(owned_path):
        source = (root / item['path']).resolve()
        assert source.is_relative_to(root / 'docs/art') and source.suffix == '.webm'
        assert item['path'] not in protected
        if source.is_file():
            assert sha(source) == item['sha256']
            source.unlink()
            removed_temporary.append(item)
(out / 'verification/own-temporary-media-removed.json').write_text(json.dumps(removed_temporary,indent=2),encoding='utf8')

media = {i['path'] for i in read(out / 'cleanup.json')['files']}
changed = subprocess.check_output(['git', '-c', 'core.quotepath=false', 'diff', '--name-only', '--diff-filter=M'], cwd=root, encoding='utf8').splitlines()
restored = []
for name in changed:
    if not name.startswith('docs/') or name.startswith('docs/content/r11/') or name in media:
        continue
    # The initial worktree had no tracked modifications. Only the repository's
    # verification output directories are restored; review Markdown is untouched.
    if not name.startswith(('docs/art/', 'docs/content/', 'docs/evidence/', 'docs/store/screenshots/')) or name.endswith('.md'):
        continue
    data = subprocess.check_output(['git', 'show', 'HEAD:' + name], cwd=root)
    (root/name).write_bytes(data)
    restored.append(name)

subprocess.run(['python', 'scripts/content-r11-cleanup.py'], cwd=root, check=True)
# Remove only our stale debug report, not any pre-existing untracked file.
for name in ['map-debug.json','rwd-debug.json','diagnostic.json','diagnostic-landscape-planning.png','diagnostic-landscape-active.png','diagnostic-small.json','diagnostic-small-normal.png','diagnostic-landscape-normal.json','diagnostic-landscape-normal.png','budget-source-debug.json']:
    debug = out / name
    assert debug.resolve().is_relative_to(root) and debug.relative_to(root).as_posix() not in protected
    if debug.is_file(): debug.unlink()

evidence = root / 'docs/evidence/content-r11'
evidence.mkdir(exist_ok=True)
rows = []
for name in ['terrain-barricade-proof-turn-2', 'terrain-flood-enter-1', 'exercise-switchback-combat']:
    source = out / f'phone-{name}.png'
    target = evidence / f'after-{name}.png'
    shutil.copyfile(source, target)
    rows.append({'source':source.relative_to(root).as_posix(),'path':target.relative_to(root).as_posix(),'stage':'after','sha256':sha(target),'buildSHA256':verification['buildSHA256']})
for name,size in [('phone',(430,932)),('ipad',(1032,1376)),('desktop',(1366,600))]:
    source = out / f'phone-layout-{size[0]}x{size[1]}-result.png'
    target = evidence / f'viewport-{name}-{size[0]}x{size[1]}.png'
    shutil.copyfile(source,target)
    rows.append({'source':source.relative_to(root).as_posix(),'path':target.relative_to(root).as_posix(),'stage':'viewport','sha256':sha(target),'buildSHA256':verification['buildSHA256']})
(evidence / 'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
(out / 'verification/historical-readback.json').write_text(json.dumps({'status':'VERIFIED','restored':restored,'protectedUntracked':len(protected),'allProtectedHashesMatch':True,'note':'Current regression receipts copied before restoring historical output JSON and existing store captures.'},indent=2),encoding='utf8')
print('VERIFIED preserved untracked files', len(protected), 'restored historical verification outputs',len(restored))
