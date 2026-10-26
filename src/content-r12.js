// One authored hydraulic timing puzzle, isolated from campaign currency.
export const SLUICE={id:'sluice',name:'潮閘截流',budget:300,waves:1,count:10,enemyHP:95,terrain:'quarry',
 brief:'每場只開一次，水流持續八秒。先布三塔；可等敵軍進入中段水道再開閘。',
 lesson:'觀察敵軍進入水道的時機，讓慢行發生在火塔射程內。',
 pads:[{x:552,y:264},{x:216,y:264},{x:744,y:408},{x:216,y:408}],
 route:[{x:32,y:192},{x:800,y:192},{x:800,y:480},{x:848,y:480}]};
export const GATE={left:352,right:656,y:192,duration:8,multiplier:.35};
export const freshGate=()=>({used:false,left:0,wetIds:[],delay:0,at:null,delays:{}});
export function openGate(b){
 if(b.exercise!=='sluice'||b.phase!=='active'||b.result||b.gate?.used||!b.gate)return false;
 Object.assign(b.gate,{used:true,left:GATE.duration,at:b.time});return true;
}
export const gateWet=(b,e)=>b.exercise==='sluice'&&b.gate?.left>0&&e.hp>0&&e.x>=GATE.left&&e.x<=GATE.right&&Math.abs(e.y-GATE.y)<1;
export function gateFeedback(b){const g=b.gate;if(!g?.used)return '本場沒有開閘；0 隻進水，逐隻累計延遲 +0.00 秒（剩餘行速35%・作用8秒）。下次等敵群進入中段再開閘。';return `${g.at.toFixed(1)} 秒開閘，${g.wetIds.length} 隻進水，逐隻累計延遲 +${g.delay.toFixed(2)} 秒（剩餘行速35%・作用8秒）。${!g.wetIds.length?'水流未涵蓋敵軍，下次留意入口。':b.result==='lost'?'未全攔；下次對照首漏路段。':'全隊攔下；離水只解除水域減速。'}`;}

export function validGate(b){
 if(!b||typeof b!=='object'||Array.isArray(b))return false;
 if(b.exercise!=='sluice')return b.gate===undefined;
 const g=b.gate;if(g?.legacyDelay!==undefined&&(!Number.isFinite(g.legacyDelay)||g.legacyDelay<0||g.legacyDelay>g.delay))return false;if(g?.delays!==undefined&&(!g.delays||typeof g.delays!=='object'||Array.isArray(g.delays)||Object.entries(g.delays).some(([id,r])=>!r||!g.wetIds.includes(id)||!Number.isInteger(r.ordinal)||r.ordinal<1||!Number.isFinite(r.seconds)||r.seconds<0||r.seconds>(GATE.duration+.05)*(1-GATE.multiplier)+1e-8||!Number.isFinite(r.enteredAt)||r.enteredAt<0||r.enteredAt>b.time)||Math.abs(Object.values(g.delays).reduce((n,r)=>n+r.seconds,g.legacyDelay||0)-g.delay)>.00001))return false;return !!g&&typeof g.used==='boolean'&&Number.isFinite(g.left)&&g.left>=0&&g.left<=8&&Number.isFinite(g.delay)&&g.delay>=0&&g.delay<=SLUICE.count*8*.65+.001&&Array.isArray(g.wetIds)&&g.wetIds.length<=SLUICE.count&&new Set(g.wetIds).size===g.wetIds.length&&g.wetIds.every(id=>/^u[0-9]+$/.test(id))&&(g.used?Number.isFinite(g.at)&&g.at>=0&&g.at<=b.time&&b.wave===1:g.at===null&&g.left===0&&g.delay===0&&g.wetIds.length===0);
}
