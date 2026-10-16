import { animationFrame,resonance,ROUTE,PADS } from './engine.js';
import {CHAPTERS,COLORS} from './campaign.js';
export const ASSETS=['buildings.webp','materials.webp','nature.webp',...['warrior','archer','villager','shieldBearer'].flatMap(a=>['e','ne','nw','w','sw','se'].map(d=>`${a}-${d}.png`)), 'mage.png','miremaw.png','ashwing.png','rootback.png'];
export async function loadArt(){const images={};await Promise.all(ASSETS.map(async name=>{const im=new Image();im.src=`./assets/${name}`;await im.decode();images[name]=im;}));return images;}
export function createRenderer(canvas,art){
 const ctx=canvas.getContext('2d');const bg=document.createElement('canvas');bg.width=960;bg.height=640;const g=bg.getContext('2d');let lastTerrain;
 function terrain(id){
  g.clearRect(0,0,960,640);for(let y=0;y<640;y+=160)for(let x=0;x<960;x+=160)g.drawImage(art['materials.webp'],id==='quarry'?0:0,id==='quarry'?512:0,512,512,x,y,160,160);
  if(id==='ford'){g.drawImage(art['materials.webp'],512,512,512,512,450,0,110,640);g.fillStyle='#9c8058';g.fillRect(430,150,150,90);g.fillRect(430,380,150,90);g.strokeStyle='#d9bc89';g.lineWidth=5;g.strokeRect(430,150,150,90);}
  g.strokeStyle='#263c3155';g.lineWidth=1;for(let x=0;x<960;x+=48){g.beginPath();g.moveTo(x,0);g.lineTo(x,640);g.stroke();}for(let y=0;y<640;y+=48){g.beginPath();g.moveTo(0,y);g.lineTo(960,y);g.stroke();}
  g.lineCap='round';g.lineJoin='round';g.strokeStyle='#344435';g.lineWidth=58;g.beginPath();ROUTE.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();g.strokeStyle='#b9a175';g.lineWidth=44;g.stroke();
  g.setLineDash([8,18]);g.strokeStyle='#e7cda155';g.lineWidth=2;g.stroke();g.setLineDash([]);
  for(const [x,y,tree]of [[38,35,1],[220,10,0],[780,20,1],[830,320,1],[50,290,0],[310,520,1],[745,542,0],[388,20,1]])nature(g,tree,x,y,135);
  if(id==='quarry'||id==='citadel')for(const[x,y]of [[350,360],[710,70],[30,460]])nature(g,2,x,y,120);
 }
 function nature(c,index,x,y,size){c.drawImage(art['nature.webp'],index%4*512,Math.floor(index/4)*512,512,512,x,y,size,size);}
 function building(index,x,y,w){const h=w;ctx.drawImage(art['buildings.webp'],index%4*384,Math.floor(index/4)*384,384,384,x-w/2,y-h*0.8,w,h);}
 function label(text,x,y,color='#f8f3df'){ctx.font='bold 16px "Segoe UI", sans-serif';ctx.textAlign='center';const w=ctx.measureText(text).width+16;ctx.fillStyle='#183e43e8';ctx.fillRect(x-w/2,y-17,w,24);ctx.fillStyle=color;ctx.fillText(text,x,y);}
 function actor(a){
  const f=animationFrame(a);const big=['mage','miremaw','ashwing','rootback'].includes(a.type);const facing=a.facing|| (a.team==='enemy'?'w':'e');const im=art[big?`${a.type}.png`:`${a.type}-${facing}.png`];if(!im)return;
  const fw=big?256:a.type==='shieldBearer'?112:96,fh=big?256:112;
  const h=big?86:72,w=h*fw/fh;
  ctx.fillStyle='#0e3a3355';ctx.beginPath();ctx.ellipse(a.x,a.y+3,19,7,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(im,f.frame*fw,f.row*fh,fw,fh,a.x-w/2,a.y-h*0.82,w,h);
  if(a.hp>0){ctx.fillStyle='#173a39';ctx.fillRect(a.x-18,a.y-58,36,5);ctx.fillStyle=a.team==='player'?'#82e1c5':'#f5b091';ctx.fillRect(a.x-18,a.y-58,36*a.hp/a.maxHP,5);ctx.fillStyle=a.team==='player'?'#8be2e0':'#ea9564';ctx.beginPath();ctx.arc(a.x,a.y+9,3,0,Math.PI*2);ctx.fill();}
 }
 return function render(c,b,pending,skill){
  const terrainId=CHAPTERS[b?.chapter??Math.min(c.chapter,5)].terrain;if(lastTerrain!==terrainId){terrain(terrainId);lastTerrain=terrainId;}
  ctx.clearRect(0,0,960,640);ctx.drawImage(bg,0,0);
  if(!b){building(0,818,480,180);building(1,200,400,120);building(4,310,470,130);label('松林村',815,577);for(let i=0;i<3;i++)actor({type:i===0?'villager':'warrior',x:400+i*80,y:440,team:'player',hp:100,maxHP:100,state:'idle',anim:0,attack:0,hurt:0});return;}
  const siege=CHAPTERS[b.chapter].mode==='siege';building(0,siege?140:848,siege?485:480,150);label('松林守望軍',siege?140:848,siege?578:575);
  if(siege){building(b.keepHP>0?0:10,818,180,175);label(`灰旗據點 ${Math.ceil(b.keepHP)}/${b.keepMaxHP}`,818,280);nature(ctx,4,225,400,100);label('結晶補給',275,510,'#9ee3dd');if(b.barracks||b.construction){building(2,240,320,140);label(b.barracks?'兵營':`施工 ${Math.ceil(b.construction)} 秒`,240,388);}
   ctx.strokeStyle='#ddc58d';ctx.setLineDash([7,10]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(170,410);ctx.lineTo(b.armyTarget.x,b.armyTarget.y);ctx.stroke();ctx.setLineDash([]);ctx.strokeRect(b.armyTarget.x-13,b.armyTarget.y-13,26,26);
  }else{
   for(const p of PADS){ctx.strokeStyle='#f3dab699';ctx.lineWidth=2;ctx.strokeRect(p.x-23,p.y-23,46,46);}
   for(const t of b.towers){for(const partner of resonance(t,b.towers).partners){ctx.strokeStyle='#9ef3e6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(t.x,t.y-24);ctx.lineTo(partner.x,partner.y-24);ctx.stroke();}}
   for(const t of b.towers){building(3,t.x,t.y,95);ctx.fillStyle=COLORS[t.type];ctx.beginPath();ctx.moveTo(t.x,t.y-96);ctx.lineTo(t.x+10,t.y-80);ctx.lineTo(t.x,t.y-65);ctx.lineTo(t.x-10,t.y-80);ctx.fill();label(`${Math.round(resonance(t,b.towers).bonus*100)}%`,t.x,t.y+25,COLORS[t.type]);}
  }
  [...b.units,...b.enemies].sort((a,d)=>a.y-d.y).forEach(actor);
  for(const fx of b.effects){if(fx.kind==='shot'){ctx.strokeStyle=COLORS[fx.color]||'#edd498';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(fx.x,fx.y-60);const f=Math.min(1,fx.age/.22);ctx.lineTo(fx.x+(fx.tx-fx.x)*f,fx.y-60+(fx.ty-fx.y+60)*f);ctx.stroke();}else{ctx.strokeStyle=fx.kind==='spell'?'#a0f1ed':'#fff4be';ctx.lineWidth=4;ctx.beginPath();ctx.arc(fx.x,fx.y,fx.kind==='spell'?100:10+fx.age*25,0,Math.PI*2);ctx.stroke();}}
  if(pending){ctx.fillStyle='#a4ecdc44';ctx.fillRect(pending.x-24,pending.y-24,48,48);ctx.strokeStyle=COLORS[pending.type];ctx.lineWidth=3;ctx.strokeRect(pending.x-24,pending.y-24,48,48);ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(pending.x,pending.y,180,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);label('預覽：確認才付款',pending.x,pending.y+56);}
  if(skill)label('點選敵群施放；取消不扣結晶',480,605,'#a0f1ed');
 };
}
