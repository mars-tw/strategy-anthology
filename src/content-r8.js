// Player-facing names and deterministic screen-space annotation placement.
export const towerName=(b,id)=>{const t=b.towers.find(t=>t.id===id);if(!t)return '未識別塔';const n=b.towers.filter(a=>a.type===t.type).findIndex(a=>a.id===id)+1;return `${t.inherited?'留守':''}${{cannon:'火塔',frost:'冰塔',tesla:'雷塔'}[t.type]}${n}`;};
export function enemyName(b,id){const a=b.enemies.find(a=>a.id===id),leak=b.firstLeak?.id===id?b.firstLeak:null,event=b.hitLog?.find(e=>e.targetId===id),raw=a?.ordinal||leak?.ordinal||event?.targetOrdinal||b.enemies.findIndex(a=>a.id===id)+1,n=Number.isSafeInteger(raw)&&raw>0?raw:0,type=a?.type||leak?.type||event?.targetType;return n?`第 ${n} 隻${type==='shieldBearer'?'盾兵':'甲犬'}`:'越線敵軍';}
export const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function paintedWaterAt(surface,point,patch){
 if(!surface||!patch)return false;
 const x=Math.floor((point.x-patch.x)/patch.w*surface.width),y=Math.floor((point.y-patch.y)/patch.h*surface.height);
 return x>=0&&y>=0&&x<surface.width&&y<surface.height&&surface.mask[y*surface.width+x]===1;
}
export function placeAnnotation(anchor,width,height,blockers,textWidth=68,textHeight=23){
 const candidates=[];
 for(const [dx,dy]of [[55,0],[-55,0],[0,-38],[0,34],[90,-42],[-90,-42],[0,65]])candidates.push({x:anchor.x+dx-textWidth/2,y:anchor.y+dy-textHeight/2,w:textWidth,h:textHeight});
 for(let y=6;y<height-textHeight;y+=12)for(let x=6;x<width-textWidth;x+=16)candidates.push({x,y,w:textWidth,h:textHeight});
 const free=candidates.filter(a=>a.x>=3&&a.y>=3&&a.x+a.w<=width-3&&a.y+a.h<=height-3&&!blockers.some(b=>intersects(a,b)));
 return free.sort((a,b)=>Math.hypot(a.x+a.w/2-anchor.x,a.y+a.h/2-anchor.y)-Math.hypot(b.x+b.w/2-anchor.x,b.y+b.h/2-anchor.y))[0]||null;
}
export const armyDamage=s=>Object.values(s?.towers||{}).reduce((n,t)=>n+t.damage,0);
export function decisionSummary(b){
 const r=b.firstWaveDecision;
 if(!r)return [b.sampleRecorded?'舊進度未保留首波明細；重演本場後可取得可比較的紀錄。':'首波尚未完成：先讓主力塔射程覆蓋道路，打完首波再比較。'];
 const lines=[`第 ${r.runNumber||'舊'} 場・本章首波・全塔火力：${r.totalDamage} 傷害，${r.totalHits} 次命中，攔下 ${r.kills} 隻，耐久 ${r.hp}/100。`];
 if(r.inheritedHits)lines.push(`同一首波・留守塔：${r.inheritedHits} 次命中、${r.inheritedDamage} 傷害；首次命中：${r.firstInheritedSegmentName}。`);
 else if(r.branch!=='crystals'&&b.towers.some(t=>t.inherited))lines.push('同一首波・留守塔：未命中，先確認射程與道路。');
 lines.push(`首波收支：支出 ${r.spent} 結晶${r.branch==='crystals'?'，拆塔收入 +90 結晶（一次入帳）':''}。`);
 if(r.salvageUses?.length)lines.push('首波拆晶用途：'+r.salvageUses.map(p=>`${p.label} ${p.amount} 結晶`).join('、')+'。');
 if(r.terrain==='flood')lines.push(`同一首波・入水 ${r.wetCount} 隻，涉水新增延遲 ${r.waterDelay.toFixed(1)} 秒（全隊合計）。`);
 if(r.terrain==='barricade')lines.push(`同一首波・北繞 ${r.detourCount} 隻，北路行軍 ${r.detourSeconds.toFixed(1)} 秒（非新增延遲）。`);
 return lines;
}

export function validDecisionExtras(r){
 if(r.scope===undefined)return true;
 if(r.runNumber!==undefined&&(!Number.isSafeInteger(r.runNumber)||r.runNumber<1))return false;
 if(r.contributions!==undefined&&(!Array.isArray(r.contributions)||r.contributions.length>250||r.contributions.some(t=>!t||!['cannon','frost','tesla'].includes(t.type)||!Number.isFinite(t.x)||t.x<0||t.x>960||!Number.isFinite(t.y)||t.y<0||t.y>640||typeof t.inherited!=='boolean'||!Number.isSafeInteger(t.hits)||t.hits<0||!Number.isSafeInteger(t.damage)||t.damage<0)||r.contributions.reduce((n,t)=>n+t.damage,0)!==r.totalDamage||r.contributions.reduce((n,t)=>n+t.hits,0)!==r.totalHits||r.contributions.filter(t=>t.inherited).reduce((n,t)=>n+t.damage,0)!==r.inheritedDamage||r.contributions.filter(t=>t.inherited).reduce((n,t)=>n+t.hits,0)!==r.inheritedHits))return false;
 const integer=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e8;
 if(!['spent','kills','hp','damage','hits','segment','wetCount','detourCount'].every(k=>integer(r[k]))||r.hp>100||!Number.isFinite(r.waterDelay)||r.waterDelay<0||r.waterDelay>1e8||!['none','upstream','gate','crystals'].includes(r.branch)||!['none','flood','barricade'].includes(r.terrain)||!['won','lost'].includes(r.outcome)||typeof r.replay!=='boolean'||!['none','cannon','frost','tesla'].includes(r.tower)||!/^t[0-9]+$|^none$/.test(r.towerId))return false;
 return (r.salvageUses===undefined||Array.isArray(r.salvageUses)&&r.salvageUses.length<=2000&&r.salvageUses.every(p=>p&&['ford','quarry'].includes(p.source)&&['火印塔','冰印塔','雷印塔','塔升級','戰前工事'].includes(p.label)&&integer(p.amount)&&p.amount<=90))&&r.scope==='chapter-first-wave'&&['totalDamage','totalHits','inheritedDamage','inheritedHits'].every(k=>integer(r[k]))&&Number.isFinite(r.detourSeconds)&&r.detourSeconds>=0&&r.detourSeconds<=1e8&&['北折長路','城門前路','上游長路','中段轉角'].includes(r.firstInheritedSegmentName)&&Array.isArray(r.formation)&&r.formation.length<=250&&r.formation.every(t=>['cannon','frost','tesla'].includes(t.type)&&Number.isFinite(t.x)&&t.x>=0&&t.x<=960&&Number.isFinite(t.y)&&t.y>=0&&t.y<=640&&[1,2,3].includes(t.level)&&typeof t.inherited==='boolean')&&r.totalDamage>=r.inheritedDamage&&r.totalHits>=r.inheritedHits;
}
export function exerciseLayout(pads,w,h){
 if(h<200){const size=Math.min(52,Math.max(44,w/pads.length*.88));return pads.map((p,i)=>({x:w*(i+.5)/pads.length,y:Math.max(size+36,h-56),h:size,anchorX:p.x/960*w,anchorY:p.y/640*h}));}
 const size=Math.max(45,Math.min(104,(h-150)/2.2));
 return pads.map((p,i)=>({x:w*((i%3)+.5)/3,y:i<3?size+76:h-54,h:size,anchorX:p.x/960*w,anchorY:p.y/640*h}));
}
