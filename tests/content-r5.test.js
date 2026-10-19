import {describe,it,expect} from 'vitest';
import {inspectRoute,padIdentity,crystalVisual} from '../src/content-r5.js';
import {salvageFrame} from '../src/content-r4.js';
import {freshCampaign} from '../src/campaign.js';
import {createBattle,buildTower,changeTerrain,startWave,step} from '../src/engine.js';
import {routeProgress} from '../src/content-r3.js';
import {persist,loadSave} from '../src/save.js';
import {EXERCISES,TERRAIN_ROUTES} from '../src/content-r1.js';

describe('R5 review gaps',()=>{
 it('the selectable three elements use actual interception geometry',()=>{
  const c=freshCampaign(),b=createBattle(0,c);
  for(const [type,x,y]of [['cannon',552,264],['frost',600,264],['tesla',552,312]])expect(buildTower(c,b,type,x,y)).toBe(true);
  const rows=['cannon','frost','tesla'].map(type=>inspectRoute(b.towers,TERRAIN_ROUTES.barricade,type));
  expect(rows.map(r=>r.pieces.length>0)).toEqual([false,true,false]);
  expect(rows[1].pieces.every(piece=>piece.every(p=>Math.hypot(p.x-600,p.y-264)<=165.00001))).toBe(true);
  expect(rows.map(r=>r.towerIds.length)).toEqual([1,1,1]);
 });
 it('flood changes real movement only inside its zone and survives storage',()=>{
  const c=freshCampaign(),b=createBattle(0,c);
  expect(buildTower(c,b,'frost',120,552)).toBe(true);expect(changeTerrain(c,b,'flood')).toBe(true);expect(startWave(b)).toBe(true);
  let wet,after;
  for(let i=0;i<8000&&!after;i++){step(c,b,1/60);const q=routeProgress(b);if(q?.wet&&!wet)wet=q;if(wet&&q?.alive&&!q.wet&&q.percent>wet.percent)after=q;}
  expect(wet.speed).toBe(26);expect(after.speed).toBe(50);expect(wet.id).toBe(after.id);
  c.battle=b;const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  expect(persist(storage,c)).toBe(true);const restored=loadSave(storage).campaign.battle;
  expect(restored.terrainChoice).toBe('flood');expect(restored.enemies[0].x).toBeCloseTo(b.enemies[0].x);
 });
 it('arrival cannot draw a crystal over the wallet number',()=>{
  for(const elapsed of [0,650,1300]){const f=salvageFrame(elapsed,411,501,{x:45,y:400},{x:240,y:40}),v=crystalVisual(f);if(f.arrived){expect(f.money).toBe(501);expect(v.opacity).toBe(0);}else expect(f.money).toBe(411);}
 });
 it('the same pad identifies a real tower during planning and combat, and empty pads are intentional',()=>{
  const e=EXERCISES.find(e=>e.id==='levee'),b={towers:[{type:'cannon',...e.pads[0]}],phase:'planning',budget:0};
  expect(padIdentity(e.pads[0],0,b,null).text).toBe('1 火塔');b.phase='wave';expect(padIdentity(e.pads[0],0,b,null).text).toBe('1 火塔');
  expect(padIdentity(e.pads[3],3,b,null)).toMatchObject({text:'4 留空',empty:true,reserved:true});
  b.phase='planning';b.budget=300;expect(padIdentity(e.pads[3],3,b,null).reserved).toBe(false);
 });
});
