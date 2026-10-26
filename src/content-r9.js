import {receiptBalance} from './content-r10.js';
// Receipts and measured attribution; never synthesize combat results.
export function receiptHTML(c,source){
 const r=c.salvageReceipts?.find(r=>r.source===source);if(!r)return '';
 return `<div class="salvage-receipt" data-source="${source}" role="status"><strong>${source==='quarry'?'石脊火塔':'渡口冰塔'}拆晶收據</strong><span>原餘額 ${r.before} ＋退回 ${r.amount} ＝入帳後 ${r.after}</span><small>${receiptBalance(c,source)}</small></div>`;
}
export function replacementNote(a,z){
 if(!a.contributions||!z.contributions)return '舊紀錄未保留逐塔明細，請以同配置重打補齊。';
 const name=t=>`${t.inherited?'留守':''}${({cannon:'火塔',frost:'冰塔',tesla:'雷塔'})[t.type]}（${t.x>=680?(z.chapter===0?'右側':'城門'):t.x<500?(z.chapter===0?'左側':'上游'):'中段'}）`;
 const key=t=>`${t.type}:${t.x}:${t.y}:${t.inherited}`,prior=new Map(a.contributions.map(t=>[key(t),t]));
 const changes=z.contributions.map(t=>({t,delta:t.damage-(prior.get(key(t))?.damage||0)})).filter(r=>!r.t.inherited&&r.delta!==0);
 return `逐塔補位（本次−前次）：${changes.length?changes.map(({t,delta})=>`${name(t)} ${delta>0?'+':''}${delta}`).join('、'):'新建塔傷害相同'}。${a.totalDamage===z.totalDamage?'全塔總傷害相同，表示同一批敵軍的生命由不同塔分攤。':''}`;
}
