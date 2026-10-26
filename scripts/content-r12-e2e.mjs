import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {freezeReloadedClock} from './freeze-test-clock.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
const out=evidenceDir('content-r12'),key='trine-frontier:campaign:v1';await mkdir(out,{recursive:true});
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const sha=b=>createHash('sha256').update(b).digest('hex'),report={status:'EXECUTED',method:'Serial headless public touch UI; virtual clock, no game-state injection. All towers bought through confirmation. Fresh independent save for timing comparisons.',buildSHA256:sha(await readFile('dist/game.js')),checks:[],shots:[],errors:[],outcomes:[]};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),view=p=>p.locator('#world').evaluate(c=>JSON.parse(c.dataset.presentation));
async function click(p,a){const d=p.locator('dialog[open]');await (await d.count()?d:p).locator(`[data-action="${a}"]`).first().tap();}
async function shot(p,name){await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));const path=name.startsWith('docs/')?evidenceFile(name):`${out}/phone-${name}.png`;await p.screenshot({path});report.shots=report.shots.filter(s=>s.path!==path);report.shots.push({path,viewport:p.viewportSize(),dpr:await p.evaluate(()=>devicePixelRatio),sha256:sha(await readFile(path)),frame:await view(p).catch(()=>null)});console.log('R12 '+name);}
async function context(width=430,height=932,dpr=1){const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(![url,'data:','blob:'].some(x=>r.url().startsWith(x)))report.errors.push(r.url());});await p.clock.install({time:new Date('2026-10-20T06:00:00Z')});await p.goto(url);await p.locator('[data-action=begin]').waitFor();await p.clock.pauseAt(new Date('2026-10-20T06:00:05Z'));return {c,p};}
async function geometry(p,label){const g=await p.evaluate(()=>{const d=document.querySelector('dialog[open]')||document;return {overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,buttons:[...d.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {action:e.dataset.action,width:r.width,height:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:hit===e||e.contains(hit)};})};});check(label+' no page overflow',!g.overflow);for(const b of g.buttons)check(label+' '+b.action+' >=44px visible and reachable',b.width>=43.9&&b.height>=43.9&&b.inside&&b.hit);check(label+' no keyboard instructions',!await p.locator('.keyboard-help').isVisible());}
async function enter(p){await click(p,'exercises');await click(p,'sluice');await geometry(p,'sluice instructions '+JSON.stringify(p.viewportSize()));await click(p,'exercise-sluice');for(const t of ['cannon','frost','tesla']){await click(p,'tower-'+t);await click(p,'confirm');}await p.clock.runFor(25);check('three paid towers and isolated zero balance',(await saved(p)).exercises.battle.spent===300&&(await saved(p)).exercises.battle.budget===0);}
async function finish(p){for(let i=0;i<120&&!await p.locator('[data-action=retry]').count();i++)await p.clock.runFor(1000);check('actual result reached',await p.locator('[data-action=retry]').count()===1);}
try{
 for(const mode of ['timed','early','unused']){
  const {c,p}=await context();await click(p,'exercises');await click(p,'sluice');await geometry(p,'sluice intro');if(mode==='timed')await shot(p,'sluice-instructions');await click(p,'close');await enter(p);
  const wallet=(await saved(p)).crystals;check('gate cannot be used during planning',await p.locator('[data-action=open-gate]').isDisabled());if(mode==='timed')await shot(p,'sluice-planning');await click(p,'wave');
  if(mode!=='unused'){
   await p.clock.runFor(mode==='timed'?18000:1);if(mode==='timed')await shot(p,'sluice-before-release');await click(p,'open-gate');const initial=(await saved(p)).exercises.battle.gate;check('release stores actual timestamp and one use',initial.used&&initial.left===8&&await p.locator('[data-action=open-gate]').isDisabled());
   if(mode==='timed'){
    await p.clock.runFor(1000);await shot(p,'sluice-flowing-1');await p.clock.runFor(1200);await shot(p,'sluice-flowing-2');
    {const v=await view(p),water=v.sluice.water;check('flow has actual targets and delay',v.sluice.wetIds.length>0&&v.sluice.delay>0);check('flow has a real wet target visibly standing on painted water',v.units.some(u=>v.sluice.wetIds.includes(u.id)&&u.x>=water.x&&u.x<=water.x+water.w&&u.y>=water.y&&u.y<=water.y+water.h));}
    await click(p,'pause');await click(p,'close');const before=(await saved(p)).exercises.battle.gate;await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await click(p,'exercises');await click(p,'exercise-resume');check('reload keeps used flag countdown and targets',JSON.stringify((await saved(p)).exercises.battle.gate)===JSON.stringify(before));await shot(p,'sluice-reloaded-flow');
    await p.clock.runFor(6500);check('flow ends and cannot be reopened',(await view(p)).sluice.left===0&&(await view(p)).sluice.wetIds.length===0&&await p.locator('[data-action=open-gate]').isDisabled());await shot(p,'sluice-flow-ended');
   }
  }
  await finish(p);const s=await saved(p),b=s.exercises.battle;check(mode+' real expected outcome',b.result===(mode==='timed'?'won':'lost'));check(mode+' shared wallet unchanged',s.crystals===wallet);if(mode==='timed')check('completion saved as new exercise',s.exercises.completed.includes('sluice'));check(mode+' actual hydraulic recap visible',await p.locator('.sluice-result').innerText().then(t=>mode==='unused'?t.includes('沒有開閘'):t.includes(b.gate.delay.toFixed(2))));await shot(p,'sluice-'+mode+'-result');report.outcomes.push({mode,result:b.result,kills:b.kills,spent:b.spent,gate:b.gate});
  await click(p,'chronicle');await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();check(mode+' result survives cold reload',(await saved(p)).exercises.battle.result===b.result);await c.close();
 }
 for(const id of ['turn','levee','switchback','split','hollow']){
  const {c,p}=await context();await click(p,'exercises');await click(p,'exercise-'+id);for(const t of ['cannon','frost','tesla']){await click(p,'tower-'+t);await click(p,'confirm');}await p.clock.runFor(25);
  if(id==='switchback'){const t=(await view(p)).towers.find(t=>t.type==='tesla');await p.locator('#world').tap({position:{x:t.x,y:t.y-t.h*.5}});await click(p,'confirm');}
  await click(p,'wave');let peak=0,samples=0;
  for(let i=0;i<150&&!await p.locator('[data-action=retry]').count();i++){
   await p.clock.runFor(500);const v=await view(p);samples++;
   for(let a=0;a<v.units.length;a++)for(let z=a+1;z<v.units.length;z++){const x=v.units[a],y=v.units[z],sharedX=Math.max(0,Math.min(x.x+x.width/2,y.x+y.width/2)-Math.max(x.x-x.width/2,y.x-y.width/2)),sharedY=Math.max(0,Math.min(x.y,y.y)-Math.max(x.y-x.poseHeight,y.y-y.poseHeight));check(id+' dense sample overlap at most half',sharedX*sharedY<=Math.min(x.width*x.poseHeight,y.width*y.poseHeight)*.5+.1);}
   if(v.units.length>peak){peak=v.units.length;await shot(p,'exercise-'+id+'-densest');}
  }
  check(id+' densest observed combat captured',peak>=3&&samples>20);(report.densest??=[]).push({id,peak,samples,stepMs:500});await c.close();
 }
 for(const [w,h]of [[320,568],[430,932],[844,390],[1032,1376],[1376,1032],[1366,600],[1280,640]]){
  const {c,p}=await context(w,h);await enter(p);await geometry(p,`${w}x${h} planning`);await shot(p,`sluice-layout-${w}x${h}-planning`);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await p.clock.runFor(1500);await geometry(p,`${w}x${h} combat`);await shot(p,`sluice-layout-${w}x${h}-combat`);await finish(p);check(`${w}x${h} can complete`,(await saved(p)).exercises.battle.result==='won');await geometry(p,`${w}x${h} result`);await c.close();
 }
 for(const [w,h,dpr,name]of [[430,932,3,'iphone'],[1032,1376,2,'ipad']]){const {c,p}=await context(w,h,dpr);await enter(p);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await p.clock.runFor(1600);await shot(p,`docs/store/screenshots/${name}-content-r12-sluice-${w*dpr}x${h*dpr}.png`);await c.close();}
 {const {c,p}=await context();await p.evaluate(async()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await enter(p);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await finish(p);check('offline cold load includes new art and completes',(await saved(p)).exercises.completed.includes('sluice'));await shot(p,'sluice-offline-complete');await c.close();}
 check('no runtime errors or outside requests',report.errors.length===0);report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/sluice-e2e.json`,JSON.stringify(report,null,2));console.log(`${report.status}: ${report.checks.length} checks, ${report.shots.length} originals`);}
