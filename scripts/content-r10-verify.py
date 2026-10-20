"""Run the actual release gate, retain receipts, restore historical evidence byte for byte."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
out = root / 'docs/content/r10/verification'
out.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
env = {**os.environ, 'PYTHONIOENCODING': 'utf-8'}
runtime_before={p.relative_to(root).as_posix():sha(p) for p in (root/'src').iterdir() if p.is_file()}
tracked=set(subprocess.check_output(['git','-c','core.quotepath=false','ls-files','docs'],cwd=root).decode('utf8').splitlines())
print('EXECUTED npm run verify (serial headless browsers)', flush=True)
with (out / 'verify.txt').open('w', encoding='utf-8') as log:
    result = subprocess.run(['cmd', '/c', 'npm', 'run', 'verify'], cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT)
build = sha(root / 'dist/game.js')
runtime_after={p.relative_to(root).as_posix():sha(p) for p in (root/'src').iterdir() if p.is_file()}
unchanged=runtime_before==runtime_after
(out/'runtime-sources.json').write_text(json.dumps({'status':'VERIFIED' if unchanged and result.returncode==0 else 'BLOCKED','buildSHA256':build,'sources':runtime_after,'unchangedDuringVerification':unchanged},indent=2),encoding='utf8')
receipts = []
for name in ['docs/evidence/e2e.json', *[f'docs/content/r{i}/e2e.json' for i in range(1, 10)]]:
    p = root / name
    if not p.exists():
        continue
    value = json.loads(p.read_text(encoding='utf-8-sig'))
    receipts.append({'path': name, 'sha256': sha(p), 'status': value.get('status'),
                     'buildSHA256': value.get('buildSHA256'), 'checks': value.get('checks'),
                     'errors': value.get('errors'), 'shots': len(value.get('shots', value.get('screenshots', [])))})
(out / 'legacy-regression.json').write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding='utf-8')
manifest = json.loads((root / '.audit-tmp/content-r10/historical.json').read_text(encoding='utf-8'))
(out / 'current-rwd').mkdir(exist_ok=True)
current_rwd=[]
for name in ['docs/store/screenshots/iphone-defense-1290x2796.png', 'docs/store/screenshots/ipad-defense-2064x2752.png', *[p.relative_to(root).as_posix() for p in (root/'docs/evidence/rwd').glob('*.png')]]:
    p=root/name
    if p.is_file():
        (out/'current-rwd'/p.name).write_bytes(p.read_bytes())
        current_rwd.append({'source':name,'path':(out/'current-rwd'/p.name).relative_to(root).as_posix(),'sha256':sha(p)})
(out/'current-rwd/manifest.json').write_text(json.dumps(current_rwd,indent=2),encoding='utf8')
supplement=[]
for p in (root/'docs/content/r3').glob('phone-exercise-*.png'):
    if not any(word in p.name for word in ['alternative','resumed']):
        continue
    target=root/'docs/content/r10'/p.name
    target.write_bytes(p.read_bytes())
    supplement.append({'source':p.relative_to(root).as_posix(),'path':target.relative_to(root).as_posix(),'sha256':sha(target)})
(root/'docs/content/r10/supplementary-regression.json').write_text(json.dumps({'status':'VERIFIED' if result.returncode==0 else 'BLOCKED','buildSHA256':build,'sourceReportSHA256':sha(root/'docs/content/r3/e2e.json'),'images':supplement},indent=2),encoding='utf8')
restored = []
protected_changes=[]
for name, digest in manifest.items():
    p = root / name
    if not p.exists() or sha(p) != digest:
        if name not in tracked:
            protected_changes.append(name)
            continue
        original = root / '.audit-tmp/content-r10/historical' / name
        if sha(original) != digest:
            raise RuntimeError('Historical backup hash mismatch: ' + name)
        p.write_bytes(original.read_bytes())
        restored.append(name)
changed = [name for name, digest in manifest.items() if sha(root / name) != digest]
(out / 'historical-readback.json').write_text(json.dumps({'status': 'VERIFIED' if not changed else 'BLOCKED', 'files': len(manifest), 'restored': restored, 'changed': changed,'protectedUntrackedPreserved':protected_changes}, indent=2), encoding='utf-8')
receipt = {'status': 'VERIFIED' if result.returncode == 0 and not changed and unchanged else 'BLOCKED', 'verifyExitCode': result.returncode,
           'command': 'npm run verify', 'buildSHA256': build, 'styleSHA256': sha(root / 'dist/style.css'), 'logSHA256': sha(out / 'verify.txt')}
(out / 'verification.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
print(receipt['status'], 'npm run verify exit', result.returncode, 'historical files restored', len(restored), flush=True)
sys.exit(0 if receipt['status'] == 'VERIFIED' else 1)
