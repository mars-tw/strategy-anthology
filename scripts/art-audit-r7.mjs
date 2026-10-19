import {acknowledgeRoutePreview} from './r3-onboarding.mjs';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='docs/art/r7';
for(const dir of ['screens','motion'])await mkdir(`${out}/${dir}`,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={status:'EXECUTED',checks:[],errors:[],views:[],method:'Fresh public UI; virtual clock for elapsed time, no game-state/resource injection. Label and terrain suppression change drawing only.',buildSHA256:sha(await readFile('dist/game.js')),styleSHA256:sha(await readFile('dist/style.css'))};
const check=(name,ok)=>{assert.ok(ok,name);result.checks.push(name);};
const manifest=JSON.parse(await readFile('docs/art/ASSET_MANIFEST_R7.json','utf8'));
for(const a of [...manifest.sources,...manifest.runtime,...manifest.support])check(`${a.path} exact bytes`,sha(await readFile(a.path))===a.sha256);
check('actual generation tool disclosed with unknown model slug',manifest.generatedMasters===8&&manifest.actualTool==='image_gen__imagegen'&&manifest.actualModelSlug===null);
check('four actor atlases and three portraits pass original unchanged color thresholds',manifest.runtime.filter(a=>a.color).length===7&&manifest.runtime.filter(a=>a.color).every(a=>a.color.pass));
check('all cutouts retain genuine transparent corners and zero hidden RGB',manifest.runtime.filter(a=>a.mode==='RGBA').every(a=>a.cornersTransparent&&a.transparentRGBZero));
check('all28 inherited atlases freshly pass original color thresholds',manifest.inheritedActorGrades.length===28&&manifest.inheritedActorGrades.every(a=>a.metrics.pass));
for(const a of manifest.inheritedActorGrades)check(`${a.path} freshly measured retained hash`,sha(await readFile(a.path))===a.sha256);
const human=JSON.parse(await readFile('public/assets/r7/actor-frames.json','utf8'));
check('three jobs have six rows of four real articulated poses',Object.values(human).every(a=>a.distinctPosesPerRow.length===6&&a.distinctPosesPerRow.every(n=>n===4)));
check('every live pose is at least40px at390wide at fixed neutral body scale',Object.values(human).every(a=>a.minimumLiveHeight/a.neutralHeight*48>=40));
const wolf=JSON.parse(await readFile('public/assets/r7/hound-frames.json','utf8'));
check('three different wolf silhouettes each have four authored steps',wolf.variants.length===3&&wolf.distinctPosesPerRow.every(n=>n===4));
const inherited=JSON.parse(await readFile('docs/art/ASSET_MANIFEST_R6.json','utf8'));
for(const a of [...inherited.sources,...inherited.runtime,...inherited.support])check(`retained ${a.path}`,sha(await readFile(a.path))===a.sha256);
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,channel:'chrome'});
const data=p=>p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));
const click=async(p,a)=>{await p.locator(`[data-action="${a}"]`).click();if(a==='wave')await acknowledgeRoutePreview(p);};
async function shot(p,path){await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await p.screenshot({path});return path;}
async function suppress(p,terrain=false){
 await p.locator('canvas').evaluate((c,t)=>{c.dataset.hideLabels='true';if(t)c.dataset.terrainOnly='true';},terrain);
 const s=await p.addStyleTag({content:'.brand,.wallet,.top-controls,.map-label,.resonance-legend,.unit-card>span:last-child,.tower-card>span,.field-status,.mission,.journey,.hint,.feedback,.command-head,.placement,.command-row,footer{visibility:hidden}'});
 await p.clock.runFor(20);
 return async()=>{await s.evaluate(e=>e.remove());await p.locator('canvas').evaluate(c=>{delete c.dataset.hideLabels;delete c.dataset.terrainOnly;});await p.clock.runFor(20);};
}
try{
 for(const [device,width,height,dpr]of [['iphone',430,932,3],['ipad',1032,1376,2],['phone360',360,800,1]]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true});const p=await ctx.newPage();
  p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.errors.push(`${r.status()} ${r.url()}`);});
  await p.clock.install({time:new Date('2026-10-18T06:00:00Z')});await p.goto(url);await p.locator('[data-action="begin"]').waitFor();
  // Pause between explicit clock advances so the screenshot and its telemetry
  // represent the same animation frame, including the projectile before impact.
  await p.clock.pauseAt(new Date('2026-10-18T06:00:10Z'));
  const store=name=>device==='phone360'?`${out}/screens/360-${name}.png`:`docs/store/screenshots/${device}-${name}-${width*dpr}x${height*dpr}.png`;
  await shot(p,store('opening'));await click(p,'begin');
  check(`${device}: empty deployment confirmation disabled`,await p.locator('[data-action="confirm"]').isDisabled());
  for(const t of ['cannon','frost','tesla']){
   await click(p,'tower-'+t);await p.clock.runFor(20);const s=await data(p);
   check(`${device}: ${t} preview is the only range`,s.resonance.drawnRangeCount===1&&s.preview.type===t&&s.resonance.selectedType===t);
   if(t!=='tesla')check(`${device}: incomplete trinity has no resonance links`,s.resonance.resonanceEdgeCount===0);
   check(`${device}: affordable preview confirmation enabled`,await p.locator('[data-action="confirm"]').isEnabled());
   await click(p,'confirm');
  }
  await p.clock.runFor(20);let s=await data(p);const fire=s.towers.find(t=>t.type==='cannon');
  await p.locator('canvas').tap({position:{x:fire.x,y:fire.y-fire.h*.6}});await p.clock.runFor(20);
  check(`${device}: existing tower uses explicit60-cost upgrade label`,(await p.locator('[data-action="confirm"]').textContent()).includes('60')&&await p.locator('[data-action="confirm"]').isEnabled());
  await click(p,'cancel');await p.clock.runFor(20);s=await data(p);
  check(`${device}: fire remains field focus and exactly one matching solid circle`,s.resonance.selectedType==='cannon'&&s.resonance.drawnRangeCount===1&&s.towers.filter(t=>t.selected).length===1);
  check(`${device}: only numeric resonance result appears`,await p.locator('.resonance-legend').innerText()==='+30%'&&await p.locator('.resonance-legend img,.legend-orbit,.legend-link').count()===0);
  check(`${device}: original actual radii and30percent bonus unchanged`,s.resonance.ranges.map(a=>a.radius).join(',')==='160,165,160'&&s.resonance.bonus===.3);
  check(`${device}: all unaffordable cards and build confirmation disabled`,await p.locator('.tower-card:disabled.unaffordable').count()===3&&await p.locator('[data-action="confirm"]').isDisabled());
  check(`${device}: empty suggestion and cancellation affordances disabled`,await p.locator('[data-action="suggest"]').isDisabled()&&await p.locator('[data-action="cancel"]').isDisabled());
  await shot(p,`${out}/screens/${device}-resource-insufficient.png`);
  await click(p,'wave');let moment;
  for(let tick=0;tick<150;tick++){
   await p.clock.runFor(100);const f=await data(p),walk=f.units.filter(u=>u.source==='r7/hound-walk'&&u.state==='walk');
   if(f.units.length<=4&&new Set(walk.map(u=>u.variant)).size===3&&new Set(walk.map(u=>u.frame)).size>1&&f.units.filter(u=>u.healthShown).length===1&&f.effects.some(e=>e.kind==='shot'&&e.age>.05&&e.age<.22)){moment=f;break;}
  }
  check(`${device}: one store frame contains three wolf gaits and actual projectile`,!!moment);
  check(`${device}: at least44px bodies, individual shadows and visible captain health`,moment.units.every(u=>u.height>=44&&u.healthWidth===36&&u.healthHeight===5)&&moment.units.filter(u=>u.healthShown).length===1&&moment.units.filter(u=>u.healthShown).every(u=>u.healthY>=8));
  check(`${device}: selected fire remains the only range in combat`,moment.resonance.selectedType==='cannon'&&moment.resonance.drawnRangeCount===1);
  await shot(p,store('defense'));let restore=await suppress(p);await shot(p,`${out}/screens/${device}-defense-no-labels.png`);await restore();
  for(let frame=0;frame<4;frame++){if(frame)await p.clock.runFor(125);await shot(p,`${out}/motion/${device}-defense-${frame}.png`);}
  let ticks=0;while(!await p.locator('[data-action="next"]').count()&&ticks++<180){const b=p.locator('[data-action="wave"]');if(await b.count()&&await b.isEnabled())await b.click();await p.clock.runFor(1000);}
  check(`${device}: defense won through normal commands`,await p.locator('[data-action="next"]').count()===1);
  await click(p,'next');await click(p,'construct');await p.clock.runFor(6000);
  for(const role of ['warrior','archer','mage'])await click(p,'unit-'+role);
  await p.clock.runFor(3200);await click(p,'attack');await p.clock.runFor(7000);s=await data(p);
  check(`${device}: all three jobs are actual new drawn atlases`,['warrior','archer','mage'].every(r=>s.units.some(u=>u.role===r&&u.source==='r7/'+r)));
  check(`${device}: human neutral scale and building proportions retained`,s.units.every(u=>u.height>=48)&&Math.abs(s.keep.height/s.bodyHeight-2.33*1.8)<.001);
  const size=await p.locator('canvas').evaluate(c=>({w:c.clientWidth,h:c.clientHeight}));
  check(`${device}: complete figures including weapons remain within viewport`,s.units.every(u=>u.x-u.width/2>=2.9&&u.x+u.width/2<=size.w-2.9&&u.y-u.poseHeight>=7.9&&u.y<=size.h-13.9));
  check(`${device}: two native crossings remain shallow perspective bridges`,s.bridges.length===2&&s.bridges.every(b=>b.width>=s.bodyHeight*2.6&&b.height/b.width<=.20));
  const portraits=await p.locator('.unit-portrait,.tower-portrait').evaluateAll(es=>es.map(e=>({w:e.clientWidth,h:e.clientHeight,src:e.src||getComputedStyle(e).backgroundImage})));
  check(`${device}: three complete weapon portraits in common safe frame`,portraits.length===3&&portraits.every(a=>a.src.includes('/r7/')&&a.h>=60));
  await shot(p,store('siege'));restore=await suppress(p);await shot(p,`${out}/screens/${device}-siege-no-labels.png`);await restore();
  const covered=await p.addStyleTag({content:'.command{visibility:hidden}'});await shot(p,`${out}/screens/${device}-siege-cards-covered.png`);await covered.evaluate(e=>e.remove());
  restore=await suppress(p,true);await shot(p,`${out}/screens/${device}-siege-terrain.png`);await restore();
  result.views.push({device,width,height,dpr,canvasRect:await p.locator('canvas').boundingBox(),defense:moment,siege:s,portraits});await ctx.close();
 }
 // Independent real-time motion evidence; only one browser/context at a time.
 const ctx=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:`${out}/motion`,size:{width:390,height:844}}}),p=await ctx.newPage();
 await p.goto(url);await click(p,'begin');for(const t of ['cannon','frost','tesla']){await click(p,'tower-'+t);await click(p,'confirm');}await click(p,'wave');await p.waitForTimeout(6500);
 result.realTime=[];const hashes=[];
 for(let i=0;i<6;i++){if(i)await p.waitForTimeout(1000);const path=`${out}/motion/real-${i}.png`;await shot(p,path);hashes.push(sha(await readFile(path)));result.realTime.push({path,presentation:await data(p)});}
 check('six real-time combat images differ over five seconds',new Set(hashes).size===6);const video=p.video();await ctx.close();result.video=await video.path();
 check('no runtime exceptions or missing assets',result.errors.length===0);result.status='VERIFIED';
}catch(e){result.status='BLOCKED';result.failure=e.stack;console.error(e.stack);process.exitCode=1;}
finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/visual-audit.json`,JSON.stringify(result,null,2));console.log(`${result.status}: ${result.checks.length} checks, ${result.views.length} sizes.`);}
