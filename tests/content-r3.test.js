import {describe,it,expect} from 'vitest';
import {padLabels,routeProgress} from '../src/content-r3.js';
import {freshCampaign} from '../src/campaign.js';
import {validateSave,loadSave,persist} from '../src/save.js';
import {createBattle,createExercise,changeTerrain,buildTower,upgradeTower,startWave,step} from '../src/engine.js';
import {EXERCISES} from '../src/content-r1.js';

describe('R3 complete paths and saved preview',()=>{
 it('first-run preview flag survives save and rejects nonboolean input while old saves remain valid',()=>{
  const c=freshCampaign(),data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  expect(validateSave(c)).toBe(true);c.routePreviewSeen=true;expect(persist(storage,c)).toBe(true);expect(loadSave(storage).campaign.routePreviewSeen).toBe(true);
  c.routePreviewSeen='true';expect(validateSave(c)).toBe(false);
 });
 it('all five labels stay separate at the smallest phone width',()=>{
  for(const width of [296,320,406,1032])for(const e of EXERCISES){const labels=padLabels(e.pads,width,250);for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)expect(Math.abs(labels[i].x-labels[j].x)>=labels[i].width||Math.abs(labels[i].y-labels[j].y)>=labels[i].height).toBe(true);}
 });
 for(const choice of ['barricade','flood'])it(choice+' tracks an actual enemy through bends, wet speed and arrival',()=>{
  const c=freshCampaign(),b=createBattle(0,c);changeTerrain(c,b,choice);buildTower(c,b,'frost',120,552);startWave(b);
  const stages=new Set();let wet=false,arrival=false;
  for(let n=0;n<6000&&!arrival;n++){step(c,b,1/60);const p=routeProgress(b);if(!p)continue;stages.add(b.enemies[0].route);if(p.wet){wet=true;expect(p.speed).toBe(26);}arrival=p.escaped;if(arrival)expect(p.percent).toBe(100);}
  expect(stages.size).toBeGreaterThanOrEqual(5);expect(arrival).toBe(true);expect(wet).toBe(choice==='flood');
 });
 for(const [id,bad] of [['turn',[0,3,4]],['levee',[0,1,3]],['switchback',[1,4,5]]])it(id+' has a winning and losing placement at identical full spend',()=>{
  const e=EXERCISES.find(e=>e.id===id);
  for(const [indices,expected] of [[[0,1,2],'won'],[bad,'lost']]){const c=freshCampaign(),b=createExercise(id);
   for(const [i,type] of ['cannon','frost','tesla'].entries()){const p=e.pads[indices[i]];expect(buildTower(c,b,type,p.x,p.y)).toBe(true);}
   if(id==='switchback')expect(upgradeTower(c,b,b.towers[2].id)).toBe(true);
   expect(b.budget).toBe(0);startWave(b);for(let n=0;n<8000&&!b.result;n++)step(c,b,1/60);
   expect(b.result).toBe(expected);expect(b.hp).toBe(expected==='won'?100:88);expect(c.crystals).toBe(360);
  }
 });
});
