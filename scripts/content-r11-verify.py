"""Run the complete repository gate after cleanup, retain current receipts."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
out = root / 'docs/content/r11/verification'
out.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
sources = lambda: {p.relative_to(root).as_posix(): sha(p) for p in (root / 'src').iterdir() if p.is_file()}
before = sources()
with (out / 'verify.txt').open('w', encoding='utf8') as log:
    result = subprocess.run(['cmd', '/c', 'npm', 'run', 'verify'], cwd=root,
                            env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}, stdout=log, stderr=subprocess.STDOUT)
build = sha(root / 'dist/game.js')
receipts = []
for name in ['docs/evidence/e2e.json', *[f'docs/content/r{i}/e2e.json' for i in range(1, 10)],
             'docs/content/r11/e2e.json', 'docs/content/r11/proof-e2e.json']:
    p = root / name
    if p.is_file():
        data = json.loads(p.read_text(encoding='utf-8-sig'))
        receipts.append({'path': name, 'status': data.get('status'), 'checks': len(data.get('checks', [])),
                         'errors': data.get('errors', []), 'sha256': sha(p), 'buildSHA256': data.get('buildSHA256')})
(out / 'regressions.json').write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding='utf8')
(out / 'runtime-sources.json').write_text(json.dumps({'status': 'VERIFIED' if before == sources() else 'BLOCKED',
    'sources': sources(), 'buildSHA256': build, 'unchangedDuringVerification': before == sources()}, indent=2), encoding='utf8')
receipt = {'status': 'VERIFIED' if result.returncode == 0 and before == sources() else 'BLOCKED',
           'command': 'npm run verify', 'verifyExitCode': result.returncode,
           'buildSHA256': build, 'styleSHA256': sha(root / 'dist/style.css'), 'logSHA256': sha(out / 'verify.txt')}
(out / 'verification.json').write_text(json.dumps(receipt, indent=2), encoding='utf8')
print(json.dumps(receipt), flush=True)
sys.exit(0 if receipt['status'] == 'VERIFIED' else 1)
