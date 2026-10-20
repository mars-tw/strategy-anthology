import towerRules from '../vendor/tower-defense/src/rules.js';
import {COLORS,TOWER_LABELS} from './campaign.js';
import {BASE_ROUTE,battleRoute,terrainRoute,floodZone} from './content-r1.js';
import towerConfig from '../vendor/tower-defense/src/config.js';

export const LEGACY_PAD={x:600,y:264};
export const LEGACY_SPRITES={foundation:[0,0,1040,887],crystal:[1130,0,644,887]};
export const towerRadius=t=>(towerConfig.TOWERS[t.type].range||140)+40;
export const shortfall=(money,cost)=>Math.max(0,cost-money);
// Solve segment/circle intersection in simulation coordinates, before map projection.
export function coveredRoute(t,route){
 const radius=towerRadius(t),pieces=[];
 for(let i=1;i<route.length;i++){
  const a=route[i-1],z=route[i],dx=z.x-a.x,dy=z.y-a.y,A=dx*dx+dy*dy;
  const B=2*((a.x-t.x)*dx+(a.y-t.y)*dy),C=(a.x-t.x)**2+(a.y-t.y)**2-radius*radius,D=B*B-4*A*C;
  if(!A||D<=0)continue;
  const lo=Math.max(0,(-B-Math.sqrt(D))/(2*A)),hi=Math.min(1,(-B+Math.sqrt(D))/(2*A));
  if(lo<hi)pieces.push([{x:a.x+dx*lo,y:a.y+dy*lo},{x:a.x+dx*hi,y:a.y+dy*hi}]);
 }
 return pieces;
}
export function formationFeedback(b){
 const kinds=new Set(b.towers.map(t=>t.type)).size;
 if(!b.trinity&&b.towers.some(t=>towerRules.resonanceFor(t,b.towers,{cellSize:48,towers:towerConfig.TOWERS}).bonus>0))return '實際布陣：火冰雷分散接力，局部雙印共鳴 +10%。';
 return b.trinity?'實際布陣：三印相鄰，共鳴傷害 +30%。':kinds===3?'實際布陣：火冰雷分散接力，沒有共鳴加成。':'實際布陣：元素未齊，以現有塔沿路攔截，沒有共鳴加成。';
}
export function drawRouteDecisions({ctx,art,b,preview,w,h,project,label,time,inspectType=null,routeAid=true}){
 const choice=preview||b.terrainChoice,route=preview?terrainRoute(preview,b.chapter):battleRoute(b);
 const point=p=>project(p.x,p.y,w,h,false);
 function line(points,color,width,dash=[]){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.lineJoin='round';ctx.beginPath();
  for(let i=1;i<points.length;i++)for(let j=i===1?0:1;j<=24;j++){const f=j/24,p=point({x:points[i-1].x+(points[i].x-points[i-1].x)*f,y:points[i-1].y+(points[i].y-points[i-1].y)*f});if(i===1&&j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.restore();}
 const proof={preview:preview||null,coverage:[],arrows:[],wetZone:null,slowIds:[]};
 if(!choice)return proof;
 if(preview)line(BASE_ROUTE,'#61666d',3,[5,5]);
 const zone=floodZone(b);
 if(choice==='flood'){
  const p=point(zone),rx=zone.radius*w/960,ry=zone.radius*h/640;
  // Shoreline from the original painting, plus its actual flowing-water crop
  // over the speed zone. All pixels are sampled art; no cyan fill substitute.
  ctx.save();ctx.drawImage(art['r7-flood'],p.x-rx*1.15,p.y-ry*1.15,rx*2.3,ry*2.3);
  ctx.beginPath();
  for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,q=point({x:zone.x+Math.cos(a)*zone.radius,y:zone.y+Math.sin(a)*zone.radius});i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.closePath();ctx.clip();
  ctx.globalAlpha=.92;ctx.drawImage(art['r7-flood'],45,220,250,260,p.x-rx,p.y-ry,rx*2,ry*2);
  ctx.globalAlpha=.75;ctx.strokeStyle='#d4f7ef';ctx.lineWidth=1.6;
  for(let i=0;i<5;i++){const yy=p.y-ry*.65+i*ry*.32,shift=Math.sin(time*1.6+i)*5;ctx.beginPath();ctx.moveTo(p.x-rx*.65+shift,yy);ctx.quadraticCurveTo(p.x-rx*.1,yy+5,p.x+rx*.6+shift,yy-3);ctx.stroke();}
  ctx.restore();proof.overlayArt='content-r7/flood.webp';
  proof.surfacePatch={x:p.x-rx,y:p.y-ry,w:rx*2,h:ry*2};
  // The authored shallow-water banks carry the terrain identity. The actual
  // circular speed boundary remains in simulation, without a target overlay.
  proof.wetZone={...zone,screen:{...p,rx,ry},art:'content-r5/flood.webp',rings:0};
 }
 if(routeAid){line(route,'#f5f1e5cf',6);line(route,'#b83e35',2.5);}
 // Arrows move along each segment even while the battle is paused in preview.
 if(routeAid)for(let i=1;i<route.length;i++){
  const a=route[i-1],z=route[i],len=Math.hypot(z.x-a.x,z.y-a.y),count=Math.max(1,Math.floor(len/140));
  for(let j=0;j<count;j++){const f=(j/count+(time*.22)%1/count)%1,p=point({x:a.x+(z.x-a.x)*f,y:a.y+(z.y-a.y)*f}),q=point({x:a.x+(z.x-a.x)*Math.min(1,f+.015),y:a.y+(z.y-a.y)*Math.min(1,f+.015)}),angle=Math.atan2(q.y-p.y,q.x-p.x);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.strokeStyle='#f5f1e5';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-6,-4);ctx.lineTo(0,0);ctx.lineTo(-6,4);ctx.stroke();ctx.strokeStyle='#b83e35';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();proof.arrows.push({x:p.x,y:p.y});}
 }
 if(preview){
  for(const t of b.towers){const pieces=coveredRoute(t,route),visible=!inspectType||inspectType===t.type;proof.coverage.push({id:t.id,type:t.type,pieces,visible});if(!visible)continue;const r=towerRadius(t),p=point(t);ctx.save();ctx.strokeStyle=COLORS[t.type];ctx.fillStyle=COLORS[t.type]+'28';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,q=point({x:t.x+Math.cos(a)*r,y:t.y+Math.sin(a)*r});i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();for(const piece of pieces){line(piece,'#292d38',8);line(piece,COLORS[t.type],5);}label(TOWER_LABELS[t.type]+(pieces.length?'・覆蓋新路':'・零重疊'),p.x,p.y+24,'#292d38',12);}
  proof.inspectType=inspectType;
 }
 return proof;
}
