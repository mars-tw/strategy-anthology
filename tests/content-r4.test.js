import {describe,it,expect} from 'vitest';
import {salvageFrame,routeConclusions,deployedCard} from '../src/content-r4.js';
import {freshCampaign,chooseFordLegacy} from '../src/campaign.js';
import {createBattle,buildTower,startWave,step,resonance} from '../src/engine.js';
import {validateSave,persist,loadSave} from '../src/save.js';
import {TERRAIN_ROUTES} from '../src/content-r1.js';
import {EXERCISES} from '../src/content-r1.js';
import {padLabels} from '../src/content-r3.js';
import {towerPoint} from '../src/presentation-r7.js';

describe('R4 visible decision chains',()=>{
 it('nearby pad labels remain distinct even on a 320px phone with a short battlefield',()=>{
  for(const [w,h]of [[296,150],[296,170],[406,430],[1032,700]])for(const e of EXERCISES){const anchors=e.pads.map((p,i)=>towerPoint({...p,type:['cannon','frost','tesla'][i%3]},w,h)),labels=padLabels(e.pads,w,h,anchors);
   for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)expect(Math.abs(labels[i].x-labels[j].x)>=52||Math.abs(labels[i].y-labels[j].y)>=23).toBe(true);
  }
 });
 it('credit waits for arrival on screen while persisted once-only balance survives interruption',()=>{
  const c=freshCampaign();c.chapter=2;c.completed=['pine-watch','ford-assault'];c.battle=createBattle(1);c.battle.result='won';c.fordLegacy='pending';c.crystals=411;
  expect(chooseFordLegacy(c,'crystals')).toBe(true);expect(c.crystals).toBe(501);expect(chooseFordLegacy(c,'crystals')).toBe(false);
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};expect(persist(storage,c)).toBe(true);
  const restored=loadSave(storage).campaign;expect(restored.crystals).toBe(501);expect(chooseFordLegacy(restored,'crystals')).toBe(false);
  const frames=[0,650,1300].map(t=>salvageFrame(t,411,501,{x:35,y:350},{x:280,y:30}));
  expect(frames.map(f=>f.money)).toEqual([411,411,501]);expect(new Set(frames.map(f=>`${f.x},${f.y}`)).size).toBe(3);
  expect(frames[1].y).toBeLessThan(350);expect(frames[2].arrived).toBe(true);
 });
 it('inherited level-one frost participates in resonance and actually fires first-wave frost shots',()=>{
  const c=freshCampaign();c.fordLegacy='tower';const b=createBattle(2,c),inherited=b.towers[0];
  expect(inherited.inherited).toBe(true);expect(buildTower(c,b,'cannon',552,264)).toBe(true);expect(buildTower(c,b,'tesla',552,312)).toBe(true);
  expect(resonance(inherited,b.towers).trinity).toBe(true);expect(startWave(b)).toBe(true);
  let shot;for(let i=0;i<3000&&!shot;i++){step(c,b,1/60);shot=b.effects.find(e=>e.kind==='shot'&&e.x===600&&e.y===264);}
  expect(shot?.color).toBe('frost');expect(shot?.slow).toBeGreaterThan(0);expect(b.trinity).toBe(true);
 });
 it('preview returns exactly one independently calculated row per element for empty and built maps',()=>{
  expect(routeConclusions([],TERRAIN_ROUTES.barricade).map(r=>r.text)).toEqual(['尚未部署','尚未部署','尚未部署']);
  const rows=routeConclusions([{type:'cannon',x:552,y:264},{type:'frost',x:600,y:264},{type:'tesla',x:552,y:312}],TERRAIN_ROUTES.barricade);
  expect(rows.map(r=>r.covers)).toEqual([false,true,false]);
 });
 it('deployed but unaffordable cards retain identity and separate on-field state from repeat cost',()=>{
  const state=deployedCard('frost',[{type:'frost'}],0,70);expect(state).toMatchObject({count:1,poor:true,muted:false,status:'場上已有 1 座',purchase:'再建需 70 結晶'});
  expect(deployedCard('frost',[],0,70).muted).toBe(true);
 });
});
