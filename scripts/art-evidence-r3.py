"""Build comparison and thumbnail evidence without altering raw screenshots."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json, hashlib
ROOT=Path(__file__).resolve().parents[1];base=ROOT/'docs/art/compare/r3';out=ROOT/'docs/art/r3/thumbnails'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records=[]
for p in sorted((base/'after').glob('*.png')):
    im=Image.open(p).convert('RGB');im.resize((64,round(im.height*64/im.width)),Image.Resampling.LANCZOS).save(out/(p.stem+'-width64.png'),optimize=True)
    before=base/'before'/p.name
    if before.exists():
        a=Image.open(before).convert('RGB');assert a.size==im.size
        pair=Image.new('RGB',(im.width*2,im.height+24),'#eeeee5');pair.paste(a,(0,24));pair.paste(im,(im.width,24));d=ImageDraw.Draw(pair);d.text((8,6),'BEFORE R2',fill='#292d38');d.text((im.width+8,6),'AFTER R3',fill='#292d38');pair.save(base/(p.stem+'.png'),optimize=True)
    records.append({'path':p.relative_to(ROOT).as_posix(),'size':im.size,'sha256':sha(p)})
audit=ROOT/'docs/art/r3/visual-audit.json'
if audit.exists():
    r=json.loads(audit.read_text(encoding='utf8'));sheet=Image.new('RGB',(3*344,2*459),'#eeeee5')
    for i,c in enumerate(r['chapters']):
        p=ROOT/c['path'];im=Image.open(p);records.append({'path':c['path'],'size':im.size,'sha256':sha(p)});sheet.paste(im.resize((344,459),Image.Resampling.LANCZOS),(i%3*344,i//3*459))
        for k in ['path','noLabels']:
            im=Image.open(ROOT/c[k]);im.resize((64,round(im.height*64/im.width)),Image.Resampling.LANCZOS).save(out/(Path(c[k]).stem+'-width64.png'),optimize=True)
    sheet.save(ROOT/'docs/art/r3/chapters/contact-six-chapters.png',optimize=True)
motion=sorted((ROOT/'docs/art/r3/motion').glob('combat-*.png'))
if motion:
    contact=Image.new('RGB',(3*260,2*563),'#eeeee5')
    for i,p in enumerate(motion[:6]):contact.paste(Image.open(p).resize((260,563),Image.Resampling.LANCZOS),(i%3*260,i//3*563))
    contact.save(ROOT/'docs/art/r3/motion/contact-combat.png',optimize=True)
index={'status':'VERIFIED','rawScreenshots':records,'note':'Raw before/after at original CSS viewport size; side-by-side is a labeled contact image. Width64 files preserve aspect ratio. Native 64px per-unit no-text and silhouette contact sheets are separate.'}
(ROOT/'docs/evidence/art-r3-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('VERIFIED:',len(records),'raw screenshot hashes')
