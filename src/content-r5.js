import {coveredRoute} from './content-r2.js';
import {TOWER_LABELS} from './campaign.js';

// The preview uses the simulation's segment/circle intersections, never an
// independent approximation of whether a tower can reach the altered route.
export function inspectRoute(towers,route,type){
 const selected=towers.filter(t=>t.type===type);
 return {type,towerIds:selected.map(t=>t.id),pieces:selected.flatMap(t=>coveredRoute(t,route))};
}
export function padIdentity(pad,index,battle,pending){
 const tower=battle.towers.find(t=>t.x===pad.x&&t.y===pad.y);
 const reserved=!tower&&!pending&&(battle.phase!=='planning'||battle.budget<70);
 return {number:index+1,type:tower?.type||null,empty:!tower,reserved,
  text:tower?`${index+1} ${TOWER_LABELS[tower.type].slice(0,1)}塔`:reserved?`${index+1} 留空`:`界碑 ${index+1}`};
}
export function crystalVisual(frame){
 const scale=1-frame.t*.75;
 return {scale,opacity:frame.arrived?0:1,x:frame.x-19*scale,y:frame.y-23*scale};
}
