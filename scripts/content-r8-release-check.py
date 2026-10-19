"""Read-only release checks; scan only this repository, never credential folders."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parent.parent
out=root/'docs/content/r8/verification-artifacts'
state=json.loads((root/'.audit-tmp/content-r8/initial.json').read_text(encoding='utf8'))
receipt=json.loads((out/'npm-verify.json').read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert receipt['status']=='VERIFIED' and sha(root/'dist/game.js')==receipt['buildSHA256']
for name,digest in receipt['runtimeSources'].items():assert sha(root/name)==digest,name
listed=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode('utf8').split('\0')
pattern=re.compile(rb'sk-proj-'+rb'[A-Za-z0-9_-]{20,}|sk-'+rb'[a-z0-9]{40}')
matches=[];count=0
for name in set(listed):
    p=root/name
    if not name or not p.is_file():continue
    count+=1
    if pattern.search(p.read_bytes()):matches.append(name)
assert not matches, 'Secret pattern matches; see receipt paths, never print matched content'
version=json.loads((root/'package.json').read_text(encoding='utf8'))['version']
assert version=='0.16.0'
for name in ['src/version.js','src/campaign.js','README.md','package-lock.json']:
    assert '0.16.0' in (root/name).read_text(encoding='utf8') and '0.15.0' not in (root/name).read_text(encoding='utf8')
preserved=[]
for name,item in state.items():
    if name.startswith('docs/store/screenshots/') or not item['tracked']:
        assert sha(root/name)==item['sha256'],name
        preserved.append(name)
screens=[]
for name,size in [('iphone-content-r8-flood-1290x2796.png',(1290,2796)),('ipad-content-r8-flood-2064x2752.png',(2064,2752))]:
    p=root/'docs/store/screenshots'/name;data=p.read_bytes()
    assert (int.from_bytes(data[16:20],'big'),int.from_bytes(data[20:24],'big'))==size
    screens.append({'path':p.relative_to(root).as_posix(),'width':size[0],'height':size[1],'sha256':sha(p)})
result={'status':'VERIFIED','version':version,'buildSHA256':receipt['buildSHA256'],
        'secretScan':{'files':count,'matches':len(matches),'paths':matches},'sourceHashesMatchVerification':True,
        'preservedInitialFiles':preserved,'newStoreScreenshots':screens,
        'noDebugHook':'__TRINE_DEBUG' not in (root/'dist/game.js').read_text(encoding='utf8')}
assert result['noDebugHook']
(out/'release-check.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('VERIFIED:',count,'files scanned, zero secret matches; old store screenshots and initial untracked files preserved')
