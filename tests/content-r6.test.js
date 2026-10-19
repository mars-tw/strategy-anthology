import {describe,it,expect} from 'vitest';
import {freshCampaign,chooseQuarryLegacy,chooseFordLegacy,completeChapter,CHAPTERS} from '../src/campaign.js';
import {createBattle,createExercise,buildTower,startWave,step,changeTerrain} from '../src/engine.js';
import {EXERCISES} from '../src/content-r1.js';
import {decisionReview,contribution,IMPACT_SOUND} from '../src/content-r6.js';
import {validateSave,loadSave,persist} from '../src/save.js';
const tick=(c,b)=>{for(let i=0;i<9000&&!b.result&&b.phase==='active';i++)step(c,b,1/30);};
describe('R6 actual consequences',()=>{
 for(const choice of ['upstream','gate','crystals'])it('second relay '+choice+' persists and completes the first wave',()=>{
  const c=freshCampaign();c.chapter=3;c.completed=CHAPTERS.slice(0,3).map(x=>x.id);c.crystals=800;c.battle=createBattle(3);c.battle.result='won';completeChapter(c,c.battle);
  const before=c.crystals;expect(chooseQuarryLegacy(c,choice)).toBe(true);expect(chooseQuarryLegacy(c,choice)).toBe(false);expect(c.crystals).toBe(before+(choice==='crystals'?90:0));
  const b=createBattle(4,c);c.battle=b;expect(b.towers.filter(t=>t.inherited).length).toBe(choice==='crystals'?0:1);
  for(const [type,x,y] of [['cannon',552,264],['frost',600,264],['tesla',552,312]])expect(buildTower(c,b,type,x,y)).toBe(true);
  expect(startWave(b)).toBe(true);tick(c,b);expect(b.phase).toBe('planning');expect(b.wave).toBe(1);expect(b.hp).toBe(100);
  const m=new Map(),storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};expect(persist(storage,c)).toBe(true);expect(loadSave(storage).campaign).toEqual(c);
  expect(decisionReview(b).join(' ')).toContain(choice==='crystals'?'火印塔 90 結晶':'次命中');
 });
 it('tracks real hit damage and unique slowed targets without altering tower balance',()=>{
  const c=freshCampaign(),b=createExercise('turn');for(const [i,t]of ['cannon','frost','tesla'].entries())buildTower(c,b,t,EXERCISES[0].pads[i].x,EXERCISES[0].pads[i].y);startWave(b);tick(c,b);
  expect(b.result).toBe('won');const rows=Object.values(b.decisionStats.towers);expect(rows.length).toBe(3);expect(rows.reduce((n,t)=>n+t.damage,0)).toBe(9*65);expect(rows.find(t=>t.type==='frost').slowed.length).toBeGreaterThan(0);expect(contribution(b)).toContain('路段');expect(new Set(Object.values(IMPACT_SOUND).map(s=>s.type)).size).toBe(3);
 });
 for(const choice of ['flood','barricade'])it(choice+' report uses measured simulation time',()=>{
  const c=freshCampaign(),b=createBattle(0);changeTerrain(c,b,choice);buildTower(c,b,'frost',120,552);startWave(b);tick(c,b);const s=b.decisionStats;expect(choice==='flood'?s.waterDelay:s.detourSeconds).toBeGreaterThan(0);expect(decisionReview(b).join('')).toContain('秒');
 });
 it('five puzzles include separated and deliberate empty-site solutions at the same budget',()=>{
  expect(EXERCISES.length).toBe(5);for(const id of ['split','hollow']){const c=freshCampaign(),b=createExercise(id),e=EXERCISES.find(e=>e.id===id);for(const [i,t]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,t,e.pads[i].x,e.pads[i].y)).toBe(true);expect(b.trinity).toBe(false);expect(b.budget).toBe(0);startWave(b);tick(c,b);expect(b.result).toBe('won');expect(b.towers.some(t=>t.x===e.pads[3].x&&t.y===e.pads[3].y)).toBe(false);}
 });
 it('restores the new puzzle during live combat and keeps real contribution counters',()=>{const c=freshCampaign(),b=createExercise('hollow'),e=EXERCISES.find(e=>e.id==='hollow');for(const [i,t]of ['cannon','frost','tesla'].entries())buildTower(c,b,t,e.pads[i].x,e.pads[i].y);startWave(b);for(let n=0;n<600;n++)step(c,b,1/30);c.exercises.battle=b;const m=new Map(),storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};expect(persist(storage,c)).toBe(true);const restored=loadSave(storage).campaign;expect(restored.exercises.battle.decisionStats).toEqual(b.decisionStats);tick(restored,restored.exercises.battle);expect(restored.exercises.battle.result).toBe('won');});
 it('rejects malformed or executable imported telemetry',()=>{const c=freshCampaign();c.battle=createBattle(0);c.battle.decisionStats={towers:{},wetSeconds:0,waterDelay:0,detourSeconds:0,spending:[{source:'ford',amount:90,label:'<img src=x onerror=alert(1)>'}]};expect(validateSave(c)).toBe(false);});
});
