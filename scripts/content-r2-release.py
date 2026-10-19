"""Read back the final local release and its evidence. Does not modify runtime."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
from PIL import Image

root = Path(__file__).resolve().parent.parent
out = root / 'docs/content/r2'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads((root / p).read_text(encoding='utf-8'))
e2e = read('docs/content/r2/e2e.json')
touch = read('docs/content/r2/touch-e2e.json')
perf = read('docs/content/r2/performance.json')
archives = read('docs/content/r2/verification-artifacts/receipt.json')
initial = read('.audit-tmp/content-r2/initial.json')
checks = []
def check(name, value):
    checks.append({'name': name, 'pass': bool(value)})
    return value
check('R2 real operation E2E verified', e2e['status'] == 'VERIFIED')
log_path = out / 'verify-release.txt'
raw_log = log_path.read_bytes()
log = raw_log.decode('utf-16') if raw_log.startswith((b'\xff\xfe', b'\xfe\xff')) else raw_log.decode('utf-8-sig')
check('full npm verify reached its final successful check',
      f"VERIFIED: {len(e2e['checks'])} checks, {len(e2e['shots'])} original screenshots" in log
      and '80 passed (80)' in log)
check('R2 E2E bound to final game bytes', e2e['buildSHA256'] == sha(root / 'dist/game.js'))
check('full touch journeys verified on same game bytes', touch['status'] == 'VERIFIED'
      and touch['buildSHA256'] == sha(root / 'dist/game.js'))
check('performance bound to final game bytes', perf['buildSHA256'] == sha(root / 'dist/game.js'))
check('concurrent-load reference p95 passes', perf['status'] == 'VERIFIED')
check('legacy evidence retained and restored', archives['status'] == 'VERIFIED')
for name, old_hash in initial['untracked'].items():
    check('initial untracked preserved: ' + name, sha(root / name) == old_hash)
for name, old_hash in initial['tracked'].items():
    if name.startswith('docs/store/screenshots/'):
        check('old store screenshot unchanged: ' + name, sha(root / name) == old_hash)
shots = []
for item in e2e['shots'] + touch['shots']:
    p = root / item['path']
    with Image.open(p) as im:
        size = im.size
    check('native screenshot dimensions: ' + item['path'], size == (
        round(item['viewport']['width'] * item['dpr']), round(item['viewport']['height'] * item['dpr'])))
    shots.append({'path': item['path'], 'size': list(size), 'sha256': sha(p)})
for topic in ['turn', 'levee', 'switchback']:
    for state in ['formation', 'combat', 'failed', 'complete']:
        p = out / f'phone-exercise-{topic}-{state}.png'
        with Image.open(p) as im:
            check(f'{topic} {state} portrait original', im.size == (430, 932))
media = []
for item in e2e['videos'] + touch['videos']:
    p = root / item['path']
    metadata = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,width,height,nb_read_frames:format=duration',
        '-of', 'json', str(p)], creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)))
    video = next(s for s in metadata['streams'] if s['codec_type'] == 'video')
    check('video native dimensions and no audio: ' + item['path'],
          (video['width'], video['height']) == (item['viewport']['width'], item['viewport']['height'])
          and int(video['nb_read_frames']) == item['frames']
          and not any(s['codec_type'] == 'audio' for s in metadata['streams']))
    media.append({'path': item['path'], 'sha256': sha(p), 'metadata': metadata})
manifest = read('docs/content/r2/art/ASSET_MANIFEST.json')
check('new generated art exact source', sha(root / manifest['source']) == manifest['sha256'])
scan = []
pattern = re.compile('sk-proj-' + r'[A-Za-z0-9_-]{20,}|sk-' + r'[a-z0-9]{40}')
count = 0
for p in root.rglob('*'):
    if not p.is_file() or any(part in {'.git', '.audit-tmp', 'node_modules'} for part in p.relative_to(root).parts):
        continue
    if p.suffix.lower() in {'.png', '.jpg', '.webp', '.webm', '.mp4', '.zip', '.woff2', '.ttf'}:
        continue
    count += 1
    if pattern.search(p.read_bytes().decode('utf-8', errors='ignore')):
        scan.append(p.relative_to(root).as_posix())
check('secret scan zero matches', not scan)
release_sources = ['package.json', 'package-lock.json', 'README.md', 'CREDITS.md', 'scripts/build.mjs',
                   'scripts/content-r2-e2e.mjs', 'scripts/content-r2-touch-evidence.mjs',
                   'scripts/content-r2-perf.mjs', 'tests/content-r2.test.js']
release_sources += [p.relative_to(root).as_posix() for p in (root / 'src').rglob('*') if p.is_file()]
check('old 0.9.0 absent from active identity', all('0.9.0' not in (root / p).read_text(encoding='utf-8')
      for p in ['package.json', 'package-lock.json', 'src/version.js', 'src/campaign.js', 'README.md']))
runtime = [p for p in (root / 'dist').rglob('*') if p.is_file()]
result = {'status': 'VERIFIED' if all(c['pass'] for c in checks) else 'BLOCKED',
          'version': read('package.json')['version'], 'sourceHead': initial['head'],
          'gameSHA256': sha(root / 'dist/game.js'), 'styleSHA256': sha(root / 'dist/style.css'),
          'verifyCommand': 'npm run verify', 'verifyLogSHA256': sha(log_path),
          'checks': checks, 'e2eChecks': len(e2e['checks']), 'fullTouchChecks': len(touch['checks']),
          'screenshots': shots, 'videos': media,
          'secretScan': {'files': count, 'matches': len(scan), 'paths': scan},
          'sources': [{'path': p, 'sha256': sha(root / p)} for p in release_sources],
          'runtime': {'files': len(runtime), 'bytes': sum(p.stat().st_size for p in runtime)},
          'externalGates': {'humanComprehension': 'BLOCKED: five new players required',
                            'physicalIOS': 'BLOCKED: devices required', 'idleNativePerformance': 'BLOCKED',
                            'independentMuseScore': 'BLOCKED: new independent review required'}}
(out / 'release.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"{result['status']}: {len(checks)} readbacks; {len(shots)} original screenshots; {len(media)} videos; {len(scan)} secret matches.")
raise SystemExit(0 if result['status'] == 'VERIFIED' else 1)
