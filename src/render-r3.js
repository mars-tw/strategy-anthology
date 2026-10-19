import {animationFrame,resonance,ROUTE,PADS} from './engine.js';
import {CHAPTERS,COLORS} from './campaign.js';
import {towerPoint,roadWidth} from './presentation-r2.js';
import {unitHeight,riverCenter,riverBanks,roundedRoute,CHAPTER_ART} from './presentation-r3.js';
import towerConfig from '../vendor/tower-defense/src/config.js';
const ACTORS=[...['warrior','archer','villager','shieldBearer'].flatMap(a=>['e','ne','nw','w','sw','se'].map(d=>`${a}-${d}.png`)),'mage.png','miremaw.png','ashwing.png','rootback.png'];
export async function loadArt(){
 const images={};await Promise.all([
  ...ACTORS.map(n=>[n,`./assets/r1/${n}`]),
  ...['keep.png','barracks.png','tower-cannon.png','tower-frost.png','tower-tesla.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['battlefield.webp','battlefield-siege.webp','enemy-keep.png','bridge.png'].map(n=>[n,`./assets/r2/${n}`]),
  ...CHAPTER_ART.map(n=>[`chapter-${n}`,`./assets/r3/chapter-${n}.webp`]),
  ['road-surface','./assets/r3/road-surface.webp'],
  ...['gravel','ruts','sand','reeds','shoal','abutment'].map(n=>[n,`./assets/r3/${n}.png`]),
  ...['e','ne','nw','w','sw','se'].map(d=>[`enemy-shieldBearer-${d}.png`,`./assets/r2/enemy-shieldBearer-${d}.png`]),
  ['materials.webp','./assets/materials.webp'],['nature.webp','./assets/nature.webp']
 ].map(async([name,url])=>{const im=new Image();im.src=url;await im.decode();images[name]=im;}));
 const r=await fetch('./assets/r2/actor-frames.json');if(!r.ok)throw Error('frame metadata missing');images.frames=await r.json();return images;
}
export function createRenderer(canvas,art){
 const ctx=canvas.getContext('2d'),bg=document.createElement('canvas'),g=bg.getContext('2d');
 let w=0,h=0,dpr=1,sx=1,sy=1,lastTerrain;
 const roadTile=document.createElement('canvas');roadTile.width=128;roadTile.height=128;roadTile.getContext('2d').drawImage(art['road-surface'],0,0,128,128);const roadPattern=g.createPattern(roadTile,'repeat');
 const observer=new ResizeObserver(()=>{if(!canvas.isConnected)observer.disconnect();else lastTerrain=null;});observer.observe(canvas);
 function fit(){
  if(!canvas.isConnected){observer.disconnect();return false;}
  const nw=canvas.clientWidth,nh=canvas.clientHeight,nd=Math.min(devicePixelRatio||1,2);
  if(nw!==w||nh!==h||nd!==dpr){w=nw;h=nh;dpr=nd;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);bg.width=canvas.width;bg.height=canvas.height;sx=w/960;sy=h/640;lastTerrain=null;}
  return w>0&&h>0;
 }
 function cover(c,im){const s=Math.max(w/im.width,h/im.height);c.drawImage(im,(w-im.width*s)/2,(h-im.height*s)*.18,im.width*s,im.height*s);}
 function riverShape(){
  g.beginPath();for(let y=-20;y<=660;y+=8){const x=riverBanks(y).left;y===-20?g.moveTo(x,y):g.lineTo(x,y);}
  for(let y=660;y>=-20;y-=8)g.lineTo(riverBanks(y).right,y);g.closePath();
 }
 function road(route){
  const ps=roundedRoute(route),norm=ps.map((p,i)=>{const a=ps[Math.max(0,i-1)],b=ps[Math.min(ps.length-1,i+1)],l=Math.hypot(b.x-a.x,b.y-a.y)||1;return {x:-(b.y-a.y)/l,y:(b.x-a.x)/l};});
  function outline(extra){g.beginPath();for(let i=0;i<ps.length;i++){const p=ps[i],n=norm[i],r=roadWidth(i*10)/2+extra+(extra?Math.sin(i*1.73)*extra*.4:0),x=p.x+n.x*r,y=p.y+n.y*r;i?g.lineTo(x,y):g.moveTo(x,y);}for(let i=ps.length-1;i>=0;i--){const p=ps[i],n=norm[i],r=roadWidth(i*10)/2+extra+(extra?Math.sin(i*1.27)*extra*.4:0);g.lineTo(p.x-n.x*r,p.y-n.y*r);}g.closePath();}
  outline(7);g.fillStyle='#8d845b70';g.fill();outline(3);g.fillStyle='#ad9b6f99';g.fill();outline(0);g.fillStyle=roadPattern;g.fill();
  g.save();outline(0);g.clip();g.fillStyle='#bb9c6330';g.fillRect(0,0,960,640);
  // Paired irregular cart ruts follow the smooth route through both bends.
  for(const off of [-6,6]){g.beginPath();ps.forEach((p,i)=>{const n=norm[i],j=Math.sin(i*.9)*.7;const x=p.x+n.x*(off+j),y=p.y+n.y*(off+j);i?g.lineTo(x,y):g.moveTo(x,y);});g.strokeStyle='#5c583d58';g.lineWidth=2.6;g.stroke();g.strokeStyle='#e4cda64d';g.lineWidth=.8;g.stroke();}
  g.restore();
  for(let i=3;i<ps.length;i+=7+(i%5)){const p=ps[i],n=norm[i],r=roadWidth(i*10)/2,side=i%2?-1:1;g.save();g.translate(p.x+n.x*(r+5)*side,p.y+n.y*(r+5)*side);g.rotate(Math.atan2(n.y,n.x));g.drawImage(art.gravel,-11,-8,22,16);g.restore();}
 }
 function terrain(id,home,siege,chapter){
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);cover(g,art['chapter-'+CHAPTER_ART[chapter]]);if(home)return;
  g.save();g.scale(sx,sy);
  road(siege?[{x:90,y:520},{x:310,y:425},{x:700,y:425},{x:700,y:195},{x:845,y:195}]:ROUTE);
  if(id==='ford'){
   riverShape();g.strokeStyle='#65796e55';g.lineWidth=28;g.stroke();g.fillStyle='#c9c4a3';g.fill();
   g.save();riverShape();g.clip();const water=g.createLinearGradient(400,0,600,0);water.addColorStop(0,'#a5c9b9');water.addColorStop(.25,'#6ca8ad');water.addColorStop(.6,'#538c9b');water.addColorStop(1,'#a6c7b7');g.fillStyle=water;g.fillRect(350,0,320,640);
   g.globalAlpha=.25;g.drawImage(art['materials.webp'],512,512,512,512,350,0,320,640);g.globalAlpha=1;
   for(let y=15;y<640;y+=38){const c=riverCenter(y);g.beginPath();g.moveTo(c-40,y);g.bezierCurveTo(c-20,y+9,c+8,y-9,c+38,y+5);g.strokeStyle='#e0f1db77';g.lineWidth=2;g.stroke();}g.restore();
   riverShape();g.strokeStyle='#e1e1bfa8';g.lineWidth=3;g.stroke();
   for(let y=38;y<640;y+=71){if(Math.abs(y-195)<52||Math.abs(y-425)<52)continue;const side=y%2?'left':'right',bank=riverBanks(y),x=bank[side];g.drawImage(art.sand,x-30,y-10,60,26);g.drawImage(art.reeds,x+(side==='left'?-23:2),y-28,25,38);if(y%3)g.drawImage(art.shoal,bank.left-13,y+27,42,26);}
   for(const y of [195,425]){const bank=riverBanks(y),left=bank.left-20,right=bank.right+20;for(const x of [left,right])g.drawImage(art.abutment,x-20,y-19,40,40);g.drawImage(art['bridge.png'],left-8,y-54,right-left+16,103);}
  }
  g.restore();
 }
 function label(text,x,y,color='#292d38',size=12){
  if(canvas.dataset.hideLabels==='true')return;
  ctx.save();ctx.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';
  const width=ctx.measureText(text).width+14;x=Math.max(width/2+3,Math.min(w-width/2-3,x));y=Math.max(18,Math.min(h-25,y));
  ctx.fillStyle='#eeeee5ed';ctx.fillRect(x-width/2,y-14,width,23);ctx.fillStyle=color;ctx.fillText(text,x,y+2);ctx.restore();
 }
 function sprite(im,x,y,height){const width=height*im.width/im.height;ctx.drawImage(im,x-width/2,y-height*.9,width,height);}
 function actor(a,measurements){
  const f=animationFrame(a),big=['mage','miremaw','ashwing','rootback'].includes(a.type),prefix=a.team==='enemy'&&a.type==='shieldBearer'?'enemy-':'',name=big?`${a.type}.png`:`${prefix}${a.type}-${a.facing||(a.team==='enemy'?'w':'e')}.png`,im=art[name];if(!im)return;
  const m=art.frames[name],box=m.boxes[f.row][f.frame],bh=unitHeight(a.type,w,h),scale=bh/(box[3]-box[1]),bw=(box[2]-box[0])*scale;
  const x=Math.max(bw/2+3,Math.min(w-bw/2-3,a.x*sx)),y=Math.max(bh+10,Math.min(h-14,a.y*sy));
  ctx.save();ctx.fillStyle='#28323a45';ctx.beginPath();ctx.ellipse(x,y+4,bh*.25,bh*.085,0,0,Math.PI*2);ctx.fill();
  // Native authored pose, constant scale across the atlas; only transparent
  // padding is cropped. No single-image wobble substitutes for animation.
  const drawY=y-bh;
  if(a.hurt>0&&!measurements.reduced){ctx.globalAlpha=.6+.4*Math.abs(Math.sin(a.hurt*34));}
  ctx.drawImage(im,f.frame*m.fw+box[0],f.row*m.fh+box[1],box[2]-box[0],box[3]-box[1],x-bw/2,drawY,bw,bh);ctx.globalAlpha=1;
  if(a.hp>0){
   const hw=Math.max(36,bw*.65),hy=drawY-9;ctx.fillStyle='#292d38';ctx.fillRect(x-hw/2-1,hy-1,hw+2,7);ctx.fillStyle=a.team==='player'?'#69c9bb':'#d65b4b';ctx.fillRect(x-hw/2,hy,hw*a.hp/a.maxHP,5);
   ctx.fillStyle=a.team==='player'?'#c74936':'#303b53';ctx.beginPath();if(a.team==='player')ctx.arc(x,y+5,4,0,Math.PI*2);else{ctx.moveTo(x,y);ctx.lineTo(x+6,y+9);ctx.lineTo(x-6,y+9);}ctx.fill();
   measurements.units.push({type:a.type,team:a.team,height:bh,width:bw,healthWidth:hw,healthHeight:5,shadowWidth:bh*.5,frame:f.frame,row:f.row});
  }
  if(a.rewarded&&!a.escaped&&a.anim<.8){ctx.globalAlpha=Math.max(0,1-a.anim/.8);label('+4',x,y-36-a.anim*30,'#9b4330',13);}
  ctx.restore();
 }
 function drawTower(t,pending=false){
  const p=towerPoint(t,w,h),color=COLORS[t.type];
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(p.anchorX,p.anchorY);ctx.lineTo(p.x,p.y+2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#28333c55';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.34,7,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.fillStyle='#eeeddfc9';ctx.beginPath();ctx.ellipse(p.x,p.y+1,p.h*.34,8,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(pending)ctx.globalAlpha=.65;sprite(art[`tower-${t.type}.png`],p.x,p.y,p.h);
  ctx.fillStyle=color;for(let i=0;i<(t.level||1);i++){ctx.beginPath();ctx.arc(p.x+(i-((t.level||1)-1)/2)*8,p.y+5,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();return p;
 }
 return function render(c,b,pending,skill){
  if(!fit())return;const chapter=CHAPTERS[b?.chapter??Math.min(c.chapter,5)],id=chapter.terrain,siege=chapter.mode==='siege',key=id+!b+siege;
  if(lastTerrain!==key){terrain(id,!b,siege,b?.chapter??Math.min(c.chapter,5));lastTerrain=key;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(bg,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
  const time=c.settings.reducedMotion?0:(b?.time||0),measurements={units:[],towers:[],reduced:c.settings.reducedMotion};
  if(!b)return;
  if(id==='ford'&&!c.settings.reducedMotion){
   ctx.save();ctx.strokeStyle='#d5e9df88';ctx.lineWidth=1.5;
   for(let i=0;i<13;i++){const wy=(i*53+time*24)%640,y=wy*sy,x=(riverCenter(wy)+Math.sin(i*2)*24)*sx;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-7,y+7,x-3,y+15);ctx.stroke();}ctx.restore();
  }
  const structureH=Math.max(70,Math.min(126,w*.16));sprite(art['keep.png'],(siege?125:845)*sx,(siege?520:535)*sy,structureH);label('松林', (siege?125:845)*sx,(siege?565:580)*sy);
  if(siege){
   sprite(art['enemy-keep.png'],818*sx,215*sy,structureH*1.2);label(`灰旗 ${Math.ceil(b.keepHP)}`,818*sx,263*sy,'#64403a');
   ctx.drawImage(art['nature.webp'],0,512,512,512,245*sx-22,462*sy-36,44,44);label('補給',275*sx,520*sy,'#366975');
   if(b.barracks||b.construction){sprite(art['barracks.png'],230*sx,333*sy,structureH*.85);label(b.barracks?'兵營':`施工 ${Math.ceil(b.construction)}`,230*sx,374*sy);}
   const x1=170*sx,y1=410*sy,x2=b.armyTarget.x*sx,y2=b.armyTarget.y*sy,angle=Math.atan2(y2-y1,x2-x1),length=Math.hypot(x2-x1,y2-y1);
   ctx.save();ctx.strokeStyle='#eef1dbe6';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.lineDashOffset=-time*12;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
   for(let t=35;t<length;t+=55){const x=x1+Math.cos(angle)*t,y=y1+Math.sin(angle)*t;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(1,0);ctx.lineTo(-5,4);ctx.stroke();ctx.restore();}ctx.restore();
  }else{
   if(b.phase==='planning'||pending)for(const t of b.towers){const r=(towerConfig.TOWERS[t.type].range||140)+40;ctx.save();ctx.strokeStyle=COLORS[t.type];ctx.fillStyle=COLORS[t.type]+'16';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(t.x*sx,t.y*sy,r*sx,r*sy,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
   const linked=new Set();for(const t of b.towers)for(const partner of resonance(t,b.towers).partners){const edge=[t.id,partner.id].sort().join(':');if(linked.has(edge))continue;linked.add(edge);const a=towerPoint(t,w,h),z=towerPoint(partner,w,h);ctx.save();ctx.strokeStyle=b.trinity?'#8063af':'#888e83';ctx.lineWidth=2.5;ctx.setLineDash([7,5]);ctx.lineDashOffset=-time*14;ctx.beginPath();ctx.moveTo(a.x,a.y+2);ctx.lineTo(z.x,z.y+2);ctx.stroke();ctx.restore();}
   for(const t of [...b.towers].sort((a,z)=>a.y-z.y||a.x-z.x))measurements.towers.push({...drawTower(t),type:t.type});
  }
  [...b.units,...b.enemies].sort((a,z)=>a.y-z.y).forEach(a=>actor(a,measurements));
  for(const fx of b.effects){
   const color=COLORS[fx.color]||'#e9c681';ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;
   if(fx.kind==='shot'){
    const tower=b.towers.find(t=>t.x===fx.x&&t.y===fx.y),p=tower?towerPoint(tower,w,h):{x:fx.x*sx,y:fx.y*sy},f=Math.min(1,fx.age/.22),x=p.x+(fx.tx*sx-p.x)*f,y=p.y-36+(fx.ty*sy-p.y+36)*f;
    ctx.beginPath();ctx.moveTo(p.x,p.y-36);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
   }else{
    const x=fx.x*sx,y=fx.y*sy,r=fx.kind==='spell'?Math.max(16,100*sx)*(fx.age/.55):8+fx.age*28;ctx.globalAlpha=1-fx.age/.55;
    for(let i=0;i<(fx.kind==='spell'?3:1);i++){ctx.strokeStyle=['#ef9654','#85d3db','#b39ae8'][i];ctx.beginPath();ctx.arc(x,y,r+i*6,0,Math.PI*2);ctx.stroke();}
   }ctx.restore();
  }
  if(pending){
   const d=({cannon:160,frost:165,tesla:160})[pending.type];ctx.save();ctx.strokeStyle=COLORS[pending.type];ctx.fillStyle=COLORS[pending.type]+'18';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(pending.x*sx,pending.y*sy,d*sx,d*sy,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();drawTower(pending,true);
  }
  if(skill)label('點敵群施放；取消不扣結晶',w/2,h-32,'#704b91');
  const field=canvas.parentElement;let legend=field.querySelector('.resonance-legend');if(!siege){if(!legend){legend=document.createElement('div');legend.className='resonance-legend';field.append(legend);}const text=b.trinity?'三相共鳴 · 傷害 +30%':'三相共鳴 · 尚未成陣';const hint=b.phase==='planning'?'虛線圈＝真實射程 · 紫線＝共鳴連結':b.trinity?'紫線＝共鳴連結 · 每塔增益已生效':'異元素相鄰可共鳴 · 三相各加 30%';if(legend.dataset.text!==text+hint){legend.dataset.text=text+hint;legend.replaceChildren(document.createTextNode(text));const small=document.createElement('small');small.textContent=hint;legend.append(small);}legend.hidden=canvas.dataset.hideLabels==='true';}else legend?.remove();
  measurements.chapterArt=CHAPTER_ART[b.chapter];measurements.resonance={active:b.trinity,bonus:b.trinity ? .30 : 0,ranges:b.towers.map(t=>({type:t.type,x:t.x,y:t.y,radius:(towerConfig.TOWERS[t.type].range||140)+40})),rangeVisible:b.phase==='planning'||!!pending};canvas.dataset.presentation=JSON.stringify(measurements);
 };
}
