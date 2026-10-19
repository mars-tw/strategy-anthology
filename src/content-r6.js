import {decisionSummary} from './content-r8.js';
// Measurements are accumulated at the real simulation event, never inferred from a win.
const names={cannon:'火塔',frost:'冰塔',tesla:'雷塔'};
export function statsFor(b){return b.decisionStats??={towers:{},wetSeconds:0,waterDelay:0,detourSeconds:0,spending:[]};}
export function recordHit(b,fx,a){
 const s=statsFor(b),t=b.towers.find(t=>t.id===fx.towerId);if(!t)return;
 const row=s.towers[t.id]??={type:t.type,x:t.x,y:t.y,inherited:!!t.inherited,hits:0,damage:0,kills:0,slowed:[],segments:{}};
 row.firstSegment??=a.route+1;row.hits++;row.damage+=fx.actualDamage;row.kills+=a.hp===0?1:0;
 if(fx.slow&&!row.slowed.includes(a.id))row.slowed.push(a.id);
 const segment=a.route+1;row.segments[segment]=(row.segments[segment]||0)+fx.actualDamage;
}
export function spendCredit(c,b,amount,label){
 const s=statsFor(b);for(const credit of c.salvageCredits||[]){const n=Math.min(amount,credit.remaining);if(n>0){credit.remaining-=n;amount-=n;s.spending.push({source:credit.source,label,amount:n});}if(!amount)break;}
}
export function contribution(b){
 const rows=Object.entries(statsFor(b).towers).sort((a,z)=>z[1].damage-a[1].damage),best=rows[0];
 if(!best)return '尚無有效命中；先讓塔的射程覆蓋道路。';
 const [id,t]=best,segment=Object.entries(t.segments).sort((a,z)=>z[1]-a[1])[0]?.[0];
 return `主力 ${names[t.type]}（${t.x>680?'城門前路':t.x<500?'上游長路':'中段轉角'}）・第 ${segment} 路段，${t.hits} 次命中／${t.damage} 傷害。`;
}
export function decisionReview(b){
 if(!b.exercise&&b.decisionSeed)return decisionSummary(b);
 const s=statsFor(b),lines=[];
 for(const t of Object.values(s.towers).filter(t=>t.inherited))lines.push(`留塔工事：${t.hits} 次命中、${t.damage} 傷害、攔下 ${t.kills} 隻；${t.x>680?'城門前路':'上游長路'}${t.type==='frost'?`，緩速 ${t.slowed.length} 隻`:''}。`);
 if(b.towers.some(t=>t.inherited)&&!lines.length)lines.push('留塔工事：0 次命中；本波敵軍未進射程。');
 const groups=new Map();for(const p of s.spending)groups.set(p.label,(groups.get(p.label)||0)+p.amount);
 if(groups.size)lines.push('拆晶用途：'+[...groups].map(([label,n])=>`${label} ${n} 結晶`).join('、')+'。');
 if(b.terrainChoice==='flood')lines.push(`放水：敵軍入水合計 ${s.wetSeconds.toFixed(1)} 秒，因水域多停留 ${s.waterDelay.toFixed(1)} 秒。`);
 if(b.terrainChoice==='barricade')lines.push(`堵隘：敵軍在北側新路行軍合計 ${s.detourSeconds.toFixed(1)} 秒。`);
 return lines;
}
export const IMPACT_SOUND={cannon:{frequencies:[170,85],spacing:.055,type:'sawtooth'},frost:{frequencies:[930,630,410],spacing:.06,type:'sine'},tesla:{frequencies:[380,1100,380],spacing:.035,type:'square'}};

export function drawCombatFeedback({ctx,b,units,towers,reduced,label,placeFloat}){
 const proof=[];
 for(const a of b.enemies){const u=units.find(u=>u.id===a.id);if(!u)continue;
  if(a.slow>0){ctx.save();ctx.fillStyle='#81e5f277';ctx.strokeStyle='#e6ffff';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(u.x-u.width*.5,u.y-6);ctx.lineTo(u.x-u.width*.35,u.y-u.poseHeight*.8);ctx.lineTo(u.x,u.y-u.poseHeight-3);ctx.lineTo(u.x+u.width*.45,u.y-u.poseHeight*.65);ctx.lineTo(u.x+u.width*.5,u.y-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
 }
 for(const fx of b.effects.filter(f=>f.kind==='shot')){
  const u=units.find(u=>u.id===fx.targetId),p=towers.find(t=>t.id===fx.towerId);if(!u||!p)continue;
  const x=u.x,y=u.y-u.poseHeight*.45;ctx.save();
  if(fx.bonus>0){ctx.strokeStyle='#e4c7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y-p.h-8);ctx.lineTo(p.x-12,p.y-p.h+8);ctx.lineTo(p.x+12,p.y-p.h+8);ctx.closePath();ctx.stroke();}
  if(fx.hit&&fx.actualDamage!==undefined){const age=fx.age-.22,r=14+Math.min(.25,age)*35;
   ctx.lineWidth=3;ctx.strokeStyle={cannon:'#ffae56',frost:'#e2ffff',tesla:'#f0cbff'}[fx.color];ctx.fillStyle={cannon:'#ed733cbb',frost:'#66d8ee88',tesla:'#b38aff88'}[fx.color];
   ctx.beginPath();if(fx.color==='cannon'){for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rr=i%2?r*.5:r;i?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+rr,y);}ctx.closePath();ctx.fill();ctx.stroke();}
   else if(fx.color==='frost'){for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.stroke();}
   else{ctx.moveTo(x+8,y-r);ctx.lineTo(x-8,y);ctx.lineTo(x+9,y-3);ctx.lineTo(x-7,y+r);ctx.stroke();}
   // Every struck enemy has an explicit numeric health bar, including non-leaders.
   ctx.fillStyle='#292d38';ctx.fillRect(x-23,u.y-u.poseHeight-15,46,8);ctx.fillStyle='#f0c1aa';ctx.fillRect(x-22,u.y-u.poseHeight-14,44*fx.hpBefore/fx.maxHP,6);ctx.fillStyle='#b83e35';ctx.fillRect(x-22,u.y-u.poseHeight-14,44*fx.hpAfter/fx.maxHP,6);
   fx.floatBox=placeFloat?.(`−${fx.actualDamage}${fx.slow?' 冰':''}`,{x,y},fx.color)||null;
   if(!placeFloat)label(`−${fx.actualDamage}`,x+30,y-25,'#943b20',15);
   proof.push({towerId:fx.towerId,targetId:fx.targetId,type:fx.color,damage:fx.actualDamage,hpBefore:fx.hpBefore,hpAfter:fx.hpAfter,slow:fx.slow,age:fx.age,bonus:fx.bonus,floatBox:fx.floatBox});
  }ctx.restore();
 }
 return proof;
}
