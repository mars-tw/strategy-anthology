import {orderedPadLabels,projectedRoute,queueOnRoad,insetRange} from './content-r11.js';
import {exerciseGround,exerciseTower,clearBody} from './content-r10.js';
import {enemyName,placeAnnotation,exerciseLayout,intersects,paintedWaterAt} from './content-r8.js';
import {impactReadout,leakDescription} from './content-r7.js';
import {drawCombatFeedback} from './content-r6.js';
import {padLabels,routeProgress} from './content-r3.js';
import {padIdentity,inspectRoute} from './content-r5.js';
import {drawRouteDecisions,LEGACY_PAD,LEGACY_SPRITES} from './content-r2.js';
import {animationFrame,resonance,ROUTE,PADS} from './engine.js';
import {CHAPTERS,COLORS} from './campaign.js';
import {towerPoint as baseTowerPoint,bodyHeight,groundRange,bridgeGeometry,landMarch,actorLane,worldPoint} from './presentation-r7.js';
import {CHAPTER_ART} from './presentation-r3.js';
import {roundedRoute} from './presentation-r4.js';
import spriteBoxes from '../public/assets/r5/structure-frames.json';
import towerConfig from '../vendor/tower-defense/src/config.js';
import {battleRoute,exerciseFor,FIELDWORK_SPRITES,floodZone,terrainRoute} from './content-r1.js';
export async function loadArt(){
 const images={};await Promise.all([
  ...['ashwing.png','rootback.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['keep.png','barracks.png'].map(n=>[n,`./assets/r1/${n}`]),
  ...['tower-cannon.png','tower-frost.png','tower-tesla.png'].map(n=>[n,`./assets/r4/${n}`]),
  ...['enemy-keep.png','bridge.png'].map(n=>[n,`./assets/r2/${n}`]),
  ...CHAPTER_ART.map(n=>[`chapter-${n}`,`./assets/r3/chapter-${n}.webp`]),
  ...['warrior','archer','mage','enemy','worker','hound'].map(n=>['r5-'+n,['warrior','archer','mage'].includes(n)?`./assets/r7/${n}.png`:`./assets/r5/${n}.webp`]),
  ...['pine','road'].map(n=>['r4-'+n,`./assets/r4/${n}.webp`]),
  ...['gear-flag','gear-horn','gear-pack'].map(n=>['r5-'+n,`./assets/r5/${n}.png`]),
  ['r7-flood','./assets/content-r7/flood.webp'],['r7-legacy-cannon','./assets/content-r7/legacy-cannon.webp'],['r6-flood','./assets/content-r6/flood.webp'],['r6-barricade','./assets/content-r6/barricade.webp'],['flood-water','./assets/content-r5/flood.webp'],['legacy','./assets/content-r2/legacy.png'],['abutment','./assets/r3/abutment.png'],['nature.webp','./assets/nature.webp'],['fieldworks','./assets/content-r1/fieldworks.png']
  ,...['ford.webp','hound-walk.png','bridge-main.png','bridge-old.png','bridge-military.png'].map(n=>['r7-'+n.split('.')[0],`./assets/r7/${n}`])
 ].map(async([name,url])=>{const im=new Image();im.src=url;await im.decode();images[name]=im;}));
 const r=await fetch('./assets/r2/actor-frames.json');if(!r.ok)throw Error('frame metadata missing');images.frames=await r.json();const r4=await fetch('./assets/r5/actor-frames.json');if(!r4.ok)throw Error('R4 frames missing');images.currentFrames=await r4.json();const current=await fetch('./assets/r7/actor-frames.json');if(!current.ok)throw Error('R6 human frames missing');Object.assign(images.currentFrames,await current.json());const r6=await fetch('./assets/r7/hound-frames.json');if(!r6.ok)throw Error('R6 frames missing');images.houndFrames=await r6.json();// Cache a conservative mask of the authored turquoise surface once. Wet mud
 // still slows movement; individual water labels appear only over visible water.
 const sample=document.createElement('canvas');sample.width=sample.height=160;const sampleCtx=sample.getContext('2d',{willReadFrequently:true});sampleCtx.drawImage(images['r7-flood'],0,0,160,160);const pixels=sampleCtx.getImageData(0,0,160,160).data,mask=new Uint8Array(160*160);
 for(let i=0;i<mask.length;i++){const j=i*4;mask[i]=pixels[j+3]>128&&pixels[j+1]>pixels[j]*1.08&&pixels[j+2]>pixels[j]*1.08?1:0;}
 const road=document.createElement('canvas');road.width=images['r4-road'].width;road.height=images['r4-road'].height;const rc=road.getContext('2d');rc.drawImage(images['r4-road'],0,0);rc.globalCompositeOperation='destination-in';const fade=rc.createLinearGradient(0,0,0,road.height);for(const [p,a]of [[0,0],[.15,1],[.85,1],[1,0]])fade.addColorStop(p,`rgba(0,0,0,${a})`);rc.fillStyle=fade;rc.fillRect(0,0,road.width,road.height);images['r10-road']=road;
 images.waterSurface={width:160,height:160,mask};return images;
}
export function createRenderer(canvas,art){
 const ctx=canvas.getContext('2d'),bg=document.createElement('canvas'),g=bg.getContext('2d');
 let northInset=0,exercisePoints=null,activeExercise=null,currentTowers=[],w=0,h=0,dpr=1,sx=1,sy=1,lastTerrain,terrainId,previewMode=false;
 const project=(x,y,width,height,siege)=>activeExercise&&!siege?exerciseGround(x,y,width,height):worldPoint(x,y,width,height,{northInset:siege?0:northInset,flat:siege||terrainId==='ford'});
 const observer=new ResizeObserver(()=>{if(!canvas.isConnected)observer.disconnect();else lastTerrain=null;});observer.observe(canvas);
 function towerPoint(t,width,height){const i=activeExercise?.pads.findIndex(p=>p.x===t.x&&p.y===t.y)??-1,p=i>=0?exerciseTower(t,width,height):baseTowerPoint(t,width,height),anchor=project(t.x,t.y,width,height,false),unshifted=i<0&&Math.abs(p.x-p.anchorX)<1&&Math.abs(p.y-p.anchorY)<1;return {...p,...(northInset&&unshifted?{x:anchor.x,y:anchor.y}:{}),anchorX:anchor.x,anchorY:anchor.y};}
 function fit(){
  if(!canvas.isConnected){observer.disconnect();return false;}
  const nw=canvas.clientWidth,nh=canvas.clientHeight,nd=Math.min(devicePixelRatio||1,2);
  if(nw!==w||nh!==h||nd!==dpr){w=nw;h=nh;dpr=nd;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);bg.width=canvas.width;bg.height=canvas.height;sx=w/960;sy=h/640;lastTerrain=null;}
  return w>0&&h>0;
 }
 function cover(c,im){const s=Math.max(w/im.width,h/im.height);c.drawImage(im,(w-im.width*s)/2,(h-im.height*s)*.18,im.width*s,im.height*s);}
 function road(route,painter=g){
  const ps=projectedRoute(route,(x,y)=>project(x,y,w,h,false)),im=art['r10-road']||art['r4-road'];let distance=0;
  // Genuine painted shoulder/rut slices follow native route; never a solid ribbon.
  for(let i=1;i<ps.length;i++){
   const a=ps[i-1],b=ps[i],len=Math.hypot(b.x-a.x,b.y-a.y),angle=Math.atan2(b.y-a.y,b.x-a.x),steps=Math.ceil(len/2);
   for(let j=0;j<steps;j++){const f=j/steps,d=distance+f*len,span=Math.max(24,(82+13*Math.sin(d*.014))*sx),sample=Math.floor(d*1.1)%(im.width-8);
    painter.save();painter.translate(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);painter.rotate(angle);painter.drawImage(im,sample,0,8,im.height,-2,-span/2,len/steps+3,span);painter.restore();
   }distance+=len;
  }
 }
 function terrain(id,home,siege,chapter,route){
  terrainId=id;
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  if(home){cover(g,art['chapter-'+CHAPTER_ART[chapter]]);return;}
  if(id==='pine'||id==='ford')g.drawImage(art[id==='pine'?'r4-pine':'r7-ford'],0,0,w,h);else cover(g,art['chapter-'+CHAPTER_ART[chapter]]);
  if(id!=='ford'){
   g.save();if(!siege&&route!==ROUTE){g.globalAlpha=.28;road(ROUTE);g.globalAlpha=1;}road(siege?[{x:90,y:520},{x:310,y:425},{x:700,y:425},{x:700,y:195},{x:845,y:195}]:route);g.restore();
  }else{
   if(!siege){const layer=document.createElement('canvas');layer.width=bg.width;layer.height=bg.height;const paint=layer.getContext('2d');paint.setTransform(dpr,0,0,dpr,0,0);road(route,paint);paint.globalCompositeOperation='destination-in';const fade=paint.createLinearGradient(0,0,w,0);for(const [x,a]of [[0,1],[.32,1],[.41,0],[.60,0],[.69,1],[1,1]])fade.addColorStop(x,`rgba(0,0,0,${a})`);paint.fillStyle=fade;paint.fillRect(0,0,w,h);g.drawImage(layer,0,0,w,h);}
   for(const [y,name] of [[195,'main'],[307,'old'],[425,'military']]){
    const p=bridgeGeometry(y,w,h);if(activeExercise)p.y=project(500,y,w,h,false).y-p.height*.55;const im=art['r7-bridge-'+name];
    g.save();g.fillStyle='#282c3b45';g.beginPath();g.ellipse(p.x+p.width*.52,p.y+p.height*.86,p.width*.44,p.height*.14,0,0,Math.PI*2);g.fill();
    g.drawImage(im,p.x,p.y,p.width,p.height);g.restore();
   }
  }
 }

 function label(text,x,y,color='#292d38',size=12){
  if(canvas.dataset.hideLabels==='true'||canvas.dataset.routeAid==='off')return;
  ctx.save();ctx.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';
  const width=ctx.measureText(text).width+14;x=Math.max(width/2+3,Math.min(w-width/2-3,x));y=Math.max(18,Math.min(h-25,y));
  ctx.fillStyle='#eeeee5ed';ctx.fillRect(x-width/2,y-14,width,23);ctx.fillStyle=color;ctx.fillText(text,x,y+2);ctx.restore();
 }
 function sprite(im,x,y,height){const name=Object.keys(art).find(k=>art[k]===im),b=spriteBoxes[name]||[0,0,im.width,im.height],width=height*(b[2]-b[0])/(b[3]-b[1]);ctx.drawImage(im,b[0],b[1],b[2]-b[0],b[3]-b[1],x-width/2,y-height,width,height);}
 function actor(a,measurements){
  const lane=actorLane(a,measurements.siege);if(a.type==='miremaw'){lane.x*=.35;lane.y*=.14;}if(measurements.flood&&Math.hypot(a.x-measurements.flood.x,a.y-measurements.flood.y)<=measurements.flood.radius){lane.x=0;lane.y=0;}const visual={...a,anim:a.anim+(['walk','idle'].includes(a.state)?lane.phase:0)};
  const f=animationFrame(visual),role=({warrior:'warrior',archer:'archer',mage:'mage',villager:'worker',shieldBearer:'enemy',miremaw:'hound'})[a.type],legacyName=`${a.type}.png`,variantWalk=role==='hound'&&f.state==='walk',im=variantWalk?art['r7-hound-walk']:role?art['r5-'+role]:art[legacyName];if(!im)return;
  const m=variantWalk?art.houndFrames:role?art.currentFrames[role]:art.frames[legacyName],row=variantWalk?lane.variant:f.row,box=m.boxes[row][f.frame],bh=role==='hound'?44:bodyHeight(w),neutral=variantWalk?Math.max(m.neutralHeights[lane.variant],Math.max(...m.boxes[row].map(b=>b[3]-b[1]))/1.12):(m.neutralHeight||m.minimumLiveHeight),scale=bh/neutral,poseHeight=(box[3]-box[1])*scale,bw=(box[2]-box[0])*scale;
  const ground=project(a.x,a.y,w,h,measurements.siege);
  let x=Math.max(bw/2+3,Math.min(w-bw/2-3,ground.x+lane.x+(measurements.siege&&role==='worker'?40:0)));let y=Math.max(poseHeight+20,Math.min(h-14,ground.y+lane.y));
  if(!measurements.siege){
   const blocks=currentTowers.map(t=>{const p=towerPoint(t,w,h);return {x:p.x-p.h*.4,y:p.y-p.h,w:p.h*.8,h:p.h};});
   const q=queueOnRoad(ground,bw,poseHeight,w,h,measurements.roadPath,blocks,(measurements.combatBodies||[]).map(u=>({x:u.x-u.width/2,y:u.y-u.poseHeight,w:u.width,h:u.poseHeight})),activeExercise?44:15);
   if(!q){measurements.waitingIds.push(a.id);return;}x=q.x;y=q.y;
  }
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
   const leader=role==='hound'?measurements.leaderId===a.id:role!=='worker',healthShown=leader&&canvas.dataset.hideLabels!=='true';
   const hw=36,hy=Math.max(8,drawY-9);if(healthShown){ctx.fillStyle='#292d38';ctx.fillRect(x-hw/2-1,hy-1,hw+2,7);ctx.fillStyle=a.team==='player'?'#69c9bb':'#d65b4b';ctx.fillRect(x-hw/2,hy,hw*a.hp/a.maxHP,5);}
   measurements.units.push({id:a.id,nativeX:a.x,nativeY:a.y,waterDelay:a.waterDelay||0,type:a.type,role,team:a.team,x,y,height:bh,width:bw,healthWidth:hw,healthHeight:5,healthY:hy,shadowWidth:bh*.60,poseHeight,variant:lane.variant,phase:lane.phase,healthShown,frame:f.frame,row,state:f.state,source:variantWalk?'r7/hound-walk':(['warrior','archer','mage'].includes(role)?'r7/':'r5/')+role,facing:left?'left-mirror':'right-authored'});
  }
  (measurements.combatBodies??=[]).push({id:a.id,x,y,width:bw,poseHeight,box,row,frame:f.frame,fw:m.fw,fh:m.fh,asset:variantWalk?'r7-hound-walk':'r5-'+role,left});
  if(a.rewarded&&!a.escaped&&a.anim<.8&&measurements.rewardCaption!=="??"){ctx.globalAlpha=Math.max(0,1-a.anim/.8);label(measurements.rewardCaption,x,y-36-a.anim*30,'#9b4330',13);}
  ctx.restore();
 }
 function drawTower(t,pending=false,focused=false){
  const p=previewMode?{...project(t.x,t.y,w,h,false),h:Math.max(30,100*sx)}:towerPoint(t,w,h),color=COLORS[t.type];
  ctx.save();
  ctx.fillStyle='#28333c55';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.34,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6b553e66';ctx.beginPath();ctx.ellipse(p.x,p.y+4,p.h*.37,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=focused?color:'#ad966b88';ctx.lineWidth=focused?2.5:1;ctx.stroke();
  if(pending)ctx.globalAlpha=.65;sprite(t.inherited&&t.type==='cannon'?art['r7-legacy-cannon']:art[`tower-${t.type}.png`],p.x,p.y,p.h);
  if(resonance(t,currentTowers).bonus>0){ctx.strokeStyle='#9865c6';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p.x,p.y-p.h-9);ctx.lineTo(p.x-8,p.y-p.h+5);ctx.lineTo(p.x+8,p.y-p.h+5);ctx.closePath();ctx.stroke();}
  if(t.inherited){ctx.save();ctx.fillStyle='#f5f1e5';ctx.strokeStyle='#216778';ctx.lineWidth=2;ctx.fillRect(p.x-20,p.y+10,40,20);ctx.strokeRect(p.x-20,p.y+10,40,20);ctx.fillStyle='#216778';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('留守',p.x,p.y+25);ctx.restore();ctx.strokeStyle='#216778';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(p.x,p.y+2,p.h*.42,11,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#c4f4eb';ctx.lineWidth=2;ctx.stroke();}
  ctx.fillStyle=color;for(let i=0;i<(t.level||1);i++){ctx.beginPath();ctx.arc(p.x+(i-((t.level||1)-1)/2)*8,p.y+5,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();return p;
 }
 return function render(c,b,pending,skill,selectedTower,preview=null,swapping=null){
  if(!fit())return;currentTowers=b?.towers||[];previewMode=!!preview||canvas.dataset.mini==='true';const exercise=exerciseFor(b),chapter=CHAPTERS[b?.chapter??Math.min(c.chapter,5)],id=exercise?.id==='split'?'ford':exercise?.terrain||chapter.terrain,siege=chapter.mode==='siege',route=preview?terrainRoute(preview,b.chapter):battleRoute(b),key=id+!b+siege+JSON.stringify(route);
  activeExercise=exercise;
  northInset=!siege&&id!=='ford'&&(exercise||route.some(p=>p.y<110))?Math.min(.48,((exercise?70:35)+bodyHeight(w))/h):0;
  const mapKey=key+':'+northInset+':'+w+':'+h;if(lastTerrain!==mapKey){terrain(id,!b,siege,exercise?.terrain==='quarry'?3:b?.chapter??Math.min(c.chapter,5),route);lastTerrain=mapKey;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(bg,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
  const time=c.settings.reducedMotion?0:(b?.time||0),measurements={projection:{northInset,flat:siege||id==='ford'},rewardCaption:b?.exercise||b?.replay?'攔下':'+4',units:[],towers:[],reduced:c.settings.reducedMotion,siege,bodyHeight:bodyHeight(w),bridges:[195,425].map(y=>bridgeGeometry(y,w,h)),flood:b?.terrainChoice==='flood'?floodZone(b):null,leaderId:(b?.enemies.find(a=>a.hp>0&&actorLane(a,siege).variant===0)||b?.enemies.find(a=>a.hp>0))?.id};
  if(!b)return;measurements.waitingIds=[];measurements.roadPath=projectedRoute(route,(x,y)=>project(x,y,w,h,false));activeExercise=exercise;exercisePoints=exercise?exerciseLayout(exercise.pads,w,h):null;canvas.dataset.exercise=exercise?.id||'';
  function prop(kind,x,y,height){const box=FIELDWORK_SPRITES[kind],p=project(x,y,w,h,false),ww=height*box[2]/box[3];if(kind==='barricade'){const im=art['r6-barricade'],size=Math.max(120,280*sx);ctx.drawImage(im,p.x-size/2,p.y-size*.63,size,size);measurements.blockade={x:p.x-size/2,y:p.y-size*.63,w:size,h:size,nativeX:x,nativeY:y};}else ctx.drawImage(art.fieldworks,...box,p.x-ww/2,p.y-height*.7,ww,height);}
  const decisionTime=c.settings.reducedMotion?0:performance.now()/1000;
  measurements.contentR2=drawRouteDecisions({ctx,art,b,preview,w,h,project,label,time:decisionTime,inspectType:canvas.dataset.inspectType||null,routeAid:canvas.dataset.routeAid!=='off'});
  if(preview)measurements.inspection=inspectRoute(b.towers,route,canvas.dataset.inspectType||'frost');
  const choice=preview||b.terrainChoice;
  if(choice){const zone=floodZone(b),blockX=b.chapter===2?344:400;prop(choice,choice==='flood'?zone.x+zone.radius+35:blockX,choice==='flood'?zone.y:192,choice==='flood'?Math.max(48,85*sx):Math.max(86,150*sx));const pos=project(choice==='flood'?zone.x:blockX,choice==='flood'?zone.y:192,w,h,false);if(choice!=='flood'){ctx.save();ctx.strokeStyle='#b83e35';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(pos.x+68,pos.y-7);ctx.lineTo(pos.x+78,pos.y+3);ctx.moveTo(pos.x+68,pos.y+3);ctx.lineTo(pos.x+78,pos.y-7);ctx.stroke();ctx.restore();label('此處封堵',pos.x,pos.y+30,'#9c342c',12);}}
  measurements.contentR2.vacantFoundation=b.chapter===2&&c.fordLegacy==='crystals'&&!b.towers.some(t=>t.x===LEGACY_PAD.x&&t.y===LEGACY_PAD.y);
  if(measurements.contentR2.vacantFoundation){const p=previewMode?project(LEGACY_PAD.x,LEGACY_PAD.y,w,h,false):towerPoint({...LEGACY_PAD,type:'frost'},w,h),box=LEGACY_SPRITES.foundation,size=previewMode?30:80;ctx.drawImage(art.legacy,...box,p.x-size/2,p.y-size*.32,size,size*.63);label('拆晶後空地基',p.x,p.y+22,'#735b3c',12);}
  if(choice){const entrance=project(route[0].x,route[0].y,w,h,false),end=project(route.at(-1).x,route.at(-1).y,w,h,false);label('敵軍入口 →',entrance.x+38,entrance.y-24,'#a2332c',12);label('守住城門',end.x,end.y+25,'#a2332c',12);}
  if(exercise){measurements.padBases=exercise.pads.map((pad,i)=>({number:i+1,...exerciseTower(pad,w,h)}));
   for(const p of measurements.padBases){ctx.save();ctx.strokeStyle='#6b6350';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(p.x,p.y+3,19,9,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
  }
  if(canvas.dataset.terrainOnly==='true'){canvas.dataset.presentation=JSON.stringify({terrainOnly:true,chapterArt:CHAPTER_ART[b.chapter]});return;}
  const structureH=canvas.dataset.mini==='true'?Math.max(24,160*sx):bodyHeight(w)*2.33*1.8;
  function building(im,x,y,size,edgeCrop=false){const ww=size*im.width/im.height;if(!edgeCrop)x=Math.max(ww*.46,Math.min(w-ww*.46,x));y=Math.max(size+3,Math.min(h-10,y));ctx.save();ctx.fillStyle='#302e3b66';ctx.beginPath();ctx.ellipse(x+6,y+4,ww*.40,Math.max(6,size*.055),0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#75634880';ctx.lineWidth=2;ctx.stroke();ctx.restore();sprite(im,x,y,size);return {x,y,height:size,edgeCrop};}
  measurements.keep=siege?building(art['keep.png'],-structureH*.15,590*sy,structureH,true):building(art['keep.png'],w+36,h+32,previewMode?structureH:Math.min(112,h*.28),true);
  const linked=new Set();
  if(siege){
   measurements.enemyKeep=building(art['enemy-keep.png'],w+structureH*.12,190*sy,structureH,true);
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
   for(const card of canvas.closest('.play-layout')?.querySelectorAll('.tower-card')||[]){const value=String(card.dataset.action==='tower-'+cardType);if(card.getAttribute('aria-pressed')!==value)card.setAttribute('aria-pressed',value);}
   measurements.rangeCenters=[];if(focus&&!pending&&!preview)for(const t of [focus]){const r=(towerConfig.TOWERS[t.type].range||140)+40,ellipse=insetRange(groundRange(towerPoint(t,w,h),r,w),w,h),active=!pending&&t===focus;measurements.rangeCenters.push({towerId:t.id,...ellipse});ctx.save();ctx.strokeStyle=active?COLORS[t.type]:'#5e677129';ctx.fillStyle=active?COLORS[t.type]+'16':'#00000000';ctx.lineWidth=active?2:1;ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(ellipse.x,ellipse.y,ellipse.rx,ellipse.ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
   if(b.trinity)for(const t of b.towers)for(const partner of resonance(t,b.towers).partners){const edge=[t.id,partner.id].sort().join(':');if(linked.has(edge))continue;linked.add(edge);const a=towerPoint(t,w,h),z=towerPoint(partner,w,h);ctx.save();ctx.strokeStyle='#8063af70';ctx.lineWidth=1.1;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(a.x,a.y+2);ctx.lineTo(z.x,z.y+2);ctx.stroke();ctx.restore();}
   // Towers and troops share a ground-depth pass below, so a marching enemy
   // behind a tower cannot paint over its roof and change its apparent shape.
  }
  const focusTower=b.towers.find(t=>t.id===selectedTower)||b.towers.find(t=>t.type===pending?.type)||b.towers.at(-1);
  const depth=[...b.units,...b.enemies].map(a=>({y:siege?project(a.x,a.y,w,h,true).y:-route.slice(1,(a.route||0)+1).reduce((sum,p,i)=>sum+Math.hypot(p.x-route[i].x,p.y-route[i].y),0)-Math.hypot(a.x-route[Math.min(a.route||0,route.length-1)].x,a.y-route[Math.min(a.route||0,route.length-1)].y),actor:a}));
  if(!siege)depth.push(...b.towers.map(t=>({y:-1e9,tower:t})));
  depth.sort((a,z)=>a.y-z.y).forEach(item=>{if(item.actor)actor(item.actor,measurements);else{const t=item.tower,p=drawTower(t,false,!pending&&t===focusTower);measurements.towers.push({...p,id:t.id,type:t.type,selected:!pending&&t===focusTower,inherited:!!t.inherited});}});
  if(exercise){const anchors=exercise.pads.map((pad,i)=>measurements.towers.find(t=>t.id===b.towers.find(t=>t.x===pad.x&&t.y===pad.y)?.id)||towerPoint({...pad,type:['cannon','frost','tesla'][i%3]},w,h));measurements.padLabels=orderedPadLabels(exercise.pads,anchors,w,h);measurements.padPins=[];
   for(const mark of measurements.padLabels){const index=mark.number-1,p=anchors[index],active=pending?.x===mark.pad.x&&pending?.y===mark.pad.y,swapped=swapping&&(index===swapping.from||index===swapping.to);
    ctx.save();ctx.beginPath();ctx.moveTo(p.x,index<3?p.y-p.h-8:p.y+8);ctx.lineTo(mark.x,index<3?mark.y+11:mark.y-17);ctx.strokeStyle=active||swapped?'#b83e35':'#433b2dc9';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();measurements.padPins.push({number:mark.number,x:mark.x,y:mark.y-4,active,swapped:!!swapped});
   }
   // Labels are a separate final pass, so later connectors never cross text.
   measurements.padIdentities=exercise.pads.map((pad,i)=>padIdentity(pad,i,b,pending));
   // The reserved upper band is painted last, after effects and troops.
  }
  measurements.progress=choice?routeProgress(b):null;
  const blockers=[...(measurements.combatBodies||[]).map(u=>({x:u.x-u.width/2-3,y:u.y-u.poseHeight-18,w:u.width+6,h:u.poseHeight+24})),...measurements.towers.map(t=>({x:t.x-t.h*.4,y:t.y-t.h,w:t.h*.8,h:t.h+12})),...(measurements.padLabels||[]).map(p=>({x:p.x-30,y:p.y-16,w:60,h:25}))];
  for(const e of canvas.parentElement.querySelectorAll('.map-label,.field-status,.field-toggle,.resonance-caption,.resonance-legend')){if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')continue;const r=e.getBoundingClientRect(),c=canvas.getBoundingClientRect();blockers.push({x:r.x-c.x,y:r.y-c.y,w:r.width,h:r.height});}
  function annotation(text,anchor,color='#292d38',size=13){ctx.font=`bold ${size}px sans-serif`;const width=ctx.measureText(text).width+14,rect=placeAnnotation(anchor,w,h,blockers,width,23);if(!rect)return null;blockers.push(rect);ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(rect.x+rect.w/2,rect.y+rect.h/2);ctx.stroke();ctx.fillStyle='#f5f1e5f5';ctx.fillRect(rect.x,rect.y,rect.w,rect.h);ctx.fillStyle=color;ctx.font=`bold ${size}px sans-serif`;ctx.textAlign='center';ctx.fillText(text,rect.x+rect.w/2,rect.y+16);ctx.restore();return rect;}
  measurements.wetLabels=[];
  if(choice)for(const a of b.enemies.filter(e=>e.hp>0)){const u=measurements.units.find(u=>u.id===a.id);if(!u)continue;const wet=choice==='flood'&&Math.hypot(a.x-floodZone(b).x,a.y-floodZone(b).y)<=floodZone(b).radius;ctx.save();ctx.strokeStyle=wet?'#dcffff':'#b83e35';ctx.lineWidth=2.5;if(wet){measurements.contentR2.slowIds.push(a.id);const surface=Math.hypot(a.x-floodZone(b).x,a.y-floodZone(b).y)<=floodZone(b).radius*.4&&Math.hypot(u.x-measurements.contentR2.wetZone.screen.x,(u.y-measurements.contentR2.wetZone.screen.y)*w/h)<floodZone(b).radius*w/960*.72;if(surface)for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(u.x+(i-1)*9,u.y+3,7+(a.anim*10+i)%7,3,0,0,Math.PI);ctx.stroke();}const rect=surface?annotation('行速×52% +'+(a.waterDelay||0).toFixed(2)+'秒',{x:u.x,y:u.y-u.poseHeight/2},'#126173',12):null;if(rect)measurements.wetLabels.push({id:a.id,rect,nativeX:a.x,nativeY:a.y});}else if(choice==='barricade'&&a.route===1){ctx.beginPath();ctx.moveTo(u.x-8,u.y+12);ctx.lineTo(u.x,u.y+3);ctx.lineTo(u.x+8,u.y+12);ctx.stroke();}ctx.restore();}
  if(choice==='barricade'){const leader=b.enemies.find(a=>a.hp>0),u=measurements.units.find(u=>u.id===leader?.id);if(u)measurements.detourLeader={id:u.id,ordinal:leader.ordinal,rect:annotation('前鋒 '+leader.ordinal,{x:u.x,y:u.y-u.poseHeight},'#9c342c',11)};}
  for(const fx of b.effects){
   const color=COLORS[fx.color]||'#e9c681';ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;
   if(fx.kind==='shot'){
    const tower=b.towers.find(t=>t.x===fx.x&&t.y===fx.y),p=tower?towerPoint(tower,w,h):project(fx.x,fx.y,w,h,siege),body=measurements.units.find(u=>u.id===fx.targetId),target=body?{x:body.x,y:body.y-body.poseHeight*.38}:project(fx.tx,fx.ty,w,h,siege),f=Math.min(1,fx.age/.22),x=p.x+(target.x-p.x)*f,y=p.y-36+(target.y-p.y+36)*f;
    ctx.beginPath();ctx.moveTo(x-(target.x-p.x)*.10,y-(target.y-p.y+36)*.10);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
    if(tower?.inherited){ctx.strokeStyle=tower.type==='frost'?'#45ddeb':'#ffad56';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-(target.x-p.x)*.10,y-(target.y-p.y+36)*.10);ctx.lineTo(x,y);ctx.stroke();measurements.inheritedShot={towerId:tower.id,targetId:fx.targetId,x,y,age:fx.age,hit:fx.hit,bonus:resonance(tower,b.towers).bonus};}
   }else{
    const p=project(fx.x,fx.y,w,h,siege),x=p.x,y=p.y,r=fx.kind==='spell'?Math.max(16,100*sx)*(fx.age/.55):8+fx.age*28;ctx.globalAlpha=1-fx.age/.55;
    for(let i=0;i<(fx.kind==='spell'?3:1);i++){ctx.strokeStyle=['#ef9654','#85d3db','#b39ae8'][i];ctx.beginPath();ctx.arc(x,y,r+i*6,0,Math.PI*2);ctx.stroke();}
   }ctx.restore();
  }
  measurements.shotEvents=b.effects.filter(f=>f.kind==='shot').map(f=>({...f}));measurements.impacts=drawCombatFeedback({ctx,b,units:measurements.combatBodies||[],towers:measurements.towers,reduced:c.settings.reducedMotion,label,placeFloat:(text,p,type)=>annotation(text,p,({cannon:'#943b20',frost:'#145767',tesla:'#624387'})[type],15)});
  // The live readout is in the command panel, outside the battlefield.
  const detail=impactReadout(b,selectedTower),panel=canvas.closest('.play-layout')?.querySelector('.combat-readout');
  if(panel&&panel.dataset.readout!==detail.html){const open=panel.querySelector('details')?.open;panel.innerHTML=detail.html;if(open&&panel.querySelector('details'))panel.querySelector('details').open=true;panel.dataset.readout=detail.html;}
  measurements.impactReadout=detail.event;
  if(detail.event)measurements.impactFocus={towerId:detail.event.towerId,targetId:detail.event.targetId,hit:true,hp:detail.event.hpAfter,damage:detail.event.actualDamage,placement:'outside battlefield'};
  if(pending){
   const d=({cannon:160,frost:165,tesla:160})[pending.type],ellipse=insetRange(groundRange(towerPoint(pending,w,h),d,w),w,h);measurements.preview={type:pending.type,...ellipse};ctx.save();ctx.strokeStyle=COLORS[pending.type];ctx.fillStyle=COLORS[pending.type]+'18';ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(ellipse.x,ellipse.y,ellipse.rx,ellipse.ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();drawTower(pending,true,true);
  }
  if(exercise)for(const mark of measurements.padLabels){const pin=measurements.padPins[mark.number-1],identity=measurements.padIdentities[mark.number-1];ctx.save();ctx.fillStyle='#f5f1e5f5';ctx.fillRect(mark.x-32,mark.y-16,64,25);ctx.fillStyle=pin.active||pin.swapped?'#b83e35':'#493f30';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(identity.text,mark.x,mark.y+2);if(identity.type){ctx.strokeStyle=COLORS[identity.type];ctx.lineWidth=2;ctx.strokeRect(mark.x-32,mark.y-16,64,25);}if(pin.active||pin.swapped){ctx.strokeStyle='#b83e35';ctx.lineWidth=2;ctx.strokeRect(mark.x-32,mark.y-16,64,25);}ctx.restore();}
  if(skill)label('點敵群施放；取消不扣結晶',w/2,h-32,'#704b91');
  if(exercise&&b.result==='lost'){const p=project(route.at(-1).x,route.at(-1).y,w,h,false);ctx.save();ctx.strokeStyle='#b83e35';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,19,0,Math.PI*2);ctx.stroke();ctx.restore();label(`首漏 ${enemyName(b,b.firstLeak?.id)}・城門前路`,w/2,h-94,'#9c342c',12);measurements.leakPoint=p;}
  const field=canvas.parentElement;let keyRow=canvas.closest('.play-layout')?.querySelector('.field-key')||field.parentElement.querySelector('.field-key');if(!previewMode&&!keyRow){keyRow=document.createElement('div');keyRow.className='field-key';field.parentElement.insertBefore(keyRow,field);const status=field.querySelector('#fieldStatus');if(status)keyRow.append(status);const toggle=field.querySelector(".field-toggle");if(toggle)keyRow.append(toggle);}let note=field.parentElement.querySelector('.inherited-note');if(b.towers.some(t=>t.inherited)&&!preview&&canvas.dataset.mini!=='true'){if(!note){note=document.createElement('div');note.className='inherited-note';field.parentElement.append(note);}note.textContent=b.chapter===4?'石脊火塔工事・'+((b.relayChoice||c.quarryLegacy)==='upstream'?'上游長路':'城門前路')+'・繼承一級':'渡口冰塔工事・繼承一級';}else note?.remove();let legend=keyRow?.querySelector('.resonance-legend');
  if(!siege&&canvas.dataset.mini!=='true'){if(!legend){legend=document.createElement('div');legend.className='resonance-legend';keyRow.append(legend);}const focus=measurements.towers.find(t=>t.selected),type=pending?.type||focus?.type||'cannon',actualBonus=pending?resonance(pending,b.towers).bonus:focusTower?resonance(focusTower,b.towers).bonus:0,key=type+String(actualBonus);
   if(legend.dataset.text!==key){legend.dataset.text=key;legend.title=actualBonus===.3?'觀察塔：共鳴傷害 +30%':actualBonus?'觀察塔：局部共鳴 +10%':'觀察塔：分散配置，共鳴 0%';legend.setAttribute('aria-label',legend.title);legend.innerHTML=`<strong>${actualBonus?'+'+Math.round(actualBonus*100)+'%':'0%'}</strong>`;}
   legend.hidden=canvas.dataset.hideLabels==='true'||canvas.dataset.routeAid==='off';
   let caption=keyRow?.querySelector('.resonance-caption');if(!caption){caption=document.createElement('div');caption.className='resonance-caption';keyRow.append(caption);}caption.textContent=actualBonus===.3?'觀察塔共鳴・+30%':actualBonus?'觀察塔共鳴・+10%':'分散接力・觀察塔共鳴 0%';caption.hidden=legend.hidden;
  }else{legend?.remove();keyRow?.querySelector('.resonance-caption')?.remove();}
  measurements.firstWaveDecision=b.firstWaveDecision||null;
  measurements.contentR1={exercise:b.exercise||null,route,terrainChoice:b.terrainChoice||null,pads:exercise?.pads||[],inheritedTower:b.towers.some(t=>t.inherited)};
  measurements.chapterArt=CHAPTER_ART[b.chapter];measurements.resonance={active:b.trinity,bonus:b.trinity ? .30 : 0,ranges:b.towers.map(t=>({type:t.type,x:t.x,y:t.y,radius:(towerConfig.TOWERS[t.type].range||140)+40})),selectedType:pending?.type||measurements.towers.find(t=>t.selected)?.type,projection:'ground ellipse 0.32; combat radii unchanged',lineStyle:'selected solid, inactive hidden, active resonance solid only',drawnRangeCount:pending||measurements.towers.some(t=>t.selected)?1:0,resonanceEdgeCount:linked.size,rangeVisible:!!b.towers.length||!!pending};measurements.effects=b.effects.map(f=>({kind:f.kind,age:f.age,hit:f.hit}));canvas.dataset.presentation=JSON.stringify(measurements);
 };
}
