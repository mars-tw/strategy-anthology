import {it,expect} from 'vitest';
import {freshCampaign} from '../src/campaign.js';
import {createExercise,buildTower,startWave,step} from '../src/engine.js';
import {SLUICE,openGate,gateWet} from '../src/content-r12.js';
import {gateDelayRows,gateLedgerHTML,polygonArea,waterLabelArea} from '../src/content-r15.js';
import {persist,loadSave,validateSave} from '../src/save.js';

function run(){const c=freshCampaign(),b=createExercise('sluice');c.exercises.battle=b;for(const [i,t]of ['cannon','frost','tesla'].entries())buildTower(c,b,t,SLUICE.pads[i].x,SLUICE.pads[i].y);startWave(b);while(b.time<18)step(c,b,1/60);openGate(b);return {c,b};}
it('R16 visible receipts include departed enemies and reconcile throughout actual water flow',()=>{
 const {c,b}=run();let departed=false;
 for(let n=0;n<510;n++){
  step(c,b,1/60);const rows=gateDelayRows(b),ids=Object.keys(b.gate.delays);
  expect(rows.map(r=>r.id).sort()).toEqual(ids.sort());
  expect(rows.reduce((sum,r)=>sum+r.cents,0)).toBe(Math.round(Number(b.gate.delay.toFixed(2))*100));
  for(const row of rows){const e=b.enemies.find(e=>e.id===row.id);expect(row.state==='涉水中').toBe(gateWet(b,e||{}));if(!gateWet(b,e||{}))departed=true;expect(Math.abs(row.cents/100-row.seconds)).toBeLessThan(.010001);}
 }
 expect(departed).toBe(true);expect(b.gate.left).toBe(0);expect(gateDelayRows(b).length).toBe(b.gate.wetIds.length);
});
it('R16 reconciled visible receipt and departed state survive save/load without rounding simulation data',()=>{
 const {c,b}=run();for(let n=0;n<90;n++)step(c,b,1/60);const exact=structuredClone(b.gate),html=gateLedgerHTML(b);
 const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
 expect(persist(storage,c)).toBe(true);const loaded=loadSave(storage).campaign.exercises.battle;
 expect(loaded.gate).toEqual(exact);expect(gateLedgerHTML(loaded)).toBe(html);expect(validateSave(c)).toBe(true);
 expect(gateDelayRows(b).some(r=>r.state!=='涉水中')).toBe(true);
});
it('R16 old aggregate is visible and included instead of fabricating per-enemy history',()=>{
 const {c,b}=run();for(let n=0;n<60;n++)step(c,b,1/60);delete b.gate.delays;
 expect(gateDelayRows(b).reduce((n,r)=>n+r.cents,0)).toBe(Math.round(b.gate.delay*100));
 step(c,b,1/60);const rows=gateDelayRows(b);expect(rows.some(r=>r.state==='舊存檔未分隻')).toBe(true);
 expect(rows.reduce((n,r)=>n+r.cents,0)).toBe(Math.round(b.gate.delay*100));expect(validateSave(c)).toBe(true);
});
it('R16 escaped or removed enemies retain a truthful outcome and displayed rounding matches the panel',()=>{
 const {c,b}=run();for(let n=0;n<60;n++)step(c,b,1/60);const id=Object.keys(b.gate.delays)[0];
 b.leakLog=[{id,wave:1,hp:1}];b.enemies=b.enemies.filter(e=>e.id!==id);
 expect(gateDelayRows(b).find(r=>r.id===id).state).toBe('已越線');
 const sample={enemies:[],gate:{used:true,delay:4.175,delays:{u1:{ordinal:1,seconds:4.175}}}};
 expect(gateDelayRows(sample)[0].cents/100).toBe(Number(sample.gate.delay.toFixed(2)));
});
it('R16 flood label coverage measures the real L-shaped water, leaving its dry corner available',()=>{
 const water=[{x:0,y:0},{x:20,y:0},{x:20,y:40},{x:60,y:40},{x:60,y:60},{x:0,y:60}];
 expect(polygonArea(water)).toBe(2000);
 expect(waterLabelArea(water,{x:30,y:10,w:10,h:10})).toBe(0);
 expect(waterLabelArea(water,{x:0,y:0,w:10,h:10})).toBe(100);
 expect(waterLabelArea(water,{x:10,y:30,w:30,h:20})).toBe(400);
});
