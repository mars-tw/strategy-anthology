import {RELAY_CHOICES,relayMini} from './content-r7.js';
import {BASE_ROUTE} from './content-r1.js';

const segmentPlace={
 upstream:'上游長路旁',
 gate:'城門前路旁',
 crystals:'中段轉角旁',
};

// Keep a read-only budget preview. The amount displayed is derived from the
// campaign balance and the recorded 90-crystal salvage receipt.
export function relayQuote(c,choice){
 const row=RELAY_CHOICES[choice];
 if(!row)throw new RangeError(`Unknown relay choice: ${choice}`);
 const salvage=choice==='crystals'?90:0,balance=c.crystals+salvage;
 return {choice,pad:choice==='crystals'?null:{...row.pad},balance,salvage,damage:choice==='crystals'?0:26,iceAfter:balance-70,upgradeAfter:balance-60};
}

export function relayQuoteHTML(c,choice){
 const q=relayQuote(c,choice),row=RELAY_CHOICES[choice];
 const location=choice==='crystals'?'示意塔位在中段轉角':`${segmentPlace[choice]}，免費留下 1 級火塔`;
 const balance=`${c.crystals}${q.salvage?` ＋拆取 ${q.salvage}`:''} ＝ ${q.balance}`;
 const remainder=cost=>q.balance>=cost?`剩 ${q.balance-cost}`:`還差 ${cost-q.balance}`;
 return `<div class="relay-quote" data-choice="${choice}" data-balance="${q.balance}">${relayMini(choice,BASE_ROUTE)}<h3>${row.title}</h3><p>${location}；${q.damage?`每次命中造成 ${q.damage} 點基礎傷害。`:'不留塔，拆取後自行配置。'}</p><p class="budget-equation">目前 ${balance} 枚結晶。${q.salvage?'拆取收入只在確認這案後入帳。':''}</p><p>再建冰塔花 70，${remainder(70)}；升級一座既有 1 級塔花 60，${remainder(60)}。</p><p class="fine">上游塔較早接敵；城門塔補末段；拆晶可自行配置。實際攔截結果仍要看塔位與其他火力。</p></div>`;
}

export function terrainChoiceHTML(choice,cost){
 const rows=[['barricade','堵隘口・敵軍改走北側長路'],['flood','放水・敵軍經南側濕地']];
 return `<div class="terrain-options">${rows.map(([id,label])=>`<button data-action="preview-${id}" class="terrain-choice${choice===id?' selected':''}" aria-pressed="${choice===id}">${label}${choice===id?'<small>目前選擇</small>':''}</button>`).join('')}</div><p class="terrain-cost">目前選擇：<b>${rows.find(([id])=>id===choice)?.[1]||rows[0][1]}</b>・施工花費 ${cost} 結晶</p>`;
}
