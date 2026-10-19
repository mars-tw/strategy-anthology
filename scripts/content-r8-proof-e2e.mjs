import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
import {worldPoint} from '../src/presentation-r7.js';
const out='docs/content/r8',key='trine-frontier:campaign:v1',server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={status:'EXECUTED',method:'Additional screenshot proof through public UI. Natural quarry-victory import, isolated replay, all four waves and original-wallet return. No game-state, health, money or outcome injection.',buildSHA256:sha(await readFile('dist/game.js')),checks:[],shots:[],errors:[]};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true}),p=await ctx.newPage();
p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(![url,'data:','blob:'].some(a=>r.url().startsWith(a)))report.errors.push(r.url());});
const click=async a=>{const root=await p.locator('dialog[open]').count()?p.locator('dialog[open]'):p;await root.locator(`[data-action="${a}"]`).first().tap();};
const view=()=>p.locator('#world').evaluate(c=>JSON.parse(c.dataset.presentation));
const saved=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function shot(name){const path=`${out}/phone-${name}.png`;await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await p.screenshot({path});report.shots.push({path,viewport:{width:430,height:932},dpr:1,sha256:sha(await readFile(path)),frame:await view()});console.log('PROOF '+name);}
async function place(type,x,y){await click('tower-'+type);const r=await p.locator('#world').boundingBox(),v=await view();await p.locator('#world').tap({position:worldPoint(x,y,r.width,r.height,v.projection)});await click('confirm');await p.clock.runFor(25);}
try{
 await p.clock.install({time:new Date('2026-10-19T06:00:00Z')});await p.goto(url);await p.locator('[data-action=begin]').waitFor();await p.clock.pauseAt(new Date('2026-10-19T06:00:05Z'));
 const source=await readFile('docs/content/r6/attained-quarry-save.json');report.sourceSaveSHA256=sha(source);
 await click('pause');await click('saves');await p.locator('#saveCode').fill(JSON.stringify({kind:'trine-frontier-save',campaign:JSON.parse(source)}));await click('preview');await click('commit-import');await click('begin');await click('quarry-gate');await click('next');await p.clock.runFor(25);
 const original=await saved();await shot('relay-original-before-replay');await click('pause');await click('decisions');await click('replay');await click('start-replay');
 await place('frost',696,408);await place('tesla',744,360);
 for(let upgrade=0;upgrade<2;upgrade++){const tower=(await view()).towers.find(t=>t.type==='tesla');await p.locator('#world').tap({position:{x:tower.x,y:tower.y-tower.h*.25}});await click('confirm');await p.clock.runFor(25);}
 check('real gate setup uses two paid towers and two Tesla upgrades',(await saved()).decisionReplay.spent===320&&(await saved()).decisionReplay.towers.find(t=>t.type==='tesla').level===3);
 await click('wave');let fourth=false;
 for(let n=0;n<600;n++){
  if(await p.locator('[data-action=return-campaign]').count())break;
  const wave=p.locator('[data-action=wave]');if(await wave.count()&&await wave.isEnabled())await click('wave');
  await p.clock.runFor(1000);
  const v=await view(),text=await p.locator('#fieldStatus').innerText();
  if(!fourth&&text.includes('第 4/4 波')&&v.shotEvents.some(f=>f.hit&&v.units.some(u=>u.id===f.targetId))){await shot('relay-replay-wave4-combat');await p.clock.runFor(250);await shot('relay-replay-wave4-combat-2');fourth=true;}
 }
 const finished=await saved();
 check('fourth-wave combat was visible and the replay genuinely won all four waves',fourth&&finished.decisionReplay.result==='won'&&finished.decisionReplay.wave===4);
 check('no shared-currency debit, reward or original-combat mutation',finished.crystals===original.crystals&&finished.decisionReplay.earnings===0&&JSON.stringify(finished.battle)===JSON.stringify(original.battle)&&JSON.stringify(finished.salvageCredits)===JSON.stringify(original.salvageCredits));
 report.original={crystals:original.crystals,battleSHA256:sha(Buffer.from(JSON.stringify(original.battle)))};report.finished={crystals:finished.crystals,wave:finished.decisionReplay.wave,result:finished.decisionReplay.result,budget:finished.decisionReplay.budget,spent:finished.decisionReplay.spent};
 await shot('relay-replay-four-waves-complete');await click('return-campaign');await p.clock.runFor(25);await shot('relay-original-after-replay');
 await p.reload();await p.locator('[data-action=begin]').waitFor();await click('begin');await p.clock.runFor(25);
 check('return and reload preserve the original wallet and single inherited tower',(await saved()).crystals===original.crystals&&JSON.stringify((await saved()).battle)===JSON.stringify(original.battle));await shot('relay-original-return-reloaded');
 check('no runtime errors or outside requests',report.errors.length===0);report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/proof-e2e.json`,JSON.stringify(report,null,2));console.log(`${report.status}: ${report.checks.length} supplemental checks, ${report.shots.length} originals`);}
