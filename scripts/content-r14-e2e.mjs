import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {freezeReloadedClock} from './freeze-test-clock.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
import {worldPoint} from '../src/presentation-r7.js';
import {acknowledgeRoutePreview} from './r3-onboarding.mjs';
const out=evidenceDir('content-r14'),key='trine-frontier:campaign:v1';await mkdir(out,{recursive:true});
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
 if(v.healthBars){check(name+' every visible health bar accounted',v.healthBars.length===v.units.filter(u=>u.healthShown).length);for(let i=0;i<v.healthBars.length;i++)for(let j=i+1;j<v.healthBars.length;j++)check(name+' health bars do not overlap',!rectHit(v.healthBars[i],v.healthBars[j]));}
 if(v.snapshot){check(name+' no result actors or effects',!v.units.length&&!v.effects.length);for(let i=0;i<v.towers.length;i++)for(let j=i+1;j<v.towers.length;j++){const box=t=>({x:t.x-t.h*.4,y:t.y-t.h,w:t.h*.8,h:t.h});check(name+' result towers do not overlap',!rectHit(box(v.towers[i]),box(v.towers[j])));}for(const r of v.snapshotLabels)check(name+' label within 24px',Math.hypot(r.x+r.w/2-r.anchorX,r.y+r.h/2-r.anchorY)<=24.01);for(const r of v.snapshotLabels)for(const t of v.towers)check(name+' label keeps every tower silhouette clear',!rectHit(r,{x:t.x-t.h*.4,y:t.y-t.h,w:t.h*.8,h:t.h}));for(let i=0;i<v.snapshotLabels.length;i++)for(let j=i+1;j<v.snapshotLabels.length;j++)check(name+' result labels separate',!rectHit(v.snapshotLabels[i],v.snapshotLabels[j]));}
 return v;
}
async function shot(p,name){await p.clock.runFor(25);await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));const v=await readFrame(p,name),path=name.startsWith('docs/')?name:`${out}/phone-${name}.png`;await p.screenshot({path:evidenceFile(path)});report.shots.push({path:evidenceFile(path),viewport:p.viewportSize(),dpr:await p.evaluate(()=>devicePixelRatio),sha256:sha(await readFile(evidenceFile(path))),frame:v});console.log('R14 '+name);}
async function geometry(p,name){const g=await p.evaluate(()=>{const d=document.querySelector('dialog[open]')||document;return {overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,buttons:[...d.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {action:e.dataset.action,w:r.width,h:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:hit===e||e.contains(hit)};})};});check(name+' no page overflow',!g.overflow);for(const b of g.buttons)check(name+' '+b.action+' visible reachable >=44px',b.w>=43.9&&b.h>=43.9&&b.inside&&b.hit);check(name+' no phone keyboard instructions',!await p.locator('.keyboard-help').isVisible());}
async function build(p){for(const type of ['cannon','frost','tesla']){await click(p,'tower-'+type);await click(p,'confirm');}await p.clock.runFor(25);}
async function place(p,type,x,y){await click(p,'tower-'+type);const r=await p.locator('#world').boundingBox(),v=await view(p);await p.locator('#world').tap({position:worldPoint(x,y,r.width,r.height,v.projection)});await click(p,'confirm');await p.clock.runFor(25);}
async function restore(p,c){await click(p,'pause');await click(p,'saves');await p.locator('#saveCode').fill(JSON.stringify({kind:'trine-frontier-save',campaign:c}));await click(p,'preview');await click(p,'commit-import');await click(p,'begin');}
async function finish(p){await until(p,async()=>await p.locator('[data-action=retry]').count()===1,200,1000);}
async function enterSluice(p){await click(p,'exercises');await click(p,'sluice');await click(p,'exercise-sluice');await build(p);}
async function finishRelay(p){
 let upgraded=false;
 for(let n=0;n<700;n++){
  if(await p.locator('.result').count())return;
  const button=p.locator('[data-action=wave]');
  if(await button.count()&&await button.isEnabled()){
   const b=(await saved(p)).decisionReplay?.result===null?(await saved(p)).decisionReplay:(await saved(p)).battle;
   if(b.wave===1&&!upgraded){const t=(await view(p)).towers.find(t=>t.type==='tesla'&&!t.inherited);await p.locator('#world').tap({position:{x:t.x,y:t.y-t.h*.25}});await click(p,'confirm');upgraded=true;}
   await click(p,'wave');
  }
  await p.clock.runFor(1000);
 }
 throw Error('Full relay not completed');
}
try{
 // Use one naturally attained source and public replay. All paid cells and levels match.
 {const {c,p}=await context(),sourcePath='docs/content/r11/verification/input-fixtures/attained-quarry-save.json',sourceBytes=await readFile(sourcePath),source=JSON.parse(sourceBytes);report.sourceSavePath=sourcePath;report.sourceSaveSHA256=sha(sourceBytes);
  await restore(p,source);await click(p,'relay-map');await geometry(p,'same-scale relay map');await shot(p,'relay-same-scale-choices');await click(p,'close');await click(p,'quarry-upstream');await click(p,'next');
  for(const branch of ['upstream','gate','crystals']){
   if(branch!=='upstream'){await click(p,'replay');await click(p,'replay-branch-'+branch);await click(p,'start-replay');}
   await build(p);await click(p,'wave');await until(p,async()=>(await view(p)).impacts.length>0,3000,25);await shot(p,'relay-'+branch+'-combat');
   await finishRelay(p);const state=await saved(p),b=branch==='upstream'?state.battle:state.decisionReplay;
   check(branch+' full four-wave completion',b.result==='won'&&b.wave===4);check(branch+' same paid setup and upgrade',b.spent===360&&b.towers.find(t=>t.type==='tesla'&&!t.inherited).level===2);await shot(p,'relay-'+branch+'-result');report.outcomes.push({kind:'relay',branch,result:b.result,hp:b.hp,time:b.time,firstWave:b.firstWaveDecision});
   if(branch==='crystals'){await click(p,'decisions');check('three branches simultaneously visible',await p.locator('dialog .three-branches thead th').count()===4);await geometry(p,'three branches comparison');await shot(p,'relay-three-branch-comparison');await click(p,'close');}
  }
  await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();check('all three branch records persist',(await saved(p)).decisionRecords.filter(r=>r.chapter===4).length===3);await c.close();
 }
 for(const choice of ['barricade','flood']){
  const {c,p}=await context();await click(p,'begin');await click(p,'terrain');if(choice==='flood')await click(p,'preview-flood');await shot(p,'terrain-'+choice+'-preview');await click(p,'apply-terrain');await click(p,'route-aid');
  await place(p,'frost',360,504);await place(p,'cannon',696,408);await click(p,'wave');
  if(choice==='barricade'){
   await until(p,async()=>(await view(p)).units.some(u=>u.nativeX>=285&&u.nativeX<310),3000,25);let id;
   for(let n=1;n<=3;n++){const v=await view(p),u=id?v.units.find(u=>u.id===id):v.units.find(u=>u.nativeX>=285&&u.nativeX<310);check('same leader moves through detour '+n,!!u);id=u.id;await shot(p,'terrain-barricade-turn-'+n);await p.clock.runFor(1600);}
   await click(p,'route-aid');await shot(p,'terrain-barricade-aid-on');
  }else{
   await until(p,async()=>(await view(p)).wetLabels.length>0,3000,50);await shot(p,'terrain-flood-enter');await p.clock.runFor(800);await shot(p,'terrain-flood-moving');
   await until(p,async()=>!!(await view(p)).waterExit,3000,50);await shot(p,'terrain-flood-exit');await p.locator('.hit-details>summary').tap();await shot(p,'terrain-flood-frost-details');await p.locator('.hit-details>summary').tap();
  }
  await until(p,async()=>await p.locator('[data-action=wave]').isEnabled(),400,1000);await place(p,'tesla',choice==='barricade'?696:552,choice==='barricade'?312:264);await click(p,'wave');await until(p,async()=>await p.locator('.result').count()===1,400,1000);check(choice+' terrain defense genuinely completes both waves',(await saved(p)).battle.result==='won'&&(await saved(p)).battle.wave===2);await shot(p,'terrain-'+choice+'-complete');await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();check(choice+' completed defense and choice survive reload',(await saved(p)).battle.terrainChoice===choice&&(await saved(p)).battle.firstWaveDecision.totalHits>0&&(await saved(p)).battle.result==='won');await c.close();
 }
 {const {c,p}=await context();await enterSluice(p);const wallet=(await saved(p)).crystals;
  for(const mode of ['early','timed','unused']){
   const before=(await saved(p)).exercises.battle,formation=before.towers.map(({type,x,y,level})=>({type,x,y,level}));
   if(mode==='timed'){check('retry shows actual previous gate timing',await p.locator('.gate-timing').innerText().then(t=>t.includes('0.0秒開閘')));await shot(p,'sluice-retry-previous-timing');}
   await click(p,'wave');if(mode==='early')await click(p,'open-gate');
   if(mode==='timed'){
    await p.clock.runFor(18000);await shot(p,'sluice-before-release');await click(p,'open-gate');await p.clock.runFor(100);await shot(p,'sluice-release-instant');
    await p.clock.runFor(1000);await click(p,'pause');await click(p,'close');const prior=(await saved(p)).exercises.battle.gate;await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await click(p,'exercises');await click(p,'exercise-resume');check('running flow reload preserves exact state',JSON.stringify((await saved(p)).exercises.battle.gate)===JSON.stringify(prior));await shot(p,'sluice-flowing-reloaded');
    await p.clock.runFor(7500);check('one shot gate ends and stays disabled',!(await view(p)).sluice.left&&await p.locator('[data-action=open-gate]').isDisabled());await shot(p,'sluice-ended-summary');
   }
   await finish(p);const b=(await saved(p)).exercises.battle;check(mode+' actual timing outcome',b.result===(mode==='timed'?'won':'lost'));check(mode+' same paid formation and budget',JSON.stringify(formation)===JSON.stringify(b.towers.map(({type,x,y,level})=>({type,x,y,level})))&&b.spent===300&&b.budget===0&&(await saved(p)).crystals===wallet);await geometry(p,mode+' result');await shot(p,'sluice-'+mode+'-result');report.outcomes.push({kind:'sluice',mode,result:b.result,kills:b.kills,gate:b.gate});
   await writeFile(`${out}/attained-sluice-${mode}-save.json`,JSON.stringify(await saved(p)));
   await click(p,'retry-same');const next=(await saved(p)).exercises.battle;check(mode+' retry exactly preserves formation levels and money, resets gate',JSON.stringify(formation)===JSON.stringify(next.towers.map(({type,x,y,level})=>({type,x,y,level})))&&next.spent===300&&next.budget===0&&!next.gate.used&&next.gate.delay===0&&next.time===0);await shot(p,'sluice-'+mode+'-same-formation');
  }
  await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();check('history and retry persist cold',(await saved(p)).exercises.gateTrials.length===3&&!(await saved(p)).exercises.battle.gate.used);await c.close();
 }
 for(const [w,h]of [[320,568],[430,932],[844,390],[1032,1376],[1376,1032],[1366,600],[1280,640]]){
  const {c,p}=await context(w,h);await enterSluice(p);await geometry(p,`${w}x${h} planning`);await shot(p,`layout-${w}x${h}-planning`);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await p.clock.runFor(1200);await geometry(p,`${w}x${h} combat`);await shot(p,`layout-${w}x${h}-combat`);await finish(p);await geometry(p,`${w}x${h} result`);await shot(p,`layout-${w}x${h}-result`);await click(p,'retry-same');await geometry(p,`${w}x${h} retry`);await c.close();
 }
 for(const [w,h,dpr,name]of [[430,932,3,'iphone'],[1032,1376,2,'ipad']]){const {c,p}=await context(w,h,dpr);await enterSluice(p);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await p.clock.runFor(1200);await shot(p,`docs/store/screenshots/${name}-content-r14-sluice-${w*dpr}x${h*dpr}.png`);await c.close();}
 {const {c,p}=await context();await p.evaluate(async()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await freezeReloadedClock(p);await p.locator('[data-action=begin]').waitFor();await enterSluice(p);await click(p,'wave');await p.clock.runFor(18000);await click(p,'open-gate');await finish(p);check('offline cold reload plays completes and saves',(await saved(p)).exercises.completed.includes('sluice'));await shot(p,'sluice-offline-complete');await c.close();}
 check('zero page errors and external requests',report.errors.length===0);report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/e2e.json`,JSON.stringify(report,null,2));console.log(`${report.status}: ${report.checks.length} checks, ${report.shots.length} originals`);}
