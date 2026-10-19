import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {actorScale,towerPoint,visibleTowerAt,roadWidth,riverWidth} from '../src/presentation-r2.js';
import {PADS} from '../src/engine.js';
const frames=JSON.parse(readFileSync('public/assets/r2/actor-frames.json','utf8'));
describe('R2 visible silhouettes and native map anchors',()=>{
 it('keeps every authored live pose at least 44 CSS pixels at all form factors',()=>{
  for(const [w,h]of [[300,180],[370,360],[500,240],[1028,680],[1350,500]])for(const m of Object.values(frames)){
   const scale=actorScale(m,w,h);
   for(const row of [0,1,2,3,5])for(const b of m.boxes[row])expect((b[3]-b[1])*scale).toBeGreaterThanOrEqual(43.999);
  }
 });
 it('fans three native adjacent pads into separate clickable tower bodies',()=>{
  const towers=['cannon','frost','tesla'].map((type,i)=>({type,...PADS[i]}));
  for(const [w,h]of [[300,180],[370,360],[500,240],[1028,680]]){
   const points=towers.map(t=>towerPoint(t,w,h));
   points.forEach((p,i)=>{expect(p.anchorX).toBeCloseTo(towers[i].x*w/960);expect(p.anchorY).toBeCloseTo(towers[i].y*h/640);expect(visibleTowerAt(towers,p.x,p.y-p.h*.5,w,h)).toBe(towers[i]);});
   for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
    const a=points[i],b=points[j];expect(Math.abs(a.x-b.x)>=a.h*.6||Math.abs(a.y-b.y)>=a.h*.9).toBe(true);
   }
  }
 });
 it('uses variable shoulders without changing native route or river rules',()=>{
  const widths=Array.from({length:641},(_,i)=>roadWidth(i)),rivers=Array.from({length:641},(_,i)=>riverWidth(i));
  expect(Math.max(...widths)/Math.min(...widths)).toBeGreaterThan(1.2);
  expect(Math.min(...rivers)).toBeGreaterThanOrEqual(120);expect(Math.max(...rivers)).toBeLessThanOrEqual(200);expect(Math.max(...rivers)/Math.min(...rivers)).toBeGreaterThan(1.2);
 });
});
