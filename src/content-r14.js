// Geometry and summaries use recorded simulation events, never sample outcomes.
import {intersects} from './content-r8.js';
export function snapshotPoint(x,y,w,h){
 const scale=Math.min(w/960,h/640);return {x:Math.max(0,Math.min(w,(w-960*scale)/2+x*scale)),y:Math.max(0,Math.min(h,(h-640*scale)/2+y*scale))};
}
export function nearbyLabels(anchors,w,h,bodies=[]){
 const offsets=[[0,9],[0,16],[0,24],[-14,18],[14,18],[-24,0],[24,0],[0,-18],[14,-18],[-14,-18],[0,-24],[0,0]];
 for(const width of bodies.length?[42,18]:[42]){
  const options=anchors.map(a=>offsets.map(([dx,dy])=>({x:a.x+dx-width/2,y:a.y+dy-9,w:width,h:18})).filter(r=>r.x>=1&&r.y>=8&&r.x+r.w<=w-1&&r.y+20<=h&&!bodies.some(b=>intersects(r,b))));
  const placed=[];let visits=0;
  function choose(i){if(++visits>4096)return false;if(i===anchors.length)return true;for(const r of options[i]){if(placed.some(p=>intersects(r,p)))continue;placed.push(r);if(choose(i+1))return true;placed.pop();}return false;}
  if(choose(0))return placed.map((r,i)=>({...r,number:i+1,anchorX:anchors[i].x,anchorY:anchors[i].y,compact:width===18}));
 }
 if(bodies.length)return nearbyLabels(anchors,w,h);
 return anchors.map((a,i)=>({x:Math.max(1,Math.min(w-43,a.x-21)),y:Math.max(1,Math.min(h-19,a.y)),w:42,h:18,number:i+1,anchorX:a.x,anchorY:a.y,compact:false}));
}

export function separateHealth(units,w,h){
 const placed=[];
 return units.filter(u=>u.healthShown).map(u=>{
  const base={x:u.x-19,y:u.healthY-1,w:38,h:7};let rect;
  for(let d=0;d<h&&!rect;d+=9)for(const side of d?[1,-1]:[1]){
   const r={...base,x:Math.max(2,Math.min(w-40,base.x)),y:base.y+d*side};
   if(r.y>=2&&r.y+r.h<h-2&&!placed.some(p=>intersects(r,p)))rect=r;
  }
  if(!rect)return null;placed.push(rect);return {id:u.id,...rect,anchorX:u.x,anchorY:u.y-u.poseHeight};
 }).filter(Boolean);
}
export function branchTotals(r){
 const bonus=r.bonusDamage;
 return {inherited:r.inheritedDamage||0,built:(r.totalDamage||0)-(r.inheritedDamage||0),bonus:bonus??null,seconds:r.duration??null,leaks:Math.round((100-r.hp)/12)};
}
export function threeBranchHTML(c,b,compact=false){
 if(b.chapter!==4)return '';
 const records=['upstream','gate','crystals'].map(branch=>(c.decisionRecords||[]).filter(r=>r.chapter===4&&r.branch===branch&&r.scope==='chapter-first-wave').at(-1));
 if(records.some(r=>!r))return '';
 const paid=r=>JSON.stringify(r.formation.filter(t=>!t.inherited));
 const same=records.every(r=>paid(r)===paid(records[0])&&r.seedBase===records[0].seedBase&&r.terrain===records[0].terrain);
 const sameStart=Number.isSafeInteger(records[0].seedBase)&&records.every(r=>r.seedBase===records[0].seedBase&&r.terrain===records[0].terrain);
 const full=records.every(r=>r.fullRun),get=r=>r.fullRun;
 const rows=full?[
 ['波數／耐久',r=>`${get(r).waves}/4・${get(r).hp}/100`],['四波漏入',r=>get(r).leaks],['整場秒數',r=>get(r).time.toFixed(1)],['支出／淨值',r=>`${get(r).spent}／${get(r).balance}`],['留守總傷害',r=>get(r).inheritedDamage],['整場傷害／命中',r=>`${get(r).damage}／${get(r).hits}`],['首波20秒傷／命中',r=>r.window20?`${r.window20.damage}／${r.window20.hits}`:r.duration<20?'未滿20秒':'舊紀錄缺取樣'],['首波留守／新建',r=>`${r.inheritedDamage}／${r.totalDamage-r.inheritedDamage}`],['共鳴實扣¹',r=>r.bonusDamage],['相對上游時間',r=>(get(r).time-get(records[0]).time).toFixed(1)+'秒']
 ]:[['首波傷害',r=>r.totalDamage],['留守／新建',r=>`${r.inheritedDamage}／${r.totalDamage-r.inheritedDamage}`],['共鳴實扣¹',r=>r.bonusDamage],['相對上游',r=>(r.duration-records[0].duration).toFixed(1)+'秒']];
 const causes=full?records.map((r,i)=>`${['上游','城門','拆晶'][i]}：${get(r).waveResults.filter(w=>w.leaks).map(w=>`第${w.wave}波漏${w.leaks}隻`).join('、')||'四波全攔'}${r.branch==='gate'&&!r.inheritedHits?'（首波前線全攔；城門在後波收尾）':''}`).join('；'):'';
 const names=['上游','城門','拆晶'];
 const best=full?[...records].sort((a,z)=>get(z).hp-get(a).hp||get(a).leaks-get(z).leaks||(get(a).outcome==='won'?get(a).time-get(z).time:get(z).kills-get(a).kills||get(z).time-get(a).time))[0]:null;
 const headline=best?(get(best).outcome==='lost'?`${names[records.indexOf(best)]}攔下${get(best).kills}隻，撐${get(best).time.toFixed(1)}秒；三案仍失守。`:`${names[records.indexOf(best)]}${get(best).leaks?'漏'+get(best).leaks+'隻':'全部攔下'}，${get(best).time.toFixed(1)}秒；${records.some(r=>get(r).hp!==get(best).hp)?'先比耐久，再看耗時。':'三案耐久相同，以耗時比較。'}`):'尚缺四波結果；以下只比首波。';
 const primary=full?[['耐久',r=>get(r).hp+'/100'],['漏入',r=>get(r).leaks+'隻'],['秒數',r=>get(r).time.toFixed(1)]]:[['耐久',r=>r.hp+'/100'],['漏入',r=>Math.round((100-r.hp)/12)+'隻'],['秒數',r=>Number.isFinite(r.duration)?r.duration.toFixed(1):'未記錄']];
 return `<div class="branch-comparison"><p class="branch-headline">${headline}</p><table class="decision-compare three-branches branch-primary"><caption>各分支差異・${full?(records.every(r=>get(r).waves===4)?'完整四波實測':'整場實測（含提前失守）'):'首波實測'}</caption><thead><tr><th>結果</th><th>上游</th><th>城門</th><th>拆晶</th></tr></thead><tbody>${primary.map(([name,value])=>`<tr><th>${name}</th>${records.map(r=>`<td>${value(r)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="branch-context">${same?'相同開局、敵隊與新建塔位／等級。':sameStart?'共同起點與敵隊；配置依各案實際支出比較。':'開局或配置不同，不能只歸因於留塔。'}</p>${compact?'':`<details class="full-data"><summary>看完整數據</summary><p>${same?'相同開局、敵隊與新建塔位／等級。':sameStart?'共同起點與敵隊；配置依各案實際支出比較。':'開局或路線不同／未記錄，不能歸因給單一留塔選擇。'}${full?'上游提前削血；城門後段收尾；拆晶自由補塔，餘額可留給後續。淨值＝開局含拆晶−支出，排除戰役擊殺與通關獎勵。':'尚缺四波結果；以下只比首波，不能推論整場。'}</p><table class="decision-compare branch-details"><caption>各分支差異・${full?(records.every(r=>get(r).waves===4)?'完整四波實測':'整場實測（含提前失守）'):'首波實測（四波待完成）'}</caption><thead><tr><th>${full?'四波':'首波'}</th><th>上游</th><th>城門</th><th>拆晶</th></tr></thead><tbody>${(compact?rows.slice(0,5):rows).map(([name,get])=>`<tr><th>${name}</th>${records.map(r=>`<td>${get(r)}</td>`).join('')}</tr>`).join('')}</tbody></table><p>${causes}</p><p class="fine">¹共鳴已包含。首波以同一20秒取樣比較射程效率。全殲總傷會受敵軍生命上限限制；另列留守與四波結果。拆晶另建冰塔70、可升級60，依實付列入支出。</p></details>`}</div>`;
}
export function gateTimingHint(c,b){
 if(!b.gate||b.result)return '';
 const last=(c.exercises.gateTrials||[]).at(-1);if(!last)return '';
 const at=last.at===null?'未開閘':`${last.at.toFixed(1)}秒開閘`;
 return `上局${at}・攔${last.kills}/10；本局${b.time.toFixed(1)}秒${last.at!==null?`・${b.gate.used?'本次比上局'+(b.gate.at>=last.at?'晚':'早')+Math.abs(b.gate.at-last.at).toFixed(1)+'秒開閘':b.time<last.at?'再過'+(last.at-b.time).toFixed(1)+'秒到上局時刻':'已過上局時刻'+(b.time-last.at).toFixed(1)+'秒'}`:''}`;
}
