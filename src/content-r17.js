import {RELAY_CHOICES,relayMini} from './content-r7.js';
import {BASE_ROUTE} from './content-r1.js';

// A read-only quote. Selection never changes the campaign or its receipts.
export function relayQuote(c,choice){
 const row=RELAY_CHOICES[choice],balance=c.crystals+(choice==='crystals'?90:0);
 return {choice,pad:choice==='crystals'?null:{...row.pad},balance,damage:choice==='crystals'?0:26,iceAfter:balance-70,upgradeAfter:balance-60};
}
export function relayQuoteHTML(c,choice){
 const q=relayQuote(c,choice),row=RELAY_CHOICES[choice];
 return `<div class="relay-quote" data-choice="${choice}" data-balance="${q.balance}">${relayMini(choice,BASE_ROUTE)}<h3>${row.title}</h3><p>${q.pad?`${row.segment}（${q.pad.x}, ${q.pad.y}）・1級火塔・每擊26，免費留守。`:'無留守塔；拆取收入90。圖中火塔是另建位置示意，需100。'}</p><p>確認後可用 <b>${q.balance} 結晶</b><br>另建冰塔70後剩 ${q.iceAfter}；${q.pad?'留守塔':'另有1級塔時'}升級60後剩 ${q.upgradeAfter}。</p><p class="fine">上游提早削血；城門保留尾段火力；拆晶可換塔種或升級。實際效果取決於布陣。</p></div>`;
}

// The gate panel rises over 0.8s; the existing painted arch stays stationary.
export function gateLift(g,time,reduced=false){return !g.used?0:reduced?1:Math.min(1,Math.max(0,(time-g.at)/.8));}

// Circle/road intersection is the effective flood interval. Displayed bank ends
// use these exact endpoints, including legacy ford routes.
export function wetRoute(route,zone){
 const pieces=[];
 for(let i=1;i<route.length;i++){
  const a=route[i-1],z=route[i],dx=z.x-a.x,dy=z.y-a.y,A=dx*dx+dy*dy;
  const B=2*((a.x-zone.x)*dx+(a.y-zone.y)*dy),C=(a.x-zone.x)**2+(a.y-zone.y)**2-zone.radius**2,D=B*B-4*A*C;
  if(!A||D<0)continue;
  const lo=Math.max(0,(-B-Math.sqrt(D))/(2*A)),hi=Math.min(1,(-B+Math.sqrt(D))/(2*A));
  if(lo>=hi)continue;
  pieces.push({segment:i,from:{x:a.x+dx*lo,y:a.y+dy*lo},to:{x:a.x+dx*hi,y:a.y+dy*hi}});
 }
 return pieces;
}
