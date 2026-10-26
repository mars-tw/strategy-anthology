import {it,expect} from 'vitest';
import {freshCampaign,CHAPTERS} from '../src/campaign.js';
import {createBattle,startDecisionReplay,buildTower,upgradeTower,startWave,step,PADS} from '../src/engine.js';
import {validateSave,persist,loadSave} from '../src/save.js';
it('R15 real branch full combat receipts',()=>{
 const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(ch=>ch.id),quarryLegacy:'upstream',crystals:390});const source=createBattle(4,c);c.battle=source;const rows=[];
 for(const branch of ['upstream','gate','crystals']){
 const b=startDecisionReplay(c,source,branch,'none');
 for(const [i,t]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,t,PADS[i].x,PADS[i].y)).toBe(true);
 if(branch==='crystals'){expect(buildTower(c,b,'frost',744,408)).toBe(true);expect(upgradeTower(c,b,b.towers.at(-1).id)).toBe(true);}
 for(let wave=1;wave<=4&&!b.result;wave++){expect(startWave(b)).toBe(true);for(let n=0;n<20000&&b.phase==='active'&&!b.result;n++)step(c,b,1/60);}
 rows.push({...b.fullRun,window20:b.firstWaveDecision.window20});expect(b.wave).toBe(4);expect(validateSave(c)).toBe(true);expect(b.fullRun.waveResults.length).toBe(4);
 }
 expect(new Set(rows.map(r=>r.window20.damage)).size).toBeGreaterThan(1);expect(rows[1].inheritedDamage).toBeGreaterThan(0);expect(rows[2].spent).toBe(430);expect(rows[2].balance).toBe(50);expect(new Set(rows.map(r=>JSON.stringify([r.hp,r.time,r.balance,r.inheritedDamage]))).size).toBe(3);
});

import {gateTimingHint,threeBranchHTML} from '../src/content-r14.js';
import {validFullRun,gateDelayHTML} from '../src/content-r15.js';
import {createExercise} from '../src/engine.js';
import {openGate,SLUICE} from '../src/content-r12.js';
import {retryFormation,recordGateTrial} from '../src/content-r13.js';
it('R15 gate clock changes relative to the actual last timing and reports actual release difference',()=>{
 const c=freshCampaign(),b=createExercise('sluice');c.exercises.gateTrials=[{at:18,kills:10}];
 b.time=10;expect(gateTimingHint(c,b)).toContain('再過8.0秒');b.time=21;expect(gateTimingHint(c,b)).toContain('已過上局時刻3.0秒');b.phase='active';openGate(b);b.time=24;expect(gateTimingHint(c,b)).toContain('本局24.0秒');expect(gateTimingHint(c,b)).toContain('晚3.0秒開閘');
});
it('R15 records every hydraulic delay and validates their exact sum across reload',()=>{
 const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;
 for(const [i,t]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,t,SLUICE.pads[i].x,SLUICE.pads[i].y)).toBe(true);
 startWave(b);while(b.time<18)step(c,b,1/60);openGate(b);while(b.gate.left>0)step(c,b,1/60);
 const rows=Object.values(b.gate.delays);expect(rows.length).toBe(b.gate.wetIds.length);expect(rows.reduce((n,r)=>n+r.seconds,0)).toBeCloseTo(b.gate.delay,9);expect(gateDelayHTML(b)).toContain(rows.sort((a,z)=>z.seconds-a.seconds)[0].seconds.toFixed(2));
 const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};expect(persist(storage,c)).toBe(true);expect(loadSave(storage).campaign.exercises.battle.gate).toEqual(b.gate);
 const bad=structuredClone(c);Object.values(bad.exercises.battle.gate.delays)[0].seconds+=.1;expect(validateSave(bad)).toBe(false);
 while(!b.result)step(c,b,1/60);recordGateTrial(c,b);const next=retryFormation(c,b,createExercise,buildTower,upgradeTower);expect(next.gate.delays).toEqual({});
});
it('R15 does not fabricate full four-wave statistics for a legacy mid-chapter save',()=>{
 const c=freshCampaign(),b=createBattle(0,c);c.battle=b;buildTower(c,b,'cannon',552,264);b.wave=1; // emulate an old completed first wave without its receipt
 startWave(b);for(let n=0;n<20000&&!b.result;n++)step(c,b,1/60);expect(b.fullRun).toBeUndefined();expect(validateSave(c)).toBe(true);
});

it('R15 first-wave damage changes with actual range coverage and never forces 1034',()=>{
 const rows=[];
 for(const branch of ['upstream','gate','crystals']){
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(ch=>ch.id),quarryLegacy:'upstream',crystals:390});const source=createBattle(4,c);c.battle=source;const b=startDecisionReplay(c,source,branch);
  for(const [t,x,y]of [['cannon',456,408],['frost',600,264],['tesla',744,360]])expect(buildTower(c,b,t,x,y)).toBe(true);
  if(branch==='crystals'){expect(buildTower(c,b,'frost',600,408)).toBe(true);expect(upgradeTower(c,b,b.towers.at(-1).id)).toBe(true);}
  startWave(b);for(let n=0;n<18000&&b.phase==='active'&&!b.result;n++)step(c,b,1/60);
  const r=b.firstWaveDecision;rows.push(r);expect(r.totalDamage).toBe(Object.values(b.decisionStats.towers).reduce((n,t)=>n+t.damage,0));
 }
 expect(new Set(rows.map(r=>r.totalDamage)).size).toBe(3);expect(rows[1].inheritedDamage).toBeGreaterThan(0);expect(rows[2].spent).toBe(430);
});
it('R15 preserves historical aggregate water delay when resuming an older live save',()=>{
 const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;for(const [i,t]of ['cannon','frost','tesla'].entries())buildTower(c,b,t,SLUICE.pads[i].x,SLUICE.pads[i].y);startWave(b);while(b.time<18)step(c,b,1/60);openGate(b);for(let i=0;i<60;i++)step(c,b,1/60);const prior=b.gate.delay;delete b.gate.delays;expect(validateSave(c)).toBe(true);step(c,b,1/60);expect(b.gate.legacyDelay).toBe(prior);expect(validateSave(c)).toBe(true);
});

import {relayMini} from '../src/content-r7.js';
import {BASE_ROUTE} from '../src/content-r1.js';
import {towerRadius} from '../src/content-r2.js';
it('R15 preview circles use the same actual radius as combat',()=>{const radius=towerRadius({type:'cannon'});expect(relayMini('upstream',BASE_ROUTE)).toContain('r=\"'+radius+'\" fill=\"#ed86571f\"');});
