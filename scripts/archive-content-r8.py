"""Keep current regression receipts, then restore initially clean historical evidence.

Initial untracked files are checked only. No delete or broad git restore is used.
"""
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

root=Path(__file__).resolve().parent.parent
state=json.loads((root/'.audit-tmp/content-r8/initial.json').read_text(encoding='utf8'))
out=root/'docs/content/r8/verification-artifacts'
verification=json.loads((out/'npm-verify.json').read_text(encoding='utf8'))
assert verification['status']=='VERIFIED'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(root/'dist/game.js')==verification['buildSHA256']
archive=root/'.audit-tmp/content-r8/verification-archives'/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')+'-'+verification['buildSHA256'][:12])
r3=json.loads((root/'docs/content/r3/e2e.json').read_text(encoding='utf8'))
assert r3['status']=='VERIFIED' and r3['buildSHA256']==verification['buildSHA256']
captures=[]
for name in ['phone-exercise-turn-alternative-formation.png','phone-exercise-turn-alternative-complete.png','phone-exercise-switchback-alternative-formation.png','phone-exercise-switchback-alternative-complete.png','phone-exercise-turn-resumed.png','phone-exercise-levee-resumed.png','phone-exercise-switchback-resumed.png']:
    src=root/'docs/content/r3'/name
    dest=root/'docs/content/r8'/name
    assert src.is_file()
    shutil.copy2(src,dest)
    assert sha(src)==sha(dest)
    data=dest.read_bytes()
    assert (int.from_bytes(data[16:20],'big'),int.from_bytes(data[20:24],'big'))==(430,932)
    captures.append({'path':dest.relative_to(root).as_posix(),'source':src.relative_to(root).as_posix(),'sha256':sha(dest),'viewport':{'width':430,'height':932},'dpr':1,'origin':'same npm run verify, R3 public-UI regression','buildSHA256':verification['buildSHA256']})
(root/'docs/content/r8/supplementary-legacy-captures.json').write_text(json.dumps(captures,ensure_ascii=False,indent=2),encoding='utf8')
changed=[]
for name,info in state.items():
    p=root/name
    if not info['tracked']:
        assert p.is_file() and sha(p)==info['sha256'], 'Initial untracked file changed: '+name
        continue
    if not name.startswith('docs/') or not p.is_file() or sha(p)==info['sha256']:
        continue
    baseline=root/'.audit-tmp/content-r8/baseline'/name
    assert baseline.is_file() and sha(baseline)==info['sha256']
    dest=archive/name
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(p,dest)
    current=sha(p)
    assert sha(dest)==current
    if p.suffix=='.json':
        portable=out/'historical'/name
        portable.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(p,portable)
        assert sha(portable)==current
    shutil.copy2(baseline,p)
    assert sha(p)==info['sha256']
    changed.append({'path':name,'rerunSHA256':current,'originalSHA256':info['sha256'],'restored':True})
receipt={'status':'VERIFIED','buildSHA256':verification['buildSHA256'],'archive':archive.relative_to(root).as_posix(),
         'restoredHistoricalFiles':changed,'initialUntrackedPreserved':sum(not x['tracked'] for x in state.values())}
(out/'historical-restoration.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf8')
print('VERIFIED:',len(changed),'historical outputs archived and restored; initial untracked files retained')
