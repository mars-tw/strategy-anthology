// Display only. Simulation, timing, costs, native paths and collision are unchanged.
export {bodyHeight,towerPoint,visibleTowerAt,groundRange,landMarch} from './presentation-r5.js';
import {bodyHeight} from './presentation-r5.js';
export function riverBanks(y){const center=505+78*Math.sin(y*.014)+20*Math.sin(y*.032),radius=138+38*Math.sin(y*.024+.7);return {left:Math.min(450,center-radius),right:Math.max(560,center+radius)};}
export function bridgeGeometry(y,width,height){
 const bank=riverBanks(y),deck=bodyHeight(width)/.44;
 const span=Math.max((bank.right-bank.left+280)*width/960,Math.min(width*.78,deck*2.6));
 const visualHeight=Math.min(deck/.70,height*.43);
 const center=(bank.left+bank.right)/2*width/960;
 return {x:Math.max(2,Math.min(width-span-2,center-span/2)),y:y*height/640-visualHeight*.63,width:span,height:visualHeight,deckWidth:visualHeight*.70,bodyToDeck:bodyHeight(width)/(visualHeight*.70),compressed:visualHeight<deck/.70};
}
export function project(x,y,width,height,siege){
 const bend=siege?0:-90*Math.sin(Math.max(0,Math.min(1,(x-32)/624))*Math.PI*2)*Math.max(0,1-Math.abs(y-192)/80);
 return {x:x*width/960,y:(y+bend)*height/640};
}
export function actorLane(a,siege){
 const n=Number(String(a.id).replace(/\D/g,''))||0;
 if(a.type==='miremaw')return {x:[-8,3,10,-2,5][n%5],y:[-10,5,-3,12,-6][n%5],variant:n%3,phase:(n*.137)%1};
 return {x:siege&&a.type==='villager'?[-20,0,20][n%3]:0,y:siege&&a.type==='villager'?[-14,5,16][n%3]:0,variant:0,phase:0};
}
