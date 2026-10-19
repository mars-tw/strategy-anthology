import {spendCredit} from './content-r6.js';
// Authored battlefield decisions. No rewards, clocks or online services.
export const BASE_ROUTE=[{x:32,y:192},{x:656,y:192},{x:656,y:480},{x:848,y:480}];
export const TERRAIN_COST=30;
export const TERRAIN_ROUTES={
 barricade:[{x:32,y:192},{x:320,y:192},{x:320,y:96},{x:752,y:96},{x:752,y:480},{x:848,y:480}],
 flood:[{x:32,y:192},{x:272,y:192},{x:272,y:384},{x:656,y:384},{x:656,y:480},{x:848,y:480}],
};
export const FLOOD_ZONE={x:272,y:384,radius:116,multiplier:.52};
// At the ford, both authored edits still cross one of the two actual bridges.
export const FORD_TERRAIN_ROUTES={
 barricade:[{x:32,y:192},{x:272,y:192},{x:272,y:96},{x:416,y:96},{x:416,y:192},{x:656,y:192},{x:656,y:480},{x:848,y:480}],
 flood:[{x:32,y:192},{x:272,y:192},{x:272,y:425},{x:656,y:425},{x:656,y:480},{x:848,y:480}],
};
export const terrainRoute=(choice,chapter)=>(chapter===2?FORD_TERRAIN_ROUTES:TERRAIN_ROUTES)[choice];
export const floodZone=b=>({...FLOOD_ZONE,y:b.chapter===2?425:FLOOD_ZONE.y});
export const EXERCISES=Object.freeze([
 {id:'turn',name:'聚印轉角',budget:300,waves:1,count:9,enemyHP:65,terrain:'pine',
  brief:'五處界碑，轉角三格可共鳴。遠哨會分走預算，留意射程。',
  lesson:'把三印壓在轉角，共鳴讓短射程也能守住。',
  pads:[{x:552,y:264},{x:600,y:264},{x:552,y:312},{x:216,y:408},{x:360,y:552}],route:BASE_ROUTE},
 {id:'levee',name:'分守長堤',budget:300,waves:1,count:8,enemyHP:60,terrain:'quarry',
  brief:'四處界碑分隔長堤，無法共鳴。冰塔先拖敵，別把火力留在遠灘。',
  lesson:'失去共鳴也能守住；冰塔放在上游，多爭取一段射擊時間。',
  pads:[{x:216,y:264},{x:456,y:264},{x:696,y:408},{x:216,y:408}],
  route:[{x:32,y:192},{x:800,y:192},{x:800,y:480},{x:848,y:480}]},
 {id:'switchback',name:'折返雙隘',budget:360,waves:1,count:12,enemyHP:78,terrain:'quarry',
  brief:'六處界碑，360 結晶可升級一次。集中共鳴或折返接力，遠哨射不到主路。',
  lesson:'折返讓同一座塔有兩次開火機會；剩下的 60 結晶也能決定勝負。',
  pads:[{x:552,y:264},{x:600,y:264},{x:552,y:312},{x:744,y:264},{x:744,y:408},{x:216,y:408}],
  route:[{x:32,y:192},{x:656,y:192},{x:656,y:384},{x:416,y:384},{x:416,y:480},{x:848,y:480}]},
 {id:'split',name:'雙岸接力',budget:300,waves:1,count:9,enemyHP:60,terrain:'pine',
  brief:'長路分成兩岸，三塔無法相鄰。冰印守上游，火雷分守兩個轉角。',lesson:'把射擊機會分給兩岸，比擠在單一轉角更穩。',
  pads:[{x:600,y:264},{x:216,y:264},{x:744,y:408},{x:216,y:504},{x:360,y:504}],
  route:[{x:32,y:192},{x:656,y:192},{x:656,y:480},{x:848,y:480}]},
 {id:'hollow',name:'空哨折道',budget:300,waves:1,count:10,enemyHP:65,terrain:'quarry',
  brief:'北折與東岸相距遠；先看各界碑射程，預算只夠三塔。',lesson:'中央看似安全卻打不到路；留空第 4 號，把火力壓在北折與東岸。',
  pads:[{x:744,y:264},{x:216,y:264},{x:696,y:408},{x:408,y:552},{x:264,y:504}],
  route:[{x:32,y:192},{x:416,y:192},{x:416,y:96},{x:800,y:96},{x:800,y:480},{x:848,y:480}]},
]);
export const exerciseFor=b=>EXERCISES.find(e=>e.id===b?.exercise);
export const battleRoute=b=>exerciseFor(b)?.route||terrainRoute(b?.terrainChoice,b?.chapter)||BASE_ROUTE;
export const battleInfo=b=>exerciseFor(b);
export const wallet=(c,b)=>b?.exercise||b?.replay?b.budget:c.crystals;
export function debit(c,b,n,label='戰前工事'){if(wallet(c,b)<n)return false;if(b.exercise||b.replay)b.budget-=n;else {c.crystals-=n;spendCredit(c,b,n,label);}b.spent+=n;return true;}
export const FIELDWORK_SPRITES={barricade:[0,0,630,887],flood:[630,0,650,887],seal:[1280,0,494,887]};
