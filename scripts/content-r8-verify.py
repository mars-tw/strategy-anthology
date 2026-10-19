"""Record the real verify exit code and bind it to the exact local release."""
import hashlib
import json
import os
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / 'docs/content/r8/verification-artifacts'
out.mkdir(parents=True, exist_ok=True)
log = root / '.audit-tmp/content-r8/npm-verify.log'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
before = {p.relative_to(root).as_posix(): sha(p) for p in (root/'src').iterdir() if p.is_file()}
with log.open('w', encoding='utf8') as handle:
    result = subprocess.run(['cmd', '/c', 'npm', 'run', 'verify'], cwd=root, stdout=handle, stderr=subprocess.STDOUT,
                            env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
after = {p.relative_to(root).as_posix(): sha(p) for p in (root/'src').iterdir() if p.is_file()}
receipt = {'status': 'VERIFIED' if result.returncode == 0 and before == after else 'BLOCKED',
           'exitCode': result.returncode, 'command': 'npm run verify', 'buildSHA256': sha(root/'dist/game.js'),
           'styleSHA256': sha(root/'dist/style.css'), 'logSHA256': sha(log), 'sourcesUnchangedDuringVerification': before == after,
           'runtimeSources': after, 'log': log.relative_to(root).as_posix()}
(out/'npm-verify.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding='utf8')
print(receipt['status'], 'npm run verify, exit', result.returncode, flush=True)
raise SystemExit(0 if receipt['status'] == 'VERIFIED' else 1)
