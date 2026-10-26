import {it,expect} from 'vitest';
import {relayQuote,wetRoute,gateLift} from '../src/content-r17.js';
import {freshCampaign} from '../src/campaign.js';
import {TERRAIN_ROUTES,FORD_TERRAIN_ROUTES,FLOOD_ZONE} from '../src/content-r1.js';
import {separateHealth} from '../src/content-r14.js';
import {threeBranchHTML} from '../src/content-r14.js';
import {intersects} from '../src/content-r8.js';
import {readFileSync} from 'node:fs';
import {branchScenario} from '../scripts/content-r17-scenarios.mjs';
it('R17 previews exact budget and retained positions without any mutation',()=>{
 const c=freshCampaign(),before=structuredClone(c);const quotes=['upstream','gate','crystals'].map(k=>relayQuote(c,k));
 expect(quotes.map(q=>q.balance)).toEqual([c.crystals,c.crystals,c.crystals+90]);expect(quotes[0].pad).toEqual({x:456,y:264});expect(quotes[1].pad).toEqual({x:744,y:408});expect(quotes[2].pad).toBeNull();expect(quotes[2].iceAfter).toBe(c.crystals+20);expect(c).toEqual(before);
});
it('R17 visible water entry and exit match the effective circle along both flood routes',()=>{
 for(const [route,y]of [[TERRAIN_ROUTES.flood,384],[FORD_TERRAIN_ROUTES.flood,425]]){const zone={...FLOOD_ZONE,y},parts=wetRoute(route,zone);expect(parts).toHaveLength(2);for(const p of parts)for(const q of [p.from,p.to])expect(Math.hypot(q.x-zone.x,q.y-zone.y)).toBeLessThanOrEqual(zone.radius+1e-8);expect(Math.hypot(parts[0].from.x-zone.x,parts[0].from.y-zone.y)).toBeCloseTo(zone.radius);expect(Math.hypot(parts.at(-1).to.x-zone.x,parts.at(-1).to.y-zone.y)).toBeCloseTo(zone.radius);}
});
it('R17 gate opens progressively, stays lifted after water stops and respects reduced motion',()=>{
 expect(gateLift({used:false},18)).toBe(0);expect(gateLift({used:true,at:18},18.4)).toBeCloseTo(.5);expect(gateLift({used:true,at:18},26.1)).toBe(1);expect(gateLift({used:true,at:18},18,true)).toBe(1);
});
it('R17 dense same-lane health bars never overlap at narrow phone sizes',()=>{
 for(const w of [296,414]){const units=Array.from({length:12},(_,i)=>({id:'u'+i,x:70,y:100+i*2,poseHeight:44,healthY:50+i*2,healthShown:true})),bars=separateHealth(units,w,220);expect(bars.length).toBe(12);for(let i=0;i<bars.length;i++)for(let j=i+1;j<bars.length;j++)expect(intersects(bars[i],bars[j])).toBe(false);}
});
it('R17 each existing branch has an evidenced context without changing enemies or combat rules',()=>{
 const source=JSON.parse(readFileSync('docs/content/r11/verification/input-fixtures/attained-quarry-save.json','utf8'));
 const rear=branchScenario(source,'rear'),budget=branchScenario(source,'budget');
 expect(rear.outcomes[1].hp).toBe(100);expect(rear.outcomes[1].hp).toBeGreaterThan(rear.outcomes[0].hp);expect(rear.outcomes[0].spent).toBe(rear.outcomes[1].spent);
 expect(budget.outcomes.every(r=>r.hp===100)).toBe(true);expect(budget.outcomes[2].time).toBeLessThan(budget.outcomes[0].time);expect(budget.outcomes[0].spent).toBe(360);expect(budget.outcomes[2].spent).toBe(460);
 expect(rear.outcomes[2].hp).toBe(0); // Preserve the unfavourable result too.
 // An interrupted replay may have three first-wave receipts but no full run.
 const partial=structuredClone(budget.campaign);for(const r of partial.decisionRecords)delete r.fullRun;
 const html=threeBranchHTML(partial,partial.battle),primary=html.split('<tbody>')[1].split('</tbody>')[0];
 expect(primary.match(/<tr>/g)).toHaveLength(3);expect(primary).toContain('耐久');expect(primary).toContain('漏入');expect(primary).toContain('秒數');expect(html).toContain('尚缺四波結果');
});
