// Display-only geometry. Native route, deep water, range and combat stay in engine.
export {unitHeight} from './presentation-r3.js';
export function riverBanks(y){
 const center=505+65*Math.sin(y*.0095)+20*Math.sin(y*.021),radius=115+25*Math.sin(y*.018);
 return {left:Math.min(450,center-radius),right:Math.max(560,center+radius)};
}
export function groundRange(point,radius,width){
 const rx=Math.max(40,radius*width/960);
 return {x:point.x,y:point.y+3,rx,ry:rx*.40};
}
export function roundedRoute(route){
 const ps=[route[0]],corner=64;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],z=route[i+1],len=Math.hypot(b.x-a.x,b.y-a.y);
  const end=z?{x:b.x-(b.x-a.x)/len*corner,y:b.y-(b.y-a.y)/len*corner}:b,from=ps.at(-1),steps=Math.max(1,Math.ceil(Math.hypot(end.x-from.x,end.y-from.y)/6));
  for(let j=1;j<=steps;j++)ps.push({x:from.x+(end.x-from.x)*j/steps,y:from.y+(end.y-from.y)*j/steps});
  if(z){const l=Math.hypot(z.x-b.x,z.y-b.y),out={x:b.x+(z.x-b.x)/l*corner,y:b.y+(z.y-b.y)/l*corner};for(let j=1;j<=24;j++){const t=j/24,u=1-t;ps.push({x:u*u*end.x+2*u*t*b.x+t*t*out.x,y:u*u*end.y+2*u*t*b.y+t*t*out.y});}}
 }return ps;
}
