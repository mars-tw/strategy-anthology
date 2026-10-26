import {towerName,enemyName} from './content-r8.js';
import {replacementNote} from './content-r9.js';
import {battleRoute,exerciseFor} from './content-r1.js';
import {coveredRoute,towerRadius} from './content-r2.js';
const htmlText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

export const RELAY_CHOICES={
 upstream:{title:'留上游火塔',brief:'先削前段，提早開火。',segment:'上游長路',pad:{x:456,y:264}},
 gate:{title:'留城門火塔',brief:'補最後一段，攔住漏網。',segment:'城門前路',pad:{x:744,y:408}},
 crystals:{title:'拆取 90 結晶',brief:'少一座工事，結晶自行補塔。',segment:'中段轉角',pad:{x:552,y:264}},
};
export function routeSegment(b,index){
 const route=battleRoute(b),a=route[Math.max(0,Math.min(route.length-2,index-1))],z=route[Math.max(1,Math.min(route.length-1,index))];
 if(a.y<=110&&z.y<=110)return '北折長路';
 if(index===route.length-2)return '城門前路';
 if(a.x>=700&&z.x>=700)return '城門前路';
 if(a.y>=380&&z.y>=380)return '城門前路';
 if(a.y===z.y)return '上游長路';
 return '中段轉角';
}
export function relayMini(choice,route){
 const row=RELAY_CHOICES[choice],t={...row.pad,type:'cannon'},points=route.map(p=>`${p.x},${p.y}`).join(' '),pieces=coveredRoute(t,route),start=pieces[0]?.[0];
 return `<svg class="relay-mini" viewBox="0 0 960 640" role="img" aria-label="${row.segment}塔位及射程覆蓋" data-segment="${row.segment}"><image href="./assets/r3/chapter-quarry-watch.webp" width="960" height="640" preserveAspectRatio="xMidYMid slice"/><polyline points="${points}" fill="none" stroke="#292d38" stroke-width="65"/><polyline points="${points}" fill="none" stroke="#dbc49a" stroke-width="48"/>${pieces.map(p=>`<path class="covered-piece" d="M${p[0].x},${p[0].y} L${p[1].x},${p[1].y}" fill="none" stroke="#fff4cb" stroke-width="76"/><path d="M${p[0].x},${p[0].y} L${p[1].x},${p[1].y}" stroke="#b83e35" stroke-width="48"/>`).join('')}<circle class="relay-range" cx="${t.x}" cy="${t.y}" r="${towerRadius(t)}" fill="#ed86571f" stroke="#ed8657" stroke-width="12"/>${start?`<circle class="first-contact" cx="${start.x}" cy="${start.y}" r="35" fill="#fff8de" stroke="#292d38" stroke-width="12"/><path d="M${start.x-16},${start.y}h32m-16,-16v32" stroke="#b83e35" stroke-width="9"/>`:''}<image href="./assets/r4/tower-cannon.png" x="${t.x-66}" y="${t.y-133}" width="132" height="145"/></svg>`;
}
export function leakDescription(b){
 const leak=b.firstLeak;if(!leak)return '';
 const why='此處仍有敵軍越線；可先檢查首漏路段，再自行展開塔位提示。';
 return `首漏敵軍 ${enemyName(b,leak.id)}・漏點路段：${routeSegment(b,leak.segment)}・敵剩血 ${Math.ceil(leak.hp)}・漏入扣防線12（100→${b.hp}）。${why}`;
}
export function recordDecision(c,b){
 if(!b.decisionSeed||b.sampleRecorded||b.exercise||b.wave!==1)return false;
 b.sampleRecorded=true;
 const s=b.decisionStats||{},rows=Object.entries(s.towers||{}).sort((a,z)=>z[1].damage-a[1].damage),[id,t]=rows[0]||[];
 const segment=t?Number(Object.entries(t.segments).sort((a,z)=>z[1]-a[1])[0]?.[0]||1):1;
 const row={chapter:b.chapter,branch:b.relayChoice||'none',terrain:b.terrainChoice||'none',replay:!!b.replay,spent:b.spent,kills:b.kills,hp:b.hp,damage:t?.damage||0,hits:t?.hits||0,tower:t?.type||'none',towerId:id||'none',segment,wetCount:s.wetIds?.length||0,detourCount:s.detourIds?.length||0,waterDelay:s.waterDelay||0,outcome:b.result==='lost'?'lost':'won'};
 Object.assign(row,{runNumber:Math.max(0,...(c.decisionRecords||[]).map(r=>r.runNumber||0))+1,contributions:b.towers.map(t=>({type:t.type,x:t.x,y:t.y,inherited:!!t.inherited,hits:s.towers?.[t.id]?.hits||0,damage:s.towers?.[t.id]?.damage||0})),scope:'chapter-first-wave',salvageUses:structuredClone(s.spending||[]),totalDamage:Object.values(s.towers||{}).reduce((n,t)=>n+t.damage,0),totalHits:Object.values(s.towers||{}).reduce((n,t)=>n+t.hits,0),detourSeconds:s.detourSeconds||0,inheritedDamage:Object.values(s.towers||{}).filter(t=>t.inherited).reduce((n,t)=>n+t.damage,0),inheritedHits:Object.values(s.towers||{}).filter(t=>t.inherited).reduce((n,t)=>n+t.hits,0),firstInheritedSegmentName:routeSegment(b,Object.values(s.towers||{}).find(t=>t.inherited)?.firstSegment||1),formation:b.towers.map(t=>({type:t.type,x:t.x,y:t.y,level:t.level,inherited:!!t.inherited}))});Object.assign(row,{duration:b.time,seedBase:b.decisionSeed.baseCrystals,bonusDamage:Object.values(s.towers||{}).reduce((n,t)=>n+(t.bonusDamage||0),0)});if(b.window20)row.window20=structuredClone(b.window20);b.firstWaveDecision=structuredClone(row);(c.decisionRecords??=[]).push(row);c.decisionRecords=c.decisionRecords.slice(-8);return true;
}
export function impactReadout(b,selected){
 const events=b.hitLog||[];let focus=b.towers.find(t=>t.id===selected)||b.towers.at(-1);const f=events.filter(f=>f.towerId===focus?.id).at(-1)||events.at(-1);if(f&&f.towerId!==focus?.id)focus=b.towers.find(t=>t.id===f.towerId);
 const title=focus?`${focus.inherited?'留守':''}${({cannon:'火',frost:'冰',tesla:'雷'})[focus.type]}塔`:'命中';
 const watch=`<button data-action="watch-hit" data-watch-id="${htmlText(focus?.id||'')}" aria-label="切換觀察命中的塔">${focus?.inherited?'':'看'}${title}<small>切換</small></button>`;
 if(!f)return {html:watch+'<div class="impact-lines"><strong>命中明細</strong><span>等待這座塔開火，顯示來源、共鳴與實扣。</span></div>',event:null};
 const a=b.enemies.find(e=>e.id===f.targetId),slow=a?.hp>0?a.slow:0;
 const names={cannon:'火印',frost:'冰印',tesla:'雷印'},bolt=f.color==='tesla'?'<svg class="impact-bolt" viewBox="0 0 100 20" aria-label="單體折線電弧"><path d="M2 10H22L36 2 48 18 62 2 76 10H98" fill="none" stroke="currentColor" stroke-width="3"/></svg>':'';
 const total=focus?.inherited?(b.firstWaveDecision?{hits:b.firstWaveDecision.inheritedHits,damage:b.firstWaveDecision.inheritedDamage}:b.wave===1?b.decisionStats?.towers?.[focus.id]:null):null;
 const full=watch+`<div class="impact-lines"><strong>${names[f.color]} ${towerName(b,f.towerId)} → ${enemyName(b,f.targetId)}${f.bonus>0?' ▲共鳴'+Math.round(f.bonus*100)+'%':''}</strong><span>基礎 ${htmlText(f.baseDamage)} ＋共鳴 ${htmlText(f.bonusDamage)}＝威力 ${htmlText(f.damage)}；實扣 <b>−${htmlText(f.actualDamage)}</b></span><span>生命 ${htmlText(f.hpBefore)} → ${htmlText(f.hpAfter)}｜結霜 ${slow>0?1:0} 層・剩 ${slow.toFixed(1)} 秒${f.color==='tesla'?'｜單體電弧':''}</span>${total?`<span>同場首波留塔累計：${total.hits} 次／${total.damage} 傷害${b.firstWaveDecision?'（已結算）':''}</span>`:''}${bolt}</div>`;
 const summary=`<div class="hit-summary">${towerName(b,f.towerId)} → ${enemyName(b,f.targetId)} −${htmlText(f.actualDamage)}${f.bonus?'・共鳴 +'+Math.round(f.bonus*100)+'%':''}${total?`<br>首波留塔 ${total.hits} 次／${total.damage} 傷害`:''}</div>`;
 const html=watch+summary+`<details class="hit-details"><summary>命中明細<span class="hit-heading">・${towerName(b,f.towerId)} → ${enemyName(b,f.targetId)} −${htmlText(f.actualDamage)}</span></summary>${full.slice(watch.length)}</details>`;
 return {html,event:{...f,remainingSlow:slow}};
}
export function comparisonHTML(c,b){
 const records=(c.decisionRecords||[]).filter(r=>r.chapter===b.chapter&&r.scope==='chapter-first-wave').slice(-2);
 if(!records.length||records.some(r=>!r.totalHits))return '<p class="comparison-empty">首波交火資料不足。先確認主力塔射程覆蓋道路，打完首波再比較；未命中時不列零值表。</p>';
 const title=r=>`${RELAY_CHOICES[r.branch]?.title||'本場防線'}／${({none:'原路',flood:'放水',barricade:'堵隘'})[r.terrain]}`;
 const rows=[['選擇',title],['支出（結晶）',r=>r.spent],['全塔傷害',r=>r.totalDamage],['全塔命中（次）',r=>r.totalHits],['攔下（隻）',r=>r.kills],['防線耐久',r=>r.hp]];
 if(records.some(r=>r.branch==='crystals'))rows.splice(2,0,['拆塔收入（結晶）',r=>r.branch==='crystals'?90:0]);
 if(records.some(r=>r.branch!=='none'))rows.push(['留塔傷害',r=>r.inheritedDamage],['留塔命中（次）',r=>r.inheritedHits],['留塔首次路段',r=>r.inheritedHits?r.firstInheritedSegmentName:'無留塔／未命中']);
 if(records.some(r=>r.terrain!=='none'))rows.push(['新路敵軍（隻）',r=>r.terrain==='flood'?r.wetCount:r.detourCount],['涉水新增延遲（秒）',r=>r.terrain==='flood'?Number(r.waterDelay.toFixed(1)):'未涉水'],['北路行軍（全隊秒）',r=>r.terrain==='barricade'?Number(r.detourSeconds.toFixed(1)):'未走北路']);
 const two=records.length===2,diff=get=>{const a=get(records[0]),z=get(records.at(-1));return typeof a==='number'&&typeof z==='number'?z-a:null;};
 const damageDelta=two?records[1].totalDamage-records[0].totalDamage:0,hitDelta=two?records[1].totalHits-records[0].totalHits:0;
 const same=two&&JSON.stringify(records[0].formation.filter(t=>!t.inherited))===JSON.stringify(records[1].formation.filter(t=>!t.inherited));
 const terrainNote=two&&records.every(r=>r.terrain==='flood')?` 涉水新增延遲差 ${(records[1].waterDelay-records[0].waterDelay).toFixed(1)} 秒（本次減前次）。`:'';
 const identical=two&&rows.every(([,get])=>String(get(records[0]))===String(get(records[1])));
 const note=two?`<p class="comparison-verdict">首波${records[1].kills===records[0].kills?'攔下數相同':records[1].kills>records[0].kills?'多攔 '+(records[1].kills-records[0].kills)+' 隻':'少攔 '+(records[0].kills-records[1].kills)+' 隻'}，耐久 ${records[1].hp-records[0].hp>=0?'+':''}${records[1].hp-records[0].hp}。全塔傷害 ${damageDelta>=0?'+':''}${damageDelta}，命中 ${hitDelta>=0?'+':''}${hitDelta} 次。${terrainNote}${same?'新建塔位／等級相同，可對照本次決定。':'新建塔位或等級不同：這是整套配置比較，不能歸因給單一留塔。'}</p>`:'';
 return (identical?'<p class="identical-results">兩場結果相同。這次與上次結果完全相同，實測數據如下。</p>':'')+note+`<table class="decision-compare"><caption>本章相同首波・${two?'前次與本次':'第一筆'}實測；全部數字止於首波結束</caption><thead><tr><th>首波統計</th>${records.map(r=>`<th>第 ${r.runNumber||'舊'} 場<br>${r.replay?'對照試打':'本場實際'}</th>`).join('')}${two?'<th>差異<br>本次−前次</th>':''}</tr></thead><tbody>${rows.filter(([,get])=>!two||identical||String(get(records[0]))!==String(get(records[1]))).map(([label,get])=>{const delta=diff(get),changed=two&&String(get(records[0]))!==String(get(records[1]));return `<tr${changed?' class="different"':''}><th>${label}</th>${records.map(r=>`<td>${get(r)}</td>`).join('')}${two?`<td>${delta===null?(changed?'已變更':'相同'):(delta>0?'+':'')+Number(delta.toFixed(1))}</td>`:''}</tr>`;}).join('')}</tbody></table>${two&&!identical?`<details class="same-results"><summary>展開相同欄位（${rows.filter(([,get])=>String(get(records[0]))===String(get(records[1]))).length}）</summary><table class="decision-compare"><tbody>${rows.filter(([,get])=>String(get(records[0]))===String(get(records[1]))).map(([label,get])=>`<tr><th>${label}</th><td>${get(records[0])}</td><td>${get(records[1])}</td><td>${typeof get(records[0])==='number'?'0':'相同'}</td></tr>`).join('')}</tbody></table></details>`:''}${two?`<p class="replacement-note">${replacementNote(records[0],records[1])}</p>`:''}${records.some(r=>r.terrain!=='none')?'<p class="fine">涉水延遲是水域額外增加的時間；北路行軍是實際停留時間，兩者不可相減。</p>':''}`;
}
