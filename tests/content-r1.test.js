import {describe,it,expect} from 'vitest';
import {freshCampaign,completeChapter,chooseFordLegacy} from '../src/campaign.js';
import {createBattle,createExercise,buildTower,upgradeTower,changeTerrain,finishExercise,startWave,step,construct,recruit,march,cast,PADS,canPlace} from '../src/engine.js';
import {EXERCISES,battleRoute,BASE_ROUTE,FLOOD_ZONE} from '../src/content-r1.js';
import {validateSave,persist,loadSave,SAVE_KEY,exportSave,previewImport} from '../src/save.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const tick=(c,b,n)=>{for(let i=0;i<n*30;i++)step(c,b,1/30);};
function defend(c,b){for(const [i,t]of ['cannon','frost','tesla'].entries())expect(buildTower(c,b,t,PADS[i].x,PADS[i].y)).toBe(true);for(let i=0;i<9000&&!b.result;i++){if(b.phase==='planning')startWave(b);step(c,b,1/30);}expect(b.result).toBe('won');}
function conquered(){const c=freshCampaign();let b=createBattle(0);defend(c,b);completeChapter(c,b);b=createBattle(1);c.battle=b;construct(c,b);tick(c,b,6);for(let i=0;i<7200&&!b.result;i++){if(i%90===0){recruit(c,b,'mage');march(b,818,180);}step(c,b,1/30);}expect(b.result).toBe('won');expect(completeChapter(c,b)).toBe(true);return c;}
describe('渡口一次性的戰後工事',()=>{
 for(const choice of ['tower','crystals'])it(`${choice}: actual conquest, reload, one claim, next battle and retry`,()=>{
  const c=conquered(),s=storage();expect(c.fordLegacy).toBe('pending');expect(persist(s,c)).toBe(true);const r=loadSave(s).campaign,before=r.crystals;
  expect(chooseFordLegacy(r,choice)).toBe(true);expect(r.crystals).toBe(before+(choice==='crystals'?90:0));expect(chooseFordLegacy(r,choice)).toBe(false);expect(chooseFordLegacy(r,choice==='tower'?'crystals':'tower')).toBe(false);
  expect(persist(s,r)).toBe(true);const restored=loadSave(s).campaign,b=createBattle(2,restored);expect(b.towers.length).toBe(choice==='tower'?1:0);
  if(choice==='tower'){expect(b.towers[0]).toMatchObject({type:'frost',level:1,inherited:true});expect(b.spent).toBe(0);}
  expect(createBattle(2,restored).towers).toEqual(b.towers);expect(createBattle(4,restored).towers).toEqual([]);restored.battle=b;expect(validateSave(restored)).toBe(true);
  expect(changeTerrain(restored,b,choice==='tower'?'barricade':'flood')).toBe(true);
  for(const [i,type]of ['cannon','frost','tesla'].entries())if(!b.towers.some(t=>t.type===type))expect(buildTower(restored,b,type,PADS[i].x,PADS[i].y+(choice==='crystals'?48:0))).toBe(true);
  for(let i=0;i<12000&&!b.result;i++){if(b.phase==='planning'){for(const t of b.towers)upgradeTower(restored,b,t.id);startWave(b);}step(restored,b,1/30);}expect(b.result).toBe('won');expect(completeChapter(restored,b)).toBe(true);expect(persist(s,restored)).toBe(true);
 });
 it('cannot claim without the conquered ford',()=>{const c=freshCampaign();expect(chooseFordLegacy(c,'crystals')).toBe(false);expect(c.crystals).toBe(360);});
});
describe('戰前地形真正改變路徑與行速',()=>{
 for(const ch of [0,2,4])for(const choice of ['barricade','flood'])it(`chapter ${ch} ${choice}: one paid edit, changed path and persisted route`,()=>{
  const c=freshCampaign(),b=createBattle(ch);expect(changeTerrain(c,b,choice)).toBe(true);expect(c.crystals).toBe(330);expect(battleRoute(b)).not.toEqual(BASE_ROUTE);expect(changeTerrain(c,b,choice)).toBe(false);expect(c.crystals).toBe(330);
  // Active ford defense follows the authored defense route, not siege bridge diversion.
  buildTower(c,b,'frost',120,552);startWave(b);tick(c,b,4);expect(b.enemies.length).toBeGreaterThan(0);expect(b.enemies[0].y).toBe(192);
  const copy=structuredClone(b);expect(battleRoute(copy)).toEqual(battleRoute(b));
 });
 it('rejects unaffordable, siege, post-wave and tower-overlap edits without payment',()=>{
  const c=freshCampaign(),b=createBattle(0);expect(buildTower(c,b,'frost',312,96)).toBe(true);const before=c.crystals;expect(changeTerrain(c,b,'barricade')).toBe(false);expect(c.crystals).toBe(before);expect(changeTerrain(c,createBattle(1),'flood')).toBe(false);
  startWave(b);expect(changeTerrain(c,b,'flood')).toBe(false);const p=createBattle(0);c.crystals=29;expect(changeTerrain(c,p,'flood')).toBe(false);expect(p.terrainChoice).toBeNull();
 });
 it('flood movement is exactly 52 percent inside its visible wet zone',()=>{
  const c=freshCampaign(),b=createBattle(0);changeTerrain(c,b,'flood');buildTower(c,b,'frost',120,552);startWave(b);tick(c,b,12);
  let wet;for(let i=0;i<900&&!wet;i++){step(c,b,1/30);wet=b.enemies.find(e=>e.hp>0&&e.route===2&&e.x>280&&e.x<320&&e.y===384);}
  expect(wet).toBeTruthy();expect(Math.hypot(wet.x-FLOOD_ZONE.x,wet.y-FLOOD_ZONE.y)).toBeLessThan(FLOOD_ZONE.radius);const before=wet.x;step(c,b,.05);expect(wet.x-before).toBeCloseTo(50*.52*.05,5);
 });
 for(const choice of ['barricade','flood'])it(`ford ${choice} crosses real bridge decks, never deep water`,()=>{const c=freshCampaign(),b=createBattle(2);changeTerrain(c,b,choice);buildTower(c,b,'frost',120,552);startWave(b);let crossed=false;for(let i=0;i<3600&&!b.result;i++){step(c,b,1/30);for(const e of b.enemies)if(e.hp>0&&e.x>450&&e.x<560){crossed=true;expect(Math.min(Math.abs(e.y-195),Math.abs(e.y-425))).toBeLessThanOrEqual(3);}}expect(crossed).toBe(true);});
 it('can complete all waves after flooding, save and continue at the changed route',()=>{const c=freshCampaign(),b=createBattle(0),s=storage();changeTerrain(c,b,'flood');defend(c,b);c.battle=b;expect(persist(s,c)).toBe(true);expect(loadSave(s).campaign.battle.terrainChoice).toBe('flood');});
 for(const ch of [0,2,4])it(`barricade chapter ${ch} remains winnable when the formation follows the new road`,()=>{const c=freshCampaign(),b=createBattle(ch);changeTerrain(c,b,'barricade');for(const [i,type]of ['cannon','frost','tesla'].entries()){const p=(ch===2?PADS:[{x:648,y:264},{x:696,y:264},{x:648,y:312}])[i];expect(buildTower(c,b,type,p.x,p.y)).toBe(true);}for(let i=0;i<12000&&!b.result;i++){if(b.phase==='planning'){for(const t of [...b.towers].reverse())upgradeTower(c,b,t.id);startWave(b);}step(c,b,1/30);}expect(b.result,JSON.stringify({hp:b.hp,wave:b.wave,kills:b.kills})).toBe('won');});
});
describe('三印窄陣的固定空間、預算及完成紀錄',()=>{
 for(const e of EXERCISES)it(`${e.id}: real commands win with no wallet or unlock contamination`,()=>{
  const c=freshCampaign(),before=structuredClone(c),b=createExercise(e.id),s=storage();
  expect(canPlace(b,120,120)).toBe(false);expect(changeTerrain(c,b,'flood')).toBe(false);expect(cast(c,b,100,100)).toBe(false);
  for(const [i,type]of ['cannon','frost','tesla'].entries()){const p=e.pads[i];expect(buildTower(c,b,type,p.x,p.y)).toBe(true);}
  if(e.id==='switchback')expect(upgradeTower(c,b,b.towers[2].id)).toBe(true);
  c.exercises.battle=b;expect(persist(s,c)).toBe(true);const restored=loadSave(s).campaign,active=restored.exercises.battle;expect(active).toEqual(b);expect(startWave(active)).toBe(true);
  expect(buildTower(restored,active,'frost',e.pads[0].x,e.pads[0].y)).toBe(false);tick(restored,active,120);expect(active.result).toBe('won');expect(active.hp).toBe(100);expect(finishExercise(restored,active)).toBe(true);expect(finishExercise(restored,active)).toBe(false);expect(completeChapter(restored,active)).toBe(false);
  expect(restored.crystals).toBe(before.crystals);expect(restored.unlocks).toEqual(before.unlocks);expect(restored.chapter).toBe(0);expect(restored.battle).toBeNull();expect(persist(s,restored)).toBe(true);expect(loadSave(s).campaign.exercises.completed).toContain(e.id);
 });
 it('a weak formation fails on its first escaped enemy and can start with full budget again',()=>{const c=freshCampaign(),b=createExercise('levee');buildTower(c,b,'frost',216,264);startWave(b);tick(c,b,100);expect(b.result).toBe('lost');expect(b.hp).toBe(88);expect(finishExercise(c,b)).toBe(false);expect(createExercise('levee').budget).toBe(300);});
 it('saves campaign and exercise simultaneously and validates tampering',()=>{const c=freshCampaign(),s=storage();c.battle=createBattle(0);buildTower(c,c.battle,'cannon',552,264);c.exercises.battle=createExercise('turn');expect(persist(s,c)).toBe(true);expect(loadSave(s).campaign).toEqual(c);const bad=structuredClone(c);bad.exercises.battle.budget++;expect(validateSave(bad)).toBe(false);bad.exercises.battle.exercise='wrong';expect(validateSave(bad)).toBe(false);expect(()=>createExercise('wrong')).toThrow('沒有這個演習。');});
 it('old optional fields migrate only in memory and exports preserve new content',()=>{const c=freshCampaign(),s=storage();delete c.fordLegacy;delete c.exercises;c.battle=createBattle(0);delete c.battle.terrainChoice;const raw=JSON.stringify(c);s.setItem(SAVE_KEY,raw);const r=loadSave(s);expect(r.error).toBeNull();expect(r.campaign.exercises).toEqual({completed:[],battle:null});expect(s.getItem(SAVE_KEY)).toBe(raw);expect(previewImport(exportSave(r.campaign),freshCampaign()).campaign).toEqual(r.campaign);});
});
