"""Bind the final store frames, 360px blind view and comparisons to the tested build."""
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np
import hashlib, json
R=Path(__file__).resolve().parents[1]; A=R/'docs/art/r7'; C=R/'docs/art/compare/r7'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
v=json.loads((A/'visual-audit.json').read_text(encoding='utf-8'))
assert v['status']=='VERIFIED',v.get('failure')
assert v['buildSHA256']==sha(R/'dist/game.js') and v['styleSHA256']==sha(R/'dist/style.css')
capture=json.loads((C/'after/capture.json').read_text(encoding='utf-8'));assert capture['status']=='VERIFIED'
assert capture['buildSHA256']==v['buildSHA256'] and capture['styleSHA256']==v['styleSHA256']
comparisons=[]
for before in sorted((C/'before').glob('*.png')):
    after=C/'after'/before.name
    assert after.exists(),after
    a=Image.open(before).convert('RGB');b=Image.open(after).convert('RGB');assert a.size==b.size
    pair=Image.new('RGB',(a.width*2,a.height));pair.paste(a,(0,0));pair.paste(b,(a.width,0));out=C/before.name;pair.save(out,optimize=True)
    comparisons.append(dict(before=before.relative_to(R).as_posix(),after=after.relative_to(R).as_posix(),comparison=out.relative_to(R).as_posix(),size=list(a.size),beforeSHA256=sha(before),afterSHA256=sha(after)))
assert len(comparisons)==9
store=[]
for p in sorted((R/'docs/store/screenshots').glob('*.png')):
    im=Image.open(p);assert im.size in [(1290,2796),(2064,2752)]
    quarter=A/'thumbnails'/(p.stem+'-quarter.png');im.resize((im.width//4,im.height//4),Image.Resampling.LANCZOS).save(quarter)
    small=A/'thumbnails'/(p.stem+'-360.png');im.resize((360,round(im.height*360/im.width)),Image.Resampling.LANCZOS).save(small)
    store.append(dict(path=p.relative_to(R).as_posix(),size=list(im.size),sha256=sha(p),quarterPath=quarter.relative_to(R).as_posix(),quarterSHA256=sha(quarter),phone360Path=small.relative_to(R).as_posix(),phone360SHA256=sha(small)))
assert len(store)==6
store_comparisons=[];(C/'store-pairs').mkdir(exist_ok=True)
for entry in store:
    after=R/entry['path'];before=C/'store-before'/after.name
    assert before.exists()
    a=Image.open(before).convert('RGB');b=Image.open(after).convert('RGB');assert a.size==b.size
    pair=Image.new('RGB',(a.width*2,a.height));pair.paste(a,(0,0));pair.paste(b,(a.width,0))
    target=C/'store-pairs'/(after.stem+'.webp');pair.save(target,quality=86,method=6)
    store_comparisons.append(dict(before=before.relative_to(R).as_posix(),beforeSHA256=sha(before),after=entry['path'],afterSHA256=entry['sha256'],comparison=target.relative_to(R).as_posix(),comparisonSHA256=sha(target)))

# Inspect the shipped, actually rendered terrain after bridge composition.
# Water is recognized by relative RGB, excluding purple cliffs and warm sand.
profiles=[]
for view in v['views']:
    p=A/'screens'/(view['device']+'-siege-terrain.png');im=Image.open(p).convert('RGB');rect=view['canvasRect'];d=view['dpr']
    im=im.crop(tuple(round(rect[k]*d) for k in ['x','y'])+tuple(round((rect[k]+rect[j])*d) for k,j in [('x','width'),('y','height')]))
    a=np.array(im).astype(float);rows=[]
    for y in [64,80,128,150,235,260,355,380,465,512,560,600]:
        row=a[min(im.height-1,round(y/640*im.height))];rr,gg,bb=row[:,0],row[:,1],row[:,2]
        xs=np.where((bb>rr*1.05)&(gg>rr*1.08)&(gg>65)&(np.arange(im.width)>im.width*.20)&(np.arange(im.width)<im.width*.90))[0]
        assert len(xs)>10,(view['device'],y)
        left,right=np.percentile(xs,[5,95]);rows.append(dict(y=y,width=float(right-left),center=float((left+right)/2)))
    zones=[]
    for lo,hi in [(0,300),(300,640)]:
        ws=[r['width'] for r in rows if lo<=r['y']<hi];zones.append(max(ws)/min(ws))
    center_span=max(r['center'] for r in rows)-min(r['center'] for r in rows)
    assert all(z>=1.2 for z in zones),(view['device'],zones)
    profiles.append(dict(device=view['device'],method='RGB water intervals on rendered terrain screenshot, outside bridge rows; no source-only proof.',rows=rows,twoZoneWidthRatios=zones,centerSpanPixels=center_span,canvasWidthPixels=im.width))

# Whole-figure64px checks use authored frame0, with no silhouette redrawing.
sheet=Image.new('RGB',(480,80),'#f5f1e5')
for col,role in enumerate(['warrior','archer','mage','flag','horn','pack']):
    if col<3:p=R/f'public/assets/r7/{role}.png';im=Image.open(p).crop((0,0,256,256))
    else:p=R/'public/assets/r7/hound-walk.png';im=Image.open(p).crop((0,(col-3)*256,256,(col-2)*256))
    b=im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox();im=ImageOps.contain(im.crop(b),(64,64),Image.Resampling.LANCZOS)
    thumb=Image.new('RGBA',(64,64));thumb.alpha_composite(im,((64-im.width)//2,64-im.height));thumb.save(A/'thumbnails'/(role+'-proof-64.png'))
    bg=Image.new('RGBA',(80,80),'#f5f1e5');bg.alpha_composite(thumb,(8,8));sheet.paste(bg.convert('RGB'),(col*80,0))
sheet.save(A/'thumbnails/silhouettes-64.png')

m=json.loads((R/'docs/art/ASSET_MANIFEST_R7.json').read_text(encoding='utf-8'));assert m['status']=='VERIFIED'
initial=json.loads((A/'initial-state.json').read_text(encoding='utf-8'))
for review in initial['untouchedUntrackedReviews']:assert sha(R/review['path'])==review['sha256']
package=sum(p.stat().st_size for p in (R/'dist').rglob('*') if p.is_file())
perf=json.loads((A/'performance.json').read_text(encoding='utf-8'))
assert perf['buildSHA256']==v['buildSHA256']
for size in ['1366x600','844x390']:assert perf[size]['referencePass'],(size,perf[size])
release=dict(status='VERIFIED',version='0.8.0',generatedMasters=m['generatedMasters'],newRuntimeImages=m['runtimeImageCount'],newRuntimeMetadata=2,newRuntimeBytes=m['runtimeBytes'],previousPackageBytes=initial['distBytes'],currentPackageBytes=package,deltaBytes=package-initial['distBytes'],deltaPercent=(package/initial['distBytes']-1)*100,buildSHA256=v['buildSHA256'],styleSHA256=v['styleSHA256'],screenshots=store,comparisons=comparisons,storeComparisons=store_comparisons,renderedTerrainProfiles=profiles,visualAudit='docs/art/r7/visual-audit.json',performance='docs/art/r7/performance.json',independentScore='BLOCKED - fresh Muse rescore and human blind test not performed; no8+ claim',limitations=['Real iOS/iPadOS and clean-machine performance not qualified.','Painted shoals and the ruined old bridge are scenery; native navigation and two crossing coordinates stay unchanged.','R4-R6 version-bound art receipts retained unchanged; current five-item visual contract is covered by R7, not obsolete symbol/deck assertions.'])
release['assetManifestSHA256']=sha(R/'docs/art/ASSET_MANIFEST_R7.json')
(R/'docs/evidence/art-r7-release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:release[k] for k in ['status','generatedMasters','newRuntimeImages','newRuntimeBytes','currentPackageBytes','deltaBytes','deltaPercent']}))
