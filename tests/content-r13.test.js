import {describe,it,expect} from 'vitest';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {freshCampaign} from '../src/campaign.js';
import {createExercise,buildTower,upgradeTower,startWave,step} from '../src/engine.js';
import {defenseHint,retryFormation,visibleDamageEvents,recordGateTrial,validGateTrials} from '../src/content-r13.js';
import {impactReadout,relayMini} from '../src/content-r7.js';
import {openGate} from '../src/content-r12.js';
import {persist,loadSave,validateSave} from '../src/save.js';
import {verifySourceSnapshot} from '../scripts/source-integrity.mjs';
import {BASE_ROUTE,exerciseFor} from '../src/content-r1.js';
describe('R13 battle readability and complete retry',()=>{
 it('retries every real puzzle with the exact paid formation, upgrade and wallet, then persists it',()=>{
  for(const id of ['turn','levee','switchback','split','hollow','sluice']){
   const c=freshCampaign(),b=createExercise(id),e=exerciseFor(b);c.exercises.battle=b;
   for(const [i,t]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,t,e.pads[i].x,e.pads[i].y)).toBe(true);
   if(id==='switchback')expect(upgradeTower(c,b,b.towers[2].id)).toBe(true);
   startWave(b);if(id==='sluice')openGate(b);for(let n=0;n<18000&&!b.result;n++)step(c,b,1/60);
   expect(b.result).not.toBe(null);const next=retryFormation(c,b,createExercise,buildTower,upgradeTower);
   expect(next.towers.map(({type,x,y,level})=>({type,x,y,level}))).toEqual(b.towers.map(({type,x,y,level})=>({type,x,y,level})));
   expect([next.spent,next.budget,c.crystals]).toEqual([b.spent,b.budget,360]);expect(next.phase).toBe('planning');expect(next.time).toBe(0);
   if(next.gate)expect(next.gate.used).toBe(false);
   c.exercises.battle=next;const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
   expect(persist(storage,c)).toBe(true);expect(loadSave(storage).campaign.exercises.battle).toEqual(next);
  }
 });
 it('never says waiting after another tower has already hit, and updates ready instructions',()=>{
  const b=createExercise('turn');b.towers=[{id:'t1',type:'cannon'},{id:'t2',type:'frost'}];b.hitLog=[{towerId:'t1',targetId:'u1',color:'cannon',baseDamage:26,bonusDamage:0,damage:26,actualDamage:26,hpBefore:65,hpAfter:39}];
  expect(impactReadout(b,'t2').html).not.toContain('等待');expect(impactReadout(b,'t2').event.towerId).toBe('t1');
  expect(defenseHint(b)).toContain('先配置');b.towers.push({type:'tesla'});expect(defenseHint(b)).toContain('開始下一波');
 });
 it('shows one damage label per target in sequential time slots and keeps actual damage untouched',()=>{
  const first={kind:'shot',targetId:'u1',hit:true,actualDamage:26,age:.24},second={...first,actualDamage:10,age:.23};
  expect(visibleDamageEvents([first,second])).toEqual([first]);first.age+=.24;second.age+=.24;
  expect(visibleDamageEvents([first,second])).toEqual([second]);expect([first.actualDamage,second.actualDamage]).toEqual([26,10]);
 });
 it('all relay previews use the same tower art and expose a range circle',()=>{
  for(const choice of ['upstream','gate','crystals']){const svg=relayMini(choice,BASE_ROUTE);expect(svg).toContain('relay-range');expect(svg).toContain('r4/tower-cannon.png');expect(svg).not.toContain('legacy-cannon');}
 });
 it('records only completed hydraulic attempts once and validates saved comparisons',()=>{
  const c=freshCampaign(),b=createExercise('sluice');recordGateTrial(c,b);expect(c.exercises.gateTrials).toBeUndefined();
  b.result='lost';recordGateTrial(c,b);recordGateTrial(c,b);expect(c.exercises.gateTrials).toHaveLength(1);expect(validateSave(c)).toBe(true);
  expect(validGateTrials([{...c.exercises.gateTrials[0],delay:-1}])).toBe(false);expect(validGateTrials(Array(4).fill(c.exercises.gateTrials[0]))).toBe(false);
 });
 it('audits every archived source without sibling repos and rejects missing or changed baseline bytes',async()=>{
  const result=await verifySourceSnapshot();expect(result.sourceFiles).toHaveLength(41);expect(result.sourceFiles.every(f=>f.unchanged)).toBe(true);
  expect(result.sourceFiles.every(f=>f.evidence==='vendored-bytes')).toBe(true);
  expect(result.sourceFiles.filter(f=>f.evidence==='recorded-hash-only')).toHaveLength(0);
  const root='.audit-tmp/r13-integrity-negative';await mkdir(root+'/docs/evidence',{recursive:true});
  try{const bytes=await readFile('docs/evidence/source-baseline.json');await writeFile(root+'/docs/evidence/source-baseline.json',bytes);await expect(verifySourceSnapshot(root)).rejects.toThrow();await writeFile(root+'/docs/evidence/source-baseline.json',Buffer.concat([bytes,Buffer.from(' ')]));await expect(verifySourceSnapshot(root)).rejects.toThrow('baseline changed');}
  finally{await rm(root,{recursive:true,force:true});}
 });
});
