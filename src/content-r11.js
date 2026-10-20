import {overlapArea} from './content-r10.js';

// Labels keep their native pad identity, but follow the actual map's left/right order.
export function orderedPadLabels(pads,anchors,w,h){
 const result=[];
 for(const indices of [pads.map((_,i)=>i).filter(i=>i<3),pads.map((_,i)=>i).filter(i=>i>=3)]){
  indices.sort((a,b)=>anchors[a].x-anchors[b].x||anchors[a].y-anchors[b].y);
  indices.forEach((i,rank)=>result.push({number:i+1,x:w*(rank+.5)/indices.length,y:i<3?23:h-17,width:64,height:23,pad:pads[i]}));
 }
 return result.sort((a,b)=>a.number-b.number);
}

// Sample the same projected route that is painted. Packing moves BACK along it,
// never sideways onto cliffs/grass. Combat coordinates and timing remain native.
export function projectedRoute(route,project){
 const points=[];let distance=0;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],z=route[i],length=Math.hypot(z.x-a.x,z.y-a.y),steps=Math.ceil(length/4);
  for(let j=i===1?0:1;j<=steps;j++){
   const t=j/steps,nativeX=a.x+(z.x-a.x)*t,nativeY=a.y+(z.y-a.y)*t,p=project(nativeX,nativeY),prior=points.at(-1);
   if(prior)distance+=Math.hypot(p.x-prior.x,p.y-prior.y);
   points.push({...p,nativeX,nativeY,distance});
  }
 }
 return points;
}
export function queueOnRoad(point,width,height,w,h,path,towers,others,top=44){
 let nearest=0,best=Infinity;
 for(let i=0;i<path.length;i++){const d=Math.hypot(path[i].x-point.x,path[i].y-point.y);if(d<best){best=d;nearest=i;}}
 for(let i=nearest;i>=0;i--){
  const p=path[i],box={x:p.x-width/2,y:p.y-height,w:width,h:height};
  if(box.x<3||box.x+width>w-3||box.y<top||p.y>h-42)continue;
  if(towers.some(t=>overlapArea(box,t)>t.w*t.h*.18))continue;
  if(others.some(o=>overlapArea(box,o)>Math.min(width*height,o.w*o.h)*.44||(Math.abs(p.y-o.y-o.h)<=Math.min(height,o.h)*.25&&Math.max(0,Math.min(box.x+width,o.x+o.w)-Math.max(box.x,o.x))>Math.min(width,o.w)*.5)))continue;
  return {...p,queued:Math.hypot(p.x-point.x,p.y-point.y)>.1};
 }
 return null; // Waiting at the route entrance, outside the visible battlefield.
}
export function insetRange(ellipse,w,h){
 const rx=Math.max(1,Math.min(ellipse.rx,ellipse.x-3,w-ellipse.x-3,(ellipse.y-3)/.32,(h-ellipse.y-3)/.32));
 return {...ellipse,rx,ry:rx*.32,schematic:true};
}
