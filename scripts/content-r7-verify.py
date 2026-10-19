"""Run every existing check and R7; bind the actual exit code to the build."""
import hashlib
import json
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parent.parent
out=root/'docs/content/r7/verification-artifacts'
out.mkdir(parents=True,exist_ok=True)
log=root/'.audit-tmp/content-r7/npm-verify.log'
with log.open('w',encoding='utf-8') as f:
    result=subprocess.run(['cmd','/c','npm','run','verify'],cwd=root,stdout=f,stderr=subprocess.STDOUT)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt={'status':'VERIFIED' if result.returncode==0 else 'BLOCKED','exitCode':result.returncode,
    'command':'npm run verify','buildSHA256':sha(root/'dist/game.js'),
    'styleSHA256':sha(root/'dist/style.css'),'logSHA256':sha(log),
    'runtimeSources':{p.relative_to(root).as_posix():sha(p) for p in (root/'src').iterdir() if p.is_file()},
    'log':'.audit-tmp/content-r7/npm-verify.log'}
(out/'npm-verify.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
print(receipt['status'], 'npm run verify, exit',result.returncode)
raise SystemExit(result.returncode)
