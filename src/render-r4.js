import {animationFrame,resonance,ROUTE,PADS} from './engine.js';
import {CHAPTERS,COLORS} from './campaign.js';
import {towerPoint,roadWidth} from './presentation-r2.js';
import {unitHeight,riverCenter,CHAPTER_ART} from './presentation-r3.js';
import {riverBanks as naturalBanks,groundRange,roundedRoute} from './presentation-r4.js';
import towerConfig from '../vendor/tower-defense/src/config.js';
export async function loadArt(){
 const images={};await Promise.all([
  ...['ashwing.png','rootback.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['keep.png','barracks.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['tower-cannon.png','tower-frost.png','tower-tesla.png'].map(n=>[n,`./assets/r4/${n}`]),
  ...['enemy-keep.png','bridge.png'].map(n=>[n,`./assets/r2/${n}`]),
  ...CHAPTER_ART.map(n=>[`chapter-${n}`,`./assets/r3/chapter-${n}.webp`]),
  ...['warrior','archer','mage','enemy','worker','hound','pine','ford','river-overlay','road'].map(n=>['r4-'+n,`./assets/r4/${n}.webp`]),
  ['abutment','./assets/r3/abutment.png'],['nature.webp','./assets/nature.webp']
 ].map(async([name,url])=>{const im=new Image();im.src=url;await im.decode();images[name]=im;}));
 const r=await fetch('./assets/r2/actor-frames.json');if(!r.ok)throw Error('frame metadata missing');images.frames=await r.json();const r4=await fetch('./assets/r4/actor-frames.json');if(!r4.ok)throw Error('R4 frames missing');images.currentFrames=await r4.json();return images;
}
export function createRenderer(canvas,art){
 const ctx=canvas.getContext('2d'),bg=document.createElement('canvas'),g=bg.getContext('2d');
 let w=0,h=0,dpr=1,sx=1,sy=1,lastTerrain;
 const observer=new ResizeObserver(()=>{if(!canvas.isConnected)observer.disconnect();else lastTerrain=null;});observer.observe(canvas);
 function fit(){
  if(!canvas.isConnected){observer.disconnect();return false;}
  const nw=canvas.clientWidth,nh=canvas.clientHeight,nd=Math.min(devicePixelRatio||1,2);
  if(nw!==w||nh!==h||nd!==dpr){w=nw;h=nh;dpr=nd;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);bg.width=canvas.width;bg.height=canvas.height;sx=w/960;sy=h/640;lastTerrain=null;}
  return w>0&&h>0;
 }
 function cover(c,im){const s=Math.max(w/im.width,h/im.height);c.drawImage(im,(w-im.width*s)/2,(h-im.height*s)*.18,im.width*s,im.height*s);}
 function road(route){
  const ps=roundedRoute(route),im=art['r4-road'];let distance=0;
  // Genuine painted shoulder/rut slices follow native route; never a solid ribbon.
  for(let i=1;i<ps.length;i++){
   const a=ps[i-1],b=ps[i],len=Math.hypot(b.x-a.x,b.y-a.y),angle=Math.atan2(b.y-a.y,b.x-a.x),steps=Math.ceil(len/2);
   for(let j=0;j<steps;j++){const f=j/steps,d=distance+f*len,span=82+13*Math.sin(d*.014),sample=Math.floor(d*1.1)%(im.width-8);
    g.save();g.translate(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);g.rotate(angle);g.drawImage(im,sample,0,8,im.height,-2,-span/2,len/steps+3,span);g.restore();
   }distance+=len;
  }
 }
 function terrain(id,home,siege,chapter){
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  if(home){cover(g,art['chapter-'+CHAPTER_ART[chapter]]);return;}
  if(id==='pine'||id==='ford')g.drawImage(art[id==='pine'?'r4-pine':'r4-ford'],0,0,w,h);else cover(g,art['chapter-'+CHAPTER_ART[chapter]]);
  g.save();g.scale(sx,sy);
  road(siege?[{x:90,y:520},{x:310,y:425},{x:700,y:425},{x:700,y:195},{x:845,y:195}]:ROUTE);
  if(id==='ford'){
   if(siege)road([{x:230,y:333},{x:310,y:195},{x:845,y:195}]);
   // Hand-painted eroded shoreline and shallow water, warped around native core.
   g.drawImage(art['r4-river-overlay'],0,0,960,640);
   for(const y of [195,425]){const bank=naturalBanks(y),left=bank.left-32,right=bank.right+32;
    g.fillStyle='#1e354857';g.beginPath();g.ellipse((left+right)/2+10,y+19,(right-left)*.52,18,0,0,Math.PI*2);g.fill();
    for(const x of [left,right])g.drawImage(art.abutment,x-22,y-13,44,42);
    g.drawImage(art['bridge.png'],left-8,y-49,right-left+16,92);
   }
  }g.restore();
 }
 function label(text,x,y,color='#292d38',size=12){
  if(canvas.dataset.hideLabels==='true')return;
  ctx.save();ctx.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';
  const width=ctx.measureText(text).width+14;x=Math.max(width/2+3,Math.min(w-width/2-3,x));y=Math.max(18,Math.min(h-25,y));
  ctx.fillStyle='#eeeee5ed';ctx.fillRect(x-width/2,y-14,width,23);ctx.fillStyle=color;ctx.fillText(text,x,y+2);ctx.restore();
 }
 function sprite(im,x,y,height){const width=height*im.width/im.height;ctx.drawImage(im,x-width/2,y-height*.9,width,height);}
 function actor(a,measurements){
  const f=animationFrame(a),role=({warrior:'warrior',archer:'archer',mage:'mage',villager:'worker',shieldBearer:'enemy',miremaw:'hound'})[a.type],legacyName=`${a.type}.png`,im=role?art['r4-'+role]:art[legacyName];if(!im)return;
  const m=role?art.currentFrames[role]:art.frames[legacyName],box=m.boxes[f.row][f.frame],bh=unitHeight(a.type,w,h)*(f.state==='death'?.7:1),scale=bh/(box[3]-box[1]),bw=(box[2]-box[0])*scale;
  const x=Math.max(bw/2+3,Math.min(w-bw/2-3,a.x*sx)),y=Math.max(bh+10,Math.min(h-14,a.y*sy));
  ctx.save();ctx.fillStyle='#28323a45';ctx.beginPath();ctx.ellipse(x+3,y+4,bh*(role==='hound'?.42:.28),bh*.075,0,0,Math.PI*2);ctx.fill();
  // Authored articulated poses, normalized by visible height at a fixed foot.
  // No single-image wobble substitutes for walk/attack/hurt/death frames.
  const drawY=y-bh;
  if(a.hurt>0&&!measurements.reduced){ctx.globalAlpha=.6+.4*Math.abs(Math.sin(a.hurt*34));}
  if(a.team==='enemy'&&f.state==='walk'&&!measurements.reduced){ctx.fillStyle='#e2c59870';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x-bw*.35-5-i*7,y+3-Math.sin(a.anim*8+i)*3,5-i,2,0,0,Math.PI*2);ctx.fill();}}
  const left=['w','sw','nw'].includes(a.facing||(a.team==='enemy'?'w':'e'));
  ctx.save();ctx.translate(x,0);if(left)ctx.scale(-1,1);ctx.shadowColor=a.team==='enemy'?'#80bff2':'#ffe2a0';ctx.shadowBlur=2;
  ctx.drawImage(im,f.frame*m.fw+box[0],f.row*m.fh+box[1],box[2]-box[0],box[3]-box[1],-bw/2,drawY,bw,bh);ctx.restore();ctx.globalAlpha=1;
  if(a.hp>0){
   const hw=Math.max(36,bw*.65),hy=drawY-9;ctx.fillStyle='#292d38';ctx.fillRect(x-hw/2-1,hy-1,hw+2,7);ctx.fillStyle=a.team==='player'?'#69c9bb':'#d65b4b';ctx.fillRect(x-hw/2,hy,hw*a.hp/a.maxHP,5);
   ctx.fillStyle=a.team==='player'?'#c74936':'#303b53';ctx.beginPath();if(a.team==='player')ctx.arc(x,y+5,4,0,Math.PI*2);else{ctx.moveTo(x,y);ctx.lineTo(x+6,y+9);ctx.lineTo(x-6,y+9);}ctx.fill();
   measurements.units.push({type:a.type,role,team:a.team,x,y,height:bh,width:bw,healthWidth:hw,healthHeight:5,shadowWidth:bh*.56,frame:f.frame,row:f.row,state:f.state,facing:left?'left-mirror':'right-authored'});
  }
  if(a.rewarded&&!a.escaped&&a.anim<.8){ctx.globalAlpha=Math.max(0,1-a.anim/.8);label('+4',x,y-36-a.anim*30,'#9b4330',13);}
  ctx.restore();
 }
 function drawTower(t,pending=false,focused=false){
  const p=towerPoint(t,w,h),color=COLORS[t.type];
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(p.anchorX,p.anchorY);ctx.lineTo(p.x,p.y+2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#28333c55';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.34,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6b553e66';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.37,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=focused?color:'#ad966b88';ctx.lineWidth=focused?2.5:1;ctx.stroke();
  if(pending)ctx.globalAlpha=.65;sprite(art[`tower-${t.type}.png`],p.x,p.y,p.h);
  ctx.fillStyle=color;for(let i=0;i<(t.level||1);i++){ctx.beginPath();ctx.arc(p.x+(i-((t.level||1)-1)/2)*8,p.y+5,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();return p;
 }
 return function render(c,b,pending,skill,selectedTower){
  if(!fit())return;const chapter=CHAPTERS[b?.chapter??Math.min(c.chapter,5)],id=chapter.terrain,siege=chapter.mode==='siege',key=id+!b+siege;
  if(lastTerrain!==key){terrain(id,!b,siege,b?.chapter??Math.min(c.chapter,5));lastTerrain=key;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(bg,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
  const time=c.settings.reducedMotion?0:(b?.time||0),measurements={units:[],towers:[],reduced:c.settings.reducedMotion};
  if(!b)return;
  if(id==='ford'&&!c.settings.reducedMotion){
   ctx.save();ctx.strokeStyle='#d5e9df88';ctx.lineWidth=1.5;
   for(let i=0;i<13;i++){const wy=(i*53+time*24)%640,y=wy*sy,x=(riverCenter(wy)+Math.sin(i*2)*24)*sx;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-7,y+7,x-3,y+15);ctx.stroke();}ctx.restore();
  }
  if(canvas.dataset.terrainOnly==='true'){canvas.dataset.presentation=JSON.stringify({terrainOnly:true,chapterArt:CHAPTER_ART[b.chapter]});return;}
  const structureH=Math.max(98,Math.min(148,w*.19));sprite(art['keep.png'],(siege?125:845)*sx,(siege?520:535)*sy,structureH);
  if(siege){
   sprite(art['enemy-keep.png'],818*sx,215*sy,structureH*1.05);
   ctx.drawImage(art['nature.webp'],0,512,512,512,245*sx-22,462*sy-36,44,44);
   if(b.barracks||b.construction){sprite(art['barracks.png'],230*sx,333*sy,structureH*.85);}
   const x1=170*sx,y1=410*sy,x2=b.armyTarget.x*sx,y2=b.armyTarget.y*sy,angle=Math.atan2(y2-y1,x2-x1),length=Math.hypot(x2-x1,y2-y1);
   ctx.save();ctx.strokeStyle='#eef1dbe6';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.lineDashOffset=-time*12;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
   for(let t=35;t<length;t+=55){const x=x1+Math.cos(angle)*t,y=y1+Math.sin(angle)*t;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(1,0);ctx.lineTo(-5,4);ctx.stroke();ctx.restore();}ctx.restore();
  }else{
   const focus=b.towers.find(t=>t.id===selectedTower)||b.towers.find(t=>t.type===pending?.type)||b.towers.at(-1);
   const cardType=pending?.type||focus?.type;
   for(const card of canvas.parentElement.parentElement.querySelectorAll('.tower-card')){const value=String(card.dataset.action==='tower-'+cardType);if(card.getAttribute('aria-pressed')!==value)card.setAttribute('aria-pressed',value);}
   if(b.phase==='planning'||pending||selectedTower)for(const t of b.towers){const r=(towerConfig.TOWERS[t.type].range||140)+40,ellipse=groundRange(towerPoint(t,w,h),r,w),active=!pending&&t===focus;ctx.save();ctx.strokeStyle=active?COLORS[t.type]:'#5e677129';ctx.fillStyle=active?COLORS[t.type]+'16':'#00000000';ctx.lineWidth=active?2:1;ctx.setLineDash(active?[5,4]:[2,6]);ctx.beginPath();ctx.ellipse(ellipse.x,ellipse.y,ellipse.rx,ellipse.ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
   const linked=new Set();for(const t of b.towers)for(const partner of resonance(t,b.towers).partners){const edge=[t.id,partner.id].sort().join(':');if(linked.has(edge))continue;linked.add(edge);const a=towerPoint(t,w,h),z=towerPoint(partner,w,h);ctx.save();ctx.strokeStyle=b.trinity?'#8063af':'#888e83';ctx.lineWidth=2.5;ctx.setLineDash([7,5]);ctx.lineDashOffset=-time*14;ctx.beginPath();ctx.moveTo(a.x,a.y+2);ctx.lineTo(z.x,z.y+2);ctx.stroke();ctx.restore();}
   for(const t of [...b.towers].sort((a,z)=>a.y-z.y||a.x-z.x))measurements.towers.push({...drawTower(t,false,!pending&&t===focus),type:t.type,selected:!pending&&t===focus});
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
   const d=({cannon:160,frost:165,tesla:160})[pending.type],ellipse=groundRange(towerPoint(pending,w,h),d,w);measurements.preview={type:pending.type,...ellipse};ctx.save();ctx.strokeStyle=COLORS[pending.type];ctx.fillStyle=COLORS[pending.type]+'18';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(ellipse.x,ellipse.y,ellipse.rx,ellipse.ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();drawTower(pending,true,true);
  }
  if(skill)label('點敵群施放；取消不扣結晶',w/2,h-32,'#704b91');
  const field=canvas.parentElement;let legend=field.querySelector('.resonance-legend');
  if(!siege){if(!legend){legend=document.createElement('div');legend.className='resonance-legend';field.append(legend);}const focus=measurements.towers.find(t=>t.selected),type=pending?.type||focus?.type||'cannon',key=type+String(b.trinity);
   if(legend.dataset.text!==key){legend.dataset.text=key;legend.title='元素環為射程的貼地示意；紫線表示相鄰共鳴。';legend.innerHTML=`<img src="./assets/r4/seal-${type}.png" alt="${({cannon:'火印塔',frost:'冰印塔',tesla:'雷印塔'})[type]}已選取"><span class="legend-orbit" aria-hidden="true"></span><span class="legend-link ${b.trinity?'active':''}" aria-label="${b.trinity?'三相共鳴生效':'三相尚未成陣'}">△</span><strong>${b.trinity?'+30%':'—'}</strong>`;}
   legend.hidden=canvas.dataset.hideLabels==='true';
  }else legend?.remove();
  measurements.chapterArt=CHAPTER_ART[b.chapter];measurements.resonance={active:b.trinity,bonus:b.trinity ? .30 : 0,ranges:b.towers.map(t=>({type:t.type,x:t.x,y:t.y,radius:(towerConfig.TOWERS[t.type].range||140)+40})),selectedType:pending?.type||measurements.towers.find(t=>t.selected)?.type,projection:'ground ellipse 0.40; combat radii unchanged',rangeVisible:b.phase==='planning'||!!pending||!!selectedTower};measurements.effects=b.effects.map(f=>({kind:f.kind,age:f.age,hit:f.hit}));canvas.dataset.presentation=JSON.stringify(measurements);
 };
}
