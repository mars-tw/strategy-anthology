import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
import {worldPoint} from '../src/presentation-r7.js';
const out='docs/content/r9',key='trine-frontier:campaign:v1',server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome'});
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
 let sourcePath='docs/content/r9/verification/attained-quarry-save.json';const source=await readFile(sourcePath).catch(()=>{sourcePath='docs/content/r6/attained-quarry-save.json';return readFile(sourcePath);});report.sourceSavePath=sourcePath;report.sourceSaveSHA256=sha(source);
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
 // A second serial context gives the visible detour more time between frames.
 // Close the replay page first; do not run a second browser or server.
 await ctx.close();const tc=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true}),tp=await tc.newPage();
 tp.on('pageerror',e=>report.errors.push(e.message));tp.on('request',r=>{if(![url,'data:','blob:'].some(a=>r.url().startsWith(a)))report.errors.push(r.url());});
 await tp.clock.install({time:new Date('2026-10-19T06:00:00Z')});await tp.goto(url);await tp.locator('[data-action=begin]').waitFor();await tp.clock.pauseAt(new Date('2026-10-19T06:00:05Z'));
 const tv=()=>tp.locator('#world').evaluate(c=>JSON.parse(c.dataset.presentation)),tap=a=>tp.locator(`[data-action="${a}"]`).first().tap();
 await tap('begin');await tap('route-aid');await tap('terrain');await tap('apply-terrain');
 for(const [type,x,y]of [['frost',360,504],['cannon',696,408]]){await tap('tower-'+type);const r=await tp.locator('#world').boundingBox();await tp.locator('#world').tap({position:worldPoint(x,y,r.width,r.height,(await tv()).projection)});await tap('confirm');}
 await tap('wave');let leader;
 for(let n=0;n<1000;n++){leader=(await tv()).units.find(u=>u.nativeX>=285&&u.nativeX<305&&Math.abs(u.nativeY-192)<1);if(leader)break;await tp.clock.runFor(50);}
 check('detour leader naturally reaches the closed-road approach',!!leader);report.terrainTrack=[];
 for(let n=1;n<=3;n++){const frame=await tv(),unit=frame.units.find(u=>u.id===leader.id);check('detour frame '+n+' retains same live enemy and mandatory wave state',!!unit&&await tp.locator('#fieldStatus').innerText().then(t=>t.includes('防線')&&t.includes('第 1/2 波')));report.terrainTrack.push(unit);const path=`${out}/phone-terrain-barricade-proof-turn-${n}.png`;await tp.screenshot({path});report.shots.push({path,viewport:{width:430,height:932},dpr:1,sha256:sha(await readFile(path)),frame});console.log('PROOF detour '+n);if(n<3)await tp.clock.runFor(2400);}
 const [a,z,q]=report.terrainTrack;
 check('same enemy visibly turns north then advances east along the new road',z.nativeY<a.nativeY&&q.nativeX>z.nativeX&&q.nativeY<=110&&Math.hypot(z.x-a.x,z.y-a.y)>15&&Math.hypot(q.x-z.x,q.y-z.y)>15);
 check('detour retains painted blockade with optional arrows switched off',(await tv()).blockade.w>=88&&(await tv()).contentR2.arrows.length===0);
 // The same public auxiliary-off setting also provides a clean failure view;
 // numbered tower labels and mandatory defense/wave information stay visible.
 await tap('chronicle');await tap('exercises');await tap('exercise-hollow');
 for(const [type,moves]of [['cannon',3],['frost',0],['tesla',2]]){await tap('tower-'+type);for(let n=0;n<moves;n++)await tap('suggest');await tap('confirm');}
 await tap('wave');for(let n=0;n<300&&!await tp.locator('[data-action=retry]').count();n++)await tp.clock.runFor(1000);
 const failed=await tp.locator('.result>p').innerText();check('failure shows genuine leaker before optional hint without giving a solution',/首漏敵軍.*第 3 隻甲犬/.test(failed)&&!/打不到|少了一座|第 4 號/.test(failed)&&await tp.locator('[data-action=exercise-hint]').isVisible());
 check('auxiliary-off failure retains all numbered tower identities and mandatory defense',((await tv()).padLabels.length===5)&&await tp.locator('#fieldStatus').isVisible());
 {const path=`${out}/phone-exercise-hollow-failed-clear.png`;await tp.screenshot({path});report.shots.push({path,viewport:{width:430,height:932},dpr:1,sha256:sha(await readFile(path)),frame:await tv()});console.log('PROOF hollow failure auxiliary-off');}
 await tc.close();
 check('no runtime errors or outside requests',report.errors.length===0);report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/proof-e2e.json`,JSON.stringify(report,null,2));console.log(`${report.status}: ${report.checks.length} supplemental checks, ${report.shots.length} originals`);}
