import {exerciseSnapshotTower} from '../src/content-r10.js';
import {nearbyLabels} from '../src/content-r14.js';
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {freshCampaign} from '../src/campaign.js';
import {createExercise,buildTower,startWave,step,animationFrame} from '../src/engine.js';
import {SLUICE,openGate,gateWet} from '../src/content-r12.js';
import {exerciseGround,exerciseTower,overlapArea} from '../src/content-r10.js';
import {projectedRoute,queueOnRoad} from '../src/content-r11.js';
import {actorLane} from '../src/presentation-r7.js';

const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const walk=json('../public/assets/r7/hound-frames.json'),poses=json('../public/assets/r5/actor-frames.json').hound;

function attainedGate(seconds){
 const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;
 for(const [i,type]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,type,SLUICE.pads[i].x,SLUICE.pads[i].y)).toBe(true);
 expect(startWave(b)).toBe(true);for(let i=0;i<1079;i++)step(c,b,1/60);expect(openGate(b)).toBe(true);
 for(let i=0;i<Math.round(seconds*60);i++)step(c,b,1/60);
 return b;
}
function visibleBodies(b,profile,w=302,h=223){
 const path=projectedRoute(SLUICE.route,(x,y)=>exerciseGround(x,y,w,h,profile));
 const blocks=b.towers.map(t=>{const p=exerciseTower(t,w,h,profile);return {x:p.x-p.h*.4,y:p.y-p.h,w:p.h*.8,h:p.h};});
 const progress=a=>-SLUICE.route.slice(1,(a.route||0)+1).reduce((sum,p,i)=>sum+Math.hypot(p.x-SLUICE.route[i].x,p.y-SLUICE.route[i].y),0)-Math.hypot(a.x-SLUICE.route[Math.min(a.route||0,SLUICE.route.length-1)].x,a.y-SLUICE.route[Math.min(a.route||0,SLUICE.route.length-1)].y);
 const actors=[...b.enemies].sort((a,z)=>Number(gateWet(b,z))-Number(gateWet(b,a))||progress(a)-progress(z)),occupied=[],visible=[];
 for(const a of actors){
  const lane=actorLane(a,false),f=animationFrame({...a,anim:a.anim+(['walk','idle'].includes(a.state)?lane.phase:0)}),isWalk=f.state==='walk',m=isWalk?walk:poses,row=isWalk?lane.variant:f.row,box=m.boxes[row][f.frame];
  const neutral=isWalk?Math.max(m.neutralHeights[lane.variant],Math.max(...m.boxes[row].map(b=>b[3]-b[1]))/1.12):(m.neutralHeight||m.minimumLiveHeight),scale=44/neutral,width=(box[2]-box[0])*scale,height=(box[3]-box[1])*scale;
  const q=queueOnRoad(exerciseGround(a.x,a.y,w,h,profile),width,height,w,h,path,blocks,occupied,44,false,true);
  if(!q)continue;
  occupied.push({x:q.x-width/2,y:q.y-height,w:width,h:height});
  if(a.hp>0)visible.push({id:a.id,wet:gateWet(b,a),x:q.x,y:q.y,width,height});
 }
 return visible;
}
for(const seconds of [1.1,2.1])it(`keeps three real bodies and at least two flowing-water enemies at ${seconds}s on the 320px phone`,()=>{
 const b=attainedGate(seconds),before=structuredClone(b),prior=visibleBodies(b,null),current=visibleBodies(b,'sluice');
 expect(b.gate.left).toBeGreaterThan(0);expect(b.enemies.filter(e=>gateWet(b,e)).length).toBeGreaterThanOrEqual(3);
 expect(prior.length).toBeLessThan(3);expect(current.length).toBeGreaterThanOrEqual(3);expect(current.filter(e=>e.wet).length).toBeGreaterThanOrEqual(2);
 expect(b).toEqual(before);expect(new Set(current.map(e=>e.id)).size).toBe(current.length);
});
it('reserves compact road clearance with unchanged tower size and matching displayed anchors',()=>{
 for(const p of SLUICE.pads.filter(p=>p.y===264)){
  const old=exerciseTower(p,302,223),current=exerciseTower(p,302,223,'sluice'),road=exerciseGround(p.x,192,302,223);
  expect(current.h).toBe(old.h);expect(current.x).toBe(old.x);expect(current.anchorX).toBe(current.x);expect(current.anchorY).toBe(current.y);
  expect(current.y-current.h).toBeGreaterThanOrEqual(road.y+8-1e-8);
 }
});
it('retains every other exercise and tall-view tower layout exactly',()=>{
 for(const [w,h,id]of [[302,223,'turn'],[302,223,'levee'],[414,400,'sluice'],[700,500,'sluice']])for(const p of SLUICE.pads)expect(exerciseTower(p,w,h,id)).toEqual(exerciseTower(p,w,h));
});

it('keeps actual surviving enemies visible after the ended-state receipt shortens the phone field to 191px',()=>{
 const b=attainedGate(8.1),before=structuredClone(b);expect(b.gate.left).toBe(0);
 expect(b.enemies.filter(e=>e.hp>0).length).toBeGreaterThan(0);
 expect(visibleBodies(b,'sluice',302,191).length).toBeGreaterThan(0);
 expect(b).toEqual(before);
});

it('keeps all compact result labels near real affordable towers without hiding silhouettes',()=>{
 const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;
 for(const [i,type]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,type,SLUICE.pads[i].x,SLUICE.pads[i].y)).toBe(true);
 const before=structuredClone(b),rectHit=(a,z)=>a.x<z.x+z.w&&a.x+a.w>z.x&&a.y<z.y+z.h&&a.y+a.h>z.y;
 for(const w of [240,302,382,414,501,670,1000])for(const h of [84,90,96,100,110,120,140,160,191,223,300]){
  const anchors=SLUICE.pads.map(p=>exerciseSnapshotTower(p,w,h,'sluice'));
  const bodies=b.towers.map(t=>exerciseSnapshotTower(t,w,h,'sluice')).map(t=>({x:t.x-t.h*.4,y:t.y-t.h,w:t.h*.8,h:t.h}));
  const legend={x:8,y:4,w:w-16,h:22},labels=nearbyLabels(anchors,w,h,[...bodies,legend]);
  expect(labels.length).toBe(SLUICE.pads.length);
  for(const r of labels){expect(Math.hypot(r.x+r.w/2-r.anchorX,r.y+r.h/2-r.anchorY)).toBeLessThanOrEqual(24.01);expect(r.h).toBe(18);expect(bodies.some(t=>rectHit(r,t))).toBe(false);}
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)expect(rectHit(labels[i],labels[j])).toBe(false);
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++)expect(rectHit(bodies[i],bodies[j])).toBe(false);
  if(labels.some(r=>r.compact))expect(bodies.some(t=>rectHit(t,legend))).toBe(false);
 }
 expect(b).toEqual(before);
});
it('retains all active tower projections and unrelated snapshots',()=>{
 for(const [w,h,id]of [[302,223,'turn'],[302,223,'levee'],[414,400,'sluice'],[700,500,'sluice']])for(const p of SLUICE.pads)expect(exerciseSnapshotTower(p,w,h,id)).toEqual(exerciseTower(p,w,h,id));
});
