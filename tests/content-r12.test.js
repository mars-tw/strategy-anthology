import {describe,it,expect} from 'vitest';
import {freshCampaign} from '../src/campaign.js';
import {createExercise,buildTower,startWave,step,finishExercise} from '../src/engine.js';
import {SLUICE,GATE,openGate,gateWet,gateFeedback} from '../src/content-r12.js';
import {validateSave,persist,loadSave} from '../src/save.js';
import {EXERCISES} from '../src/content-r1.js';
import {exerciseTower,overlapArea} from '../src/content-r10.js';
import {orderedPadLabels} from '../src/content-r11.js';
function setup(){const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;for(const [t,i]of [['cannon',0],['frost',1],['tesla',2]])expect(buildTower(c,b,t,SLUICE.pads[i].x,SLUICE.pads[i].y)).toBe(true);return {c,b};}
function play(at){const {c,b}=setup();startWave(b);for(let n=0;n<18000&&!b.result;n++){if(at>=0&&b.time>=at&&!b.gate.used)expect(openGate(b)).toBe(true);step(c,b,1/60);}return {c,b};}
describe('R12 one-shot hydraulic timing puzzle',()=>{
 it('direct phone labels stay vertically aligned below each tower and clear adjacent silhouettes',()=>{
  for(const e of [...EXERCISES,SLUICE])for(const [w,h]of [[414,340],[414,360],[414,500],[414,600],[1016,850]]){
   const bases=e.pads.map(p=>exerciseTower(p,w,h)),labels=orderedPadLabels(e.pads,bases,w,h);
   for(const l of labels){const p=bases[l.number-1];expect(l.x).toBe(p.x);expect(l.y).toBeGreaterThan(p.y);for(const t of bases)expect(overlapArea({x:l.x-32,y:l.y-16,w:64,h:25},{x:t.x-t.h*.4,y:t.y-t.h,w:t.h*.8,h:t.h})).toBe(0);}
  }
 });
 it('same paid formation loses without water or when opened early, wins when timed for the column',()=>{
  const off=play(-1),early=play(0),timed=play(18);
  expect(off.b.result).toBe('lost');expect(early.b.result).toBe('lost');expect(timed.b.result).toBe('won');expect(timed.b.kills).toBe(10);
  for(const {c,b}of [off,early,timed]){expect(c.crystals).toBe(freshCampaign().crystals);expect(b.spent).toBe(300);expect(b.budget).toBe(0);expect(validateSave(c)).toBe(true);}
  expect(timed.b.gate.wetIds.length).toBeGreaterThan(early.b.gate.wetIds.length);expect(gateFeedback(timed.b)).toContain(timed.b.gate.delay.toFixed(2));
 });
 it('only active puzzle can open, once, with no debit, and completion is saved once',()=>{
  const {c,b}=setup();expect(openGate(b)).toBe(false);startWave(b);expect(openGate(b)).toBe(true);expect(openGate(b)).toBe(false);expect(c.crystals).toBe(freshCampaign().crystals);
  expect(openGate({...b,exercise:'turn',gate:{...b.gate,used:false}})).toBe(false);
  const done=play(18);expect(finishExercise(done.c,done.b)).toBe(true);expect(finishExercise(done.c,done.b)).toBe(false);expect(validateSave(done.c)).toBe(true);
 });
 it('midstream save and load resume the same countdown, targets and result',()=>{
  const {c,b}=setup();startWave(b);while(b.time<18)step(c,b,1/60);openGate(b);for(let n=0;n<120;n++)step(c,b,1/60);
  const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};expect(persist(storage,c)).toBe(true);
  const copy=loadSave(storage);expect(copy.error).toBe(null);expect(copy.campaign.exercises.battle.gate).toEqual(b.gate);expect(openGate(copy.campaign.exercises.battle)).toBe(false);
  for(let n=0;n<18000&&!b.result;n++){step(c,b,1/60);step(copy.campaign,copy.campaign.exercises.battle,1/60);}
  expect(copy.campaign.exercises.battle).toEqual(b);expect(b.result).toBe('won');
 });
 it('rejects forged timer, extra uses, wrong exercise or duplicated hydraulic targets',()=>{
  const {c,b}=setup();startWave(b);openGate(b);for(const mutate of [g=>g.left=9,g=>g.at=b.time+1,g=>g.used=false,g=>g.delay=-1,g=>g.wetIds=['u4','u4']]){const copy=structuredClone(c);mutate(copy.exercises.battle.gate);expect(validateSave(copy)).toBe(false);}
  const wrong=structuredClone(c);wrong.exercises.battle.exercise='turn';expect(validateSave(wrong)).toBe(false);
 });
 it('water affects only its authored road segment, ends after eight seconds, and counts actual simulation steps',()=>{
  const {c,b}=setup();startWave(b);while(b.time<18)step(c,b,1/60);openGate(b);let expected=0;
  for(let n=0;n<481;n++){for(const e of b.enemies)if(gateWet(b,e))expected+=(1/60)*(1-GATE.multiplier);step(c,b,1/60);}
  expect(b.gate.left).toBe(0);expect(b.gate.delay).toBeCloseTo(expected,8);expect(gateWet(b,{hp:5,x:500,y:192})).toBe(false);
  expect(gateWet({...b,gate:{left:1}},{hp:5,x:500,y:384})).toBe(false);
 });
});
