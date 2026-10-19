import {describe,it,expect} from 'vitest';
import {freshCampaign,CHAPTERS,completeChapter} from '../src/campaign.js';
import {createBattle,startDecisionReplay,buildTower,upgradeTower,startWave,step,changeTerrain,createExercise} from '../src/engine.js';
import {EXERCISES} from '../src/content-r1.js';
import {relayMini,impactReadout,leakDescription,comparisonHTML} from '../src/content-r7.js';
import {validateSave,persist,loadSave} from '../src/save.js';
import {padLabels} from '../src/content-r3.js';
const wave=(c,b)=>{startWave(b);for(let i=0;i<15000&&!b.result&&b.phase==='active';i++)step(c,b,1/30);};
const trio=(c,b)=>{for(const [i,t]of ['cannon','frost','tesla'].entries()){const p=EXERCISES[0].pads[i];expect(buildTower(c,b,t,p.x,p.y)).toBe(true);}};
const store=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};};
describe('R7 decision replays and readable consequences',()=>{
 it('compares three real first-wave branches, persists mid-replay, and cannot mint or debit campaign currency',()=>{
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(ch=>ch.id),quarryLegacy:'upstream',crystals:800});
  c.battle=createBattle(4,c);trio(c,c.battle);wave(c,c.battle);
  const original=structuredClone(c.battle),money=c.crystals,credits=structuredClone(c.salvageCredits);
  expect(c.decisionRecords).toHaveLength(1);
  for(const branch of ['gate','crystals','upstream']){
   const b=startDecisionReplay(c,c.battle,branch);expect(b.budget).toBe(800+(branch==='crystals'?90:0));trio(c,b);for(const t of b.towers.filter(t=>!t.inherited)){expect(upgradeTower(c,b,t.id)).toBe(true);expect(upgradeTower(c,b,t.id)).toBe(true);}startWave(b);
   for(let i=0;i<400;i++)step(c,b,1/30);const storage=store();expect(persist(storage,c)).toBe(true);expect(loadSave(storage).campaign.decisionReplay).toEqual(b);
   for(let i=0;i<30000&&!b.result;i++){if(b.phase==='planning')startWave(b);step(c,b,1/30);}
   expect(b.result).toBe('won');expect(b.wave).toBe(4);expect(b.earnings).toBe(0);expect(completeChapter(c,b)).toBe(false);expect(c.crystals).toBe(money);expect(c.battle).toEqual(original);expect(c.salvageCredits).toEqual(credits);
  }
  expect(c.decisionRecords).toHaveLength(4);expect(comparisonHTML(c,c.battle)).toContain('前次與本次');expect(validateSave(c)).toBe(true);
 });
 for(const choice of ['flood','barricade'])it(choice+' counts unique actual entrants and preserves isolated terrain costs',()=>{
  const c=freshCampaign(),source=createBattle(0,c),b=startDecisionReplay(c,source,'none',choice),before=c.crystals;
  expect(b.budget).toBe(before-30);buildTower(c,b,'frost',120,552);wave(c,b);
  const record=c.decisionRecords[0];expect(record.spent).toBe(100);expect(choice==='flood'?record.wetCount:record.detourCount).toBe(7);expect(choice==='flood'?record.waterDelay:b.decisionStats.detourSeconds).toBeGreaterThan(0);expect(c.crystals).toBe(before);expect(validateSave(c)).toBe(true);
 });
 it('records base, bonus, actual HP change and retained frost for fire and lightning',()=>{
  const c=freshCampaign(),b=createExercise('switchback');trio(c,b);startWave(b);const hit=[];
  for(let i=0;i<6000&&!b.result;i++){step(c,b,1/30);for(const f of b.hitLog||[])if(f.slowBefore>0&&['cannon','tesla'].includes(f.color))hit.push(f);}
  expect(new Set(hit.map(f=>f.color))).toEqual(new Set(['cannon','tesla']));for(const f of hit){expect(f.slowAfter).toBeGreaterThanOrEqual(f.slowBefore);expect(f.baseDamage+f.bonusDamage).toBe(f.damage);expect(f.hpBefore-f.hpAfter).toBe(f.actualDamage);}
  expect(impactReadout(b).html).toContain('實扣');
 });
 for(const [id,pads]of [['turn',[0,3,4]],['levee',[0,1,3]],['switchback',[1,4,5]],['split',[0,3,4]],['hollow',[3,1,4]]])it(id+' failure identifies an actual first leak at the same budget',()=>{
  const c=freshCampaign(),b=createExercise(id),e=EXERCISES.find(e=>e.id===id);for(const [i,t]of ['cannon','frost','tesla'].entries()){const p=e.pads[pads[i]];buildTower(c,b,t,p.x,p.y);}if(id==='switchback'){const t=b.towers.find(t=>t.type==='tesla');t.level++;b.budget-=60;b.spent+=60;}
  wave(c,b);expect(b.result).toBe('lost');expect(b.budget).toBe(0);expect(b.firstLeak.hp).toBeGreaterThan(0);expect(leakDescription(b)).toContain(`第 ${b.firstLeak.ordinal} 隻甲犬`);expect(leakDescription(b)).not.toMatch(/\b[tu]\d+\b/);expect(leakDescription(b)).toContain('路');
 });
 it('miniatures show exact coverage without exposing raw coordinate labels; malformed replay telemetry is rejected',()=>{
  const c=freshCampaign();expect(relayMini('gate',[{x:32,y:192},{x:656,y:192},{x:656,y:480},{x:848,y:480}])).toContain('射程覆蓋');
  c.decisionRecords=[{chapter:4,branch:'<script>'}];expect(validateSave(c)).toBe(false);
  delete c.decisionRecords;c.battle=createBattle(0);c.battle.hitLog=[{towerId:'<img>'}];expect(validateSave(c)).toBe(false);
 });
 it('continues a pre-R7 save with an in-flight projectile and keeps the next save valid',()=>{
  const c=freshCampaign();c.battle=createBattle(0);const b=c.battle;trio(c,b);startWave(b);
  for(let n=0;n<6000&&!b.effects.some(f=>f.kind==='shot');n++)step(c,b,1/30);
  expect(b.effects.length).toBeGreaterThan(0);for(const f of b.effects){delete f.baseDamage;delete f.bonusDamage;}
  expect(validateSave(c)).toBe(true);for(let n=0;n<30;n++)step(c,b,1/30);
  expect(b.hitLog.length).toBeGreaterThan(0);expect(validateSave(c)).toBe(true);
 });
 it('escapes imported legacy actor identifiers at the new HTML boundary',()=>{
  const b=createExercise('turn');b.towers=[{id:'"><img src=x onerror=alert(1)>',type:'cannon'}];
  expect(impactReadout(b).html).not.toContain('<img');expect(impactReadout(b).html).toContain('&lt;img');
  b.firstLeak={id:'<svg onload=alert(1)>',segment:3,hp:12};expect(leakDescription(b)).not.toContain('<svg');
 });
 for(const [id,indices]of [['turn',[0,1,3]],['switchback',[0,1,4]]])it(id+' preserves legitimate 10% pair resonance through live saves and completion',()=>{
  const c=freshCampaign(),b=createExercise(id),e=EXERCISES.find(e=>e.id===id),storage=store();c.exercises.battle=b;
  for(const [i,type]of ['cannon','frost','tesla'].entries()){const p=e.pads[indices[i]];buildTower(c,b,type,p.x,p.y);}if(id==='switchback')upgradeTower(c,b,b.towers[2].id);
  startWave(b);let paired=false;for(let i=0;i<8000&&!b.result;i++){step(c,b,1/60);if(b.hitLog?.some(f=>f.bonus===.1)){paired=true;expect(persist(storage,c)).toBe(true);}}
  expect(paired).toBe(true);expect(b.result).toBe('won');expect(b.trinity).toBe(false);expect(b.budget).toBe(0);expect(persist(storage,c)).toBe(true);expect(loadSave(storage).campaign.exercises.battle.result).toBe('won');
 });
 it('keeps all six small-phone pad labels outside real overlay rectangles',()=>{
  const pads=EXERCISES.find(e=>e.id==='switchback').pads,anchors=pads.map(p=>({x:p.x/960*296,y:p.y/640*133})),blocks=[{x:6,y:6,w:88,h:48},{x:250,y:6,w:40,h:30},{x:90,y:112,w:160,h:22}];
  const marks=padLabels(pads,296,133,anchors,blocks);expect(marks).toHaveLength(6);
  for(const q of marks)for(const r of blocks)expect(q.x+28>r.x&&q.x-28<r.x+r.w&&q.y+9>r.y&&q.y-14<r.y+r.h).toBe(false);
  for(let i=0;i<marks.length;i++)for(let j=i+1;j<marks.length;j++)expect(Math.abs(marks[i].x-marks[j].x)>=54||Math.abs(marks[i].y-marks[j].y)>=25).toBe(true);
 });
 it('does not invent a primary route when no tower has hit an enemy',()=>{
  const c=freshCampaign(),b=createBattle(0,c);c.battle=b;buildTower(c,b,'frost',120,552);wave(c,b);
  expect(c.decisionRecords[0].tower).toBe('none');const html=comparisonHTML(c,b);expect(html).toContain('首波交火資料不足');expect(html).toContain('未命中');expect(html).not.toContain('<table');
 });
});
