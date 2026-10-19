// Supplement the final-build screenshots with a surviving, genuinely slowed ice target.
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='docs/content/r6',sha=b=>createHash('sha256').update(b).digest('hex');
const base=JSON.parse(await readFile(out+'/e2e.json','utf8'));assert.equal(base.status,'VERIFIED');
const buildSHA256=sha(await readFile('dist/game.js'));assert.equal(base.buildSHA256,buildSHA256);
const server=await serve(0),browser=await chromium.launch({headless:true,channel:'chrome'}),proof={status:'EXECUTED',buildSHA256,method:'Public touch UI; the genuinely inherited ford frost tower, actual first wave. No game-state injection. Refresh only the three ice screenshots on the same verified build.',checks:[],shots:[]};
const check=(n,ok)=>{assert.ok(ok,n);proof.checks.push(n);};
try{
 const c=await browser.newContext({viewport:{width:430,height:932},hasTouch:true}),p=await c.newPage();
 p.on('pageerror',e=>{throw e;});await p.clock.install({time:new Date('2026-10-19T06:00:00Z')});await p.goto(`http://127.0.0.1:${server.address().port}`);await p.locator('[data-action=begin]').waitFor();await p.clock.pauseAt(new Date('2026-10-19T06:00:05Z'));
 const click=async a=>{const modal=p.locator('dialog[open]');await (await modal.count()?modal:p).locator(`[data-action=${a}]`).first().tap();},view=()=>p.locator('#world').evaluate(e=>JSON.parse(e.dataset.presentation));
 for(const a of ['pause','saves'])await click(a);await p.locator('#saveCode').fill(JSON.stringify({kind:'trine-frontier-save',campaign:JSON.parse(await readFile('docs/content/r5/attained-ford-save.json','utf8'))}));for(const a of ['preview','commit-import','begin','legacy-tower','next'])await click(a);await p.clock.runFor(25);const t=(await view()).towers[0];await p.locator('#world').tap({position:{x:t.x,y:t.y-t.h*.6}});await click('wave');
 let fx;for(let i=0;i<1600;i++){fx=(await view()).shotEvents.find(f=>f.color==='frost'&&!f.hit&&f.age>=.1&&f.age<.16);if(fx)break;await p.clock.runFor(25);}check('actual ice projectile reaches the target',!!fx);
 async function shot(state){await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));const path=`${out}/phone-impact-frost-${state}.png`;await p.screenshot({path});const row={path,viewport:{width:430,height:932},dpr:1,sha256:sha(await readFile(path))};proof.shots.push(row);base.shots[base.shots.findIndex(s=>s.path===path)]=row;}
 await shot('before');await p.clock.runFor(140);let v=await view();const hit=v.shotEvents.find(f=>f.towerId===fx.towerId&&f.targetId===fx.targetId&&f.hit);check('ice does 11 actual damage to a surviving enemy',hit?.actualDamage===11&&hit.hpBefore===76&&hit.hpAfter===65);check('living enemy receives the real 1.6 second slow',hit.slow===1.6);check('loupe shows the selected ice target',v.impactFocus?.towerId===t.id&&v.impactFocus.hp===65);await shot('hit');const a=v.units.find(u=>u.id===fx.targetId);
 await p.clock.runFor(130);v=await view();const z=v.units.find(u=>u.id===fx.targetId),distance=Math.hypot(z.nativeX-a.nativeX,z.nativeY-a.nativeY),elapsed=v.shotEvents.find(f=>f.towerId===fx.towerId&&f.targetId===fx.targetId).age-hit.age;check('same survivor advances at ice-slowed speed',elapsed>0&&Math.abs(distance-30*elapsed)<.05);await shot('after');proof.hit=hit;proof.actualDisplacement={requestedMs:130,elapsedSeconds:elapsed,distance,normalSpeed:54,iceSpeed:30};check('three distinct original PNGs',new Set(proof.shots.map(s=>s.sha256)).size===3);base.impacts.frost=hit;
 proof.status='VERIFIED';base.supplement={path:out+'/hit-proof.json',checks:proof.checks.length,method:proof.method};await writeFile(out+'/e2e.json',JSON.stringify(base,null,2));
}catch(e){proof.status='BLOCKED';proof.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(out+'/hit-proof.json',JSON.stringify(proof,null,2));console.log(proof.status+': '+proof.checks.length+' surviving-ice-target checks');}
