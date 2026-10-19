import {animationFrame,resonance,ROUTE,PADS} from './engine.js';
import {CHAPTERS,COLORS} from './campaign.js';

const ACTORS=[...['warrior','archer','villager','shieldBearer'].flatMap(a=>['e','ne','nw','w','sw','se'].map(d=>`${a}-${d}.png`)),'mage.png','miremaw.png','ashwing.png','rootback.png'];
const NEW=['battlefield.webp','keep.png','barracks.png','enemy-keep.png',...['cannon','frost','tesla'].map(t=>`tower-${t}.png`)];
export const ASSETS=[...NEW,...ACTORS];
export async function loadArt(){const images={};await Promise.all([...ASSETS.map(name=>[name,`./assets/r1/${name}`]),['materials.webp','./assets/materials.webp'],['nature.webp','./assets/nature.webp']].map(async([name,url])=>{const im=new Image();im.src=url;await im.decode();images[name]=im;}));return images;}

// Presentation stretches the coordinate field, never the actors. Pointer input
// keeps the same normalized 960x640 space. Rules, ranges and impacts are intact.
export function createRenderer(canvas,art){
 const ctx=canvas.getContext('2d');const bg=document.createElement('canvas');const g=bg.getContext('2d');let w=0,h=0,dpr=1,sx=1,sy=1,unitScale=1,lastTerrain;
 const roadTile=document.createElement('canvas');roadTile.width=160;roadTile.height=160;roadTile.getContext('2d').drawImage(art['materials.webp'],512,0,512,512,0,0,160,160);const roadPattern=g.createPattern(roadTile,'repeat');
 const observer=new ResizeObserver(()=>{if(!canvas.isConnected)observer.disconnect();else lastTerrain=null;});observer.observe(canvas);
 // Mount replaces this node; disconnect on the first frame after detachment.
 function fit(){if(!canvas.isConnected){observer.disconnect();return false;}const nw=canvas.clientWidth,nh=canvas.clientHeight,nd=Math.min(window.devicePixelRatio||1,2);if(nw!==w||nh!==h||nd!==dpr){w=nw;h=nh;dpr=nd;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);bg.width=canvas.width;bg.height=canvas.height;sx=w/960;sy=h/640;unitScale=Math.min(sx*1.45,sy*1.25,1.25);lastTerrain=null;}return w>0&&h>0;}
 function cover(c,im){const scale=Math.max(w/im.width,h/im.height);c.drawImage(im,(w-im.width*scale)/2,(h-im.height*scale)*.1,im.width*scale,im.height*scale);}
 function terrain(id,home){
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);cover(g,art['battlefield.webp']);if(home)return;
  g.save();g.scale(sx,sy);
  if(id==='quarry'||id==='citadel'){g.fillStyle='#c8a17625';g.fillRect(0,0,960,640);}
  if(id==='ford'){
   g.save();g.beginPath();g.rect(450,0,110,640);g.clip();g.drawImage(art['materials.webp'],512,512,512,512,450,0,110,640);g.restore();
   g.strokeStyle='#cce4d8';g.lineWidth=3;for(const x of [450,560]){g.beginPath();g.moveTo(x,0);g.lineTo(x,640);g.stroke();}
  }
  g.lineCap='round';g.lineJoin='round';g.strokeStyle='#786e4799';g.lineWidth=40;g.beginPath();ROUTE.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();g.strokeStyle=roadPattern;g.lineWidth=33;g.stroke();
  if(id==='ford')for(const y of [195,425]){
   g.save();g.beginPath();g.rect(430,y-30,150,60);g.clip();g.drawImage(art['materials.webp'],512,0,512,512,430,y-30,150,60);g.restore();
   g.strokeStyle='#e5c78b';g.lineWidth=6;g.beginPath();g.moveTo(427,y-29);g.lineTo(583,y-29);g.moveTo(427,y+29);g.lineTo(583,y+29);g.stroke();
   g.strokeStyle='#6e593e';g.lineWidth=2;for(let x=437;x<580;x+=14){g.beginPath();g.moveTo(x,y-25);g.lineTo(x,y+25);g.stroke();}
  }
  g.restore();
 }
 function sprite(im,x,y,height,scale=unitScale){const dh=height*scale, dw=dh*im.width/im.height;ctx.drawImage(im,x-dw/sx/2,y-dh/sy*.88,dw/sx,dh/sy);}
 function label(text,x,y,color='#f8f4df',size=11){
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.font=`600 ${size}px "Microsoft JhengHei",sans-serif`;ctx.textAlign='center';const width=ctx.measureText(text).width+12;ctx.fillStyle='#292d38e8';ctx.fillRect(x*sx-width/2,y*sy-13,width,20);ctx.fillStyle=color;ctx.fillText(text,x*sx,y*sy+1);ctx.restore();
 }
 function actor(a){
  const f=animationFrame(a),big=['mage','miremaw','ashwing','rootback'].includes(a.type),facing=a.facing||(a.team==='enemy'?'w':'e');const im=art[big?`${a.type}.png`:`${a.type}-${facing}.png`];if(!im)return;
  const fw=big?256:a.type==='shieldBearer'?112:96,fh=big?256:112,height=(big?100:96)*unitScale,width=height*fw/fh;
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);const x=a.x*sx,y=a.y*sy;
  ctx.fillStyle='#202f393c';ctx.beginPath();ctx.ellipse(x,y+2,width*.29,Math.max(3,height*.055),0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(im,f.frame*fw,f.row*fh,fw,fh,x-width/2,y-height*.82,width,height);
  if(a.hp>0){const healthW=Math.max(17,width*.58);ctx.fillStyle='#292d38';ctx.fillRect(x-healthW/2,y-height*.82-5,healthW,4);ctx.fillStyle=a.team==='player'?'#a9e6df':'#ed8867';ctx.fillRect(x-healthW/2,y-height*.82-5,healthW*a.hp/a.maxHP,4);}
  ctx.restore();
 }
 return function render(c,b,pending,skill){
  if(!fit())return;const id=CHAPTERS[b?.chapter??Math.min(c.chapter,5)].terrain,key=id+!b;
  if(lastTerrain!==key){terrain(id,!b);lastTerrain=key;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(bg,0,0);ctx.setTransform(dpr*sx,0,0,dpr*sy,0,0);
  if(!b){if(w>700){sprite(art['tower-cannon.png'],480,510,180,unitScale*.95);sprite(art['tower-frost.png'],590,485,195,unitScale*.95);sprite(art['tower-tesla.png'],700,520,175,unitScale*.95);}return;}
  const siege=CHAPTERS[b.chapter].mode==='siege';sprite(art['keep.png'],siege?135:846,siege?512:517,145);label('松林守望軍',siege?135:846,siege?554:559);
  if(siege){
   sprite(art['enemy-keep.png'],818,210,165);label(`灰旗據點 ${Math.ceil(b.keepHP)}/${b.keepMaxHP}`,818,246,'#f6c79c',10);
   ctx.drawImage(art['nature.webp'],0,512,512,512,225,406,100,100);label('結晶補給',275,530,'#b4e4e1',10);
   if(b.barracks||b.construction){sprite(art['barracks.png'],240,332,128);label(b.barracks?'兵營':`施工 ${Math.ceil(b.construction)} 秒`,240,370,'#f8e7c1',10);}
   ctx.strokeStyle='#f0ca85';ctx.setLineDash([7,10]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(170,410);ctx.lineTo(b.armyTarget.x,b.armyTarget.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(b.armyTarget.x,b.armyTarget.y,15,0,Math.PI*2);ctx.stroke();
  }else{
   for(const p of PADS){ctx.strokeStyle='#fae6b9b8';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,24,17,0,0,Math.PI*2);ctx.stroke();}
   for(const t of b.towers)for(const partner of resonance(t,b.towers).partners){ctx.strokeStyle='#e7c77c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(partner.x,partner.y);ctx.stroke();}
   for(const t of [...b.towers].sort((a,z)=>a.y-z.y||a.x-z.x)){
    const towerScale=Math.min(sx*1.08,sy*1.1,1.1);sprite(art[`tower-${t.type}.png`],t.x,t.y,132,towerScale);
    ctx.fillStyle=COLORS[t.type];for(let i=0;i<t.level;i++){ctx.beginPath();ctx.arc(t.x+(i-(t.level-1)/2)*10,t.y+9,3,0,Math.PI*2);ctx.fill();}
   }
  }
  [...b.units,...b.enemies].sort((a,z)=>a.y-z.y).forEach(actor);
  for(const fx of b.effects){
   if(fx.kind==='shot'){ctx.strokeStyle=COLORS[fx.color]||'#edbf78';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(fx.x,fx.y-35);const f=Math.min(1,fx.age/.22);ctx.lineTo(fx.x+(fx.tx-fx.x)*f,fx.y-35+(fx.ty-fx.y+35)*f);ctx.stroke();}
   else{ctx.strokeStyle=fx.kind==='spell'?'#d5baf9':'#fff0bc';ctx.lineWidth=4;ctx.beginPath();ctx.arc(fx.x,fx.y,fx.kind==='spell'?100:10+fx.age*25,0,Math.PI*2);ctx.stroke();}
  }
  if(pending){
   ctx.save();ctx.globalAlpha=.65;sprite(art[`tower-${pending.type}.png`],pending.x,pending.y,132,Math.min(sx*1.08,sy*1.1,1.1));ctx.restore();
   ctx.strokeStyle=COLORS[pending.type];ctx.lineWidth=3;ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(pending.x,pending.y,180,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);label('預覽：確認才付款',pending.x,Math.min(pending.y+65,590),COLORS[pending.type],10);
  }
  if(skill)label('點選敵群施放；取消不扣結晶',480,605,'#e6c5ff');
 };
}
