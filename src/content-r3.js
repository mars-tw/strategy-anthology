import {battleRoute,floodZone} from './content-r1.js';

// Use displayed tower bases when supplied; retained callers can use edge rows.
export function padLabels(pads,width,height,anchors=null,blockers=[]){
 if(anchors){const placed=[],top=Math.min(84,Math.max(28,height-90)),bottom=height-46;return pads.map((pad,i)=>{const p=anchors[i],offsets=[[0,25],[0,53],[0,-24],[-58,25],[58,25],[0,81],[-58,-24],[58,-24]],choices=offsets.map(([dx,dy])=>({number:i+1,x:Math.max(29,Math.min(width-29,p.x+dx)),y:Math.max(top,Math.min(bottom,p.y+dy)),width:52,height:23,pad}));
  const free=q=>placed.every(a=>Math.abs(a.x-q.x)>=54||Math.abs(a.y-q.y)>=25)&&blockers.every(r=>!(q.x+30>r.x&&q.x-30<r.x+r.w&&q.y+11>r.y&&q.y-16<r.y+r.h));let mark=choices.find(free);
  if(!mark){const candidates=[];for(let y=top;y<=bottom;y+=5)for(let x=29;x<=width-29;x+=8)candidates.push({number:i+1,x,y,width:52,height:23,pad});mark=candidates.filter(free).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y-25)-Math.hypot(b.x-p.x,b.y-p.y-25))[0]||choices[0];}
  placed.push(mark);return mark;});}
 const columns=Math.max(1,Math.floor((width-12)/58)),rows=Math.ceil(pads.length/columns);
 return pads.map((pad,i)=>{const row=Math.floor(i/columns),column=i%columns,count=Math.min(columns,pads.length-row*columns),gap=Math.min(66,(width-12)/count);
  return {number:i+1,x:width/2+(column-(count-1)/2)*gap,y:height-58-(rows-1-row)*27,width:52,height:23,pad};});
}
export function routeProgress(b){
 const first=b.enemies[0];if(!first)return null;
 const route=battleRoute(b),zone=floodZone(b),wet=b.terrainChoice==='flood'&&Math.hypot(first.x-zone.x,first.y-zone.y)<=zone.radius;
 const speed=first.escaped?0:((first.slow>0?26:50)+b.chapter*2)*(wet?zone.multiplier:1);
 let total=0,done=0;
 for(let i=1;i<route.length;i++){const length=Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y);total+=length;if(i<=first.route)done+=length;}
 if(!first.escaped&&route[first.route])done+=Math.hypot(first.x-route[first.route].x,first.y-route[first.route].y);
 return {id:first.id,x:first.x,y:first.y,wet,speed,percent:first.escaped?100:Math.min(100,Math.round(done/total*100)),escaped:!!first.escaped,alive:first.hp>0};
}
