import assert from 'node:assert/strict';
import {chooseQuarryLegacy} from '../src/campaign.js';
import {createBattle,startDecisionReplay,buildTower,upgradeTower,startWave,step} from '../src/engine.js';
import {validateSave} from '../src/save.js';
// Deterministic real engine runs from the existing attained campaign. No fields
// in a combat result, damage event, budget or receipt are assigned by this study.
export function branchScenario(attained,id){
 const c=structuredClone(attained);assert.ok(chooseQuarryLegacy(c,'upstream'));
 const source=createBattle(4,c);c.battle=source;
 const setup=id==='rear'?[['cannon',552,264],['frost',744,360],['tesla',696,408]]:[['cannon',552,264],['frost',600,264],['tesla',552,312]];
 const outcomes=[];
 for(const branch of ['upstream','gate','crystals']){
  const b=startDecisionReplay(c,source,branch,'none');
  for(const [type,x,y]of setup)assert.ok(buildTower(c,b,type,x,y));
  assert.ok(upgradeTower(c,b,b.towers.find(t=>!t.inherited&&t.type==='cannon').id));
  // Same purchase rule for all branches: buy an early extra fire tower only
  // when the remaining starting budget can afford it. No later kill income.
  if(id==='budget'&&b.budget>=100)assert.ok(buildTower(c,b,'cannon',360,264));
  for(let wave=1;wave<=4&&!b.result;wave++){assert.ok(startWave(b));for(let n=0;n<20000&&b.phase==='active'&&!b.result;n++)step(c,b,1/60);}
  assert.ok(b.result&&b.fullRun);assert.ok(validateSave(c));outcomes.push({branch,...structuredClone(b.fullRun),formation:structuredClone(b.towers)});
 }
 assert.equal(c.crystals,attained.crystals);return {campaign:c,id,setup,outcomes,rule:id==='rear'?'Same three paid rear-support pads; upgrade the new fire tower once.':'Same central trio, upgrade the new fire tower once; buy an extra early fire tower at (360,264) only if the starting balance can afford 100.'};
}
