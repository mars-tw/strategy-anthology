import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {freezeReloadedClock} from './freeze-test-clock.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
import {worldPoint} from '../src/presentation-r7.js';
import {acknowledgeRoutePreview} from './r3-onboarding.mjs';
const out=evidenceDir('content-r13'),key='trine-frontier:campaign:v1';await mkdir(out,{recursive:true});
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={status:'EXECUTED',method:'Serial headless public touch UI, real fixed-step simulation via virtual clock, attained saves imported only through public restore. No injected currency, damage, enemies or outcomes.',buildSHA256:sha(await readFile('dist/game.js')),checks:[],shots:[],errors:[],outcomes:[]};
const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);};
const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),view=p=>p.locator('#world').evaluate(c=>JSON.parse(c.dataset.presentation));
async function click(p,a){const modal=p.locator('dialog[open]');await (await modal.count()?modal:p).locator(`[data-action="${a}"]`).first().tap();if(a==='wave')await acknowledgeRoutePreview(p);}
async function context(width=430,height=932,dpr=1){const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(![url,'data:','blob:'].some(x=>r.url().startsWith(x)))report.errors.push(r.url());});await p.clock.install({time:new Date('2026-10-20T06:00:00Z')});await p.goto(url);await p.locator('[data-action=begin]').waitFor();await p.clock.pauseAt(new Date('2026-10-20T06:00:05Z'));return {c,p};}
async function until(p,test,steps=400,ms=500){for(let n=0;n<steps;n++){if(await test())return;await p.clock.runFor(ms);}throw Error('State not reached');}
const rectHit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
async function readFrame(p,name){const v=await view(p);
 if(!v.siege&&(v.flood||v.contentR1.exercise))for(let i=0;i<v.units.length;i++)for(let j=i+1;j<v.units.length;j++){
  const a=v.units[i],b=v.units[j],dx=Math.max(0,Math.min(a.x+a.width/2,b.x+b.width/2)-Math.max(a.x-a.width/2,b.x-b.width/2)),dy=Math.max(0,Math.min(a.y,b.y)-Math.max(a.y-a.poseHeight,b.y-b.poseHeight));
  check(name+' enemies overlap less than a third '+a.id+'/'+b.id,dx*dy<=Math.min(a.width*a.poseHeight,b.width*b.poseHeight)/3+.1);
 }
 if(v.impacts?.length){check(name+' live hit readout never false waiting',!await p.locator('.combat-readout').innerText().then(t=>t.includes('等待這座塔')));for(const f of v.impacts){check(name+' damage label exists',!!f.floatBox);for(const other of v.impacts)if(other!==f)check(name+' damage queue labels separate',!rectHit(f.floatBox,other.floatBox));}}
 if(v.sluice)check(name+' current wet targets are included in cumulative actual entrants',v.sluice.wetIds.every(id=>v.sluice.enteredIds.includes(id)));
 return v;
}
async function shot(p,name){await p.clock.runFor(25);await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));const v=await readFrame(p,name),path=name.startsWith('docs/')?evidenceFile(name):`${out}/phone-${name}.png`;await p.screenshot({path});report.shots.push({path,viewport:p.viewportSize(),dpr:await p.evaluate(()=>devicePixelRatio),sha256:sha(await readFile(path)),frame:v});console.log('R13 '+name);}
async function geometry(p,name){const g=await p.evaluate(()=>{const d=document.querySelector('dialog[open]')||document;return {overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,buttons:[...d.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {action:e.dataset.action,w:r.width,h:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:hit===e||e.contains(hit)};})};});check(name+' no page overflow',!g.overflow);for(const b of g.buttons)check(name+' '+b.action+' visible reachable >=44px',b.w>=43.9&&b.h>=43.9&&b.inside&&b.hit);check(name+' no phone keyboard instructions',!await p.locator('.keyboard-help').isVisible());}
async function build(p){for(const type of ['cannon','frost','tesla']){await click(p,'tower-'+type);await click(p,'confirm');}await p.clock.runFor(25);}
async function place(p,type,x,y){await click(p,'tower-'+type);const r=await p.locator('#world').boundingBox(),v=await view(p);await p.locator('#world').tap({position:worldPoint(x,y,r.width,r.height,v.projection)});await click(p,'confirm');await p.clock.runFor(25);}
async function restore(p,c){await click(p,'pause');await click(p,'saves');await p.locator('#saveCode').fill(JSON.stringify({kind:'trine-frontier-save',campaign:c}));await click(p,'preview');await click(p,'commit-import');await click(p,'begin');}
async function finish(p){await until(p,async()=>await p.locator('[data-action=retry]').count()===1,200,1000);}
async function enterSluice(p){await click(p,'exercises');await click(p,'sluice');await click(p,'exercise-sluice');await build(p);}
try{
 // All three timing choices use exactly the same paid formation, in one saved history.
 {const {c,p}=await context();await enterSluice(p);const wallet=(await saved(p)).crystals;
  for(const mode of ['early','timed','unused']){
   await click(p,'wave');if(mode==='early')await click(p,'open-gate');
   if(mode==='timed'){
    await p.clock.runFor(18000);await shot(p,'sluice-before-release');await click(p,'open-gate');await p.clock.runFor(100);await shot(p,'sluice-release-instant');
    await p.clock.runFor(1000);await shot(p,'sluice-flowing');check('gate full segment highlighted',(await view(p)).sluice.water.h>=50);
    await click(p,'pause');await click(p,'close');const prior=(await saved(p)).exercises.battle.gate;await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await click(p,'exercises');await click(p,'exercise-resume');check('midstream reload preserves countdown entrants and one use',JSON.stringify((await saved(p)).exercises.battle.gate)===JSON.stringify(prior));await shot(p,'sluice-flowing-reloaded');
    await p.clock.runFor(7500);check('gate ends after eight seconds and cannot reopen',(await view(p)).sluice.left===0&&await p.locator('[data-action=open-gate]').isDisabled());await shot(p,'sluice-ended-summary');
   }
   await finish(p);const b=(await saved(p)).exercises.battle;check(mode+' correct real outcome',b.result===(mode==='timed'?'won':'lost'));check(mode+' isolated wallet unchanged',(await saved(p)).crystals===wallet);await geometry(p,mode+' result');await shot(p,'sluice-'+mode+'-result');report.outcomes.push({mode,result:b.result,kills:b.kills,gate:b.gate});
   if(mode==='unused'){for(const [width,height]of [[320,568],[844,390]]){await p.setViewportSize({width,height});await p.clock.runFor(25);await geometry(p,'three-trial compact result '+width+'x'+height);await click(p,'gate-trials');await geometry(p,'compact history modal '+width+'x'+height);check('all three real trials reachable in compact history',await p.locator('dialog .gate-trials tbody tr').count()===3);await shot(p,'sluice-history-'+width+'x'+height);await click(p,'close');}await p.setViewportSize({width:430,height:932});await p.clock.runFor(25);}
   const before=b.towers.map(({type,x,y,level})=>({type,x,y,level}));await click(p,'retry-same');const after=(await saved(p)).exercises.battle;check(mode+' same formation one-tap retry',JSON.stringify(before)===JSON.stringify(after.towers.map(({type,x,y,level})=>({type,x,y,level})))&&after.spent===b.spent&&after.budget===b.budget&&!after.gate.used);await shot(p,'sluice-'+mode+'-same-formation');
  }
  check('three real comparisons saved',(await saved(p)).exercises.gateTrials.length===3);await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();check('three comparisons survive cold reload',(await saved(p)).exercises.gateTrials.length===3);await c.close();}
 // Three actual campaign branches, source identity and full next-chapter outcomes.
 const quarry=JSON.parse(await readFile('docs/content/r11/verification/input-fixtures/attained-quarry-save.json'));
 for(const branch of ['upstream','gate','crystals']){
  const {c,p}=await context();await restore(p,quarry);await p.clock.runFor(25);if(branch==='upstream'){await geometry(p,'relay value previews');check('three previews show art and range',await p.locator('.quarry-choice .relay-range').count()===3);await shot(p,'relay-value-choices');}
  await click(p,'quarry-'+branch);await click(p,'next');await p.clock.runFor(25);
  if(branch==='gate'){await place(p,'frost',696,408);await place(p,'tesla',744,360);}else await build(p);
  check(branch+' planning instruction matches ready state',!await p.locator('#hint').innerText().then(t=>t.includes('先配置三塔')));
  await click(p,'wave');await until(p,async()=>(await view(p)).impacts.length>0,3000,25);await shot(p,'relay-'+branch+'-combat');
  for(let n=0;n<800&&!await p.locator('[data-action=next]').count()&&!await p.locator('[data-action=retry]').count();n++){
   const wave=p.locator('[data-action=wave]');if(await wave.count()&&await wave.isEnabled()){
    // Spend only earned campaign currency on existing towers between waves.
    for(const type of ['tesla','cannon','frost']){const b=(await saved(p)).battle,t=b.towers.find(t=>t.type===type&&t.level<3);if(!t||(await saved(p)).crystals<60)continue;const point=(await view(p)).towers.find(a=>a.id===t.id);await p.locator('#world').tap({position:{x:point.x,y:point.y-point.h*.4}});await click(p,'confirm');}
    await click(p,'wave');
   }await p.clock.runFor(1000);
  }
  const b=(await saved(p)).battle;check(branch+' played all four waves',b.wave===4&&!!b.result);await shot(p,'relay-'+branch+'-four-wave-result');
  await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();check(branch+' branch and completion saved',(await saved(p)).battle.result===b.result&&(await saved(p)).quarryLegacy===branch);await c.close();
 }
 // Terrain, aid off: same leading unit turns through three actual body-width frames.
 for(const choice of ['barricade','flood']){
  const {c,p}=await context();await click(p,'begin');await click(p,'terrain');if(choice==='flood')await click(p,'preview-flood');await shot(p,'terrain-'+choice+'-preview');await click(p,'apply-terrain');await click(p,'route-aid');
  await place(p,'frost',360,504);await place(p,'cannon',696,408);await click(p,'wave');
  if(choice==='barricade'){
   await until(p,async()=>(await view(p)).units.some(u=>u.nativeX>=285&&u.nativeX<310),3000,25);let id;
   for(let n=1;n<=3;n++){const v=await view(p),u=id?v.units.find(u=>u.id===id):v.units.find(u=>u.nativeX>=285&&u.nativeX<310);check('same detouring leader visible '+n,!!u);id=u.id;await shot(p,'terrain-barricade-turn-'+n);await p.clock.runFor(1600);}
  }else{
   await until(p,async()=>(await view(p)).wetLabels.length>0,3000,50);await shot(p,'terrain-flood-enter');const first=(await view(p)).wetLabels[0].id;
   await p.clock.runFor(800);await shot(p,'terrain-flood-moving');await until(p,async()=>!!(await view(p)).waterExit,3000,50);await shot(p,'terrain-flood-exit');
   check('terrain bank visible with aid off',(await view(p)).contentR2.waterBanks.length>10);await p.locator('.hit-details>summary').tap();await shot(p,'terrain-flood-frost-details');await p.locator('.hit-details>summary').tap();
  }
  await until(p,async()=>await p.locator('[data-action=wave]').isEnabled(),400,1000);await click(p,'pause');await click(p,'close');await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await click(p,'begin');check(choice+' choice and first-wave ledger survive reload',(await saved(p)).battle.terrainChoice===choice&&(await saved(p)).battle.firstWaveDecision.totalHits>0);await c.close();
 }
 for(const [w,h]of [[320,568],[430,932],[844,390],[1032,1376],[1376,1032],[1366,600],[1280,640]]){
  const {c,p}=await context(w,h);await enterSluice(p);await geometry(p,`${w}x${h} planning`);await shot(p,`layout-${w}x${h}-planning`);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await p.clock.runFor(1500);await geometry(p,`${w}x${h} combat`);await shot(p,`layout-${w}x${h}-combat`);await finish(p);await geometry(p,`${w}x${h} result`);await click(p,'retry-same');await geometry(p,`${w}x${h} retry`);await c.close();
 }
 for(const [w,h,dpr,name]of [[430,932,3,'iphone'],[1032,1376,2,'ipad']]){const {c,p}=await context(w,h,dpr);await enterSluice(p);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await p.clock.runFor(1200);await shot(p,`docs/store/screenshots/${name}-content-r13-sluice-${w*dpr}x${h*dpr}.png`);await c.close();}
 {const {c,p}=await context();await p.evaluate(async()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await enterSluice(p);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await finish(p);check('offline cold reload can complete and save',(await saved(p)).exercises.completed.includes('sluice'));await shot(p,'sluice-offline-complete');await c.close();}
 check('no page errors or outside requests',report.errors.length===0);report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/e2e.json`,JSON.stringify(report,null,2));console.log(`${report.status}: ${report.checks.length} checks, ${report.shots.length} originals`);}
