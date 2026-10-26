import {describe,it,expect} from 'vitest';
import {firstWaveScope,scopedImpactHTML,scopedGateLedgerHTML,scopedFullRunHTML} from '../src/content-r19.js';
import {gateDelayRows,gateLedgerHTML} from '../src/content-r15.js';
import {impactReadout} from '../src/content-r7.js';

describe('R19 truthful scope labels and collapsible details',()=>{
 it('distinguishes an in-progress first-wave receipt from a settled one',()=>{
  const live={wave:1,decisionStats:{towers:{t1:{hits:2,damage:52}}}};
  expect(firstWaveScope(live,'t1')).toBe('首波進行中');
  expect(firstWaveScope({...live,firstWaveDecision:{inheritedHits:2,inheritedDamage:52}},'t1')).toBe('首波已結算');
  expect(firstWaveScope({wave:2,decisionStats:{towers:{t1:{hits:9}}}},'t1')).toBeNull();
 });
 it('wraps the actual impactReadout while keeping its selectors and values',()=>{
  const event={towerId:'t1',targetId:'u1',targetType:'miremaw',color:'cannon',baseDamage:26,bonusDamage:0,damage:26,actualDamage:26,hpBefore:95,hpAfter:69,slowAfter:0};
  const battle={wave:1,towers:[{id:'t1',type:'cannon',level:1,inherited:true}],enemies:[{id:'u1',type:'miremaw',ordinal:1}],hitLog:[event],decisionStats:{towers:{t1:{hits:2,damage:52}}}};
  const detail=impactReadout(battle,'t1'),html=scopedImpactHTML(detail,battle,'t1');
  expect(html).toContain('data-action="watch-hit"');expect(html).toContain('hit-summary');expect(html).toContain('−26');
  expect(html).toContain('data-detail-key="hit:t1"');expect(html).toContain('最新一擊');expect(html).toContain('首波進行中・留塔 2 次／52 傷害');
  expect(html).not.toContain('本波擊退');
 });
 it('leaves an unavailable first-wave aggregate unknown instead of displaying zero',()=>{
  const event={towerId:'t1',targetId:'u1',targetType:'miremaw',color:'cannon',baseDamage:26,bonusDamage:0,damage:26,actualDamage:26,hpBefore:95,hpAfter:69,slowAfter:0};
  const battle={wave:2,towers:[{id:'t1',type:'cannon',level:1,inherited:true}],enemies:[{id:'u1',type:'miremaw',ordinal:1}],hitLog:[event]};
  const html=scopedImpactHTML(impactReadout(battle,'t1'),battle,'t1');expect(firstWaveScope(battle,'t1')).toBeNull();expect(html).toContain('最新一擊');expect(html).not.toContain('首波已結算');expect(html).not.toContain('首波進行中');expect(html).not.toContain('首波留塔 0');
 });
 it('wraps real gate receipts without changing their displayed values or rounding sum',()=>{
  const b={gate:{used:true,delay:1.239,wetIds:['e1'],delays:{e1:{ordinal:1,seconds:.615},e2:{ordinal:2,seconds:.624}}},enemies:[{id:'e1',hp:1},{id:'e2',hp:0}],leakLog:[]};
  const rows=gateDelayRows(b),ledger=gateLedgerHTML(b),html=scopedGateLedgerHTML(b,ledger);
  expect(rows.reduce((sum,row)=>sum+row.cents,0)).toBe(Math.round(Number(b.gate.delay.toFixed(2))*100));
  expect(html).toContain('data-detail-key="sluice-ledger"');expect(html).toContain('本場一次');expect(html).toContain('1.24');expect(html).toContain('2 筆');
 });
 it('keeps legacy aggregate delay explicit rather than inventing per-enemy rows',()=>{
  const b={gate:{used:true,delay:2.5,wetIds:[]},enemies:[],leakLog:[]},rows=gateDelayRows(b),html=scopedGateLedgerHTML(b,gateLedgerHTML(b));
  expect(rows).toHaveLength(1);expect(rows[0].state).toBe('舊存檔未分隻');expect(html).toContain('舊紀錄');expect(html).toContain('+2.50秒');expect(html).toContain('1 筆');
 });
 it('marks an existing full-run receipt as whole-chapter without changing it',()=>{
  const original='<p class="full-run-summary">4/4波・防線 <b>100/100</b>・漏0隻・88.0秒</p>';
  const html=scopedFullRunHTML(original);expect(html).toContain('全章');expect(html).toContain('4/4波');expect(html).toContain('88.0秒');
 });
});
