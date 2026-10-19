"""Bind final store captures to build and reproducible comparisons."""
from pathlib import Path
from PIL import Image
import hashlib,json
R=Path(__file__).resolve().parents[1];A=R/'docs/art/r6';C=R/'docs/art/compare/r6'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
v=json.loads((A/'visual-audit.json').read_text(encoding='utf-8'));assert v['status']=='VERIFIED',v.get('failure')
assert v['buildSHA256']==sha(R/'dist/game.js') and v['styleSHA256']==sha(R/'dist/style.css')
comparisons=[]
for before in sorted((C/'before').glob('*.png')):
 after=C/'after'/before.name
 if not after.exists():continue
 a=Image.open(before).convert('RGB');b=Image.open(after).convert('RGB');assert a.size==b.size
 pair=Image.new('RGB',(a.width*2,a.height));pair.paste(a,(0,0));pair.paste(b,(a.width,0));target=C/before.name;pair.save(target,optimize=True)
 comparisons.append(dict(before=before.relative_to(R).as_posix(),after=after.relative_to(R).as_posix(),comparison=target.relative_to(R).as_posix(),size=list(a.size),beforeSHA256=sha(before),afterSHA256=sha(after)))
store=[]
for p in sorted((R/'docs/store/screenshots').glob('*.png')):
 im=Image.open(p);assert im.size in [(1290,2796),(2064,2752)]
 quarter=A/'thumbnails'/(p.stem+'-quarter.png');im.resize((im.width//4,im.height//4),Image.Resampling.LANCZOS).save(quarter)
 store.append(dict(path=p.relative_to(R).as_posix(),size=list(im.size),sha256=sha(p),quarterPath=quarter.relative_to(R).as_posix(),quarterSHA256=sha(quarter)))
assert len(store)==6 and len(comparisons)==9
manifest=json.loads((R/'docs/art/ASSET_MANIFEST_R6.json').read_text(encoding='utf-8'));assert manifest['status']=='VERIFIED'
baseline=json.loads((A/'initial-release-baseline.json').read_text());package=sum(p.stat().st_size for p in (R/'dist').rglob('*') if p.is_file())
release=dict(status='VERIFIED',version='0.7.0',generatedMasters=manifest['generatedMasters'],newRuntimeImages=18,newRuntimeMetadata=2,newRuntimeBytes=manifest['runtimeBytes'],previousPackageBytes=baseline['runtimeBytes'],currentPackageBytes=package,deltaBytes=package-baseline['runtimeBytes'],deltaPercent=(package/baseline['runtimeBytes']-1)*100,buildSHA256=sha(R/'dist/game.js'),styleSHA256=sha(R/'dist/style.css'),screenshots=store,comparisons=comparisons,visualAudit='docs/art/r6/visual-audit.json',independentScore='BLOCKED - no fresh Muse rescore; 8+ not claimed',limitations=['Low-height landscape compresses bridge perspective; not the store-ratio qualification viewport.','Native rectangular collision core unchanged; natural painted shoals are decorative; no new terrain/pathfinding system.','Virtual-clock captures and desktop Chromium cannot qualify real iOS/iPadOS performance.'])
(R/'docs/evidence/art-r6-release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:release[k] for k in ['status','generatedMasters','newRuntimeImages','newRuntimeBytes','currentPackageBytes','deltaBytes','deltaPercent']}))
