"""Read back the final local build and evidence without launching a browser."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent.parent
out = root / 'docs/content/r3'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
checks = []

def check(name, ok):
    checks.append({'name': name, 'pass': bool(ok)})
    assert ok, name

report = {'status': 'EXECUTED', 'version': json.loads((root/'package.json').read_text())['version'],
          'checks': checks, 'screenshots': [], 'videos': [], 'secretScan': {},
          'humanAndPhysicalDevices': 'BLOCKED: five new players, physical iPhone and iPad required',
          'independentMuseScore': 'BLOCKED: independent review required; no self-assigned score'}
try:
    e2e = json.loads((out/'e2e.json').read_text(encoding='utf-8'))
    check('final headless evidence passes', e2e['status'] == 'VERIFIED' and not e2e['errors'])
    check('evidence bound to final build', e2e['buildSHA256'] == sha(root/'dist/game.js'))
    perf = json.loads((out/'performance.json').read_text(encoding='utf-8'))
    check('real RAF performance bound to final build', perf['buildSHA256'] == sha(root/'dist/game.js'))
    check('concurrent-load reference p95 threshold', perf['status'] == 'VERIFIED' and all(x['medianP95'] <= 18 for x in perf['summary']))
    report['performance'] = perf['summary']
    report['buildSHA256'] = sha(root/'dist/game.js')
    report['styleSHA256'] = sha(root/'dist/style.css')
    for shot in e2e['shots']:
        p = root/shot['path']
        with Image.open(p) as im:
            expected = (shot['viewport']['width']*shot['dpr'], shot['viewport']['height']*shot['dpr'])
            check(shot['path']+' original screenshot dimensions', im.size == expected)
            report['screenshots'].append({'path': shot['path'], 'size': im.size, 'sha256': sha(p)})
    for stem in ['terrain-flood-slow', 'terrain-barricade-arrows', 'ford-crystals-flight']:
        images = [Image.open(out/f'phone-{stem}-{n}.png').convert('RGB') for n in [1,2,3]]
        for i in [0,1]:
            check(stem+f' frame {i+1} to {i+2} changes actual pixels', ImageChops.difference(images[i], images[i+1]).getbbox() is not None)
    for id in ['turn','levee','switchback']:
        for state in ['formation','combat','failed','complete','losing-formation','retry']:
            check(id+' '+state+' full phone evidence', (out/f'phone-exercise-{id}-{state}.png').is_file())
    for choice in ['barricade','flood']:
        samples = json.loads((out/f'{choice}-route-samples.json').read_text())
        progress = [x['progress'] for x in samples if x.get('progress')]
        check(choice+' tracked actual actor reaches castle', progress[-1]['escaped'] and progress[-1]['percent'] == 100)
        check(choice+' at least three distinct actual actor positions', len({(round(p['x']),round(p['y'])) for p in progress}) > 30)
        if choice == 'flood':
            check('visible flooded actor speed is 52 percent of normal', any(p['wet'] and p['speed'] == 26 for p in progress) and any(not p['wet'] and p['speed'] == 50 for p in progress))
    for movie in e2e['videos']:
        p = root/movie['path']
        probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-of','json',str(p)], encoding='utf-8'))
        streams = probe['streams']
        video = streams[0]
        check(movie['path']+' complete video frames, dimensions and no fabricated audio',
              len(streams) == 1 and video['codec_type'] == 'video' and int(video['nb_read_frames']) == movie['frames'] and
              video['width'] == movie['viewport']['width'] and video['height'] == movie['viewport']['height'])
        report['videos'].append({**movie, 'sha256': sha(p)})
    initial = json.loads((root/'.audit-tmp/content-r3/initial.json').read_text(encoding='utf-8'))
    for name, digest in initial['untracked'].items():
        check('retained initial untracked '+name, sha(root/name) == digest)
    for name, digest in initial['tracked'].items():
        if name.startswith('docs/store/screenshots/'):
            check('retained previous store screenshot '+name, sha(root/name) == digest)
    archive = json.loads((out/'verification-artifacts/receipt.json').read_text(encoding='utf-8'))
    check('historical evidence archived and restored', archive['status'] == 'VERIFIED')
    for item in archive['archives']:
        check('archive hash '+item['path'], sha(root/item['path']) == item['sha256'])
    patterns = [re.compile('sk-proj-'+'[A-Za-z0-9_-]{20,}|sk-'+'[a-z0-9]{40}'),
                re.compile('gh'+'[pousr]_[A-Za-z0-9]{36,}'),
                re.compile('-----BEGIN '+r'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
    scanned = 0
    hits = []
    for p in root.rglob('*'):
        if not p.is_file() or any(part in {'.git','node_modules','.audit-tmp'} for part in p.relative_to(root).parts):
            continue
        if p.suffix.lower() in {'.png','.jpg','.webp','.zip','.mp4','.webm','.woff2'}:
            continue
        text = p.read_text(encoding='utf-8',errors='replace')
        scanned += 1
        if any(pattern.search(text) for pattern in patterns):
            hits.append(p.relative_to(root).as_posix())
    report['secretScan'] = {'files': scanned, 'matches': len(hits), 'paths': hits}
    check('secret scan zero hits', not hits)
    check('release version and offline cache agree', report['version'] == '0.11.0' and 'trine-frontier-0.11.0' in (root/'dist/sw.js').read_text())
    report['status'] = 'VERIFIED'
except Exception as exc:
    report['status'] = 'BLOCKED'
    report['failure'] = str(exc)
finally:
    (out/'release.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(report['status'], len(checks), 'readbacks;', report.get('failure',''))
if report['status'] != 'VERIFIED':
    raise SystemExit(1)
