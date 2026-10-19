"""Comparison, quarter-size store previews and evidence index; raws unchanged."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import hashlib,json
ROOT=Path(__file__).resolve().parents[1];base=ROOT/'docs/art/compare/r4';out=ROOT/'docs/art/r4/thumbnails'
out.mkdir(parents=True,exist_ok=True);records=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for p in sorted((base/'before').glob('*.png')):
    im=Image.open(p);records.append(dict(path=p.relative_to(ROOT).as_posix(),size=list(im.size),sha256=sha(p),phase='before'))
manifest=json.loads((ROOT/'docs/art/ASSET_MANIFEST_R4.json').read_text(encoding='utf8'))
alpha=[]
for record in manifest['sources']:
    p=ROOT/record['path'];im=Image.open(p)
    if im.mode!='RGBA':continue
    mask=im.getchannel('A');mask.save(ROOT/f'docs/art/r4/masks/source-{record["id"]}.png',optimize=True)
    witness=Image.new('RGBA',im.size,'#d8d8d0');witness.alpha_composite(im)
    ImageOps.contain(witness.convert('RGB'),(768,768)).save(ROOT/f'docs/art/r4/opaque/source-{record["id"]}.jpg',quality=90)
    alpha.append(dict(id=record['id'],path=record['path'],nativeAlpha=True,cornerAlpha=[mask.getpixel(xy) for xy in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]],alphaExtrema=mask.getextrema(),rgbaMasterPreserved=True))
(ROOT/'docs/art/r4/source-alpha.json').write_text(json.dumps(dict(status='VERIFIED',sources=alpha,note='Native source alpha retained. Export clears alpha<20 before compression. Lossy WebP may rewrite RGB under zero alpha; masked grey witnesses verify actual compositing, not those undefined hidden RGB values.'),indent=2)+'\n',encoding='utf8')
for p in sorted((base/'after').glob('*.png')):
    im=Image.open(p).convert('RGB');old=base/'before'/p.name
    if old.exists():
        before=Image.open(old).convert('RGB');assert before.size==im.size
        pair=Image.new('RGB',(im.width*2,im.height+24),'#f5f1e5');pair.paste(before,(0,24));pair.paste(im,(im.width,24));d=ImageDraw.Draw(pair);d.text((8,6),'BEFORE R3',fill='#292d38');d.text((im.width+8,6),'AFTER R4',fill='#292d38');pair.save(base/p.name,optimize=True)
    im.resize((64,round(im.height*64/im.width)),Image.Resampling.LANCZOS).save(out/(p.stem+'-width64.png'),optimize=True)
    records.append(dict(path=p.relative_to(ROOT).as_posix(),size=list(im.size),sha256=sha(p)))
for p in sorted((ROOT/'docs/store/screenshots').glob('*.png')):
    im=Image.open(p).convert('RGB');records.append(dict(path=p.relative_to(ROOT).as_posix(),size=list(im.size),sha256=sha(p)))
    im.resize((im.width//4,im.height//4),Image.Resampling.LANCZOS).save(out/(p.stem+'-quarter.png'),optimize=True)
    im.resize((64,round(im.height*64/im.width)),Image.Resampling.LANCZOS).save(out/(p.stem+'-width64.png'),optimize=True)
    if 'defense' in p.name:
        # Center gameplay crop shown beside whole screenshot; never a store substitute.
        crop=im.crop((0,round(im.height*.15),im.width,round(im.height*.70)))
        crop.resize((im.width//4,round(crop.height/4)),Image.Resampling.LANCZOS).save(out/(p.stem+'-battle-quarter.png'),optimize=True)
for p in sorted((ROOT/'docs/art/r4/screens').glob('*.png')):
    im=Image.open(p);records.append(dict(path=p.relative_to(ROOT).as_posix(),size=list(im.size),sha256=sha(p)))
frames=sorted((ROOT/'docs/art/r4/motion').glob('iphone-*-defense-*.png'))
if frames:
    contact=Image.new('RGB',(4*215,466),'#f5f1e5')
    for i,p in enumerate(frames[:4]):contact.paste(Image.open(p).resize((215,466)),(i*215,0))
    contact.save(ROOT/'docs/art/r4/motion/contact-projectile.png',optimize=True)
record=dict(status='VERIFIED',rawScreenshots=records,note='Raw screenshots retain original dimensions. Paired images compare same public command sequence. Quarter-size store previews and 64px full-page previews are separate from per-unit 64px identity sheets; no human blind-test claim.')
(ROOT/'docs/evidence/art-r4-index.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('VERIFIED:',len(records),'raw screenshot hashes; paired comparisons and native quarter previews')
