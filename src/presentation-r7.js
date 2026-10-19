// Presentation only: preserve the 48–54px human/building scale and native paths.
export {bodyHeight,visibleTowerAt,groundRange,landMarch,project} from './presentation-r6.js';
import {bodyHeight,riverBanks,towerPoint as originalTowerPoint,project as baseProject} from './presentation-r6.js';
export function worldPoint(x,y,width,height,{northInset=0,flat=false}={}){
 const p=baseProject(x,y,width,height,flat);
 return northInset?{x:p.x,y:northInset*height+p.y*(.96-northInset)}:p;
}
export function worldCell(x,y,width,height,profile){
 let best={x:72,y:72},distance=Infinity;
 for(let gy=72;gy<=552;gy+=48)for(let gx=72;gx<=792;gx+=48){const p=worldPoint(gx,gy,width,height,profile),d=Math.hypot(p.x-x,p.y-y);if(d<distance){distance=d;best={x:gx,y:gy};}}
 return best;
}
export function towerPoint(t,width,height){
 const p=originalTowerPoint(t,width,height);
 if(t.x===360&&t.y===504)return {...p,x:width*.89,y:Math.max(p.h+8,height*.90)};
 if(t.type==='cannon'&&t.x===696&&t.y===408&&!t.inherited)return {...p,x:width*.73,y:Math.max(p.h+8,height*.62)};
 if(t.inherited&&t.x===456&&t.y===264)return {...p,x:width*.16,y:Math.max(p.h+8,Math.min(height-14,p.y))};
 if(t.x>=680&&t.x<=792&&t.y>=336){
  const h=Math.min(p.h,Math.max(48,height*.34)),i={cannon:0,frost:1,tesla:2}[t.type];
  return {...p,x:width*[.57,.87,.72][i],y:Math.min(height-14,Math.max(h+8,height*.52+(i===2?h*1.08:0))),h};
 }
 return p;
}
export function bridgeGeometry(y,width,height){
 const bank=riverBanks(y),kind=y===307?'old':y===195?'main':'military';
 const span=Math.max(bodyHeight(width)*2.6,(bank.right-bank.left+72)*width/960);
 // Use the authored, shallow ground-plane perspective, not a vertical plaza.
 const depth=span*(kind==='main'?.195:kind==='old'?.145:.15);
 return {kind,x:Math.max(8,Math.min(width-span-8,(bank.left+bank.right)/2*width/960-span/2)),y:y*height/640-depth*.55,width:span,height:depth,deckDepth:depth*.65,compressed:false};
}
export function actorLane(a,siege){
 const n=Number(String(a.id).replace(/\D/g,''))||0;
 if(a.type==='miremaw')return {x:[-7,4,13,-3,8][n%5],y:[12,-30,34][n%3]+[-4,7,-9,4,0][n%5],variant:n%3,phase:(n*.173)%1};
 const role={warrior:[20,30],archer:[-18,-16],mage:[-44,64]};
 if(siege&&a.team==='player'&&role[a.type])return {x:role[a.type][0],y:role[a.type][1],variant:0,phase:0};
 return {x:siege&&a.type==='villager'?[-20,0,20][n%3]:0,y:siege&&a.type==='villager'?[-14,5,16][n%3]:0,variant:0,phase:0};
}
