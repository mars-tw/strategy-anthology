"""R1 deterministic export only. No image synthesis or model calls.

Preserves tool-native alpha; stores opaque, mask and cleaned RGBA witnesses.
Original licensed atlases are never overwritten. Run from repository root.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import numpy as np
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art'
OUT = ROOT / 'public/assets/r1'
OUT.mkdir(parents=True, exist_ok=True)
for name in ['sources', 'masters_opaque', 'masks', 'rgba', 'thumbnails']:
    (ART / name).mkdir(parents=True, exist_ok=True)
prompts = json.loads((ART / 'PROMPTS.json').read_text(encoding='utf-8'))
records = []

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def clean(image):
    data = np.array(image.convert('RGBA'))
    # Native transparency has no matte to invert. Suppress sub-visible glow,
    # preserve the unassociated RGB of visible pixels, zero invisible RGB.
    data[data[:, :, 3] < 12] = 0
    return Image.fromarray(data)

def compact(image, colors=128):
    """Palette prepass, expanded back to real RGBA PNG. Preserve exact alpha."""
    alpha=image.getchannel('A')
    image=image.convert('RGB').quantize(colors=colors,dither=Image.Dither.NONE).convert('RGB')
    image.putalpha(alpha)
    data=np.array(image)
    data[data[:,:,3]==0]=0
    return Image.fromarray(data)

def cut(image, rect, name, size):
    image = clean(image.crop(rect))
    alpha = np.asarray(image)[:, :, 3]
    visible = Image.fromarray(np.uint8(alpha > 28) * 255).getbbox()
    if visible:
        image = image.crop(visible)
    framed = Image.new('RGBA', size)
    fitted = ImageOps.contain(image, (size[0]-16, size[1]-16), Image.Resampling.LANCZOS)
    framed.alpha_composite(fitted, ((size[0]-fitted.width)//2, size[1]-fitted.height-8))
    framed = compact(framed)
    framed.save(OUT / name, optimize=True)

for sample in prompts['samples']:
    sid = sample['id']
    source = ART / 'sources' / (sid + '.png')
    if not source.exists():
        shutil.copy2(sample['source'], source)
    image = Image.open(source)
    rgba = clean(image)
    rgba.save(ART / 'rgba' / (sid+'.png'), optimize=True)
    Image.fromarray(np.asarray(rgba)[:, :, 3]).save(ART / 'masks' / (sid+'.png'), optimize=True)
    opaque = Image.new('RGBA', rgba.size, '#d8d8ce')
    opaque.alpha_composite(rgba)
    opaque.convert('RGB').save(ART / 'masters_opaque' / (sid+'.png'), optimize=True)
    if sid == 'battlefield':
        image.convert('RGB').resize((1536,1024), Image.Resampling.LANCZOS).save(OUT/'battlefield.webp', quality=84, method=6)
    elif sid=='structures':
        for i, name in enumerate(['keep','barracks','enemy-keep']):
            w,h=image.size
            cut(rgba,(i*w//3,0,(i+1)*w//3,h),name+'.png',(256,320))
    elif sid in ['towers','icons']:
        for i, element in enumerate(['cannon','frost','tesla']):
            w,h=image.size
            cut(rgba, (i*w//3,0,(i+1)*w//3,h), f'{"tower" if sid=="towers" else "seal"}-{element}.png', (192,256) if sid=='towers' else (128,128))
    elif sid=='commander':
        cut(rgba, (0,0,*rgba.size), 'commander.png', (512,768))
        # Face crop for the story identifier; this is the same commander.
        cut(rgba, (250,110,650,560), 'commander-face.png', (128,128))
    elif sid=='panel':
        image.convert('RGB').resize((512,512),Image.Resampling.LANCZOS).save(OUT/'panel.webp',quality=82,method=6)
    elif sid=='logo':
        cut(rgba,(0,0,*rgba.size),'logo.png',(768,512))
        cut(rgba,(0,425,1536,980),'wordmark.png',(600,216))
    elif sid=='app-icon':
        image.convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS).save(ART/'app-icon-proposal.png',optimize=True)
        for size in [512,192,64]:
            icon=image.convert('RGB').resize((size,size),Image.Resampling.LANCZOS).quantize(colors=128,dither=Image.Dither.NONE).convert('RGB')
            icon.save(OUT/f'app-icon-{size}.png',optimize=True)
    witnesses={kind:{'path':(ART/kind/(sid+'.png')).relative_to(ROOT).as_posix(),'sha256':sha(ART/kind/(sid+'.png'))} for kind in ['masters_opaque','masks','rgba']}
    records.append({'id':sid,'source':source.relative_to(ROOT).as_posix(),'sourceSHA256':sha(source),'nativeMode':image.mode,'size':image.size,'nativeAlphaPreserved':sample['transparent'] and image.mode=='RGBA','actualModelSlug':None,'actualTool':prompts['actualTool'],'witnesses':witnesses})

# A bounded color grade, all poses/alpha/pivots unchanged. Luma remains textured;
# saturation floor applies only to source-visible pixels, not invisible padding.
actors = []
for source in sorted((ROOT/'public/assets').glob('*.png')):
    image=Image.open(source).convert('RGBA')
    raw=np.asarray(image)
    hsv=np.array(image.convert('RGB').convert('HSV')).astype(np.float32)/255
    low=hsv[:,:,1]<.08
    hsv[:,:,0][low]=.105  # warm bronze for neutral armor highlights
    hsv[:,:,1]=np.maximum(hsv[:,:,1],.37)
    hsv[:,:,2]=np.clip(hsv[:,:,2]**.72*1.12,0,1)
    graded=Image.fromarray(np.uint8(hsv*255),'HSV').convert('RGB')
    graded.putalpha(image.getchannel('A'))
    data=np.array(graded);data[data[:,:,3]==0]=0
    graded=compact(Image.fromarray(data),96)
    data=np.array(graded)
    path=OUT/source.name
    graded.save(path,optimize=True)
    visible=data[:,:,3]>128
    rgb=data[:,:,:3].astype(float)/255
    luma=rgb@np.array([.2126,.7152,.0722])
    sat=np.asarray(graded.convert('RGB').convert('HSV'))[:,:,1]/255
    metrics={'meanLuminance':float(luma[visible].mean()),'nearBlackRatio':float((luma[visible]<.12).mean()),'meanSaturation':float(sat[visible].mean()),'lowSaturationRatio':float((sat[visible]<.20).mean())}
    passed=.30<=metrics['meanLuminance']<=.75 and metrics['nearBlackRatio']<.35 and metrics['meanSaturation']>=.32 and metrics['lowSaturationRatio']<.20
    big=source.stem in ['mage','miremaw','ashwing','rootback']
    fw,fh=(256,256) if big else (112 if source.stem.startswith('shieldBearer') else 96,112)
    poses=[len({hashlib.sha256(graded.crop((x*fw,row*fh,(x+1)*fw,(row+1)*fh)).tobytes()).hexdigest() for x in range(4)}) for row in range(6)]
    actors.append({'path':path.relative_to(ROOT).as_posix(),'source':source.relative_to(ROOT).as_posix(),'sourceSHA256':sha(source),'sha256':sha(path),'metrics':metrics,'colorGate':passed,'alphaUnchanged':bool(np.array_equal(data[:,:,3],raw[:,:,3])),'distinctPosesPerRow':poses})

sheet=Image.new('RGB',(8*132,5*104),'#d8d8ce');d=ImageDraw.Draw(sheet)
items=[]
for a in actors:
    im=Image.open(ROOT/a['path']);big=im.width==1024
    fw,fh=(256,256) if big else (im.width//4,112)
    items.append((Path(a['path']).stem,im.crop((0,0,fw,fh))))
for name in ['tower-cannon','tower-frost','tower-tesla','seal-cannon','seal-frost','seal-tesla','commander','commander-face','app-icon-64']:
    items.append((name,Image.open(OUT/(name+'.png'))))
for i,(name,im) in enumerate(items):
    thumb=ImageOps.contain(im.convert('RGBA'),(64,64),Image.Resampling.LANCZOS)
    x,y=(i%8)*132,(i//8)*104
    sheet.paste(thumb,(x+(132-thumb.width)//2,y),thumb)
    d.text((x+2,y+68),name[:21],fill='#292d38')
sheet.save(ART/'thumbnails/contact-64.png',optimize=True)

assets=[]
for path in sorted(OUT.glob('*')):
    im=Image.open(path)
    rec={'path':path.relative_to(ROOT).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path),'size':im.size,'mode':im.mode}
    if im.mode=='RGBA':
        a=np.asarray(im)[:,:,3];rgb=np.asarray(im)[:,:,:3]
        rec.update(cornersTransparent=bool(all(a[y,x]==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)])),alphaOccupancy=float((a>8).mean()),transparentRGBZero=bool((rgb[a==0]==0).all()))
    assets.append(rec)
manifest={'status':'VERIFIED' if all(x['colorGate'] and x['alphaUnchanged'] and min(x['distinctPosesPerRow'])==4 for x in actors) else 'BLOCKED','version':'0.2.0','actualModelSlug':None,'actualTool':prompts['actualTool'],'modelNote':prompts['modelNote'],'generatedMasters':len(records),'generatedRuntimeAssets':len(assets)-len(actors),'gradeNote':'Luma: gamma RGB Rec709, near-black <0.12; saturation HSV low <0.20; alpha>128. Thresholds .30-.75 / <35% / >=.32 / <20%. This is not linear-light photometry or device validation.','sources':records,'actorGrades':actors,'runtime':assets,'runtimeBytes':sum(a['bytes'] for a in assets)}
(ART/'ASSET_MANIFEST_R1.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'status':manifest['status'],'generatedMasters':len(records),'generatedRuntimeAssets':manifest['generatedRuntimeAssets'],'colorPass':sum(a['colorGate'] for a in actors),'actors':len(actors),'runtimeBytes':manifest['runtimeBytes']}))
