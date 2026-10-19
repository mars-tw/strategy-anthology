import {describe,it,expect} from 'vitest';
import {coveredRoute,towerRadius,shortfall,formationFeedback} from '../src/content-r2.js';
import {BASE_ROUTE,TERRAIN_ROUTES} from '../src/content-r1.js';
import {freshCampaign} from '../src/campaign.js';
import {createExercise,buildTower,startWave,step} from '../src/engine.js';
describe('R2 decisions use combat coordinates',()=>{
 it('coverage clips a crossing segment to the exact combat circle',()=>{
  const t={type:'cannon',x:300,y:192},pieces=coveredRoute(t,[{x:0,y:192},{x:700,y:192}]);
  expect(towerRadius(t)).toBe(160);expect(pieces).toEqual([[{x:140,y:192},{x:460,y:192}]]);
 });
 it('north detour can lose the original corner coverage',()=>{
  const t={type:'frost',x:456,y:300};expect(coveredRoute(t,BASE_ROUTE).length).toBeGreaterThan(0);expect(coveredRoute(t,TERRAIN_ROUTES.barricade)).toEqual([]);
 });
 it('every covered interval stays inside its own tower radius',()=>{
  for(const type of ['cannon','frost','tesla'])for(const route of Object.values(TERRAIN_ROUTES)){
   const t={type,x:552,y:264};for(const piece of coveredRoute(t,route))for(const p of piece)expect(Math.hypot(p.x-t.x,p.y-t.y)).toBeLessThanOrEqual(towerRadius(t)+1e-8);
  }
 });
 it('shortfall is exact and never negative',()=>{expect(shortfall(30,130)).toBe(100);expect(shortfall(300,130)).toBe(0);});
 it('completion describes actual formation rather than a fixed lesson',()=>{
  expect(formationFeedback({trinity:true,towers:[]})).toContain('+30%');
  expect(formationFeedback({trinity:false,towers:['cannon','frost','tesla'].map(type=>({type}))})).toContain('分散接力');
  expect(formationFeedback({trinity:false,towers:[{type:'frost'}]})).toContain('元素未齊');
 });
 for(const id of ['turn','levee','switchback'])it(id+' stops on the first escaped actor, before the next frame',()=>{
  const c=freshCampaign(),b=createExercise(id);buildTower(c,b,'frost',id==='levee'?216:552,264);startWave(b);
  let lastHP=100;for(let i=0;i<9000&&!b.result;i++){lastHP=b.hp;step(c,b,1/60);}expect(lastHP).toBe(100);expect(b.result).toBe('lost');expect(b.hp).toBe(88);expect(b.enemies.filter(e=>e.escaped)).toHaveLength(1);const time=b.time;step(c,b,1/60);expect(b.time).toBe(time);
 });
});
