"""Deterministic R2 asset export: preserve native alpha, resize, compress, hash.
No image synthesis. Original R1 and licensed source assets are read-only.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import numpy as np
import json, hashlib, shutil

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art/r2'; OUT=ROOT/'public/assets/r2'
for p in [OUT,ART/'sources',ART/'rgba',ART/'masks',ART/'opaque',ART/'thumbnails']:
    p.mkdir(parents=True,exist_ok=True)
prompts=json.loads((ROOT/'docs/art/PROMPTS_R2.json').read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=[]

def clean(im):
    a=np.array(im.convert('RGBA'))
    # Native output has unassociated alpha, no matte inversion necessary.
    a[a[:,:,3]<12]=0
    return Image.fromarray(a)

def cut(im,box,name,size):
    im=clean(im.crop(box));bbox=im.getchannel('A').point(lambda a:255 if a>28 else 0).getbbox()
    if bbox: im=im.crop(bbox)
    fit=ImageOps.contain(im,(size[0]-16,size[1]-16),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',size);out.alpha_composite(fit,((size[0]-fit.width)//2,size[1]-fit.height-8))
    out=clean(out);out.save(OUT/f'{name}.png',optimize=True)

for s in prompts['samples']:
    sid=s['id'];source=ART/'sources'/f'{sid}.png'
    if not source.exists():shutil.copy2(s['source'],source)
    im=Image.open(source);rgba=clean(im)
    if sid=='commander':
        hsv=np.asarray(rgba.convert('RGB').convert('HSV')).astype(float)/255
        neutral=hsv[:,:,1]<.12;hsv[:,:,0][neutral]=.105
        hsv[:,:,1]=np.maximum(hsv[:,:,1],.245)
        hsv[:,:,2]=np.clip(hsv[:,:,2]**.95*1.02,0,1)
        graded=Image.fromarray(np.uint8(hsv*255),'HSV').convert('RGB');graded.putalpha(rgba.getchannel('A'));rgba=clean(graded)
    witnesses={}
    if s['transparent']:
        assert im.mode=='RGBA',sid
        rgba.save(ART/'rgba'/f'{sid}.png',optimize=True)
        rgba.getchannel('A').save(ART/'masks'/f'{sid}.png',optimize=True)
        opaque=Image.new('RGBA',im.size,'#d8d8ce');opaque.alpha_composite(rgba)
        opaque.convert('RGB').save(ART/'opaque'/f'{sid}.png',optimize=True)
        for kind in ['rgba','masks','opaque']:
            p=ART/kind/f'{sid}.png';witnesses[kind]={'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
    if sid=='battlefield':
        im.convert('RGB').resize((1536,1024),Image.Resampling.LANCZOS).save(OUT/'battlefield.webp',quality=84,method=6)
        # A documented cool overcast derivative of the SAME scene, no new geometry.
        a=np.asarray(im.convert('RGB')).astype(float)/255
        l=a@np.array([.2126,.7152,.0722]);a=a*.72+l[:,:,None]*.28
        a=a*np.array([.78,.93,1.06])+np.array([.012,.022,.045])
        Image.fromarray(np.uint8(np.clip(a,0,1)*255)).resize((1536,1024),Image.Resampling.LANCZOS).save(OUT/'battlefield-siege.webp',quality=84,method=6)
    elif sid=='panel':
        im.convert('RGB').resize((640,640),Image.Resampling.LANCZOS).save(OUT/'panel.webp',quality=82,method=6)
    elif sid=='icons':
        for i,e in enumerate(['cannon','frost','tesla']):cut(rgba,(i*im.width//3,0,(i+1)*im.width//3,im.height),f'seal-{e}',(128,128))
    elif sid=='app-icon':
        im.convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS).save(ART/'app-icon-proposal.png',optimize=True)
        for size in [64,192,512]:im.convert('RGB').resize((size,size),Image.Resampling.LANCZOS).save(OUT/f'app-icon-{size}.png',optimize=True)
    else:
        size={'commander':(512,768),'enemy-keep':(320,352),'logo':(768,264),'bridge':(384,256)}[sid]
        cut(rgba,(0,0,*im.size),sid,size)
    sources.append({'id':sid,'path':source.relative_to(ROOT).as_posix(),'sha256':sha(source),'size':im.size,'mode':im.mode,'nativeAlpha':im.mode=='RGBA','witnesses':witnesses})

# Exact per-pose alpha boxes. Renderer scales every live pose from the smallest
# authored visible silhouette, not the transparent atlas-cell dimensions.
frames={};grades=[]
old=json.loads((ROOT/'docs/art/ASSET_MANIFEST_R1.json').read_text(encoding='utf-8'))
for rec in old['actorGrades']:
    path=ROOT/rec['path'];im=Image.open(path).convert('RGBA');a=np.asarray(im);name=path.name
    fw,fh=im.width//4,im.height//6
    boxes=[]
    for row in range(6):
        boxes.append([])
        for col in range(4):
            tile=a[row*fh:(row+1)*fh,col*fw:(col+1)*fw,3]
            b=Image.fromarray(np.uint8(tile>128)*255).getbbox()
            boxes[-1].append(list(b or (0,0,fw,fh)))
    live=[b[3]-b[1] for r in [0,1,2,3,5] for b in boxes[r]]
    frames[name]={'fw':fw,'fh':fh,'boxes':boxes,'minimumLiveHeight':min(live)}
    visible=a[:,:,3]>128;rgb=a[:,:,:3]/255.;lum=rgb@np.array([.2126,.7152,.0722]);sat=np.asarray(im.convert('RGB').convert('HSV'))[:,:,1]/255
    m={'meanLuminance':float(lum[visible].mean()),'nearBlackRatio':float((lum[visible]<.12).mean()),'meanSaturation':float(sat[visible].mean()),'lowSaturationRatio':float((sat[visible]<.20).mean())}
    passed=.30<=m['meanLuminance']<=.75 and m['nearBlackRatio']<.35 and m['meanSaturation']>=.32 and m['lowSaturationRatio']<.20
    grades.append({'path':rec['path'],'sha256':sha(path),'metrics':m,'colorGate':passed,'alphaUnchanged':rec['alphaUnchanged'],'distinctPosesPerRow':rec['distinctPosesPerRow']})
derived=[]
for name in list(frames):
    if not name.startswith('shieldBearer-'):continue
    source=ROOT/'public/assets/r1'/name;im=Image.open(source).convert('RGBA')
    hsv=np.array(im.convert('RGB').convert('HSV')).astype(float)/255
    # Cold iron-blue enemy livery: all authored poses and exact alpha retained.
    hsv[:,:,0]=.59;hsv[:,:,1]=np.clip(hsv[:,:,1]*.5+.23,.32,.62)
    rgb=Image.fromarray(np.uint8(hsv*255),'HSV').convert('RGB');rgb.putalpha(im.getchannel('A'))
    pixels=np.array(rgb);pixels[pixels[:,:,3]==0]=0;rgb=Image.fromarray(pixels)
    dest=OUT/('enemy-'+name);rgb.save(dest,optimize=True);frames['enemy-'+name]=frames[name]
    derived.append({'path':dest.relative_to(ROOT).as_posix(),'source':source.relative_to(ROOT).as_posix(),'sourceSHA256':sha(source),'sha256':sha(dest),'alphaUnchanged':bool(np.array_equal(np.asarray(rgb)[:,:,3],np.asarray(im)[:,:,3])),'method':'Cold iron-blue livery, authored source poses preserved.'})
(OUT/'actor-frames.json').write_text(json.dumps(frames,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
assets=[]
for p in sorted(OUT.iterdir()):
    rec={'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
    if p.suffix!='.json':
        im=Image.open(p);rec.update(size=im.size,mode=im.mode)
        if im.mode=='RGBA':
            a=np.asarray(im);al=a[:,:,3];v=al>128;rgb=a[:,:,:3]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=np.asarray(im.convert('RGB').convert('HSV'))[:,:,1]/255
            rec.update(cornersTransparent=bool(all(al[y,x]==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)])),transparentRGBZero=bool((a[:,:,:3][al==0]==0).all()),alphaOccupancy=float((al>8).mean()),metrics={'meanLuminance':float(lum[v].mean()),'meanSaturation':float(sat[v].mean()),'nearBlackRatio':float((lum[v]<.12).mean()),'lowSaturationRatio':float((sat[v]<.20).mean())})
    assets.append(rec)
sheet=Image.new('RGB',(8*100,3*102),'#d8d8ce');draw=ImageDraw.Draw(sheet)
items=[]
for name in ['warrior-e.png','archer-e.png','mage.png','villager-e.png','enemy-shieldBearer-w.png','miremaw.png','ashwing.png','rootback.png']:
    p=(OUT if name.startswith('enemy-') else ROOT/'public/assets/r1')/name;m=frames[name]
    items.append((Path(name).stem,Image.open(p).crop((0,0,m['fw'],m['fh']))))
items += [(f'tower-{e}',Image.open(ROOT/f'public/assets/r1/tower-{e}.png')) for e in ['cannon','frost','tesla']]
items += [(name,Image.open(OUT/(name+'.png'))) for name in ['commander','enemy-keep']]
items += [('keep',Image.open(ROOT/'public/assets/r1/keep.png'))]
items += [(name,Image.open(OUT/(name+'.png'))) for name in ['bridge','app-icon-64','seal-cannon','seal-frost','seal-tesla','logo']]
for i,(name,im) in enumerate(items[:24]):
    t=ImageOps.contain(im.convert('RGBA'),(64,64),Image.Resampling.LANCZOS);x,y=i%8*100,i//8*102
    sheet.paste(t,(x+(100-t.width)//2,y),t);draw.text((x+2,y+67),name[:16],fill='#292d38')
sheet.save(ART/'thumbnails/contact-64.png',optimize=True)
noText=sheet.copy();d=ImageDraw.Draw(noText)
for row in range(3):d.rectangle((0,row*102+65,800,(row+1)*102),fill='#d8d8ce')
noText.save(ART/'thumbnails/contact-64-no-text.png',optimize=True)
silhouette=Image.new('RGB',sheet.size,'#d8d8ce')
for i,(name,im) in enumerate(items[:24]):
    t=ImageOps.contain(im.convert('RGBA'),(64,64),Image.Resampling.LANCZOS);black=Image.new('RGBA',t.size,(35,42,48,255));black.putalpha(t.getchannel('A'));x,y=i%8*100,i//8*102;silhouette.paste(black,(x+(100-t.width)//2,y),black)
silhouette.save(ART/'thumbnails/contact-64-silhouettes.png',optimize=True)
manifest={'status':'VERIFIED' if all(g['colorGate'] for g in grades) else 'BLOCKED','version':'0.3.0','actualTool':prompts['actualTool'],'actualModelSlug':None,'modelNote':prompts['modelNote'],'generatedMasters':len(sources),'generatedRuntimeImages':len(assets)-1-len(derived),'derivedAtlases':derived,'runtimeBytes':sum(a['bytes'] for a in assets),'sources':sources,'runtime':assets,'actorGrades':grades,'gradeNote':old['gradeNote'],'postprocessNote':'Native alpha preserved except alpha<12 cleanup. Commander receives saturation floor .245 and gamma .95/value 1.02; witnesses include this grade. No matte inversion.','frameMetadata':'public/assets/r2/actor-frames.json'}
(ROOT/'docs/art/ASSET_MANIFEST_R2.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':manifest['status'],'generated':len(sources),'generatedRuntimeImages':manifest['generatedRuntimeImages'],'derivedAtlases':len(derived),'runtimeBytes':manifest['runtimeBytes'],'actorColorPass':sum(g['colorGate'] for g in grades),'minimumPoseHeights':{k:v['minimumLiveHeight'] for k,v in frames.items() if k in ['warrior-e.png','archer-e.png','mage.png','shieldBearer-w.png','miremaw.png']}}))
