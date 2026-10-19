import {describe,it,expect} from 'vitest';
import {unitHeight,riverBanks,riverCenter,roundedRoute,CHAPTER_ART} from '../src/presentation-r3.js';
import {roadWidth} from '../src/presentation-r2.js';
import {ROUTE} from '../src/engine.js';
describe('R3 fixed human scale and natural terrain contracts',()=>{
 it('keeps all human jobs and factions in the same height band at every device size',()=>{
  for(const [w,h] of [[300,180],[374,408],[600,300],[1032,700],[1500,900]]){
   const hs=['warrior','archer','mage','villager','shieldBearer'].map(t=>unitHeight(t,w,h));
   expect(Math.min(...hs)).toBeGreaterThanOrEqual(48);expect(Math.max(...hs)).toBeLessThanOrEqual(60);expect(new Set(hs).size).toBe(1);
   expect(unitHeight('miremaw',w,h)/hs[0]).toBeCloseTo(1.22);
  }
 });
 it('varies the visible road width 20 to 35 percent without moving native path corners',()=>{
  const widths=Array.from({length:1500},(_,i)=>roadWidth(i));const ratio=Math.max(...widths)/Math.min(...widths)-1;
  expect(ratio).toBeGreaterThanOrEqual(.20);expect(ratio).toBeLessThanOrEqual(.35);
  const points=roundedRoute(ROUTE);expect(points[0]).toEqual(ROUTE[0]);expect(points.at(-1)).toEqual(ROUTE.at(-1));
  for(const p of points){const d=ROUTE.slice(1).map((b,i)=>{const a=ROUTE[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);});expect(Math.min(...d)).toBeLessThanOrEqual(8);}
 });
 it('makes a visibly curved variable river that always contains the actual deep-water collision core',()=>{
  const centers=[],widths=[];for(let y=0;y<=640;y++){const b=riverBanks(y);expect(b.left).toBeLessThanOrEqual(450);expect(b.right).toBeGreaterThanOrEqual(560);expect(b.right-b.left).toBeLessThan(230);centers.push(riverCenter(y));widths.push(b.right-b.left);}
  expect(Math.max(...centers)-Math.min(...centers)).toBeGreaterThan(65);expect(Math.max(...widths)/Math.min(...widths)).toBeGreaterThan(1.2);
 });
 it('assigns six chapter appearances with different geography in the opening two',()=>{expect(new Set(CHAPTER_ART).size).toBe(6);expect(CHAPTER_ART[0]).toBe('pine');expect(CHAPTER_ART[1]).toBe('ford');});
});
