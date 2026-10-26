import {describe,it,expect} from 'vitest';
import {nearbyLabels,separateHealth,branchTotals,threeBranchHTML,gateTimingHint,snapshotPoint} from '../src/content-r14.js';
import {intersects,validDecisionExtras} from '../src/content-r8.js';
import {CHAPTERS,freshCampaign} from '../src/campaign.js';
import {createBattle,buildTower,startWave,step,PADS,startDecisionReplay} from '../src/engine.js';
import {persist,loadSave,validateSave} from '../src/save.js';
import {retryFormation,recordGateTrial,validGateTrials} from '../src/content-r13.js';
import {createExercise,upgradeTower} from '../src/engine.js';
import {openGate,gateFeedback} from '../src/content-r12.js';
import {evidenceDir,evidenceFile} from '../scripts/current-evidence.mjs';

describe('R14 review acceptance',()=>{
 it('keeps the 3:2 deployment projection undistorted in portrait, landscape and tablet results',()=>{
  for(const [w,h]of [[296,197.333],[414,276],[501,190],[1000,700]]){
   const a=snapshotPoint(0,0,w,h),z=snapshotPoint(960,640,w,h);
   expect((z.x-a.x)/(z.y-a.y)).toBeCloseTo(1.5,8);expect(a.x).toBeGreaterThanOrEqual(0);expect(z.x).toBeLessThanOrEqual(w);expect(z.y).toBeLessThanOrEqual(h);
  }
 });
 it('keeps result labels within 24px of their own native deployment without overlap',()=>{
  for(const [w,h] of [[296,197.333],[414,276],[1000,666.667]]){
   const anchors=[{x:456,y:264},...PADS].map(p=>({x:p.x/960*w,y:p.y/640*h}));
   const marks=nearbyLabels(anchors,w,h);
   for(const m of marks)expect(Math.hypot(m.x+m.w/2-m.anchorX,m.y+m.h/2-m.anchorY)).toBeLessThanOrEqual(24);
   for(let i=0;i<marks.length;i++)for(let j=i+1;j<marks.length;j++)expect(intersects(marks[i],marks[j])).toBe(false);
  }
 });
 it('gives every visible target a distinct healthbar and a link to its own head',()=>{
  const units=Array.from({length:7},(_,i)=>({id:'u'+i,x:100+i*27,y:150,poseHeight:44,healthY:97,healthShown:true}));
  const bars=separateHealth(units,430,300);expect(bars).toHaveLength(7);
  for(let i=0;i<bars.length;i++){expect(bars[i].anchorX).toBe(units[i].x);for(let j=i+1;j<bars.length;j++)expect(intersects(bars[i],bars[j])).toBe(false);}
 });
 it('plays the same paid formation in all three real branches, records contribution and compares after reload',()=>{
  const c=freshCampaign();c.chapter=4;c.completed=CHAPTERS.slice(0,4).map(ch=>ch.id);c.quarryLegacy='upstream';c.crystals=390;
  const first=createBattle(4,c);c.battle=first;
  for(const branch of ['upstream','gate','crystals']){
   const b=branch==='upstream'?first:startDecisionReplay(c,first,branch,'none');
   for(const [i,type]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,type,PADS[i].x,PADS[i].y)).toBe(true);
   for(let wave=1;wave<=4;wave++){if(wave===2)expect(upgradeTower(c,b,b.towers.find(t=>t.type==='tesla'&&!t.inherited).id)).toBe(true);expect(startWave(b)).toBe(true);for(let n=0;n<15000&&b.phase==='active'&&!b.result;n++)step(c,b,1/60);}
   expect(b.result).toBe('won');expect(b.wave).toBe(4);
   const r=b.firstWaveDecision;expect(validDecisionExtras(r)).toBe(true);expect(r.duration).toBeGreaterThan(0);expect(r.bonusDamage).toBeGreaterThanOrEqual(0);
   expect(branchTotals(r).inherited+branchTotals(r).built).toBe(r.totalDamage);
   expect(validDecisionExtras({...r,duration:NaN})).toBe(false);expect(validDecisionExtras({...r,bonusDamage:r.totalDamage+1})).toBe(false);
  }
  const m=new Map(),store={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};expect(persist(store,c)).toBe(true);
  const restored=loadSave(store).campaign;expect(restored.decisionRecords).toHaveLength(3);const html=threeBranchHTML(restored,first);
  expect(html).toContain('各分支差異');expect(html).toContain('相同開局');expect(html).toContain('相對上游');expect(html).toContain('共鳴實扣');
 });
 it('records a genuine last timing, keeps its formation and resets the next flow across save/reload',()=>{
  const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;
  for(const [i,t]of ['cannon','frost','tesla'].entries())buildTower(c,b,t,[552,216,744][i],[264,264,408][i]);
  startWave(b);for(let i=0;i<1080;i++)step(c,b,1/60);openGate(b);for(let i=0;i<12000&&!b.result;i++)step(c,b,1/60);
  expect(b.result).toBe('won');recordGateTrial(c,b);expect(validGateTrials(c.exercises.gateTrials)).toBe(true);
  const next=retryFormation(c,b,createExercise,buildTower,upgradeTower);c.exercises.battle=next;
  expect(gateTimingHint(c,next)).toContain('18.0秒開閘');expect(next.gate.used).toBe(false);expect(next.gate.delay).toBe(0);
  expect(c.exercises.gateTrials[0].formation).toEqual(next.towers.map(({type,x,y,level})=>({type,x,y,level})));
  expect(gateFeedback(b)).toContain('逐隻累計延遲');expect(gateFeedback(b)).toContain('剩餘行速35%');expect(validateSave(c)).toBe(true);
 });
 it('routes historical evidence into only the current round and never overwrites store screenshots',()=>{
  expect(evidenceDir('content-r1')).toBe('docs/content/r19/regression/content-r1');
  expect(evidenceFile('docs/store/screenshots/iphone-defense-1290x2796.png')).toBe('docs/content/r19/regression/store/iphone-defense-1290x2796.png');
 });
});
