import {describe,it,expect} from 'vitest';
import {orderedPadLabels,projectedRoute,queueOnRoad,insetRange} from '../src/content-r11.js';
import {exerciseTower,overlapArea} from '../src/content-r10.js';
import {EXERCISES} from '../src/content-r1.js';
import {comparisonHTML} from '../src/content-r7.js';
import {replacementNote} from '../src/content-r9.js';
import {freshCampaign} from '../src/campaign.js';
import {createBattle,changeTerrain,buildTower,startWave,step} from '../src/engine.js';
describe('R11 review regressions',()=>{
 for(const e of EXERCISES)it(e.id+' retains separate bases in short phone results',()=>{
  for(const [w,h]of [[296,150],[302,167],[302,186],[302,204.03125],[501,233]]){
   const bases=e.pads.map(p=>exerciseTower(p,w,h));
   for(let i=0;i<bases.length;i++)for(let j=i+1;j<bases.length;j++)expect(Math.hypot(bases[i].x-bases[j].x,bases[i].y-bases[j].y)).toBeGreaterThanOrEqual(36);
  }
 });
 for(const e of EXERCISES)it(e.id+' labels follow actual horizontal pad order in both bands',()=>{
  for(const [w,h]of [[296,180],[414,360],[1032,800]]){
   const bases=e.pads.map(p=>exerciseTower(p,w,h)),labels=orderedPadLabels(e.pads,bases,w,h);
   for(const upper of [true,false]){
    const row=labels.filter(l=>(l.number<=3)===upper).sort((a,b)=>a.x-b.x);
    expect(row.map(l=>l.number)).toEqual(e.pads.map((_,i)=>i).filter(i=>(i<3)===upper).sort((a,b)=>bases[a].x-bases[b].x||bases[a].y-bases[b].y).map(i=>i+1));
   }
   if(e.id==='hollow')expect(labels.find(l=>l.number===5).x).toBeLessThan(labels.find(l=>l.number===4).x);
   if(e.id==='switchback')expect(labels.find(l=>l.number===6).x).toBeLessThan(labels.find(l=>l.number===4).x);
  }
 });
 it('dense queue retreats on the path and waits outside it instead of scattering',()=>{
  const path=projectedRoute([{x:0,y:100},{x:400,y:100},{x:400,y:300}],(x,y)=>({x,y})),others=[];
  for(let i=0;i<12;i++){
   const p=queueOnRoad({x:400,y:200},64,44,430,360,path,[],others);
   if(!p)continue;
   expect(Math.min(...path.map(q=>Math.hypot(q.x-p.x,q.y-p.y)))).toBe(0);
   const box={x:p.x-32,y:p.y-44,w:64,h:44};expect(box.x).toBeGreaterThanOrEqual(3);expect(box.x+box.w).toBeLessThanOrEqual(427);
   for(const o of others)expect(overlapArea(box,o)).toBeLessThanOrEqual(64*44*.44);others.push(box);
  }
  expect(others.length).toBeGreaterThan(5);
 });
 it('selected range stays complete and centered at the tower foot',()=>{
  for(const x of [20,100,400]){const q=insetRange({x,y:200,rx:75,ry:24},414,360);expect(q.x).toBe(x);expect(q.x-q.rx).toBeGreaterThanOrEqual(3);expect(q.x+q.rx).toBeLessThanOrEqual(411);}
 });
 it('water delay agrees with actual submerged simulation frames to within one frame',()=>{
  const c=freshCampaign(),b=createBattle(0,c);c.battle=b;
  expect(changeTerrain(c,b,'flood')).toBe(true);
  expect(buildTower(c,b,'cannon',120,552)).toBe(true);expect(startWave(b)).toBe(true);
  let frames=0,enemyId;
  for(let i=0;i<3000;i++){
   const e=b.enemies.find(e=>enemyId?e.id===enemyId:e.hp>0);
   if(e&&!enemyId)enemyId=e.id;
   const wet=e?.hp>0&&Math.hypot(e.x-272,e.y-384)<=116;
   const before=e?.waterDelay||0;step(c,b,1/60);
   if(wet){frames++;expect(Math.abs((e.waterDelay-before)-(1/60)*.48)).toBeLessThan(1e-8);expect(Math.abs(Number(e.waterDelay.toFixed(2))-frames/60*.48)).toBeLessThan(1/60);}
   if(frames>150)break;
  }
  expect(frames).toBeGreaterThan(150);
 });
 it('identical comparison retains real numeric rows with an explicit conclusion',()=>{
  const r={chapter:0,scope:'chapter-first-wave',totalHits:12,totalDamage:406,kills:7,hp:100,spent:200,branch:'none',terrain:'none',formation:[],contributions:[],inheritedHits:0};
  const html=comparisonHTML({decisionRecords:[r,{...r,runNumber:2}]},{chapter:0});
  expect(html).toContain('兩場結果相同');expect(html).toContain('<td>406</td>');expect(html).toContain('<td>100</td>');expect(html).not.toContain('<tbody></tbody>');
 });
 it('cross-terrain review never subtracts different time quantities or reuses relay place names',()=>{
  const r={chapter:0,scope:'chapter-first-wave',totalHits:12,totalDamage:406,kills:7,hp:100,spent:200,branch:'none',terrain:'flood',formation:[],contributions:[],inheritedHits:0,waterDelay:29.7,detourSeconds:0};
  const z={...r,terrain:'barricade',detourSeconds:86,waterDelay:0};
  expect(comparisonHTML({decisionRecords:[r,z]},{chapter:0})).not.toContain('涉水新增延遲差');
  expect(replacementNote({...r,contributions:[{type:'cannon',x:744,y:408,damage:20}]},{...z,contributions:[{type:'cannon',x:744,y:408,damage:50}]})).toContain('右側');
 });
});
