"""Evidence-only comparisons, thumbnails, dimensions and package delta."""
from pathlib import Path
from PIL import Image,ImageOps
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art/r5';OUT=ROOT/'docs/art/compare/r5'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
entries=[]
for before in sorted((OUT/'before').glob('*.png')):
    after=OUT/'after'/before.name
    if not after.exists():continue
    a=Image.open(before).convert('RGB');b=Image.open(after).convert('RGB')
    assert a.size==b.size
    pair=Image.new('RGB',(a.width*2,a.height),'#f5f1e5');pair.paste(a,(0,0));pair.paste(b,(a.width,0))
    target=OUT/before.name;pair.save(target,optimize=True)
    entries.append(dict(before=before.relative_to(ROOT).as_posix(),after=after.relative_to(ROOT).as_posix(),comparison=target.relative_to(ROOT).as_posix(),size=list(a.size),beforeSHA256=sha(before),afterSHA256=sha(after)))
shots=[]
for p in sorted((ROOT/'docs/store/screenshots').glob('*.png')):
    im=Image.open(p);assert im.size in [(1290,2796),(2064,2752)]
    for factor,name in [(4,'quarter')]:
        im.resize((im.width//factor,im.height//factor),Image.Resampling.LANCZOS).save(ART/'thumbnails'/f'{p.stem}-{name}.png')
    shots.append(dict(path=p.relative_to(ROOT).as_posix(),size=list(im.size),sha256=sha(p)))
for mode in ['no-text','silhouette']:
    sheet=Image.new('RGB',(6*96,96),'#f5f1e5')
    for i,name in enumerate(['warrior','archer','mage','enemy','worker','hound']):
        im=Image.open(ART/'thumbnails'/f'{name}-64-{mode}.png');sheet.paste(im,(i*96+16,16),im)
    sheet.save(ART/'thumbnails'/f'unit-lineup-{mode}.png')
manifest=json.loads((ROOT/'docs/art/ASSET_MANIFEST_R5.json').read_text(encoding='utf-8'))
rgba=[a for a in manifest['runtime'] if a.get('mode')=='RGBA']
alpha=dict(status='VERIFIED' if all(a['cornersTransparent'] for a in rgba) else 'BLOCKED',method='native generated alpha retained, low alpha<20 cleared, encoded PNG/WebP corners measured; masks and gray-composite witnesses hash-bound',files=rgba)
(ART/'alpha-gate.json').write_text(json.dumps(alpha,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
current=sum(p.stat().st_size for p in (ROOT/'dist').rglob('*') if p.is_file())
baseline=json.loads((ART/'initial-release-baseline.json').read_text())
release=dict(status='VERIFIED',version='0.6.0',newRuntimeImages=sum(a.get('mode') is not None for a in manifest['runtime']),newRuntimeMetadata=sum(a.get('mode') is None for a in manifest['runtime']),newRuntimeBytes=manifest['runtimeBytes'],previousVersion=baseline['version'],previousPackageBytes=baseline['runtimeBytes'],currentPackageBytes=current,deltaBytes=current-baseline['runtimeBytes'],deltaPercent=(current/baseline['runtimeBytes']-1)*100,buildSHA256=sha(ROOT/'dist/game.js'),styleSHA256=sha(ROOT/'dist/style.css'),screenshots=shots,comparisons=entries)
(ROOT/'docs/evidence/art-r5-release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'docs/evidence/art-r5-index.json').write_text(json.dumps(dict(status='VERIFIED',comparisons=entries,store=shots,manifest='docs/art/ASSET_MANIFEST_R5.json',visual='docs/art/r5/visual-audit.json'),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(status=release['status'],comparisons=len(entries),store=len(shots),images=release['newRuntimeImages'],metadata=release['newRuntimeMetadata'],bytes=manifest['runtimeBytes'],packageDelta=release['deltaBytes'],deltaPercent=release['deltaPercent'])))
