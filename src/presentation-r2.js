// Pure presentation math. World coordinates, combat ranges and saved data stay native.
export function actorScale(meta,width,height){
 // Legacy callers retain the smallest live-pose floor. R3 renderer uses the
 // explicit per-pose scale below, rather than atlas-cell size as body size.
 return 44/meta.minimumLiveHeight;
}
export function towerPoint(t,width,height){
 const sx=width/960,sy=height/640;
 // Adjacent grid cells need a readable fan on a miniature map. Fine anchor
 // lines connect each display pedestal to its exact game-space footprint.
 const cluster=Math.abs(t.x-576)<=28&&Math.abs(t.y-288)<=28;
 const h=Math.max(64,Math.min(100,width*.12,height*.25));
 if(!cluster)return {x:t.x*sx,y:t.y*sy,h,anchorX:t.x*sx,anchorY:t.y*sy};
 const i=t.type==='cannon'?0:t.type==='frost'?1:2;
 return {x:568*sx+[-.66,.66,0][i]*h,y:288*sy+[-.05,-.05,.92][i]*h,h,anchorX:t.x*sx,anchorY:t.y*sy};
}
export function visibleTowerAt(towers,x,y,width,height){
 return [...towers].reverse().find(t=>{const p=towerPoint(t,width,height);return Math.abs(x-p.x)<p.h*.42&&y>p.y-p.h&&y<p.y+12;});
}
export function roadWidth(t){return 60+8*Math.sin(t*.019);}
export function riverWidth(y){return 160+40*Math.sin(y*.012);}
