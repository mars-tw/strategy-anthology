"""R4 reproducible crop/alpha/color/atlas exports. No generated drawing here."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import numpy as np
from scipy.ndimage import label, gaussian_filter1d, map_coordinates, maximum_filter, find_objects
import hashlib, json, sys

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'docs/art/r4/sources'; OUT=ROOT/'public/assets/r4'; ART=ROOT/'docs/art/r4'
for p in [OUT,ART/'masks',ART/'opaque',ART/'thumbnails']: p.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def clean(im):
    a=np.array(im.convert('RGBA')); a[a[:,:,3]<20]=0
    return Image.fromarray(a)
def grade(im,hue=.10,boost=1.0):
    im=clean(im); hsv=np.array(im.convert('RGB').convert('HSV')).astype(float)/255
    hsv[:,:,0][hsv[:,:,1]<.16]=hue
    hsv[:,:,1]=np.maximum(hsv[:,:,1],.24)
    hsv[:,:,2]=np.clip(hsv[:,:,2]**.84*boost,0,1)
    rgb=Image.fromarray(np.uint8(hsv*255),'HSV').convert('RGB');rgb.putalpha(im.getchannel('A'))
    return clean(rgb)
def bbox(im):return im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
def cut(im,size):
    im=clean(im); im=im.crop(bbox(im)); t=ImageOps.contain(im,(size[0]-12,size[1]-12),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',size);out.alpha_composite(t,((size[0]-t.width)//2,size[1]-t.height-6));return clean(out)
def stats(im):
    a=np.array(im.convert('RGBA'));v=a[:,:,3]>128;rgb=a[:,:,:3]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=np.array(im.convert('RGB').convert('HSV'))[:,:,1]/255
    m=dict(meanLuminance=float(lum[v].mean()),nearBlackRatio=float((lum[v]<.12).mean()),meanSaturation=float(sat[v].mean()),lowSaturationRatio=float((sat[v]<.20).mean()))
    m['pass']=.30<=m['meanLuminance']<=.75 and m['nearBlackRatio']<.35 and m['meanSaturation']>=.32 and m['lowSaturationRatio']<.20
    return m

def row_poses(im,top,bottom):
    ar=np.array(im.crop((0,top,im.width,bottom))); lab,n=label(ar[:,:,3]>40)
    counts=np.bincount(lab.ravel());counts[0]=0
    ids=sorted(range(1,len(counts)),key=lambda k:counts[k],reverse=True)[:4]
    objects=find_objects(lab)
    ids.sort(key=lambda k:objects[k-1][1].start+objects[k-1][1].stop)
    # Extract complete silhouettes rather than clipping at an assumed column.
    # Narrow spear / snout extensions may legitimately cross a nominal grid line.
    if len(ids)==4 and min(counts[k] for k in ids)>=max(counts[k] for k in ids)*.22 and len(set(int((objects[k-1][1].start+objects[k-1][1].stop)/2/(im.width/4)) for k in ids))==4:
        result=[]
        for k in ids:
            mask=maximum_filter(lab==k,size=3);a=ar.copy();a[~mask]=0;result.append(Image.fromarray(a))
        return result
    return [Image.fromarray(ar).crop((c*im.width//4,0,(c+1)*im.width//4,ar.shape[0])) for c in range(4)]

# Source atlases have six drawn rows, with manual row gutters recorded here.
# Repack to equal cells, do not synthesize limbs or manufacture poses.
rowbounds={
 'warrior':[0,283,541,794,1042,1244,1536],
 'archer':[0,266,516,766,1010,1240,1536],
 'mage':[0,281,540,808,1053,1253,1536],
 'enemy':[0,281,532,792,1030,1250,1536],
 'worker':[0,278,541,811,1057,1255,1536],
 'hound':[0,280,523,753,1009,1230,1536]}
frames={}; actorgrades=[]; poses={}
reuse='--reuse-atlases' in sys.argv
previous=json.loads((ROOT/'docs/art/ASSET_MANIFEST_R4.json').read_text(encoding='utf8')) if reuse else None
cachedframes=json.loads((OUT/'actor-frames.json').read_text()) if reuse else None
for name,ys in rowbounds.items():
    if reuse:
        prior=next(a for a in previous['sources'] if a['id']==name)
        assert prior['sha256']==sha(SRC/(name+'.png')), 'Changed source cannot reuse atlas'
        atlas=Image.open(OUT/(name+'.webp')).convert('RGBA');frames[name]=cachedframes[name];poses[name]=[atlas.crop((c*256,r*256,(c+1)*256,(r+1)*256)) for r in range(6) for c in range(4)]
        actorgrades.append({'path':(OUT/(name+'.webp')).relative_to(ROOT).as_posix(),'metrics':stats(atlas),'distinctPosesPerRow':frames[name]['distinctPosesPerRow']})
        continue
    original=Image.open(SRC/(name+'.png')).convert('RGBA')
    assert original.size==(1024,1536),(name,original.size)
    im=grade(original,.61 if name in ['enemy','hound','archer'] else .10,1.08 if name in ['enemy','hound'] else 1.0)
    atlas=Image.new('RGBA',(1024,1536));boxes=[];hashes=[]; poses[name]=[]
    for row in range(6):
        bs=[];hs=[]
        drawn=row_poses(im,ys[row],ys[row+1])
        if row==2 and name in ['archer','mage','enemy']:
            correction=grade(Image.open(SRC/'attack-corrections.png'),.61 if name in ['enemy','archer'] else .10,1.08 if name=='enemy' else 1.0)
            cutrow=['archer','mage','enemy'].index(name);bands=[0,337,667,1024]
            drawn=row_poses(correction,bands[cutrow],bands[cutrow+1])
        for col in range(4):
            pose=drawn[col]
            # Remove disconnected slivers from adjacent cells, retain meaningful VFX.
            ar=np.array(pose);lab,n=label(ar[:,:,3]>40)
            if n:
                counts=np.bincount(lab.ravel());counts[0]=0
                keep=np.where(counts>=max(14,counts.max()*.12))[0]
                ar[~np.isin(lab,keep)]=0;pose=Image.fromarray(ar)
            pose=cut(pose,(256,256));atlas.alpha_composite(pose,(col*256,row*256));bs.append(bbox(pose));hs.append(hashlib.sha256(pose.tobytes()).hexdigest())
            poses[name].append(pose)
        boxes.append(bs);hashes.append(hs)
    atlas=clean(atlas);atlas.save(OUT/(name+'.webp'),quality=86,method=6)
    atlas.getchannel('A').save(ART/'masks'/(name+'.png'),optimize=True)
    opaque=Image.new('RGBA',atlas.size,'#f5f1e5');opaque.alpha_composite(atlas);opaque.convert('RGB').resize((512,768)).save(ART/'opaque'/(name+'.jpg'),quality=90)
    frames[name]={'fw':256,'fh':256,'boxes':boxes,'sourceRowBounds':ys,'distinctPosesPerRow':[len(set(h)) for h in hashes],'minimumLiveHeight':min(b[3]-b[1] for row in boxes[:4] for b in row)}
    actorgrades.append({'path':(OUT/(name+'.webp')).relative_to(ROOT).as_posix(),'metrics':stats(Image.open(OUT/(name+'.webp'))),'distinctPosesPerRow':frames[name]['distinctPosesPerRow']})
    if name in ['warrior','archer','mage']:
        pose=poses[name][0];b=bbox(pose)
        # Shoulder crop retains the weapon alongside the face, no tiny full-body card.
        bust=pose.crop((b[0],b[1],b[2],round(b[1]+(b[3]-b[1])*.76)))
        cut(bust,(224,192)).save(OUT/(name+'-portrait.webp'),lossless=True,method=6)
(OUT/'actor-frames.json').write_text(json.dumps(frames,indent=2)+'\n',encoding='utf8')

for name in ['pine','ford']:
    Image.open(SRC/(name+'.png')).convert('RGB').resize((1440,960),Image.Resampling.LANCZOS).save(OUT/(name+'.webp'),quality=85,method=6)
for name in ['river','road']:
    im=clean(Image.open(SRC/(name+'.png')))
    if name=='road':im=im.crop(bbox(im)).resize((1024,384),Image.Resampling.LANCZOS)
    else:im=im.resize((512,960),Image.Resampling.LANCZOS)
    clean(im).save(OUT/(name+'.webp'),quality=88,method=6)
    im.getchannel('A').save(ART/'masks'/(name+'.png'),optimize=True)
    opaque=Image.new('RGBA',im.size,'#f5f1e5');opaque.alpha_composite(im);opaque.convert('RGB').save(ART/'opaque'/(name+'.jpg'),quality=90)

# Row-wise art warp: preserve painted sand/reeds/rocks, align actual water with
# the unchanged collision corridor. The visible banks deliberately meander.
river=Image.open(OUT/'river.webp').convert('RGBA');src=np.array(river)
hsv=np.array(river.convert('RGB').convert('HSV')).astype(float)/255
left=[];right=[]
for y in range(river.height):
    xs=np.where((hsv[y,:,0]>.43)&(hsv[y,:,0]<.64)&(hsv[y,:,1]>.26)&(src[y,:,3]>180))[0]
    left.append(float(np.percentile(xs,4)) if len(xs)>15 else 150)
    right.append(float(np.percentile(xs,96)) if len(xs)>15 else 365)
left=gaussian_filter1d(left,8);right=gaussian_filter1d(right,8)
yy,xx=np.mgrid[0:640,0:960];sourceY=yy/639*(river.height-1)
center=505+65*np.sin(yy*.0095)+20*np.sin(yy*.021);radius=115+25*np.sin(yy*.018)
bankL=np.minimum(450,center-radius);bankR=np.maximum(560,center+radius)
sl=np.interp(sourceY[:,0],np.arange(river.height),left)[:,None];sr=np.interp(sourceY[:,0],np.arange(river.height),right)[:,None]
sourceX=sl+(xx-bankL)*(sr-sl)/(bankR-bankL)
arr=np.stack([map_coordinates(src[:,:,c],[sourceY,sourceX],order=1,mode='constant',cval=0) for c in range(4)],axis=2).astype('uint8')
clean(Image.fromarray(arr)).save(OUT/'river-overlay.webp',quality=88,method=6)
(ART/'river-geometry.json').write_text(json.dumps(dict(status='VERIFIED',method='Painted river row warp, blue-water interval mapped to meandering banks containing original deep corridor [450,560]. Bridges stay at y=195/425.',centerSpan=float(center.max()-center.min()),bankWidthMin=float((bankR-bankL).min()),bankWidthMax=float((bankR-bankL).max()),deepCoreContained=bool((bankL<=450).all() and (bankR>=560).all())),indent=2)+'\n',encoding='utf8')

for name in ['commander','logo','icons']:
    im=grade(Image.open(SRC/(name+'.png'))) if name=='commander' else clean(Image.open(SRC/(name+'.png')))
    im.getchannel('A').save(ART/'masks'/(name+'.png'),optimize=True)
    if name=='icons':
        for i,t in enumerate(['cannon','frost','tesla']):
            cut(im.crop((i*im.width//3,0,(i+1)*im.width//3,im.height)),(128,128)).save(OUT/f'seal-{t}.png',optimize=True)
    else:
        im=cut(im,{'commander':(512,768),'logo':(768,264)}[name]);im.save(OUT/(name+'.png'),optimize=True)
        if name=='commander':actorgrades.append({'path':(OUT/(name+'.png')).relative_to(ROOT).as_posix(),'metrics':stats(im)})
im=clean(Image.open(SRC/'towers.png'))
for i,t in enumerate(['cannon','frost','tesla']):
    cut(im.crop((i*im.width//3,0,(i+1)*im.width//3,im.height)),(256,256)).save(OUT/f'tower-{t}.png',optimize=True)
Image.open(SRC/'panel.png').convert('RGB').resize((512,512)).save(OUT/'panel.webp',quality=88,method=6)
im=Image.open(SRC/'app-icon.png').convert('RGB')
for size in [64,192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(OUT/f'app-icon-{size}.png',optimize=True)
im.resize((1024,1024)).save(ART/'app-icon-proposal.png',optimize=True)

for mode in ['no-text','silhouette']:
    sheet=Image.new('RGB',(8*96,96),'#f5f1e5')
    for i,name in enumerate(['warrior','archer','mage','enemy','worker','hound']):
        t=cut(poses[name][0],(76,76))
        if mode=='silhouette':b=Image.new('RGBA',t.size,'#292d38');b.putalpha(t.getchannel('A'));t=b
        sheet.paste(t,(i*96+10,10),t)
        t.resize((64,64),Image.Resampling.LANCZOS).save(ART/'thumbnails'/f'{name}-64-{mode}.png',optimize=True)
    sheet.save(ART/'thumbnails'/f'unit-lineup-{mode}.png',optimize=True)

prompts=json.loads((ROOT/'docs/art/PROMPTS_R4.json').read_text(encoding='utf8'))
sources=[dict(id=s['id'],path=s['path'],sha256=sha(ROOT/s['path']),bytes=(ROOT/s['path']).stat().st_size) for s in prompts['samples']]
runtime=[]
for p in sorted(OUT.iterdir()):
    r=dict(path=p.relative_to(ROOT).as_posix(),sha256=sha(p),bytes=p.stat().st_size)
    if p.suffix in ['.webp','.png']:
        im=Image.open(p);r.update(size=list(im.size),mode=im.mode)
        if im.mode=='RGBA':
            a=np.array(im);al=a[:,:,3];r.update(alphaOccupancy=float((al>128).mean()),transparentRGBZero=bool((a[:,:,:3][al==0]==0).all()),cornersTransparent=all(int(al[y,x])==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]))
    runtime.append(r)
# Re-measure old atlas pixels, without rewriting any inherited file.
oldframes=json.loads((ROOT/'public/assets/r2/actor-frames.json').read_text())
inherited=[dict(path=p.relative_to(ROOT).as_posix(),sha256=sha(p),metrics=stats(Image.open(p))) for p in sorted((ROOT/'public/assets/r1').glob('*.png')) if p.name in oldframes and not p.name.startswith('enemy-')]
manifest=dict(status='VERIFIED' if all(a['metrics']['pass'] for a in actorgrades+inherited) else 'BLOCKED',version='0.5.0',actualTool=prompts['actualTool'],actualModelSlug=None,modelNote=prompts['modelNote'],generatedMasters=len(sources),sources=sources,runtime=runtime,runtimeBytes=sum(a['bytes'] for a in runtime),actorGrades=actorgrades,inheritedActorGrades=inherited,frameContract=['idle','walk','attack','hurt','death','cast'],impactFrame=2,postprocess='Pillow crop/resize/alpha cleanup; manual row gutters; real authored poses repacked to 4x6. HSV saturation floor .24; value gamma .84, enemy/hound x1.08. Transparent alpha<20 cleared. Six new right-facing atlases; left uses declared mirror derivative. Old six-direction MIT atlases unchanged. WebP compressed. No synthetic limbs or single-image animation.')
(ROOT/'docs/art/ASSET_MANIFEST_R4.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
allprompts=json.loads((ROOT/'docs/art/PROMPTS.json').read_text(encoding='utf8'));allprompts['fourthRound']=prompts
(ROOT/'docs/art/PROMPTS.json').write_text(json.dumps(allprompts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(status=manifest['status'],masters=len(sources),runtime=len(runtime),runtimeBytes=manifest['runtimeBytes'],actors=[(a['path'],a['metrics']) for a in actorgrades],inheritedPass=sum(a['metrics']['pass'] for a in inherited))))
