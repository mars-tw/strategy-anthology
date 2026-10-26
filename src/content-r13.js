// Presentation and retry helpers; combat rules and original puzzle budgets stay intact.
export function defenseHint(b){
 if(b.phase!=='planning')return '交戰中，觀察命中與敵軍路段。';
 return new Set(b.towers.map(t=>t.type)).size===3?'三塔已就位，按「開始下一波」。':'先配置三塔，再開始第一波。點已有塔可升級。';
}
export function retryFormation(c,b,createExercise,buildTower,upgradeTower){
 const next=createExercise(b.exercise),ledger={crystals:c.crystals};
 for(const t of b.towers){
  if(!buildTower(c,next,t.type,t.x,t.y))throw Error('Invalid saved exercise formation');
  for(let level=1;level<t.level;level++)if(!upgradeTower(c,next,next.towers.at(-1).id))throw Error('Invalid saved exercise upgrade');
 }
 if(c.crystals!==ledger.crystals||next.spent!==b.spent||next.budget!==b.budget)throw Error('Exercise retry budget mismatch');
 return next;
}
// A target's actual hits occupy fixed 220ms slots after the 0.22s impact.
// Schedule from event time, so retiring an old particle cannot reset the queue.
export function visibleDamageEvents(effects){
 const groups=new Map();
 for(const f of effects.filter(f=>f.kind==='shot'&&f.hit&&f.actualDamage!==undefined)){
  const group=groups.get(f.targetId)||[];group.push(f);groups.set(f.targetId,group);
 }
 const visible=[];
 for(const group of groups.values()){
  group.sort((a,b)=>b.age-a.age);let end=-Infinity;
  for(const f of group){const start=Math.max(.22-f.age,end);end=start+.22;if(start<=1e-9&&end>1e-9)visible.push(f);}
 }
 return visible;
}
export function recordGateTrial(c,b){
 if(!b.gate||!b.result||b.gateTrialRecorded)return;
 b.gateTrialRecorded=true;
 const g=b.gate;
 (c.exercises.gateTrials??=[]).push({at:g.used?g.at:null,wet:g.wetIds.length,delay:g.delay,kills:b.kills,result:b.result,spent:b.spent,formation:b.towers.map(({type,x,y,level})=>({type,x,y,level})),budget:b.budget});
 c.exercises.gateTrials=c.exercises.gateTrials.slice(-3);
}
function validTrialFormation(t){
 if(t.budget!==undefined&&(!Number.isSafeInteger(t.budget)||t.budget<0||t.budget+t.spent!==300))return false;
 return t.formation===undefined||Array.isArray(t.formation)&&t.formation.length<=4&&t.formation.every(p=>p&&['cannon','frost','tesla'].includes(p.type)&&[216,552,744].includes(p.x)&&[264,408].includes(p.y)&&[1,2,3].includes(p.level));
}
export function validGateTrials(trials){
 return trials===undefined||Array.isArray(trials)&&trials.length<=3&&trials.every(t=>t&&validTrialFormation(t)&&['won','lost'].includes(t.result)&&Number.isInteger(t.kills)&&t.kills>=0&&t.kills<=10&&Number.isInteger(t.wet)&&t.wet>=0&&t.wet<=10&&Number.isFinite(t.delay)&&t.delay>=0&&t.delay<=52.001&&(t.at===null||Number.isFinite(t.at)&&t.at>=0)&&Number.isInteger(t.spent)&&t.spent>=0&&t.spent<=300);
}
export function gateTrialsHTML(c){
 const rows=c.exercises.gateTrials||[];if(rows.length<2)return '';
 const same=rows.every(t=>t.formation&&JSON.stringify(t.formation)===JSON.stringify(rows[0].formation)&&t.spent===rows[0].spent&&t.budget===rows[0].budget);
 const best=[...rows].sort((a,z)=>z.kills-a.kills||z.wet-a.wet)[0],when=t=>t.at===null?'不開閘':t.at.toFixed(1)+'秒開閘';
 const verdict=`${when(best)}${same?'最好':'本次攔下最多'}，${best.kills===10?'全部攔下':`攔下${best.kills}/10`}。`;
 const table='<table class="gate-trials"><caption>最近三場實測・'+(same?'同陣同級／支出'+rows[0].spent+'／餘額'+rows[0].budget:'配置依各場紀錄')+'</caption><thead><tr><th>開閘時點</th><th>進水數</th><th>攔下數</th></tr></thead><tbody>'+rows.map(t=>`<tr><th>${t.at===null?'未使用':t.at.toFixed(1)+'秒'}</th><td>${t.wet}隻</td><td>${t.kills}/10</td></tr>`).join('')+'</tbody></table>';
 const evidence=rows.map(t=>`${when(t)}：進水${t.wet}隻、攔下${t.kills}/10`).join('；');
 const cause=same?'同陣同級／支出相同':'各場配置不同';
 return `<div class="gate-comparison"><p class="gate-verdict">${verdict}</p>${table}<p class="gate-cause">本次試陣紀錄：${evidence}。${cause}；這些摘要數字無法判定不同開閘時機造成結果差異的原因。</p><details class="full-data"><summary>看完整數據</summary>${rows.map(t=>`<p>${when(t)}：逐隻累計延遲 +${t.delay.toFixed(2)}秒；${t.result==='won'?'全攔':'有敵越線'}。</p>`).join('')}</details></div>`;
}
