// Display-only miniature dimensions. Combat positions and hit timing stay native.
export const bodyHeight = width => 48 + Math.min(6, Math.max(0, (width - 430) / 110));
export function riverBanks(y) {
 const center=505+70*Math.sin(y*.014)+17*Math.sin(y*.032),radius=105+27*Math.sin(y*.024+.7);
 return {left:Math.min(450,center-radius),right:Math.max(560,center+radius)};
}
export function bridgeGeometry(y,width,height){
 const bank=riverBanks(y),deck=bodyHeight(width)/.44;
 return {x:(bank.left-72)*width/960,y:y*height/640-deck*.68,width:(bank.right-bank.left+144)*width/960,height:deck/.875,deckWidth:deck};
}
export function towerPoint(t,width,height){
 const sx=width/960,sy=height/640,h=bodyHeight(width)*2.33;
 const cluster=Math.abs(t.x-576)<=28&&Math.abs(t.y-288)<=28;
 if(!cluster)return {x:t.x*sx,y:t.y*sy,h,anchorX:t.x*sx,anchorY:t.y*sy};
 const i=t.type==='cannon'?0:t.type==='frost'?1:2;
 if(height<300)return {x:width*[.20,.50,.80][i],y:h+8+[.40,0,.40][i]*h,h,anchorX:t.x*sx,anchorY:t.y*sy};
 return {x:width*.52+[-.55,.55,0][i]*h,y:height*.43+[-.05,-.05,.92][i]*h,h,anchorX:t.x*sx,anchorY:t.y*sy};
}
export function visibleTowerAt(towers,x,y,width,height){
 return [...towers].reverse().find(t=>{const p=towerPoint(t,width,height);return Math.abs(x-p.x)<p.h*.40&&y>p.y-p.h*.94&&y<p.y+12;});
}
export function groundRange(point,radius,width){
 const rx=Math.max(40,radius*width/960);
 return {x:point.x,y:point.y+3,rx,ry:rx*.32};
}
export function landMarch(from,target){
 if((from.x<450&&target.x>560)||(from.x>560&&target.x<450)){
  const y=(from.y+target.y)/2<310?195:425;
  return [from,{x:from.x<450?410:600,y},{x:from.x<450?600:410,y},target];
 }
 return [from,target];
}
// Small lane offsets provide individual footprints without moving simulation entities.
export function actorLane(a,siege){
 const n=Number(String(a.id).replace(/\D/g,''))||0;
 if(a.type==='miremaw')return {x:[-9,0,12,-4,7][n%5],y:[-11,7,-3,13,-8][n%5],variant:n%3,phase:(n*.137)%1};
 return {x:siege&&a.type==='villager'?[-13,0,14][n%3]:0,y:siege&&a.type==='villager'?[-5,4,9][n%3]:0,variant:0,phase:0};
}
