import {animationFrame,resonance,ROUTE,PADS} from './engine.js';
import {CHAPTERS,COLORS} from './campaign.js';
import {towerPoint,bodyHeight,groundRange,bridgeGeometry,landMarch,actorLane,project} from './presentation-r6.js';
import {CHAPTER_ART} from './presentation-r3.js';
import {roundedRoute} from './presentation-r4.js';
import spriteBoxes from '../public/assets/r5/structure-frames.json';
import towerConfig from '../vendor/tower-defense/src/config.js';
export async function loadArt(){
 const images={};await Promise.all([
  ...['ashwing.png','rootback.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['keep.png','barracks.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['tower-cannon.png','tower-frost.png','tower-tesla.png'].map(n=>[n,`./assets/r4/${n}`]),
  ...['enemy-keep.png','bridge.png'].map(n=>[n,`./assets/r2/${n}`]),
  ...CHAPTER_ART.map(n=>[`chapter-${n}`,`./assets/r3/chapter-${n}.webp`]),
  ...['warrior','archer','mage','enemy','worker','hound'].map(n=>['r5-'+n,['warrior','archer','mage'].includes(n)?`./assets/r6/${n}.png`:`./assets/r5/${n}.webp`]),
  ...['pine','road'].map(n=>['r4-'+n,`./assets/r4/${n}.webp`]),
  ...['gear-flag','gear-horn','gear-pack'].map(n=>['r5-'+n,`./assets/r5/${n}.png`]),
  ['abutment','./assets/r3/abutment.png'],['nature.webp','./assets/nature.webp']
  ,...['ford.webp','bridge.png','hound-walk.png'].map(n=>['r6-'+n.split('.')[0],`./assets/r6/${n}`])
 ].map(async([name,url])=>{const im=new Image();im.src=url;await im.decode();images[name]=im;}));
 const r=await fetch('./assets/r2/actor-frames.json');if(!r.ok)throw Error('frame metadata missing');images.frames=await r.json();const r4=await fetch('./assets/r5/actor-frames.json');if(!r4.ok)throw Error('R4 frames missing');images.currentFrames=await r4.json();const current=await fetch('./assets/r6/actor-frames.json');if(!current.ok)throw Error('R6 human frames missing');Object.assign(images.currentFrames,await current.json());const r6=await fetch('./assets/r6/hound-frames.json');if(!r6.ok)throw Error('R6 frames missing');images.houndFrames=await r6.json();return images;
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
  const ps=roundedRoute(route).map(p=>project(p.x,p.y,960,640,false)),im=art['r4-road'];let distance=0;
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
  if(id==='pine'||id==='ford')g.drawImage(art[id==='pine'?'r4-pine':'r6-ford'],0,0,w,h);else cover(g,art['chapter-'+CHAPTER_ART[chapter]]);
  if(id!=='ford'){
   g.save();g.scale(sx,sy);road(siege?[{x:90,y:520},{x:310,y:425},{x:700,y:425},{x:700,y:195},{x:845,y:195}]:ROUTE);g.restore();
  }else{
   // Broad bridge with splayed painted steps is drawn in CSS-pixel miniature scale.
   for(const y of [195,425]){const p=bridgeGeometry(y,w,h);
    g.save();g.fillStyle='#282c3b60';g.beginPath();g.ellipse(p.x+p.width*.53,y*sy+p.height*.23,p.width*.48,p.height*.12,0,0,Math.PI*2);g.fill();
    g.drawImage(art['r6-bridge'],p.x,p.y,p.width,p.height);g.restore();
   }
  }
 }

 function label(text,x,y,color='#292d38',size=12){
  if(canvas.dataset.hideLabels==='true')return;
  ctx.save();ctx.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';
  const width=ctx.measureText(text).width+14;x=Math.max(width/2+3,Math.min(w-width/2-3,x));y=Math.max(18,Math.min(h-25,y));
  ctx.fillStyle='#eeeee5ed';ctx.fillRect(x-width/2,y-14,width,23);ctx.fillStyle=color;ctx.fillText(text,x,y+2);ctx.restore();
 }
 function sprite(im,x,y,height){const name=Object.keys(art).find(k=>art[k]===im),b=spriteBoxes[name]||[0,0,im.width,im.height],width=height*(b[2]-b[0])/(b[3]-b[1]);ctx.drawImage(im,b[0],b[1],b[2]-b[0],b[3]-b[1],x-width/2,y-height,width,height);}
 function actor(a,measurements){
  const lane=actorLane(a,measurements.siege),visual={...a,anim:a.anim+(['walk','idle'].includes(a.state)?lane.phase:0)};
  const f=animationFrame(visual),role=({warrior:'warrior',archer:'archer',mage:'mage',villager:'worker',shieldBearer:'enemy',miremaw:'hound'})[a.type],legacyName=`${a.type}.png`,variantWalk=role==='hound'&&f.state==='walk',im=variantWalk?art['r6-hound-walk']:role?art['r5-'+role]:art[legacyName];if(!im)return;
  const m=variantWalk?art.houndFrames:role?art.currentFrames[role]:art.frames[legacyName],row=variantWalk?lane.variant:f.row,box=m.boxes[row][f.frame],bh=bodyHeight(w),scale=bh/(variantWalk?m.neutralHeights[lane.variant]:(m.neutralHeight||m.minimumLiveHeight)),poseHeight=(box[3]-box[1])*scale,bw=(box[2]-box[0])*scale;
  const ground=project(a.x,a.y,w,h,measurements.siege);
  const x=Math.max(bw/2+3,Math.min(w-bw/2-3,ground.x+lane.x+(measurements.siege&&role==='worker'?40:0))),y=Math.max(poseHeight+8,Math.min(h-14,ground.y+lane.y));
  ctx.save();ctx.fillStyle='#28323a45';ctx.beginPath();ctx.ellipse(x+4,y+4,bh*(role==='hound'?.48:.30),bh*.095,0,0,Math.PI*2);ctx.fill();
  // Authored articulated poses at one neutral body scale and a fixed foot.
  // No single-image wobble substitutes for walk/attack/hurt/death frames.
  // Soil compression ring under each body, shared left-upper illumination.
  ctx.strokeStyle='#69523d65';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+3,bh*.36,bh*.11,0,0,Math.PI*2);ctx.stroke();
  const drawY=y-poseHeight;
  if(a.hurt>0&&!measurements.reduced){ctx.globalAlpha=.6+.4*Math.abs(Math.sin(a.hurt*34));}
  if(a.team==='enemy'&&f.state==='walk'&&!measurements.reduced){ctx.fillStyle='#e2c59870';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x-bw*.35-5-i*7,y+3-Math.sin(a.anim*8+i)*3,5-i,2,0,0,Math.PI*2);ctx.fill();}}
  const left=['w','sw','nw'].includes(a.facing||(a.team==='enemy'?'w':'e'));
  ctx.save();ctx.translate(x,0);if(left)ctx.scale(-1,1);ctx.shadowColor=a.team==='enemy'?'#80bff2':'#ffe2a0';ctx.shadowBlur=2;
  ctx.drawImage(im,f.frame*m.fw+box[0],row*m.fh+box[1],box[2]-box[0],box[3]-box[1],-bw/2,drawY,bw,poseHeight);
  if(role==='hound'&&a.hp>0&&!variantWalk){const gear=art['r5-gear-'+['flag','horn','pack'][lane.variant]],gh=lane.variant===0?bh*.60:bh*.38,gw=gh*gear.width/gear.height;ctx.drawImage(gear,-bw*.26,drawY+poseHeight*.25-gh*.6,gw,gh);}
  ctx.restore();ctx.globalAlpha=1;
  if(a.hp>0){
   const leader=role==='hound'?measurements.leaderId===a.id:role!=='worker'&&(a.team==='enemy'||a.hp<a.maxHP||a.state==='attack'),healthShown=leader&&canvas.dataset.hideLabels!=='true';
   const hw=36,hy=drawY-9;if(healthShown){ctx.fillStyle='#292d38';ctx.fillRect(x-hw/2-1,hy-1,hw+2,7);ctx.fillStyle=a.team==='player'?'#69c9bb':'#d65b4b';ctx.fillRect(x-hw/2,hy,hw*a.hp/a.maxHP,5);}
   measurements.units.push({type:a.type,role,team:a.team,x,y,height:bh,width:bw,healthWidth:hw,healthHeight:5,shadowWidth:bh*.60,poseHeight,variant:lane.variant,phase:lane.phase,healthShown,frame:f.frame,row,state:f.state,source:variantWalk?'r6/hound-walk':(['warrior','archer','mage'].includes(role)?'r6/':'r5/')+role,facing:left?'left-mirror':'right-authored'});
  }
  if(a.rewarded&&!a.escaped&&a.anim<.8){ctx.globalAlpha=Math.max(0,1-a.anim/.8);label('+4',x,y-36-a.anim*30,'#9b4330',13);}
  ctx.restore();
 }
 function drawTower(t,pending=false,focused=false){
  const p=towerPoint(t,w,h),color=COLORS[t.type];
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p.anchorX,p.anchorY);ctx.lineTo(p.x,p.y+2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#28333c55';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.34,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6b553e66';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.37,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=focused?color:'#ad966b88';ctx.lineWidth=focused?2.5:1;ctx.stroke();
  if(pending)ctx.globalAlpha=.65;sprite(art[`tower-${t.type}.png`],p.x,p.y,p.h);
  ctx.fillStyle=color;for(let i=0;i<(t.level||1);i++){ctx.beginPath();ctx.arc(p.x+(i-((t.level||1)-1)/2)*8,p.y+5,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();return p;
 }
 return function render(c,b,pending,skill,selectedTower){
  if(!fit())return;const chapter=CHAPTERS[b?.chapter??Math.min(c.chapter,5)],id=chapter.terrain,siege=chapter.mode==='siege',key=id+!b+siege;
  if(lastTerrain!==key){terrain(id,!b,siege,b?.chapter??Math.min(c.chapter,5));lastTerrain=key;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(bg,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
  const time=c.settings.reducedMotion?0:(b?.time||0),measurements={units:[],towers:[],reduced:c.settings.reducedMotion,siege,bodyHeight:bodyHeight(w),bridges:[195,425].map(y=>bridgeGeometry(y,w,h)),leaderId:(b?.enemies.find(a=>a.hp>0&&actorLane(a,siege).variant===0)||b?.enemies.find(a=>a.hp>0))?.id};
  if(!b)return;
  if(canvas.dataset.terrainOnly==='true'){canvas.dataset.presentation=JSON.stringify({terrainOnly:true,chapterArt:CHAPTER_ART[b.chapter]});return;}
  const structureH=bodyHeight(w)*2.33*1.8;
  function building(im,x,y,size,edgeCrop=false){const ww=size*im.width/im.height;if(!edgeCrop)x=Math.max(ww*.46,Math.min(w-ww*.46,x));y=Math.max(size+3,Math.min(h-10,y));ctx.save();ctx.fillStyle='#302e3b66';ctx.beginPath();ctx.ellipse(x+6,y+4,ww*.40,Math.max(6,size*.055),0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#75634880';ctx.lineWidth=2;ctx.stroke();ctx.restore();sprite(im,x,y,size);return {x,y,height:size,edgeCrop};}
  measurements.keep=building(art['keep.png'],siege?-structureH*.15:825*sx,(siege?590:555)*sy,structureH,siege);
  if(siege){
   building(art['enemy-keep.png'],840*sx,190*sy,structureH);
   ctx.drawImage(art['nature.webp'],0,512,512,512,245*sx+18,462*sy-36,44,44);
   if(b.barracks||b.construction){building(art['barracks.png'],-structureH*.08,310*sy,structureH*.62,true);}
   const points=landMarch({x:170,y:410},b.armyTarget);measurements.marchRoute=points;
   ctx.save();ctx.strokeStyle='#7b442ac9';ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.beginPath();
   points.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.stroke();
   // Direction marks lie on the two bank approaches and bridge deck, never water.
   for(let i=1;i<points.length;i++){const a=points[i-1],z=points[i],angle=Math.atan2((z.y-a.y)*sy,(z.x-a.x)*sx),x=(a.x+z.x)*sx/2,y=(a.y+z.y)*sy/2;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-7,-4);ctx.lineTo(0,0);ctx.lineTo(-7,4);ctx.stroke();ctx.restore();}ctx.restore();
  }else{
   const focus=b.towers.find(t=>t.id===selectedTower)||b.towers.find(t=>t.type===pending?.type)||b.towers.at(-1);
   const cardType=pending?.type||focus?.type;
   for(const card of canvas.parentElement.parentElement.querySelectorAll('.tower-card')){const value=String(card.dataset.action==='tower-'+cardType);if(card.getAttribute('aria-pressed')!==value)card.setAttribute('aria-pressed',value);}
   if(b.towers.length)for(const t of b.towers){const r=(towerConfig.TOWERS[t.type].range||140)+40,ellipse=groundRange(towerPoint(t,w,h),r,w),active=!pending&&t===focus;ctx.save();ctx.strokeStyle=active?COLORS[t.type]:'#5e677129';ctx.fillStyle=active?COLORS[t.type]+'16':'#00000000';ctx.lineWidth=active?2:1;ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(ellipse.x,ellipse.y,ellipse.rx,ellipse.ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
   const linked=new Set();if(b.trinity)for(const t of b.towers)for(const partner of resonance(t,b.towers).partners){const edge=[t.id,partner.id].sort().join(':');if(linked.has(edge))continue;linked.add(edge);const a=towerPoint(t,w,h),z=towerPoint(partner,w,h);ctx.save();ctx.strokeStyle='#8063af70';ctx.lineWidth=1.1;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(a.x,a.y+2);ctx.lineTo(z.x,z.y+2);ctx.stroke();ctx.restore();}
   for(const t of [...b.towers].sort((a,z)=>a.y-z.y||a.x-z.x))measurements.towers.push({...drawTower(t,false,!pending&&t===focus),type:t.type,selected:!pending&&t===focus});
  }
  [...b.units,...b.enemies].sort((a,z)=>a.y-z.y).forEach(a=>actor(a,measurements));
  for(const fx of b.effects){
   const color=COLORS[fx.color]||'#e9c681';ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;
   if(fx.kind==='shot'){
    const tower=b.towers.find(t=>t.x===fx.x&&t.y===fx.y),p=tower?towerPoint(tower,w,h):project(fx.x,fx.y,w,h,siege),target=project(fx.tx,fx.ty,w,h,siege),f=Math.min(1,fx.age/.22),x=p.x+(target.x-p.x)*f,y=p.y-36+(target.y-p.y+36)*f;
    ctx.beginPath();ctx.moveTo(p.x,p.y-36);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
   }else{
    const p=project(fx.x,fx.y,w,h,siege),x=p.x,y=p.y,r=fx.kind==='spell'?Math.max(16,100*sx)*(fx.age/.55):8+fx.age*28;ctx.globalAlpha=1-fx.age/.55;
    for(let i=0;i<(fx.kind==='spell'?3:1);i++){ctx.strokeStyle=['#ef9654','#85d3db','#b39ae8'][i];ctx.beginPath();ctx.arc(x,y,r+i*6,0,Math.PI*2);ctx.stroke();}
   }ctx.restore();
  }
  if(pending){
   const d=({cannon:160,frost:165,tesla:160})[pending.type],ellipse=groundRange(towerPoint(pending,w,h),d,w);measurements.preview={type:pending.type,...ellipse};ctx.save();ctx.strokeStyle=COLORS[pending.type];ctx.fillStyle=COLORS[pending.type]+'18';ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(ellipse.x,ellipse.y,ellipse.rx,ellipse.ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();drawTower(pending,true,true);
  }
  if(skill)label('點敵群施放；取消不扣結晶',w/2,h-32,'#704b91');
  const field=canvas.parentElement;let legend=field.querySelector('.resonance-legend');
  if(!siege){if(!legend){legend=document.createElement('div');legend.className='resonance-legend';field.append(legend);}const focus=measurements.towers.find(t=>t.selected),type=pending?.type||focus?.type||'cannon',key=type+String(b.trinity);
   if(legend.dataset.text!==key){legend.dataset.text=key;legend.title='元素環為射程的貼地示意；紫線表示相鄰共鳴。';legend.innerHTML=`<img src="./assets/r6/seal-${type}.png" alt="${({cannon:'火印塔',frost:'冰印塔',tesla:'雷印塔'})[type]}已選取"><span class="legend-orbit" aria-hidden="true"></span><span class="legend-link ${b.trinity?'active':''}" aria-label="${b.trinity?'三相共鳴生效':'三相尚未成陣'}">△</span><strong>${b.trinity?'+30%':'—'}</strong>`;}
   legend.hidden=canvas.dataset.hideLabels==='true';
  }else legend?.remove();
  measurements.chapterArt=CHAPTER_ART[b.chapter];measurements.resonance={active:b.trinity,bonus:b.trinity ? .30 : 0,ranges:b.towers.map(t=>({type:t.type,x:t.x,y:t.y,radius:(towerConfig.TOWERS[t.type].range||140)+40})),selectedType:pending?.type||measurements.towers.find(t=>t.selected)?.type,projection:'ground ellipse 0.32; combat radii unchanged',lineStyle:'selected solid, inactive alpha .16, active resonance solid only',rangeVisible:!!b.towers.length||!!pending};measurements.effects=b.effects.map(f=>({kind:f.kind,age:f.age,hit:f.hit}));canvas.dataset.presentation=JSON.stringify(measurements);
 };
}
