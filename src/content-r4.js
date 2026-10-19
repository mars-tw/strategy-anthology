import {coveredRoute} from './content-r2.js';
import {TOWER_TYPES,TOWER_LABELS} from './campaign.js';

export const SALVAGE_DURATION=1200;
// Presentation clock only: the once-only claim is persisted before this starts.
export function salvageFrame(elapsed,from,to,start,end){
 const t=Math.max(0,Math.min(1,elapsed/SALVAGE_DURATION));
 const control={x:start.x+24,y:Math.min(start.y,end.y)+55};
 return {elapsed,t,x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x,
  y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y,
  arrived:t===1,money:t===1?to:from};
}
export function routeConclusions(towers,route){
 return TOWER_TYPES.map(type=>{const built=towers.filter(t=>t.type===type),covers=built.some(t=>coveredRoute(t,route).length);
  return {type,name:TOWER_LABELS[type],built:built.length,covers,text:!built.length?'尚未部署':covers?'可攔截新路':'打不到新路'};});
}
export function deployedCard(type,towers,money,cost){
 const count=towers.filter(t=>t.type===type).length;
 return {count,poor:money<cost,muted:money<cost&&!count,
  status:count?`場上已有 ${count} 座`:'尚未部署',purchase:`再建需 ${cost} 結晶`};
}
