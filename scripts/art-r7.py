"""R7: deterministic cutout, pose packing, compression and measured provenance.
No generated drawing or replacement art is produced by this script.
"""
from pathlib import Path
from PIL import Image, ImageOps
from scipy.ndimage import label, find_objects, binary_dilation
import numpy as np
import json, hashlib

R = Path(__file__).resolve().parents[1]
A = R / 'docs/art/r7'
S = A / 'sources'
O = R / 'public/assets/r7'
for p in [O, A/'masks', A/'opaque', A/'rgba', A/'thumbnails']:
    p.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def clean(im):
    a = np.array(im.convert('RGBA'))
    a[a[:,:,3] < 20] = 0
    return Image.fromarray(a)

def box(im):
    return im.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox()

def metrics(im):
    a = np.array(im.convert('RGBA')); v = a[:,:,3] > 128
    rgb = a[:,:,:3] / 255; lum = rgb @ np.array([.2126, .7152, .0722])
    sat = np.array(im.convert('RGB').convert('HSV'))[:,:,1] / 255
    m = dict(meanLuminance=float(lum[v].mean()), nearBlackRatio=float((lum[v]<.12).mean()),
             meanSaturation=float(sat[v].mean()), lowSaturationRatio=float((sat[v]<.20).mean()))
    m['pass'] = .30 <= m['meanLuminance'] <= .75 and m['nearBlackRatio'] < .35 and m['meanSaturation'] >= .32 and m['lowSaturationRatio'] < .20
    return m

def grade(im):
    h = np.array(im.convert('RGB').convert('HSV')).astype(float) / 255
    h[:,:,0][h[:,:,1]<.16] = .10
    h[:,:,1] = np.maximum(h[:,:,1], .24)
    h[:,:,2] = np.clip(h[:,:,2] ** .82 * 1.08, 0, 1)
    out = Image.fromarray(np.uint8(h*255), 'HSV').convert('RGB')
    out.putalpha(im.getchannel('A'))
    return clean(out)

def save(im, name, actor=False):
    im = clean(grade(im) if actor else im)
    im.save(O/(name+'.png'), optimize=True)
    im.save(A/'rgba'/(name+'.png'), optimize=True)
    im.getchannel('A').save(A/'masks'/(name+'.png'))
    bg = Image.new('RGBA', im.size, '#d8d8ce'); bg.alpha_composite(im)
    bg.convert('RGB').save(A/'opaque'/(name+'.jpg'), quality=85)
    return im

def fit(im, size=(240,208), pad=18):
    im = clean(im); im = im.crop(box(im))
    im = ImageOps.contain(im, (size[0]-2*pad, size[1]-2*pad), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', size)
    out.alpha_composite(im, ((size[0]-im.width)//2, (size[1]-im.height)//2))
    return clean(out)

def figures(path, count):
    """Keep complete connected figures, including AA, instead of cutting weapons at grid edges."""
    im = clean(Image.open(path)); a = np.array(im)
    lab, n = label(a[:,:,3] > 100); areas = np.bincount(lab.ravel()); objs = find_objects(lab)
    major = sorted(range(1,n+1), key=lambda i: areas[i], reverse=True)[:count]
    assert min(areas[i] for i in major) > 3000
    center = lambda i: np.array([(objs[i-1][1].start+objs[i-1][1].stop)/2, (objs[i-1][0].start+objs[i-1][0].stop)/2])
    ordered = sorted(major, key=lambda i: center(i)[1])
    ordered = [i for row in range(count//4) for i in sorted(ordered[row*4:row*4+4], key=lambda i: center(i)[0])]
    groups = {i:[i] for i in ordered}
    for i in range(1,n+1):
        if i not in major and areas[i] >= 2:
            target = min(major, key=lambda k: np.linalg.norm(center(i)-center(k)))
            if np.linalg.norm(center(i)-center(target)) < 175: groups[target].append(i)
    result = []
    for i in ordered:
        mask = binary_dilation(np.isin(lab,groups[i]), iterations=2)
        b = a.copy(); b[~mask] = 0
        p = clean(Image.fromarray(b)); p = p.crop(box(p)); result.append(p)
    return result

frames = {}
for role, fraction in [('warrior',.92), ('archer',.90), ('mage',.82)]:
    poses = figures(S/(role+'-live.png' if role=='mage' else role+'.png'), 16 if role=='mage' else 24)
    if role == 'mage':
        old = json.loads((R/'public/assets/r6/actor-frames.json').read_text())['mage']
        atlas = Image.open(R/'public/assets/r6/mage.png')
        source_neutral = poses[0].height * fraction
        for row in [4,5]:
            for col in range(4):
                b=old['boxes'][row][col]
                p=atlas.crop((col*256+b[0],row*256+b[1],col*256+b[2],row*256+b[3]))
                factor=source_neutral/old['neutralHeight']
                poses.append(p.resize((round(p.width*factor),round(p.height*factor)),Image.Resampling.LANCZOS))
    factor = min(232/max(p.width for p in poses), 232/max(p.height for p in poses))
    neutral = poses[0].height * fraction * factor
    out=Image.new('RGBA',(1024,1536)); boxes=[]; distinct=[]
    for row in range(6):
        bs=[]; hashes=[]
        for col in range(4):
            p=poses[row*4+col]; p=p.resize((round(p.width*factor),round(p.height*factor)),Image.Resampling.LANCZOS)
            cell=Image.new('RGBA',(256,256)); cell.alpha_composite(p,((256-p.width)//2,246-p.height))
            out.alpha_composite(cell,(col*256,row*256)); bs.append(box(cell)); hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
        boxes.append(bs); distinct.append(len(set(hashes)))
    atlas=save(out,role,True)
    frames[role]=dict(fw=256,fh=256,boxes=boxes,neutralHeight=neutral,minimumLiveHeight=min(b[3]-b[1] for row,bs in enumerate(boxes) if row!=4 for b in bs),
                      distinctPosesPerRow=distinct,pivot=[128,246],bodyHeightPolicy='Neutral head-to-foot height; equipment and raised weapons excluded, uniform scale across poses.',inheritedRows=[4,5] if role=='mage' else [])
    save(fit(atlas.crop((0,0,256,256))),role+'-portrait')
    thumb=fit(atlas.crop((0,0,256,256)),(64,64),3); thumb.save(A/'thumbnails'/(role+'-64.png'))
    assert frames[role]['minimumLiveHeight']/neutral*48 >= 40, (role,frames[role])
(O/'actor-frames.json').write_text(json.dumps(frames,indent=2)+'\n',encoding='utf-8')

# Three genuinely different authored four-step gaits; each has a fixed body scale.
wolf_poses=figures(S/'hound-walk.png',12)
out=Image.new('RGBA',(1024,768)); boxes=[]; neutral=[]
for row,frac in enumerate([.60,.72,.81]):
    poses=wolf_poses[row*4:row*4+4]
    factor=min(232/max(p.width for p in poses),232/max(p.height for p in poses))
    neutral.append(poses[0].height*frac*factor); bs=[]
    for col,p in enumerate(poses):
        p=p.resize((round(p.width*factor),round(p.height*factor)),Image.Resampling.LANCZOS)
        cell=Image.new('RGBA',(256,256)); cell.alpha_composite(p,((256-p.width)//2,246-p.height)); out.alpha_composite(cell,(col*256,row*256));bs.append(box(cell))
    boxes.append(bs)
save(out,'hound-walk',True)
(O/'hound-frames.json').write_text(json.dumps(dict(fw=256,fh=256,boxes=boxes,neutralHeights=neutral,distinctPosesPerRow=[4,4,4],variants=['high-pennant-walk','horned-low-stalk','pack-long-bound'],policy='Four authored alternating steps per variant; fixed head-to-foot body scale; inherited R5 hurt/death.'),indent=2)+'\n',encoding='utf-8')

# Complete bridge cutouts, with no stretching of deck depth into a plaza.
im=clean(Image.open(S/'bridges.png'))
for name,y0,y1 in [('bridge-main',0,350),('bridge-old',350,604),('bridge-military',604,im.height)]:
    p=im.crop((0,y0,im.width,y1));p=p.crop(box(p));p=ImageOps.contain(p,(768,256),Image.Resampling.LANCZOS)
    save(p,name)
for kind in ['cannon','frost','tesla']:
    save(fit(Image.open(R/f'public/assets/r5/card-{kind}.png')),'card-'+kind)

# Water-only saturation grading, not geometric remapping of the painted banks.
im=Image.open(S/'ford.png').convert('RGB'); hsv=np.array(im.convert('HSV'))
water=(hsv[:,:,0]>100)&(hsv[:,:,0]<145)&(hsv[:,:,1]>65)
hsv[:,:,1][water]=(hsv[:,:,1][water].astype(float)*.76).astype('uint8')
Image.fromarray(hsv,'HSV').convert('RGB').resize((1440,960),Image.Resampling.LANCZOS).save(O/'ford.webp',quality=86,method=6)

prompts=json.loads((R/'docs/art/PROMPTS_R7.json').read_text(encoding='utf-8'))
allp=json.loads((R/'docs/art/PROMPTS.json').read_text(encoding='utf-8')); allp['seventhRound']=prompts
(R/'docs/art/PROMPTS.json').write_text(json.dumps(allp,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
runtime=[]
for p in sorted(O.iterdir()):
    item=dict(path=p.relative_to(R).as_posix(),sha256=sha(p),bytes=p.stat().st_size)
    if p.suffix in ['.png','.webp']:
        im=Image.open(p);item.update(size=list(im.size),mode=im.mode)
        if im.mode=='RGBA':
            a=np.array(im); item.update(alphaOccupancy=float((a[:,:,3]>128).mean()),cornersTransparent=all(a[y,x,3]==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]),transparentRGBZero=bool((a[a[:,:,3]==0,:3]==0).all()),bbox=list(box(im)))
        if p.stem in ['warrior','archer','mage','hound-walk','warrior-portrait','archer-portrait','mage-portrait']:item['color']=metrics(im);assert item['color']['pass'],(p,item['color'])
    runtime.append(item)
sources=[dict(id=s['id'],path=s['path'],sha256=sha(R/s['path']),bytes=(R/s['path']).stat().st_size,shipped=s['id'] not in ['mage','character-sheet']) for s in prompts['samples']]
for s in sources:
    im=Image.open(R/s['path']).convert('RGBA'); im.getchannel('A').save(A/'masks'/(s['id']+'-master.png'))
    bg=Image.new('RGBA',im.size,'#d8d8ce');bg.alpha_composite(im);bg.convert('RGB').save(A/'opaque'/(s['id']+'-master.jpg'),quality=85)
support=[dict(path=p.relative_to(R).as_posix(),sha256=sha(p),bytes=p.stat().st_size) for folder in ['masks','opaque','rgba','thumbnails'] for p in sorted((A/folder).glob('*'))]
inherited=[]
for old in json.loads((R/'docs/art/ASSET_MANIFEST_R6.json').read_text(encoding='utf-8'))['inheritedActorGrades']:
    p=R/old['path']; m=metrics(Image.open(p)); assert m['pass'],(p,m)
    inherited.append(dict(path=old['path'],sha256=sha(p),metrics=m))
manifest=dict(status='VERIFIED',round=7,actualTool='image_gen__imagegen',actualModelSlug=None,generatedMasters=len(sources),runtimeImageCount=sum('size' in i for i in runtime),runtimeBytes=sum(i['bytes'] for i in runtime),sources=sources,runtime=runtime,support=support,inheritedActorGrades=inherited,
              notes=['Original six-row mage source rejected for overlapping cells; live rows regenerated as spacious 4x4. Death/celebration inherit R6 true poses.', 'Existing R6 commander, logo, seals, panel and app icon retained to stay within the unique five-item acceptance scope.','Actor color grading and alpha cleanup are deterministic postprocessing, not new generated art.'])
(R/'docs/art/ASSET_MANIFEST_R7.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2,default=lambda b:bool(b))+'\n',encoding='utf-8')
print(json.dumps({k:manifest[k] for k in ['status','generatedMasters','runtimeImageCount','runtimeBytes']}))
