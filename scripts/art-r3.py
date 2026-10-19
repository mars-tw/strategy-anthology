"""R3 deterministic export and evidence. No synthesis or network calls."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import numpy as np
import json, hashlib

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art/r3'; OUT=ROOT/'public/assets/r3'
for p in [OUT,ART/'rgba',ART/'masks',ART/'opaque',ART/'thumbnails']:
    p.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def clean(im):
    a=np.array(im.convert('RGBA'));a[a[:,:,3]<16]=0
    return Image.fromarray(a)
def cut(im,name,size):
    im=clean(im);bbox=im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
    if bbox:im=im.crop(bbox)
    fit=ImageOps.contain(im,(size[0]-12,size[1]-12),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',size);out.alpha_composite(fit,((size[0]-fit.width)//2,size[1]-fit.height-6));out=clean(out)
    out.save(OUT/(name+'.png'),optimize=True)
def grade(im):
    # Preserve the authored cutout and broad color planes; keep charcoal detail.
    rgba=im.convert('RGBA');hsv=np.array(rgba.convert('RGB').convert('HSV')).astype(float)/255
    hsv[:,:,0][hsv[:,:,1]<.12]=.105;hsv[:,:,1]=np.maximum(hsv[:,:,1],.25)
    hsv[:,:,2]=np.minimum(1,hsv[:,:,2]**.94*1.035)
    rgb=Image.fromarray(np.uint8(hsv*255),'HSV').convert('RGB');rgb.putalpha(rgba.getchannel('A'));return clean(rgb)

sources=[]
prompts=json.loads((ROOT/'docs/art/PROMPTS_R3.json').read_text(encoding='utf8'))
extra=json.loads((ROOT/'docs/art/PROMPTS_R3_EXTRA.json').read_text(encoding='utf8'))
extra.append(json.loads((ROOT/'docs/art/PROMPT_R3_ROAD.json').read_text(encoding='utf8')))
prompts['samples']=[s for s in prompts['samples'] if s['id'] not in {e['id'] for e in extra}]+extra
(ROOT/'docs/art/PROMPTS_R3.json').write_text(json.dumps(prompts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for s in prompts['samples']:
    sid=s['id'];p=ART/'sources'/(sid+'.png')
    if not p.exists():continue
    im=Image.open(p);sources.append({'id':sid,'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'size':im.size,'mode':im.mode})
    if sid in ['pine','ford','quarry','citadel']:
        im.convert('RGB').resize((1536,1024),Image.Resampling.LANCZOS).save(OUT/f'chapter-{sid}.webp',quality=84,method=6)
        if sid in ['ford','quarry']:
            a=np.array(im.convert('RGB')).astype(float)/255
            # Same conquered location, distinct time and atmosphere on return.
            tint=np.array([.82,.91,1.08]) if sid=='ford' else np.array([.91,.87,1.02])
            a=np.clip(a*tint+np.array([.015,.02,.035]),0,1)
            Image.fromarray(np.uint8(a*255)).resize((1536,1024),Image.Resampling.LANCZOS).save(OUT/f'chapter-{sid}-watch.webp',quality=84,method=6)
    elif sid=='panel':im.convert('RGB').resize((640,640),Image.Resampling.LANCZOS).save(OUT/'panel.webp',quality=84,method=6)
    elif sid=='road-surface':im.convert('RGB').resize((256,256),Image.Resampling.LANCZOS).save(OUT/'road-surface.webp',quality=87,method=6)
    elif sid=='app-icon':
        im.convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS).save(ART/'app-icon-proposal.png',optimize=True)
        for n in [64,192,512]:im.convert('RGB').resize((n,n),Image.Resampling.LANCZOS).save(OUT/f'app-icon-{n}.png',optimize=True)
    else:
        rgba=grade(im) if sid=='commander' else clean(im)
        rgba.save(ART/'rgba'/f'{sid}.png',optimize=True)
        rgba.getchannel('A').save(ART/'masks'/f'{sid}.png',optimize=True)
        opaque=Image.new('RGBA',rgba.size,'#eeeee5');opaque.alpha_composite(rgba);opaque.convert('RGB').save(ART/'opaque'/f'{sid}.png',optimize=True)
        if sid=='terrain-kit':
            for i,n in enumerate(['gravel','ruts','sand','reeds','shoal','abutment']):
                x,y=i%3*im.width//3,i//3*im.height//2
                cut(rgba.crop((x,y,x+im.width//3,y+im.height//2)),n,(256,256))
        elif sid=='icons':
            for i,n in enumerate(['cannon','frost','tesla']):cut(rgba.crop((i*im.width//3,0,(i+1)*im.width//3,im.height)),f'seal-{n}',(128,128))
        else:cut(rgba,sid,{'commander':(512,768),'logo':(768,264)}[sid])

frames=json.loads((ROOT/'public/assets/r2/actor-frames.json').read_text())
for name in ['warrior-e.png','archer-e.png','mage.png']:
    m=frames[name];im=Image.open(ROOT/'public/assets/r1'/name).convert('RGBA');b=m['boxes'][0][0]
    pose=im.crop(tuple(b));cut(pose,Path(name).stem+'-portrait',(128,144))

runtime=[]
for p in sorted(OUT.iterdir()):
    im=Image.open(p);rec={'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size,'size':im.size,'mode':im.mode}
    if im.mode=='RGBA':
        a=np.array(im);al=a[:,:,3];v=al>128;rgb=a[:,:,:3]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=np.array(im.convert('RGB').convert('HSV'))[:,:,1]/255
        rec.update(cornersTransparent=all(int(al[y,x])==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]),transparentRGBZero=bool((a[:,:,:3][al==0]==0).all()),alphaOccupancy=float(v.mean()),metrics={'meanLuminance':float(lum[v].mean()),'nearBlackRatio':float((lum[v]<.12).mean()),'meanSaturation':float(sat[v].mean()),'lowSaturationRatio':float((sat[v]<.20).mean())})
    runtime.append(rec)
# Recompute all 28 runtime atlas gates from current pixels, never trust the old report.
grades=[]
for p in sorted((ROOT/'public/assets/r1').glob('*.png')):
    if p.name not in frames or p.name.startswith('enemy-'):continue
    im=Image.open(p).convert('RGBA');a=np.array(im);v=a[:,:,3]>128;rgb=a[:,:,:3]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=np.array(im.convert('RGB').convert('HSV'))[:,:,1]/255
    m={'meanLuminance':float(lum[v].mean()),'nearBlackRatio':float((lum[v]<.12).mean()),'meanSaturation':float(sat[v].mean()),'lowSaturationRatio':float((sat[v]<.20).mean())}
    grades.append({'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'metrics':m,'pass':.30<=m['meanLuminance']<=.75 and m['nearBlackRatio']<.35 and m['meanSaturation']>=.32 and m['lowSaturationRatio']<.20})

items=[]
for n in ['warrior-e.png','archer-e.png','mage.png','villager-e.png','enemy-shieldBearer-w.png','miremaw.png']:
    p=(ROOT/'public/assets/r2' if n.startswith('enemy') else ROOT/'public/assets/r1')/n;m=frames[n];b=m['boxes'][0][0];items.append((n,Image.open(p).crop(tuple(b))))
for n in ['tower-cannon','tower-frost','tower-tesla','keep']:items.append((n,Image.open(ROOT/f'public/assets/r1/{n}.png')))
items.append(('enemy-keep',Image.open(ROOT/'public/assets/r2/enemy-keep.png')))
for n in ['commander','app-icon-64','seal-cannon','seal-frost','seal-tesla']:
    if (OUT/(n+'.png')).exists():items.append((n,Image.open(OUT/(n+'.png'))))
for mode in ['named','no-text','silhouettes']:
    sheet=Image.new('RGB',(8*96,2*96),'#eeeee5');d=ImageDraw.Draw(sheet)
    for i,(n,im) in enumerate(items):
        t=ImageOps.contain(im.convert('RGBA'),(64,64),Image.Resampling.LANCZOS)
        if mode=='silhouettes':black=Image.new('RGBA',t.size,'#292d38');black.putalpha(t.getchannel('A'));t=black
        x,y=i%8*96,i//8*96;sheet.paste(t,(x+(96-t.width)//2,y+64-t.height),t)
        if mode=='named':d.text((x+2,y+68),n[:14],fill='#292d38')
    sheet.save(ART/f'thumbnails/units-64-{mode}.png',optimize=True)

manifest={'status':'VERIFIED' if all(g['pass'] for g in grades) else 'BLOCKED','version':'0.4.0','actualTool':prompts['actualTool'],'actualModelSlug':None,'modelNote':prompts['modelNote'],'generatedMasters':len(sources),'sources':sources,'runtime':runtime,'runtimeBytes':sum(r['bytes'] for r in runtime),'actorGrades':grades,'postprocess':'Pillow resize/crop and WebP 84. Alpha<16 RGB cleared; native alpha retained. Commander HSV saturation floor .25, value gamma .94 *1.035. Watch maps are declared time-of-day derivatives. Three portraits are MIT atlas crops, not generated masters.'}
(ROOT/'docs/art/ASSET_MANIFEST_R3.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
allprompts=json.loads((ROOT/'docs/art/PROMPTS.json').read_text(encoding='utf8'));allprompts['thirdRound']=prompts
(ROOT/'docs/art/PROMPTS.json').write_text(json.dumps(allprompts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':manifest['status'],'masters':len(sources),'runtime':len(runtime),'bytes':manifest['runtimeBytes'],'actorColorPass':sum(g['pass'] for g in grades)}))
