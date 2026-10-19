import {describe,it,expect} from 'vitest';
import {freshCampaign,CHAPTERS} from '../src/campaign.js';
import {createBattle,startDecisionReplay,createExercise,buildTower,startWave,step,changeTerrain} from '../src/engine.js';
import {comparisonHTML,impactReadout,leakDescription,relayMini,RELAY_CHOICES} from '../src/content-r7.js';
import {decisionReview} from '../src/content-r6.js';
import {EXERCISES,BASE_ROUTE} from '../src/content-r1.js';
import {validateSave,persist,loadSave} from '../src/save.js';
import {placeAnnotation,intersects,exerciseLayout,enemyName,paintedWaterAt} from '../src/content-r8.js';
import {towerPoint,worldPoint,worldCell} from '../src/presentation-r7.js';
const wave=(c,b)=>{expect(startWave(b)).toBe(true);for(let n=0;n<18000&&!b.result&&b.phase==='active';n++)step(c,b,1/60);expect(b.phase==='planning'||!!b.result).toBe(true);};
const place=(c,b)=>{expect(buildTower(c,b,'frost',360,504)).toBe(true);expect(buildTower(c,b,'cannon',696,408)).toBe(true);};
describe('R8 auditable first-wave consequences',()=>{
 it('requires actual painted water as well as the simulation slow zone before showing a water label',()=>{
  const surface={width:2,height:2,mask:new Uint8Array([0,0,1,1])},patch={x:10,y:20,w:100,h:100};
  expect(paintedWaterAt(surface,{x:20,y:30},patch)).toBe(false);expect(paintedWaterAt(surface,{x:20,y:90},patch)).toBe(true);expect(paintedWaterAt(surface,{x:5,y:90},patch)).toBe(false);
 });
 it('maps visible northern terrain placements back to the intended real construction cell',()=>{
  for(const [width,height]of [[296,140],[406,350],[1000,600]])for(const p of [{x:360,y:504},{x:696,y:408},{x:552,y:264}]){const profile={northInset:Math.min(.38,83/height),flat:false},screen=worldPoint(p.x,p.y,width,height,profile);expect(worldCell(screen.x,screen.y,width,height,profile)).toEqual(p);}
 });
 it('uses one immutable first-wave snapshot for heading, summary, table, persistence and later waves',()=>{
  const c=freshCampaign();c.battle=createBattle(0,c);const b=c.battle;for(const [i,t]of ['cannon','frost','tesla'].entries()){const p=EXERCISES[0].pads[i];buildTower(c,b,t,p.x,p.y);}wave(c,b);
  const r=structuredClone(b.firstWaveDecision);expect(r.totalDamage).toBe(Object.values(b.decisionStats.towers).reduce((n,t)=>n+t.damage,0));expect(r.totalHits).toBe(Object.values(b.decisionStats.towers).reduce((n,t)=>n+t.hits,0));
  expect(decisionReview(b).join('')).toContain(`${r.totalDamage} 傷害`);wave(c,b);expect(b.firstWaveDecision).toEqual(r);expect(decisionReview(b).join('')).toContain(`${r.totalDamage} 傷害`);expect(comparisonHTML(c,b)).toContain(`<td>${r.totalDamage}</td>`);
  const m=new Map(),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};expect(persist(store,c)).toBe(true);expect(loadSave(store).campaign.battle.firstWaveDecision).toEqual(r);
  for(const value of [NaN,-1,Infinity]){const copy=structuredClone(c);copy.battle.firstWaveDecision.totalDamage=value;expect(validateSave(copy)).toBe(false);}
  for(const key of ['spent','kills','hp','wetCount','waterDelay','branch','terrain']){const copy=structuredClone(c);copy.battle.firstWaveDecision[key]='<img src=x onerror=alert(1)>';expect(validateSave(copy)).toBe(false);}
 });
 it('compares real same-budget same-position terrain combat and explicitly separates elapsed travel from added delay',()=>{
  const c=freshCampaign(),source=createBattle(0,c);const outcomes=[];
  for(const terrain of ['flood','barricade']){const b=startDecisionReplay(c,source,'none',terrain);place(c,b);wave(c,b);outcomes.push(b.firstWaveDecision);expect(b.firstWaveDecision.totalHits).toBeGreaterThan(0);expect(b.spent).toBe(200);expect(validateSave(c)).toBe(true);}
  expect(outcomes[0].formation).toEqual(outcomes[1].formation);expect(outcomes[0].waterDelay).toBeGreaterThan(0);expect(outcomes[1].waterDelay).toBe(0);expect(outcomes[1].detourSeconds).toBeGreaterThan(0);
  const html=comparisonHTML(c,source);expect(html).toContain('差異');expect(html).toContain('新建塔位／等級相同');expect(html).toContain('兩者不可相減');expect(outcomes[0].totalHits).not.toBe(outcomes[1].totalHits);
 });
 it('gates empty samples and omits terrain rows in relay-only comparison',()=>{
  const c=freshCampaign();Object.assign(c,{chapter:4,completed:CHAPTERS.slice(0,4).map(x=>x.id),quarryLegacy:'upstream',crystals:800});const b=createBattle(4,c);c.battle=b;
  expect(comparisonHTML(c,b)).not.toContain('<table');expect(comparisonHTML(c,b)).toContain('先確認');wave(c,b);expect(comparisonHTML(c,b)).not.toContain('涉水');expect(comparisonHTML(c,b)).toContain('留塔傷害');
 });
 it('never exposes actor identifiers as visible player names and preserves escaped metadata',()=>{
  const b=createExercise('turn');b.towers=[{id:'t1',type:'cannon',inherited:true}];b.enemies=[{id:'u4',type:'miremaw',hp:30,slow:0}];b.firstLeak={id:'u4',hp:30,segment:3};b.hitLog=[{towerId:'t1',targetId:'u4',color:'cannon',bonus:0,baseDamage:26,bonusDamage:0,damage:26,actualDamage:26,hpBefore:56,hpAfter:30}];
  const text=impactReadout(b).html.replace(/<[^>]+>/g,'');expect(text).toContain('留守火塔1');expect(text).toContain('第 1 隻甲犬');expect(text).not.toMatch(/\b[tu]\d+\b/);expect(leakDescription(b)).not.toMatch(/\b[tu]\d+\b/);
 });
 it('retains the original enemy spawn ordinal after earlier enemies retire and through the hit log',()=>{
  const b=createExercise('turn');b.enemies=[{id:'u9',ordinal:5,type:'miremaw'}];expect(enemyName(b,'u9')).toBe('第 5 隻甲犬');b.hitLog=[{targetId:'u9',targetOrdinal:5,targetType:'miremaw'}];b.enemies=[];expect(enemyName(b,'u9')).toBe('第 5 隻甲犬');b.firstLeak={id:'u12',ordinal:8,type:'miremaw'};expect(enemyName(b,'u12')).toBe('第 8 隻甲犬');
 });
 it('miniatures have distinct exact route coverage, same camera, and first contact marks',()=>{
  const minis=Object.keys(RELAY_CHOICES).map(id=>relayMini(id,BASE_ROUTE));expect(new Set(minis).size).toBe(3);for(const html of minis){expect(html).toContain('viewBox="0 0 960 640"');expect(html).toContain('covered-piece');expect(html).toContain('first-contact');}
 });
 it('places feedback away from real actor/tower rectangles and does not invent space when crowded',()=>{
  const obstacles=[{x:100,y:60,w:70,h:100},{x:220,y:90,w:60,h:80}];const r=placeAnnotation({x:135,y:110},406,350,obstacles,70,23);expect(r).not.toBeNull();expect(obstacles.every(a=>!intersects(a,r))).toBe(true);expect(placeAnnotation({x:10,y:10},20,20,[],70,23)).toBeNull();
 });
 it('separates gate fire, ice and lightning bodies while keeping their true simulation anchors',()=>{
  const towers=[{type:'cannon',x:744,y:408,inherited:true},{type:'frost',x:696,y:408},{type:'tesla',x:744,y:360}].map(t=>towerPoint(t,406,350));
  for(const t of towers){expect(t.h).toBeGreaterThanOrEqual(44);expect(t.anchorX).toBeGreaterThan(290);}
  for(let i=0;i<towers.length;i++)for(let j=i+1;j<towers.length;j++){const a=towers[i],b=towers[j];expect(intersects({x:a.x-a.h*.4,y:a.y-a.h,w:a.h*.8,h:a.h},{x:b.x-b.h*.4,y:b.y-b.h,w:b.h*.8,h:b.h})).toBe(false);}
 });
 for(const e of EXERCISES)it(e.id+' gives every tower a complete separate display base at phone scale',()=>{const p=exerciseLayout(e.pads,406,350);expect(p).toHaveLength(e.pads.length);for(const a of p){expect(a.y-a.h).toBeGreaterThanOrEqual(0);expect(a.x-a.h*.4).toBeGreaterThanOrEqual(0);expect(a.x+a.h*.4).toBeLessThanOrEqual(406);}for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)expect(intersects({x:p[i].x-p[i].h*.4,y:p[i].y-p[i].h,w:p[i].h*.8,h:p[i].h},{x:p[j].x-p[j].h*.4,y:p[j].y-p[j].h,w:p[j].h*.8,h:p[j].h})).toBe(false);});
});
