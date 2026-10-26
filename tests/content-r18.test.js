import {describe,it,expect} from 'vitest';
import {relayQuote,relayQuoteHTML,terrainChoiceHTML} from '../src/content-r18.js';
import {gateTrialsHTML} from '../src/content-r13.js';

describe('R18 player-facing choices and budget preview',()=>{
 it('shows the salvage credit as a separate, accurately summed receipt',()=>{
  const c={crystals:50},q=relayQuote(c,'crystals'),html=relayQuoteHTML(c,'crystals');
  expect(q.balance).toBe(140);expect(q.salvage).toBe(90);expect(q.iceAfter).toBe(70);expect(q.upgradeAfter).toBe(80);
  expect(html).toContain('目前 50 ＋拆取 90 ＝ 140 枚結晶');expect(html).toContain('拆取收入只在確認這案後入帳');
  expect(html).not.toMatch(/\(\d+,\s*\d+\)/);expect(html).not.toContain('餘額含拆取');
 });
 it.each([['upstream','上游長路旁'],['gate','城門前路旁'],['crystals','示意塔位在中段轉角']])('uses the %s route landmark as the location', (choice,label)=>{
  expect(relayQuoteHTML({crystals:200},choice)).toContain(label);
 });
 it.each(['barricade','flood'])('marks %s as selected and states the matching construction cost',choice=>{
  const html=terrainChoiceHTML(choice,30),selected=html.match(/class="terrain-choice selected" aria-pressed="true"/g)||[];
  expect(selected).toHaveLength(1);expect(html).toContain('目前選擇：');expect(html).toContain('施工花費 30 結晶');
  expect(html).toContain(choice==='flood'?'放水・敵軍經南側濕地':'堵隘口・敵軍改走北側長路');
 });
 it('reports observed sluice outcomes without claiming an unproved cause',()=>{
  const c={exercises:{gateTrials:[
   {at:0,kills:5,wet:1,spent:300,budget:0,delay:0,result:'lost',formation:[{type:'cannon',x:216,y:264,level:1}]},
   {at:18,kills:10,wet:6,spent:300,budget:0,delay:1.3,result:'won',formation:[{type:'cannon',x:216,y:264,level:1}]},
   {at:null,kills:6,wet:0,spent:300,budget:0,delay:0,result:'lost',formation:[{type:'cannon',x:216,y:264,level:1}]},
  ]}},html=gateTrialsHTML(c);
  expect(html).toContain('0.0秒開閘：進水1隻、攔下5/10');expect(html).toContain('不開閘：進水0隻、攔下6/10');
  expect(html).toContain('這些摘要數字無法判定不同開閘時機造成結果差異的原因。');expect(html).not.toContain('太早開，水先流走');
 });
});
