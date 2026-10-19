// Rendering geometry only; the engine owns movement, ranges and collisions.
export function unitHeight(type,width,height){
 const human=48+Math.min(12,Math.max(0,Math.min(width/960,height/640)*12));
 return human*({miremaw:1.22,ashwing:1.25,rootback:1.32}[type]||1);
}
export function riverCenter(y){return 505+36*Math.sin(y*.010)+12*Math.sin(y*.019);}
export function riverRadius(y){return 82+16*Math.sin(y*.014);}
export function riverBanks(y){const c=riverCenter(y),r=riverRadius(y);return {left:Math.min(450,c-r),right:Math.max(560,c+r)};}
export const CHAPTER_ART=['pine','ford','ford-watch','quarry','quarry-watch','citadel'];
export function roundedRoute(route){
 const points=[route[0]],corner=28;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],z=route[i+1],len=Math.hypot(b.x-a.x,b.y-a.y);
  const end=z?{x:b.x-(b.x-a.x)/len*corner,y:b.y-(b.y-a.y)/len*corner}:b;
  const from=points.at(-1),steps=Math.max(1,Math.ceil(Math.hypot(end.x-from.x,end.y-from.y)/10));
  for(let j=1;j<=steps;j++)points.push({x:from.x+(end.x-from.x)*j/steps,y:from.y+(end.y-from.y)*j/steps});
  if(z){const zl=Math.hypot(z.x-b.x,z.y-b.y),out={x:b.x+(z.x-b.x)/zl*corner,y:b.y+(z.y-b.y)/zl*corner};for(let j=1;j<=10;j++){const t=j/10,u=1-t;points.push({x:u*u*end.x+2*u*t*b.x+t*t*out.x,y:u*u*end.y+2*u*t*b.y+t*t*out.y});}}
 }
 return points;
}
