// Display coordinates only. Budgets, native tower cells, routes and hit timing stay intact.
const interpolate=(n,stops)=>{let i=1;while(i<stops.length-1&&n>stops[i][0])i++;const a=stops[i-1],z=stops[i];return a[1]+(z[1]-a[1])*(n-a[0])/(z[0]-a[0]);};
export function exerciseGround(x,y,w,h){
 const px=interpolate(x,[[0,.02],[216,.13],[360,.30],[408,.39],[552,.53],[600,.72],[696,.83],[744,.91],[960,.98]]);
 if(h<250){const py=interpolate(y,[[0,0],[96,.04],[192,.14],[264,.30],[312,.76],[384,.80],[408,.84],[480,.90],[504,.94],[552,.98],[640,1]]);const top=Math.min(90,h*.4),span=Math.max(30,h-top-40);
  const upper=Math.min(w*.095,Math.sqrt(Math.max(0,40**2-(span*.46)**2))),lower=Math.sqrt(Math.max(0,40**2-(span*.54)**2));
  const shift=y<=264?0:y<=312?upper*(y-264)/48:y<=408?upper+(lower-upper)*(y-312)/96:lower,dir=Math.max(-1,Math.min(1,(.78-px)/.08));
  return {x:px*w+shift*dir,y:top+py*span};}
 const py=interpolate(y,[[0,0],[96,.08],[192,.25],[264,.47],[312,.72],[384,.77],[408,.82],[480,.89],[504,.92],[552,.98],[640,1]]);
 return {x:px*w,y:Math.min(90,h*.22)+py*(h-Math.min(90,h*.22)-45)};
}
export function exerciseTower(p,w,h){const q=exerciseGround(p.x,p.y,w,h);return {...q,anchorX:q.x,anchorY:q.y,h:Math.min(76,Math.max(44,(h-90)*.20))};}
export const overlapArea=(a,z)=>Math.max(0,Math.min(a.x+a.w,z.x+z.w)-Math.max(a.x,z.x))*Math.max(0,Math.min(a.y+a.h,z.y+z.h)-Math.max(a.y,z.y));
const offsets=[];for(let y=-160;y<=160;y+=8)for(let x=-128;x<=128;x+=8)offsets.push({x,y,d:Math.hypot(x,y*1.4)});offsets.sort((a,z)=>a.d-z.d);
// Reserve actual silhouettes, including banners. Screen-space packing never changes simulation.
export function clearBody(point,width,height,w,h,towers,others){
 const box=(x,y)=>({x:x-width/2,y:y-height,w:width,h:height});
 const blocked=(x,y)=>towers.some(t=>overlapArea(box(x,y),t)>0)||others.some(u=>overlapArea(box(x,y),u)>Math.min(width*height,u.w*u.h)*.22);
 for(const d of offsets){const x=Math.max(width/2+3,Math.min(w-width/2-3,point.x+d.x)),y=Math.max(height+46,Math.min(h-42,point.y+d.y));if(!blocked(x,y))return {x,y};}
 return {...point};
}
export function receiptBalance(c,source){const r=c.salvageReceipts?.find(r=>r.source===source);return r?`一次入帳・目前餘額 ${c.crystals}；重載不重領`:'';}
