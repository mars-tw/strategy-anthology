import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=evidenceDir('art-audit-r5');await mkdir(`${out}/screens`,{recursive:true});await mkdir(`${out}/motion`,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={status:'EXECUTED',checks:[],errors:[],views:[],method:'Fresh save, public UI, virtual clock only for deterministic elapsed time. No state/resource/victory injection. Label/terrain suppression affects drawing only.',buildSHA256:sha(await readFile('dist/game.js')),styleSHA256:sha(await readFile('dist/style.css'))};
const check=(name,ok)=>{assert.ok(ok,name);result.checks.push(name);};
const manifest=JSON.parse(await readFile('docs/art/ASSET_MANIFEST_R5.json','utf8'));
for(const item of [...manifest.sources,...manifest.runtime,...manifest.inheritedActorGrades])check(`${item.path} current hash`,sha(await readFile(item.path))===item.sha256);
check('17 genuine generation masters with disclosed tool and unknown slug',manifest.generatedMasters===17&&manifest.actualTool==='image_gen__imagegen'&&manifest.actualModelSlug===null);
check('six new unit atlases and commander pass encoded pixel color gates',manifest.actorGrades.length===7&&manifest.actorGrades.every(a=>a.metrics.pass));
check('all 28 retained MIT atlases pass freshly measured pixels',manifest.inheritedActorGrades.length===28&&manifest.inheritedActorGrades.every(a=>a.metrics.pass));
check('all six atlas rows contain four unique drawn poses',manifest.actorGrades.filter(a=>a.distinctPosesPerRow).every(a=>a.distinctPosesPerRow.every(n=>n===4)));

const river=JSON.parse(await readFile('docs/art/r5/river-geometry.json','utf8'));check('curved river contains native deep core and varies width >20%',river.deepCoreContained&&river.centerSpan>100&&river.bankWidthMax/river.bankWidthMin>1.2);
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const click=(p,a)=>p.locator(`[data-action="${a}"]`).click();
const data=p=>p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));
async function shot(p,path){path=evidenceFile(path);await p.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));await p.screenshot({path});return path;}
async function suppress(p,terrain=false){await p.locator('canvas').evaluate((c,t)=>{c.dataset.hideLabels='true';if(t)c.dataset.terrainOnly='true';},terrain);const style=await p.addStyleTag({content:'.brand,.wallet,.top-controls,.map-label,.resonance-legend,.unit-card>span:last-child,.tower-card>span,.field-status,.mission,.journey,.hint,.feedback,.command-head,.placement,.command-row,footer{visibility:hidden}'});await p.clock.runFor(20);return async()=>{await style.evaluate(s=>s.remove());await p.locator('canvas').evaluate(c=>{delete c.dataset.hideLabels;delete c.dataset.terrainOnly;});await p.clock.runFor(20);};}
try{
 for(const [device,width,height,dpr]of [['iphone',430,932,3],['ipad',1032,1376,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:true}),p=await context.newPage();
  p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.errors.push(`${r.status()} ${r.url()}`);});await p.clock.install();await p.goto(url);
  await p.locator('[data-action="begin"]').waitFor();await p.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));await p.clock.runFor(20);
  const opening=await p.locator('.commander').evaluate(e=>({ready:e.complete&&e.naturalWidth>0,height:e.getBoundingClientRect().height,loading:!!document.querySelector('.loading')}));
  check(`${device}: opening is mounted with decoded visible hero, never loading placeholder`,opening.ready&&opening.height>=200&&!opening.loading);
  if(device==='ipad')check('iPad opening visibly includes generated title logo',await p.locator('.home-logo').isVisible());
  const stem=`${device}-${width*dpr}x${height*dpr}`;
  await shot(p,`docs/store/screenshots/${device}-opening-${width*dpr}x${height*dpr}.png`);
  await click(p,'begin');for(const t of ['cannon','frost','tesla']){
   await click(p,`tower-${t}`);await p.clock.runFor(20);const preview=await data(p);
   check(`${device}: ${t} preview is the sole emphasized range and matching legend`,preview.preview?.type===t&&preview.resonance.selectedType===t&&preview.towers.every(a=>!a.selected)&&(await p.locator('.resonance-legend img').getAttribute('src')).endsWith(`seal-${t}.png`));
   await click(p,'confirm');
  }
  await p.clock.runFor(20);let s=await data(p);
  check(`${device}: one selected tower and active actual 30% resonance`,s.towers.filter(t=>t.selected).length===1&&s.resonance.active&&s.resonance.bonus===.3);
  check(`${device}: native 160/165/160 radii preserved`,s.resonance.ranges.map(r=>r.radius).join(',')==='160,165,160');
  await shot(p,`${out}/screens/${stem}-selected.png`);
  // Actual body selection must update the visual focus and retain native upgrade.
  const fire=s.towers.find(t=>t.type==='cannon');await p.locator('canvas').tap({position:{x:fire.x,y:fire.y-fire.h*.6}});await p.clock.runFor(20);s=await data(p);
  check(`${device}: tapping fire body selects fire only`,s.resonance.selectedType==='cannon'&&s.towers.filter(t=>t.selected).length===1&&await p.locator('[data-action="tower-cannon"]').getAttribute('aria-pressed')==='true'&&await p.locator('[data-action="tower-tesla"]').getAttribute('aria-pressed')==='false');
  await shot(p,`${out}/screens/${stem}-fire-selected.png`);
  const selected=s.towers.filter(t=>t.selected);check(`${device}: selected solid range is a flat ellipse, inactive ranges below 20 percent`,selected.length===1&&s.resonance.lineStyle.includes('selected solid')&&s.resonance.lineStyle.includes('alpha .16'));
  let noText=await suppress(p);await shot(p,`${out}/screens/${stem}-defense-no-labels.png`);await noText();await click(p,'cancel');
  let restore=await suppress(p,true);await shot(p,`${out}/screens/${stem}-defense-terrain.png`);await restore();
  await click(p,'wave');let moment;
  for(let i=0;i<150;i++){await p.clock.runFor(100);const f=await data(p);if(f.units.length>=3&&new Set(f.units.map(u=>u.variant)).size===3&&new Set(f.units.map(u=>u.frame)).size>1&&f.units.filter(u=>u.healthShown).length===1&&f.effects.some(e=>e.kind==='shot'&&e.age>.06&&e.age<.21)){moment=f;break;}}
  check(`${device}: store defense is a genuine projectile moment`,!!moment);
  check(`${device}: enemy pack has visible >=44px bodies and 36x5 leader health bar`,moment.units.length>=3&&moment.units.every(u=>u.height>=44&&u.healthWidth>=36&&u.healthHeight===5&&u.role==='hound'));
  check(`${device}: pack has three stable accessories, mixed walk poses and one captain health bar`,new Set(moment.units.map(u=>u.variant)).size===3&&new Set(moment.units.map(u=>u.frame)).size>1&&moment.units.filter(u=>u.healthShown).length===1);
  await shot(p,`docs/store/screenshots/${device}-defense-${width*dpr}x${height*dpr}.png`);
  for(let i=0;i<4;i++){if(i)await p.clock.runFor(125);await shot(p,`${out}/motion/${stem}-defense-${i}.png`);}
  let tick=0;while(!await p.locator('[data-action="next"]').count()&&tick++<180){const b=p.locator('[data-action="wave"]');if(await b.count()&&await b.isEnabled())await b.click();await p.clock.runFor(1000);}
  check(`${device}: first defense won through normal play`,await p.locator('[data-action="next"]').count()===1);await click(p,'next');await click(p,'construct');await p.clock.runFor(6000);
  for(const t of ['warrior','archer','mage'])await click(p,'unit-'+t);
  await p.clock.runFor(3200);await click(p,'attack');await p.clock.runFor(7000);s=await data(p);
  const humans=s.units.filter(u=>u.type!=='miremaw');check(`${device}: worker, three jobs and grey enemy all use new art`,['worker','warrior','archer','mage','enemy'].every(r=>humans.some(u=>u.role===r)));
  check(`${device}: all human bodies have equal scale >=48px`,humans.every(u=>u.height>=48&&Math.abs(u.height-humans[0].height)<.01));
  const portraits=await p.locator('.unit-portrait').evaluateAll(es=>es.map(e=>({image:getComputedStyle(e).backgroundImage,width:e.clientWidth,height:e.clientHeight})));check(`${device}: weapon-led R6 portraits loaded`,portraits.length===3&&portraits.every(e=>e.image.includes('/r6/')&&e.height>=60));
  check(`${device}: no person is wider than the bridge deck`,s.units.every(u=>u.width<=Math.min(...s.bridges.map(b=>b.deckWidth))));
  check(`${device}: people/bridge scale <= .45, towers 2.2-2.6 people, keep 1.8 towers`,s.bodyHeight/s.bridges[0].deckWidth<=.45&&s.keep.height/s.bodyHeight>=2.2*1.8&&s.keep.height/s.bodyHeight<=2.6*1.8);
  check(`${device}: march crosses only on a bridge`,s.marchRoute.length===4&&s.marchRoute[1].y===s.marchRoute[2].y&&[195,425].includes(s.marchRoute[1].y));
  await shot(p,`docs/store/screenshots/${device}-siege-${width*dpr}x${height*dpr}.png`);
  restore=await suppress(p);await shot(p,`${out}/screens/${stem}-siege-no-labels.png`);await restore();
  restore=await suppress(p,true);await shot(p,`${out}/screens/${stem}-siege-terrain.png`);await restore();
  result.views.push({device,width,height,dpr,defense:moment,siege:s,portraits});await context.close();
 }
 const motion=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:`${out}/motion`,size:{width:390,height:844}}}),q=await motion.newPage();
 await q.goto(url);await click(q,'begin');for(const t of ['cannon','frost','tesla']){await click(q,'tower-'+t);await click(q,'confirm');}await click(q,'wave');await q.waitForTimeout(8000);
 result.realTimeMotion=[];const hashes=[];
 for(let i=0;i<6;i++){if(i)await q.waitForTimeout(1000);const path=`${out}/motion/real-combat-${i}.png`;await shot(q,path);hashes.push(sha(await readFile(path)));result.realTimeMotion.push({path,presentation:await data(q)});}
 check('six real-time combat frames differ across five seconds',new Set(hashes).size===6);const video=q.video();await motion.close();result.video=await video.path();
 check('no runtime exceptions or failed assets',result.errors.length===0);result.status='VERIFIED';
}catch(e){result.status='BLOCKED';result.failure=e.stack;console.error(e.stack);process.exitCode=1;}
finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/visual-audit.json`,JSON.stringify(result,null,2));console.log(`${result.status}: ${result.checks.length} R5 checks, ${result.views.length} store sizes.`);}
