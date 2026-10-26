import {CHAPTERS} from './campaign.js';
import {gateWet} from './content-r12.js';
// R15 receipts are captured from the simulation at each completed wave.
export function recordFullRun(c,b){
 if(b.exercise||!b.decisionSeed||b.wave<1||b.phase!=='planning'&&!b.result)return;
 const rows=b.waveResults??=[];if(rows.length!==b.wave-1||rows.some(r=>r.wave===b.wave))return;
 rows.push({wave:b.wave,hp:b.hp,kills:b.kills,time:b.time,leaks:(b.leakLog||[]).filter(r=>r.wave===b.wave).length});
 if(!b.result)return;
 const stats=Object.values(b.decisionStats?.towers||{}),base=b.decisionSeed.baseCrystals+(b.relayChoice==='crystals'?90:0);
 const full={waves:b.wave,hp:b.hp,kills:b.kills,time:b.time,spent:b.spent,balance:base-b.spent,seed:base,leaks:(b.leakLog||[]).length,inheritedDamage:stats.filter(t=>t.inherited).reduce((n,t)=>n+t.damage,0),damage:stats.reduce((n,t)=>n+t.damage,0),hits:stats.reduce((n,t)=>n+t.hits,0),waveResults:structuredClone(rows),outcome:b.result};
 b.fullRun=full;
 const row=(c.decisionRecords||[]).find(r=>r.runNumber===b.firstWaveDecision?.runNumber);if(row)row.fullRun=structuredClone(full);
}
export function validFullRun(r){
 if(r===undefined)return true;
 const integer=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e8;
 return !!r&&['waves','hp','kills','spent','seed','leaks','inheritedDamage','damage','hits'].every(k=>integer(r[k]))&&r.hp<=100&&r.waves<=4&&r.hp===Math.max(0,100-r.leaks*12)&&Number.isSafeInteger(r.balance)&&r.balance===r.seed-r.spent&&Number.isFinite(r.time)&&r.time>=0&&r.inheritedDamage<=r.damage&&['won','lost'].includes(r.outcome)&&Array.isArray(r.waveResults)&&r.waveResults.length===r.waves&&r.waveResults.every((w,i)=>w&&w.wave===i+1&&integer(w.hp)&&w.hp<=100&&integer(w.kills)&&integer(w.leaks)&&Number.isFinite(w.time)&&w.time>=0)&&r.waveResults.reduce((n,w)=>n+w.leaks,0)===r.leaks;
}
export function fullRunHTML(b){
 const r=b.fullRun;if(!r)return '';
 const why=r.waveResults.filter(w=>w.leaks).map(w=>`第${w.wave}波漏${w.leaks}隻`).join('、');
 return `<p class="full-run-summary">${r.waves}/${CHAPTERS[b.chapter].waves}波・防線 <b>${r.hp}/100</b>・漏${r.leaks}隻・${r.time.toFixed(1)}秒<br>${why||'全場攔下，沒有敵軍扣防線。'}${b.relayChoice==='gate'&&!b.firstWaveDecision?.inheritedHits?'首波已被前線全攔；城門塔在後波收尾。':''}</p><details class="full-data"><summary>看本場收支</summary><p>留守總傷害${r.inheritedDamage}；支出${r.spent}，預算淨值${r.balance}。${b.relayChoice==='crystals'?'拆晶收入90已含於開局；補塔／升級由實際建造扣款。':''}</p></details>`;
}
export function gateDelayHTML(b){
 const g=b.gate;if(!g?.used||g.left>0||!g.delays)return '';
 const rows=Object.values(g.delays).sort((a,z)=>z.seconds-a.seconds),sum=rows.reduce((n,r)=>n+r.seconds,0);
 return `<span class="delay-leaders">慢最多：${rows.slice(0,3).map(r=>`第${r.ordinal}隻 +${r.seconds.toFixed(2)}秒`).join('、')}；逐隻合計 +${sum.toFixed(2)}秒${g.legacyDelay?`；舊存檔未逐隻記錄 +${g.legacyDelay.toFixed(2)}秒`:``}</span>`;
}
// Reuse the authored mineral-pigment water; irregular banks follow the road.
export function paintWater(ctx,art,points,half=22,time=0,emphasis=false){
 if(points.length<2)return;
 // Both hydraulic surfaces use the same opacity, texture and earth banks.
 // Round the road corner locally; preserve the exact wet entry/exit centers.
 const smooth=points.map((p,i)=>i===0||i===points.length-1?p:{x:(points[Math.max(0,i-3)].x+p.x*2+points[Math.min(points.length-1,i+3)].x)/4,y:(points[Math.max(0,i-3)].y+p.y*2+points[Math.min(points.length-1,i+3)].y)/4});
 const banks=[-1,1].map(side=>smooth.map((p,i)=>{const a=smooth[Math.max(0,i-4)],z=smooth[Math.min(smooth.length-1,i+4)],angle=Math.atan2(z.y-a.y,z.x-a.x),edge=Math.min(1,(i+1)/5,(smooth.length-i)/5),spread=half*(.91+.05*Math.sin(i*.31)+.03*Math.cos(i*.67))*Math.sqrt(edge);return {x:p.x-Math.sin(angle)*spread*side,y:p.y+Math.cos(angle)*spread*side};}));
 const polygon=[...banks[0],...[...banks[1]].reverse()],xs=polygon.map(p=>p.x),ys=polygon.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 const path=()=>{ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
 ctx.save();path();ctx.strokeStyle='#998564b8';ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=9;ctx.stroke();
 path();ctx.clip();ctx.fillStyle='#319fad';ctx.fillRect(x,y,w,h);ctx.globalAlpha=.64;ctx.drawImage(art['r7-flood'],420,180,80,220,x,y,w,h);ctx.globalAlpha=1;ctx.fillStyle='#288f9c70';ctx.fillRect(x,y,w,h);
 ctx.strokeStyle='#a5e4df';ctx.lineWidth=1.4;
 for(let i=2;i<smooth.length;i+=5){const p=smooth[i],shift=Math.sin(time*2+i)*3;ctx.beginPath();ctx.moveTo(p.x-6,p.y+shift);ctx.quadraticCurveTo(p.x,p.y+4+shift,p.x+8,p.y+shift);ctx.stroke();}ctx.restore();
 ctx.save();path();ctx.strokeStyle='#386d6599';ctx.lineWidth=2;ctx.stroke();ctx.restore();return {polygon,banks,bounds:{x,y,w,h},emphasis,art:'content-r7/flood.webp',palette:'celadon-channel',entry:points[0],exit:points.at(-1),flowPhase:time};
}

// Allocate displayed hundredths, leaving exact simulation and save values intact.
// A removed or dry enemy keeps its receipt; legacy aggregates remain explicit.
export function gateDelayRows(b){
 const g=b.gate;if(!g?.used)return [];
 const rows=Object.entries(g.delays||{}).map(([id,d])=>{const e=b.enemies.find(e=>e.id===id),escaped=e?.escaped||(b.leakLog||[]).some(r=>r.id===id);return {id,ordinal:d.ordinal,seconds:d.seconds,state:gateWet(b,e||{})?'涉水中':escaped?'已越線':e?.hp>0?'已離水':'已攔下'};}).sort((a,z)=>a.ordinal-z.ordinal);
 const legacy=g.legacyDelay??(g.delays===undefined?g.delay:0);if(legacy>0)rows.push({id:'legacy',seconds:legacy,state:'舊存檔未分隻'});
 for(const r of rows)r.cents=Math.floor(r.seconds*100+1e-8);
 const left=Math.round(Number(g.delay.toFixed(2))*100)-rows.reduce((n,r)=>n+r.cents,0);
 const order=[...rows].sort((a,z)=>(z.seconds*100-z.cents)-(a.seconds*100-a.cents));
 for(let i=0;i<left;i++)order[i%order.length].cents++;
 return rows;
}
export function gateLedgerHTML(b){
 if(!b.gate?.used)return '';
 return `<div class="gate-ledger" aria-label="逐隻延遲對帳" data-total="${b.gate.delay.toFixed(2)}">${gateDelayRows(b).map(r=>`<span class="gate-delay-row ${r.state==='涉水中'?'wet':'dry'}" data-enemy="${r.id}" data-seconds="${(r.cents/100).toFixed(2)}"><b>${r.ordinal?'第'+r.ordinal+'隻':'舊紀錄'} +${(r.cents/100).toFixed(2)}秒</b><i>${r.state}</i></span>`).join('')}</div>`;
}

export const polygonArea=points=>Math.abs(points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p.x*q.y-q.x*p.y;},0)/2);
// Clip the actual irregular water polygon, not its mostly-empty bounding box.
export function waterLabelArea(polygon,rect){
 let points=polygon;
 for(const [axis,edge,greater]of [['x',rect.x,true],['x',rect.x+rect.w,false],['y',rect.y,true],['y',rect.y+rect.h,false]]){
  const clipped=[];if(!points.length)return 0;
  for(let i=0;i<points.length;i++){
   const a=points[i],z=points[(i+1)%points.length],inside=p=>greater?p[axis]>=edge:p[axis]<=edge,A=inside(a),Z=inside(z);
   if(A)clipped.push(a);
   if(A!==Z){const f=(edge-a[axis])/(z[axis]-a[axis]);clipped.push({x:a.x+(z.x-a.x)*f,y:a.y+(z.y-a.y)*f});}
  }points=clipped;
 }
 return polygonArea(points);
}

export const validWindow20=w=>!!w&&w.at===20&&['damage','hits','inheritedDamage'].every(k=>Number.isSafeInteger(w[k])&&w[k]>=0&&w[k]<=1e8)&&w.inheritedDamage<=w.damage;
