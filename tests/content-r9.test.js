import {describe,it,expect} from 'vitest';
import {freshCampaign,CHAPTERS,chooseQuarryLegacy} from '../src/campaign.js';
import {createBattle,startDecisionReplay,buildTower,startWave,step,createExercise} from '../src/engine.js';
import {comparisonHTML,leakDescription} from '../src/content-r7.js';
import {validateSave,persist,loadSave} from '../src/save.js';
import {receiptHTML,replacementNote} from '../src/content-r9.js';
const wave=(c,b)=>{expect(startWave(b)).toBe(true);for(let n=0;n<18000&&b.phase==='active'&&!b.result;n++)step(c,b,1/60);};
describe('R9 measured receipts, same-run statistics and voluntary hints',()=>{
 it('saves a real once-only receipt with before +90 = after and rejects forged receipts',()=>{
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(c=>c.id),quarryLegacy:'pending'});c.battle=createBattle(3,c);c.battle.result='won';
  const before=c.crystals;expect(chooseQuarryLegacy(c,'crystals')).toBe(true);expect(chooseQuarryLegacy(c,'crystals')).toBe(false);expect(c.salvageReceipts).toEqual([{source:'quarry',before,amount:90,after:before+90}]);
  const m=new Map(),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};expect(persist(store,c)).toBe(true);const loaded=loadSave(store).campaign;expect(receiptHTML(loaded,'quarry')).toContain(`原餘額 ${before} ＋退回 90 ＝入帳後 ${before+90}`);expect(loaded.crystals).toBe(before+90);loaded.salvageReceipts[0].after++;expect(validateSave(loaded)).toBe(false);
 });
 for(const branch of ['upstream','gate','crystals'])it(branch+' freezes the exact sum of same-run real hits and persists it across later waves',()=>{
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(c=>c.id),quarryLegacy:branch,crystals:800});const b=createBattle(4,c);c.battle=b;
  if(branch==='gate'){buildTower(c,b,'frost',696,408);buildTower(c,b,'tesla',744,360);}else{for(const [type,x,y]of [['cannon',552,264],['frost',600,264],['tesla',552,312]])buildTower(c,b,type,x,y);}
  wave(c,b);const r=structuredClone(b.firstWaveDecision);expect(r.totalDamage).toBe(r.contributions.reduce((n,t)=>n+t.damage,0));expect(r.inheritedDamage).toBe(r.contributions.filter(t=>t.inherited).reduce((n,t)=>n+t.damage,0));expect(r.inheritedHits).toBe(r.contributions.filter(t=>t.inherited).reduce((n,t)=>n+t.hits,0));if(branch!=='crystals')expect(r.inheritedHits).toBeGreaterThan(0);
  const rawHits=Object.values(b.decisionStats.towers).filter(t=>t.inherited);expect(r.inheritedDamage).toBe(rawHits.reduce((n,t)=>n+t.damage,0));wave(c,b);expect(b.firstWaveDecision).toEqual(r);expect(validateSave(c)).toBe(true);
  const copy=structuredClone(c);copy.battle.firstWaveDecision.contributions[0].damage++;expect(validateSave(copy)).toBe(false);
 });
 it('same gate formation replay has identical nonzero inherited contribution and a separate run number',()=>{
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(c=>c.id),quarryLegacy:'gate',crystals:800});const b=createBattle(4,c);c.battle=b;for(const [t,x,y]of [['frost',696,408],['tesla',744,360]])buildTower(c,b,t,x,y);wave(c,b);const original=structuredClone(b.firstWaveDecision),r=startDecisionReplay(c,b,'gate');for(const [t,x,y]of [['frost',696,408],['tesla',744,360]])buildTower(c,r,t,x,y);wave(c,r);
  expect(r.firstWaveDecision.inheritedHits).toBe(original.inheritedHits);expect(r.firstWaveDecision.inheritedDamage).toBe(original.inheritedDamage);expect(r.firstWaveDecision.inheritedHits).toBeGreaterThan(0);expect(r.firstWaveDecision.runNumber).toBe(original.runNumber+1);expect(comparisonHTML(c,r)).toContain('新建塔傷害相同');
 });
 it('explains an unchanged total with independently measured replacement tower damage',()=>{
  const a={totalDamage:100,contributions:[{type:'cannon',x:500,y:200,inherited:true,damage:50},{type:'frost',x:700,y:400,inherited:false,damage:50}]},z={totalDamage:100,contributions:[{type:'cannon',x:500,y:200,inherited:true,damage:20},{type:'frost',x:700,y:400,inherited:false,damage:80}]};expect(replacementNote(a,z)).toContain('冰塔（城門） +30');expect(replacementNote(a,z)).toContain('同一批敵軍的生命由不同塔分攤');
 });
 it('never reveals the hollow solution before the optional hint opens',()=>{
  const b=createExercise('hollow');b.firstLeak={id:'u4',ordinal:3,type:'miremaw',segment:5,hp:65};expect(leakDescription(b)).toContain('第 3 隻甲犬');expect(leakDescription(b)).not.toMatch(/打不到|少了一座|第 4 號|外沿|中央遠哨/);
 });
});
