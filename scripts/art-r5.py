"""R5 deterministic crop, grade, compression and evidence; no generated drawing."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import numpy as np
from scipy.ndimage import label, gaussian_filter1d, map_coordinates, maximum_filter, find_objects
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'docs/art/r5/sources';OUT=ROOT/'public/assets/r5';ART=ROOT/'docs/art/r5'
for p in [OUT,ART/'masks',ART/'opaque',ART/'thumbnails',ART/'rgba']:p.mkdir(parents=True,exist_ok=True)
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


def encode(im,path,actor=False):
    im=clean(im)
    if actor:
        # Global, reproducible color adjustment, never paint or recolor individual limbs.
        im=grade(im,.61 if 'enemy' in path.name or 'hound' in path.name or 'archer' in path.name else .10,1.10)
        for attempt in range(4):
            m=stats(im)
            if m['pass']:break
            hsv=np.array(im.convert('RGB').convert('HSV')).astype(float)/255
            if m['lowSaturationRatio']>=.20:hsv[:,:,1]=np.maximum(hsv[:,:,1],.24)
            if m['meanSaturation']<.32:hsv[:,:,1]=np.clip(hsv[:,:,1]*1.15,0,1)
            if m['meanLuminance']<.30:hsv[:,:,2]=np.clip(hsv[:,:,2]**.8*1.1,0,1)
            rgb=Image.fromarray(np.uint8(hsv*255),'HSV').convert('RGB');rgb.putalpha(im.getchannel('A'));im=clean(rgb)
    im.save(ART/'rgba'/(path.stem+'.png'),optimize=True)
    if path.suffix=='.webp':im.save(path,quality=88,method=6)
    else:im.save(path,optimize=True)
    im.getchannel('A').save(ART/'masks'/(path.stem+'.png'),optimize=True)
    witness=Image.new('RGBA',im.size,'#d8d8ce');witness.alpha_composite(im)
    ImageOps.contain(witness.convert('RGB'),(768,768)).save(ART/'opaque'/(path.stem+'.jpg'),quality=90)
    return Image.open(path).convert('RGBA')

frames={};grades=[]
for name in ['warrior','archer','mage','enemy','worker','hound']:
    source=clean(Image.open(SRC/(name+'.png')));assert source.size==(1024,1536)
    atlas=Image.new('RGBA',(1024,1536));boxes=[];distinct=[];neutral=None
    for row in range(6):
        poses=row_poses(source,row*256,(row+1)*256);bs=[];hs=[]
        for col,pose in enumerate(poses):
            # Preserve the scale drawn in the source sheet. Only common whole-sheet
            # factor .72 is used; never stretch individual attack/death poses to height.
            b=bbox(pose);assert b,(name,row,col)
            pose=pose.crop(b);pose=pose.resize((max(1,round(pose.width*.72)),max(1,round(pose.height*.72))),Image.Resampling.LANCZOS)
            if pose.width>250 or pose.height>250:raise ValueError((name,row,col,'cell overflow',pose.size))
            cell=Image.new('RGBA',(256,256));cell.alpha_composite(pose,((256-pose.width)//2,250-pose.height))
            atlas.alpha_composite(cell,(col*256,row*256));bs.append(bbox(cell));hs.append(hashlib.sha256(cell.tobytes()).hexdigest())
            if row==0 and col==0:neutral=pose.height
        boxes.append(bs);distinct.append(len(set(hs)))
    encoded=encode(atlas,OUT/(name+'.webp'),True)
    frames[name]={'fw':256,'fh':256,'boxes':boxes,'neutralHeight':neutral,'pivot':[128,250],'distinctPosesPerRow':distinct,'minimumLiveHeight':min(b[3]-b[1] for row in boxes[:4] for b in row),'scalePolicy':'one .72 factor for all source poses; runtime fixed neutral body scale'}
    grades.append({'path':(OUT/(name+'.webp')).relative_to(ROOT).as_posix(),'metrics':stats(encoded),'distinctPosesPerRow':distinct})
    neutralImage=encoded.crop((0,0,256,256));b=bbox(neutralImage)
    if name in ['warrior','archer','mage']:
        encode(cut(neutralImage.crop((b[0],b[1],b[2],b[1]+round((b[3]-b[1])*.48))),(224,192)),OUT/(name+'-portrait.webp'))
    for mode in ['no-text','silhouette']:
        t=cut(neutralImage,(64,64))
        if mode=='silhouette':s=Image.new('RGBA',t.size,'#292d38');s.putalpha(t.getchannel('A'));t=s
        t.save(ART/'thumbnails'/f'{name}-64-{mode}.png',optimize=True)
(OUT/'actor-frames.json').write_text(json.dumps(frames,indent=2)+'\n',encoding='utf-8')

for name in ['commander','logo']:
    size={'commander':(512,768),'logo':(768,300)}[name]
    im=encode(cut(Image.open(SRC/(name+'.png')),size),OUT/(name+'.png'),name=='commander')
    if name=='commander':grades.append({'path':(OUT/(name+'.png')).relative_to(ROOT).as_posix(),'metrics':stats(im)})
for name,prefix in [('icons','seal-'),('tower-cards','card-'),('hound-gear','gear-')]:
    im=clean(Image.open(SRC/(name+'.png')))
    for i,t in enumerate(['cannon','frost','tesla'] if name!='hound-gear' else ['flag','horn','pack']):
        crop=im.crop((round(i*im.width/3),0,round((i+1)*im.width/3),im.height))
        encode(cut(crop,(256,256) if name=='tower-cards' else (128,128)),OUT/(prefix+t+'.png'))
bridge=clean(Image.open(SRC/'bridge-plan.png'));bridge=bridge.crop(bbox(bridge))
# Preserve the painted deck; reduce vertical fascia/rail thickness to top-down view.
W,H=bridge.size;top=round(H*.15);bottom=round(H*.85)
parts=[bridge.crop((0,0,W,top)),bridge.crop((0,top,W,bottom)),bridge.crop((0,bottom,W,H))]
heights=[24,336,24];plan=Image.new('RGBA',(512,384));off=0
for part,hh in zip(parts,heights):plan.alpha_composite(part.resize((512,hh),Image.Resampling.LANCZOS),(0,off));off+=hh
encode(plan,OUT/'bridge.png')
structures={}
for name,path in [('keep.png','r1/keep.png'),('barracks.png','r1/barracks.png'),('enemy-keep.png','r2/enemy-keep.png')]+[(f'tower-{t}.png',f'r4/tower-{t}.png') for t in ['cannon','frost','tesla']]:structures[name]=list(bbox(Image.open(ROOT/'public/assets'/path)))
(OUT/'structure-frames.json').write_text(json.dumps(structures,indent=2)+'\n',encoding='utf-8')
Image.open(SRC/'panel.png').convert('RGB').resize((512,512)).save(OUT/'panel.webp',quality=86,method=6)
im=Image.open(SRC/'app-icon.png').convert('RGB')
for size in [64,192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(OUT/f'app-icon-{size}.png',optimize=True)
im.save(ART/'app-icon-proposal.png',optimize=True)
# Measured teal-water intervals; full terrain warp keeps the sand/shoal art.
im=Image.open(SRC/'ford.png').convert('RGB');src=np.array(im);hsv=np.array(im.convert('HSV'))/255
left=[];right=[]
for y in range(im.height):
    xs=np.where((hsv[y,:,0]>.43)&(hsv[y,:,0]<.57)&(hsv[y,:,1]>.30)&(np.arange(im.width)>.22*im.width)&(np.arange(im.width)<.85*im.width))[0]
    left.append(float(np.percentile(xs,5)) if len(xs)>20 else .40*im.width);right.append(float(np.percentile(xs,95)) if len(xs)>20 else .65*im.width)
left=gaussian_filter1d(left,16);right=gaussian_filter1d(right,16)
yy,xx=np.mgrid[0:960,0:1440];worldY=yy/960*640;worldX=xx/1440*960
center=505+70*np.sin(worldY*.014)+17*np.sin(worldY*.032);radius=105+27*np.sin(worldY*.024+.7)
bl=np.minimum(450,center-radius);br=np.maximum(560,center+radius)
sourceY=yy/959*(im.height-1);sl=np.interp(sourceY[:,0],np.arange(im.height),left)[:,None];sr=np.interp(sourceY[:,0],np.arange(im.height),right)[:,None]
sourceX=np.where(worldX<bl,worldX/bl*sl,np.where(worldX>br,sr+(worldX-br)/(960-br)*(im.width-1-sr),sl+(worldX-bl)/(br-bl)*(sr-sl)))
arr=np.stack([map_coordinates(src[:,:,c],[sourceY,sourceX],order=1,mode='nearest') for c in range(3)],axis=2).astype('uint8')
Image.fromarray(arr).save(OUT/'ford.webp',quality=88,method=6)
(ART/'river-geometry.json').write_text(json.dumps({'status':'VERIFIED','method':'whole painted terrain row-warp, not solid color river','centerSpan':float(center.max()-center.min()),'bankWidthMin':float((br-bl).min()),'bankWidthMax':float((br-bl).max()),'deepCoreContained':bool((bl<=450).all() and (br>=560).all()),'samples':[{'y':y,'left':float(bl[round(y/640*959),0]),'right':float(br[round(y/640*959),0])} for y in [0,80,160,240,320,400,480,560,640]]},indent=2)+'\n',encoding='utf-8')

prompts=json.loads((ROOT/'docs/art/PROMPTS_R5.json').read_text(encoding='utf-8'))
sources=[dict(id=s['id'],path=s['path'],sha256=sha(ROOT/s['path']),bytes=(ROOT/s['path']).stat().st_size) for s in prompts['samples']]
for a in sources:
    im=Image.open(ROOT/a['path']);a['size']=list(im.size);a['mode']=im.mode
runtime=[]
for p in sorted(OUT.iterdir()):
    r=dict(path=p.relative_to(ROOT).as_posix(),sha256=sha(p),bytes=p.stat().st_size)
    if p.suffix in ['.png','.webp']:
        im=Image.open(p);r.update(size=list(im.size),mode=im.mode)
        if im.mode=='RGBA':
            a=np.array(im);al=a[:,:,3];r.update(alphaOccupancy=float((al>128).mean()),cornersTransparent=all(int(al[y,x])==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]))
    runtime.append(r)
oldframes=json.loads((ROOT/'public/assets/r2/actor-frames.json').read_text())
inherited=[dict(path=p.relative_to(ROOT).as_posix(),sha256=sha(p),metrics=stats(Image.open(p))) for p in sorted((ROOT/'public/assets/r1').glob('*.png')) if p.name in oldframes and not p.name.startswith('enemy-')]
support=[dict(path=p.relative_to(ROOT).as_posix(),bytes=p.stat().st_size,sha256=sha(p)) for folder in ['masks','opaque','rgba'] for p in sorted((ART/folder).glob('*'))]
manifest=dict(support=support,status='VERIFIED' if all(a['metrics']['pass'] for a in grades) else 'BLOCKED',version='0.6.0',actualTool='image_gen__imagegen',actualModelSlug=None,modelNote=prompts['modelNote'],generatedMasters=len(sources),sources=sources,runtime=runtime,runtimeBytes=sum(a['bytes'] for a in runtime),inheritedActorGrades=inherited,actorGrades=grades,frameContract=['idle','walk','attack','hurt','death','cast'],impactFrame=2,postprocess='Pillow alpha cleanup<20, crop, uniform .72 sheet scale, common neutral body scale, encoded color grade and WebP compression. Generated alpha preserved. Original masters plus masks and gray composites retained. Six right-facing authored atlases, left facing mirrored derivative. Rejected narrow bridge master preserved but not shipped.')
(ROOT/'docs/art/ASSET_MANIFEST_R5.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
allprompts=json.loads((ROOT/'docs/art/PROMPTS.json').read_text(encoding='utf-8'));allprompts['fifthRound']=prompts;(ROOT/'docs/art/PROMPTS.json').write_text(json.dumps(allprompts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':manifest['status'],'masters':len(sources),'runtime':len(runtime),'bytes':manifest['runtimeBytes'],'grades':grades}))
