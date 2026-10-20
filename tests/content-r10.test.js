import {describe,it,expect} from 'vitest';
import {exerciseGround,exerciseTower,clearBody,overlapArea,receiptBalance} from '../src/content-r10.js';
import {EXERCISES} from '../src/content-r1.js';
import {freshCampaign,CHAPTERS,chooseQuarryLegacy} from '../src/campaign.js';
import {createBattle,buildTower,createExercise,startWave,step,upgradeTower} from '../src/engine.js';
import {persist,loadSave} from '../src/save.js';
import {receiptHTML} from '../src/content-r9.js';
describe('R10 map truth and wallet receipts',()=>{
 it('receipt keeps historical arithmetic and reads live wallet after purchases and reload',()=>{
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(x=>x.id),quarryLegacy:'pending',crystals:390});c.battle=createBattle(3,c);c.battle.result='won';
  expect(chooseQuarryLegacy(c,'crystals')).toBe(true);c.battle=createBattle(4,c);
  for(const [t,x,y]of [['cannon',552,264],['frost',600,264],['tesla',552,312]])expect(buildTower(c,c.battle,t,x,y)).toBe(true);
  expect(c.crystals).toBe(180);expect(receiptBalance(c,'quarry')).toContain('目前餘額 180');expect(receiptHTML(c,'quarry')).toContain('原餘額 390 ＋退回 90 ＝入帳後 480');expect(receiptHTML(c,'quarry')).toContain('目前餘額 180');
  const m=new Map(),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};expect(persist(store,c)).toBe(true);const loaded=loadSave(store).campaign;expect(loaded.crystals).toBe(180);expect(receiptBalance(loaded,'quarry')).toBe(receiptBalance(c,'quarry'));expect(chooseQuarryLegacy(loaded,'crystals')).toBe(false);
 });
 for(const e of EXERCISES)it(e.id+' visible towers occupy their own projected map cells',()=>{
  for(const [w,h]of [[406,350],[414,580],[296,260],[1032,800]]){
   const pads=e.pads.map(p=>exerciseTower(p,w,h));
   for(const [i,p]of pads.entries()){expect(p.x).toBe(exerciseGround(e.pads[i].x,e.pads[i].y,w,h).x);expect(p.y).toBe(p.anchorY);expect(p.x-p.h*.4).toBeGreaterThan(0);expect(p.x+p.h*.4).toBeLessThan(w);}
   for(let i=0;i<pads.length;i++)for(let j=i+1;j<pads.length;j++)expect(Math.hypot(pads[i].x-pads[j].x,pads[i].y-pads[j].y)).toBeGreaterThan(30);
  }
 });
 it('packed silhouettes avoid towers and keep individual enemy bodies apart',()=>{
  const tower={x:120,y:100,w:60,h:100},placed=[];
  for(let i=0;i<7;i++){const p=clearBody({x:150,y:180},70,48,414,580,[tower],placed),b={x:p.x-35,y:p.y-48,w:70,h:48};expect(overlapArea(b,tower)).toBe(0);for(const z of placed)expect(overlapArea(b,z)).toBeLessThanOrEqual(70*48*.22);placed.push(b);}
 });
 for(const e of EXERCISES)it(e.id+' unchanged budget still finishes and persists',()=>{
  const c=freshCampaign(),b=createExercise(e.id);c.exercises.battle=b;for(const [i,type]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,type,e.pads[i].x,e.pads[i].y)).toBe(true);
  // Existing switchback requires its original one upgrade; other exercises spend exactly300.
  if(e.id==='switchback')expect(upgradeTower(c,b,b.towers.find(t=>t.type==='tesla').id)).toBe(true);
  expect(startWave(b)).toBe(true);for(let i=0;i<18000&&!b.result;i++)step(c,b,1/60);expect(b.result).toBe('won');expect(b.budget).toBe(0);
  const m=new Map(),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};expect(persist(store,c)).toBe(true);expect(loadSave(store).campaign.exercises.battle.result).toBe('won');
 });
});
