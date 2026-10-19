import {describe,it,expect} from 'vitest';
import {bodyHeight,bridgeGeometry,towerPoint,landMarch,actorLane,groundRange,visibleTowerAt,riverBanks} from '../src/presentation-r5.js';

describe('R5 scale contract and display routing',()=>{
 it.each([[320,568],[390,844],[844,390],[1032,1376],[1366,600]])('keeps miniature ratios at %ix%i',(w,h)=>{
  const person=bodyHeight(w),tower=towerPoint({x:552,y:264,type:'cannon'},w,h);
  expect(person).toBeGreaterThanOrEqual(48);
  expect(tower.h/person).toBeGreaterThanOrEqual(2.2);
  expect(tower.h/person).toBeLessThanOrEqual(2.6);
  for(const y of [195,425])expect(person/bridgeGeometry(y,w,h).deckWidth).toBeLessThanOrEqual(.45);
  expect(visibleTowerAt([{x:552,y:264,type:'cannon'}],tower.x,tower.y-tower.h*.5,w,h)?.type).toBe('cannon');
 });
 it('routes both crossing directions over native bridges and never diagonally through water',()=>{
  for(const [from,to] of [[{x:170,y:410},{x:720,y:220}],[{x:780,y:200},{x:140,y:485}]]){
   const route=landMarch(from,to);expect(route).toHaveLength(4);
   expect([195,425]).toContain(route[1].y);expect(route[1].y).toBe(route[2].y);
   expect(route[1].x<450||route[1].x>560).toBe(true);expect(route[2].x<450||route[2].x>560).toBe(true);
  }
 });
 it('preserves the native deep-water core inside varied painted banks',()=>{
  const spans=[];for(let y=0;y<=640;y+=8){const b=riverBanks(y);expect(b.left).toBeLessThanOrEqual(450);expect(b.right).toBeGreaterThanOrEqual(560);spans.push(b.right-b.left);}
  expect(Math.max(...spans)/Math.min(...spans)).toBeGreaterThan(1.2);
 });
 it('gives a pack three stable accessories and irregular footprints with different real walk phases',()=>{
  const pack=Array.from({length:8},(_,i)=>actorLane({id:'u'+i,type:'miremaw'},false));
  expect(new Set(pack.map(a=>a.variant)).size).toBe(3);
  expect(new Set(pack.map(a=>a.y)).size).toBe(5);
  expect(new Set(pack.map(a=>a.phase)).size).toBe(8);
  expect(groundRange({x:100,y:100},160,390).ry/groundRange({x:100,y:100},160,390).rx).toBeCloseTo(.32);
 });
});
