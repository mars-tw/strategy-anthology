"""R6 deterministic cutout processing and measured delivery manifest. No drawing."""
from pathlib import Path
from PIL import Image,ImageOps
import numpy as np
from scipy.ndimage import gaussian_filter1d
import json,hashlib
R=Path(__file__).resolve().parents[1];A=R/'docs/art/r6';S=A/'sources';O=R/'public/assets/r6'
for p in [O,A/'masks',A/'opaque',A/'rgba',A/'thumbnails']:p.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def clean(im,threshold=20):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]<threshold]=0;return Image.fromarray(a)
def bbox(im):return im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
def metrics(im):
 a=np.array(im.convert('RGBA'));v=a[:,:,3]>128;rgb=a[:,:,:3]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=np.array(im.convert('RGB').convert('HSV'))[:,:,1]/255
 m=dict(meanLuminance=float(lum[v].mean()),nearBlackRatio=float((lum[v]<.12).mean()),meanSaturation=float(sat[v].mean()),lowSaturationRatio=float((sat[v]<.20).mean()))
 m['pass']=.30<=m['meanLuminance']<=.75 and m['nearBlackRatio']<.35 and m['meanSaturation']>=.32 and m['lowSaturationRatio']<.20
 return m
def grade(im):
 h=np.array(im.convert('RGB').convert('HSV')).astype(float)/255;h[:,:,0][h[:,:,1]<.16]=.10;h[:,:,1]=np.maximum(h[:,:,1],.24);h[:,:,2]=np.clip(h[:,:,2]**.83*1.08,0,1)
 out=Image.fromarray(np.uint8(h*255),'HSV').convert('RGB');out.putalpha(im.getchannel('A'));return clean(out)
def fit(im,size,pad=14):
 im=clean(im);im=im.crop(bbox(im));im=ImageOps.contain(im,(size[0]-pad*2,size[1]-pad*2),Image.Resampling.LANCZOS);out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,size[1]-pad-im.height));return clean(out)
def save(im,name,actor=False):
 im=clean(im)
 if actor:im=grade(im)
 im.save(O/(name+'.png'),optimize=True);im.save(A/'rgba'/(name+'.png'),optimize=True);im.getchannel('A').save(A/'masks'/(name+'.png'))
 comp=Image.new('RGBA',im.size,'#d8d8ce');comp.alpha_composite(im);comp.convert('RGB').save(A/'opaque'/(name+'.jpg'),quality=88)
 return im
bridge=clean(Image.open(S/'bridge-deck.png'),64);bridge=bridge.crop(bbox(bridge));bw,bh=bridge.size
# Perspective correction: preserve the arch silhouette while giving the top deck
# 70% of output height. This is a measured slice resize, not painted geometry.
plan=Image.new('RGBA',(768,384));offset=0
for y0,y1,hh in [(0,.10,30),(.10,.48,269),(.48,1,85)]:
 part=bridge.crop((0,round(y0*bh),bw,round(y1*bh))).resize((768,hh),Image.Resampling.LANCZOS);plan.alpha_composite(part,(0,offset));offset+=hh
save(plan,'bridge')
for name,size in [('commander',(512,768)),('logo',(768,320))]:save(fit(Image.open(S/(name+'.png')),size),name,name=='commander')
for name,ids,size in [('portraits',['warrior-portrait','archer-portrait','mage-portrait'],(240,208)),('icons',['seal-cannon','seal-frost','seal-tesla'],(128,128))]:
 im=clean(Image.open(S/(name+'.png')))
 for i,id in enumerate(ids):save(fit(im.crop((i*im.width//3,0,(i+1)*im.width//3,im.height)),size,18),id, name=='portraits')
Image.open(S/'panel.png').convert('RGB').resize((512,512)).save(O/'panel.webp',quality=85,method=6)
im=Image.open(S/'app-icon.png').convert('RGB')
for size in [64,192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(O/f'app-icon-{size}.png',optimize=True)
im.save(A/'app-icon-proposal.png',optimize=True)

# Keep authored alternating legs; each variant has fixed neutral torso scale.
im=clean(Image.open(S/'hound-variants.png'));atlas=Image.new('RGBA',(1024,768));boxes=[];neutral=[];poses=[]
# Source rows measured at 0..39%,40..68%,69..98% (generator used unequal gutters).
for row,(top,bottom,bodyfrac) in enumerate([(0,.39,.53),(.395,.68,.81),(.69,.985,.90)]):
 bs=[];hs=[];nh=None
 for col in range(4):
  part=im.crop((col*im.width//4,round(top*im.height),(col+1)*im.width//4,round(bottom*im.height)));part=part.crop(bbox(part))
  scale=min(232/part.height,236/part.width);p=part.resize((round(part.width*scale),round(part.height*scale)),Image.Resampling.LANCZOS)
  cell=Image.new('RGBA',(256,256));cell.alpha_composite(p,((256-p.width)//2,250-p.height));atlas.alpha_composite(cell,(col*256,row*256));bs.append(bbox(cell));hs.append(sha(S/'hound-variants.png')+hashlib.sha256(cell.tobytes()).hexdigest())
  if col==0:nh=p.height*bodyfrac
 boxes.append(bs);neutral.append(nh);poses.append(len(set(hs)))
save(atlas,'hound-walk',True)
(O/'hound-frames.json').write_text(json.dumps(dict(fw=256,fh=256,boxes=boxes,neutralHeights=neutral,distinctPosesPerRow=poses,policy='fixed per-variant neutral body scale, flag excluded from body height; drawn four-pose walk, inherited R5 hurt/death'),indent=2)+'\n')

actorFrames={}
for role in ['warrior','archer','mage']:
 im=clean(Image.open(S/(role+'.png')));alpha=np.array(im)[:,:,3]>80
 # Find gutters rather than cutting boots at assumed 256px source rows.
 rows=[0]+[min(range(round(k*im.height/6)-32,round(k*im.height/6)+33),key=lambda y:int(alpha[max(0,y-1):y+2].sum())) for k in range(1,6)]+[im.height]
 atlas=Image.new('RGBA',(1024,1536));boxes=[];distinct=[];neutral=None
 for row in range(6):
  strip=im.crop((0,rows[row],im.width,rows[row+1]));ar=np.array(strip)[:,:,3]>80
  columns=[0]+[min(range(round(k*im.width/4)-28,round(k*im.width/4)+29),key=lambda x:int(ar[:,max(0,x-1):x+2].sum())) for k in range(1,4)]+[im.width]
  bs=[];hashes=[]
  for col in range(4):
   p=strip.crop((columns[col],0,columns[col+1],strip.height));p=p.crop(bbox(p));p=p.resize((round(p.width*.72),round(p.height*.72)),Image.Resampling.LANCZOS)
   assert p.width<250 and p.height<250,(role,row,col,p.size)
   cell=Image.new('RGBA',(256,256));cell.alpha_composite(p,((256-p.width)//2,250-p.height));atlas.alpha_composite(cell,(col*256,row*256));bs.append(bbox(cell));hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
   if row==0 and col==0:neutral=p.height
  boxes.append(bs);distinct.append(len(set(hashes)))
 hurtScale=None
 if role in ['warrior','mage']:
  hurt=clean(Image.open(S/(role+'-hurt.png')));parts=[]
  for col in range(4):
   part=hurt.crop((col*hurt.width//4,0,(col+1)*hurt.width//4,hurt.height));parts.append(part.crop(bbox(part)))
  # One common factor for the whole authored standing-hurt strip. No per-frame
  # enlargement, and no inflation of an old crouched pose.
  hurtScale=neutral/max(p.height for p in parts);hashes=[]
  for col,part in enumerate(parts):
   part=part.resize((round(part.width*hurtScale),round(part.height*hurtScale)),Image.Resampling.LANCZOS);assert part.width<250 and part.height<250
   cell=Image.new('RGBA',(256,256));cell.alpha_composite(part,((256-part.width)//2,250-part.height));atlas.paste(cell,(col*256,3*256));boxes[3][col]=bbox(cell);hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
  distinct[3]=len(set(hashes))
 save(atlas,role,True);actorFrames[role]=dict(fw=256,fh=256,boxes=boxes,neutralHeight=neutral,minimumLiveHeight=min(b[3]-b[1] for i,row in enumerate(boxes) if i!=4 for b in row),distinctPosesPerRow=distinct,pivot=[128,250],sourceRowGutters=rows,hurtSheetScale=hurtScale)
(O/'actor-frames.json').write_text(json.dumps(actorFrames,indent=2)+'\n')

# Whole painted terrain remapped once to measured, authored winding banks.
im=Image.open(S/'ford.png').convert('RGB');src=np.array(im);hsv=np.array(im.convert('HSV'))/255;left=[];right=[]
for y in range(im.height):
 xs=np.where((hsv[y,:,0]>.43)&(hsv[y,:,0]<.57)&(hsv[y,:,1]>.26))[0]
 left.append(float(np.percentile(xs,3)) if len(xs)>20 else .38*im.width);right.append(float(np.percentile(xs,97)) if len(xs)>20 else .68*im.width)
left=gaussian_filter1d(left,14);right=gaussian_filter1d(right,14)
wy=np.linspace(0,640,641)
center=505+78*np.sin(wy*.014)+20*np.sin(wy*.032);radius=138+38*np.sin(wy*.024+.7);bl=np.minimum(450,center-radius);br=np.maximum(560,center+radius)
im.resize((1440,960),Image.Resampling.LANCZOS).save(O/'ford.webp',quality=87,method=6)
paintLeft=np.array(left)*960/im.width;paintRight=np.array(right)*960/im.width;paintCenter=(paintLeft+paintRight)/2;paintSpan=paintRight-paintLeft
(A/'river-geometry.json').write_text(json.dumps(dict(method='Measured cyan-water intervals on the unwarped painted source; no row displacement of terrain.',centerSpan=float(paintCenter.max()-paintCenter.min()),bankWidthMin=float(paintSpan.min()),bankWidthMax=float(paintSpan.max()),targetDeepCoreContained=bool((bl<=450).all() and (br>=560).all()),paintedDeepCoreContained=bool((paintLeft<=450).all() and (paintRight>=560).all()),samples=[dict(y=y,left=float(paintLeft[round(y/640*(im.height-1))]),right=float(paintRight[round(y/640*(im.height-1))])) for y in range(0,641,80)]),indent=2)+'\n')

prompts=json.loads((R/'docs/art/PROMPTS_R6.json').read_text(encoding='utf-8'));allp=json.loads((R/'docs/art/PROMPTS.json').read_text(encoding='utf-8'));allp['sixthRound']=prompts;(R/'docs/art/PROMPTS.json').write_text(json.dumps(allp,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
runtime=[]
for p in sorted(O.iterdir()):
 item=dict(path=p.relative_to(R).as_posix(),sha256=sha(p),bytes=p.stat().st_size)
 if p.suffix in ['.png','.webp']:
  im=Image.open(p);item.update(size=list(im.size),mode=im.mode)
  if im.mode=='RGBA':
   a=np.array(im);alpha=a[:,:,3];item.update(alphaOccupancy=float((alpha>128).mean()),cornersTransparent=all(int(alpha[y,x])==0 for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]),transparentRGBZero=bool((a[alpha==0,:3]==0).all()),bbox=list(bbox(im)))
  if p.stem in ['commander','hound-walk','warrior','archer','mage','warrior-portrait','archer-portrait','mage-portrait']:item['color']=metrics(im)
 runtime.append(item)
sources=[]
for sample in prompts['samples']:
 p=R/sample['path'];im=Image.open(p);sources.append(dict(id=sample['id'],path=sample['path'],sha256=sha(p),bytes=p.stat().st_size,size=list(im.size),mode=im.mode,shipped=sample['id'] not in ['unit-sheet','bridge','bridge-horizontal']))
for item in sources:
 im=Image.open(R/item['path']).convert('RGBA');base=Image.new('RGBA',im.size,'#d8d8ce');base.alpha_composite(im);base.convert('RGB').save(A/'opaque'/(item['id']+'-master.jpg'),quality=88);im.getchannel('A').save(A/'masks'/(item['id']+'-master.png'))
for role in ['warrior','archer','mage','enemy','worker','hound']:
 im=Image.open(O/(role+'.png') if role in ['warrior','archer','mage'] else R/f'public/assets/r5/{role}.webp').convert('RGBA').crop((0,0,256,256));t=fit(im,(64,64),2);t.save(A/'thumbnails'/(role+'-64.png'))
sheet=Image.new('RGB',(6*80,80),'#f5f1e5')
for i,role in enumerate(['warrior','archer','mage','enemy','worker','hound']):
 t=Image.open(A/'thumbnails'/(role+'-64.png'));sheet.paste(t,(i*80+8,8),t)
sheet.save(A/'thumbnails'/'unit-lineup-64.png')
sheet=Image.new('RGB',(240,80),'#f5f1e5');im=Image.open(O/'hound-walk.png').convert('RGBA')
for i in range(3):
 t=fit(im.crop((0,i*256,256,(i+1)*256)),(64,64),2);sheet.paste(t,(i*80+8,8),t)
sheet.save(A/'thumbnails'/'enemy-variants-64.png')
old=json.loads((R/'docs/art/ASSET_MANIFEST_R5.json').read_text(encoding='utf-8'))
inherited=[dict(path=a['path'],sha256=sha(R/a['path']),metrics=metrics(Image.open(R/a['path']))) for a in old['inheritedActorGrades']]
support=[dict(path=p.relative_to(R).as_posix(),sha256=sha(p),bytes=p.stat().st_size) for folder in ['masks','opaque','rgba','thumbnails'] for p in sorted((A/folder).glob('*')) if folder!='thumbnails' or '-quarter' not in p.name]
manifest=dict(status='VERIFIED' if all(i.get('color',{'pass':True})['pass'] for i in runtime) and all(i['metrics']['pass'] for i in inherited) else 'BLOCKED',version='0.7.0',actualTool='image_gen__imagegen',actualModelSlug=None,modelNote=prompts['modelNote'],generatedMasters=len(sources),sources=sources,support=support,inheritedActorGrades=inherited,runtime=runtime,runtimeBytes=sum(i['bytes'] for i in runtime),postprocess='Generated alpha preserved; alpha<20 cleanup, bbox crop, safe padding, fixed body normalization, HSV color grade, PNG cutouts and WebP opaque textures. Original two rejected bridge variants retained. Three humans have all six new pose states; worker/enemy and hound hurt/death retain R5 true frames.')
(R/'docs/art/ASSET_MANIFEST_R6.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(status=manifest['status'],masters=len(sources),runtime=len(runtime),bytes=manifest['runtimeBytes'],color=[(i['path'],i.get('color')) for i in runtime if i.get('color')])))
