import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=evidenceDir('art-audit-r3');await mkdir(`${out}/chapters`,{recursive:true});await mkdir(`${out}/motion`,{recursive:true});
const result={status:'EXECUTED',method:'Six chapters played from fresh save with public UI and virtual clock, no currency or victory injection. Motion is separate real-clock public UI. Label suppression changes presentation only.',checks:[],chapters:[],errors:[],contrast:[]};
const check=(name,ok)=>{assert.ok(ok,name);result.checks.push(name);};
const sha=b=>createHash('sha256').update(b).digest('hex');
result.buildSHA256=sha(await readFile('dist/game.js'));result.styleSHA256=sha(await readFile('dist/style.css'));
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const click=(p,a)=>p.locator(`[data-action="${a}"]`).click();
const save=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('trine-frontier:campaign:v1')));
// The campaign may win between checking a command and Playwright clicking it.
// Accept only an evidenced victory with its real next-chapter button; all other
// action failures and every existing final victory assertion remain failures.
async function battleClick(p,action){try{await p.locator(`[data-action="${action}"]`).click({timeout:2000});}catch(error){if((await save(p)).battle.result!=='won'||await p.locator('[data-action="next"]').count()!==1)throw error;}}
try{
 const manifest=JSON.parse(await readFile('docs/art/ASSET_MANIFEST_R3.json','utf8'));
 for(const a of [...manifest.sources,...manifest.runtime,...manifest.actorGrades])check(`${a.path} exact hash`,sha(await readFile(a.path))===a.sha256);
 check('28 inherited actor atlases pass current pixel color gates',manifest.actorGrades.length===28&&manifest.actorGrades.every(g=>g.pass));
 check('all native cutouts have zero-alpha corners and clean hidden RGB',manifest.runtime.filter(a=>a.mode==='RGBA').every(a=>a.cornersTransparent&&a.transparentRGBZero));
 const m=manifest.runtime.find(a=>a.path.endsWith('/commander.png')).metrics;check('commander color gate',m.meanLuminance>=.3&&m.meanLuminance<=.75&&m.nearBlackRatio<.35&&m.meanSaturation>=.32&&m.lowSaturationRatio<.2);
 const ctx=await browser.newContext({viewport:{width:1032,height:1376},hasTouch:true});const p=await ctx.newPage();await p.clock.install();p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.errors.push(`${r.status()} ${r.url()}`);});await p.goto(url);await click(p,'begin');
 for(let chapter=0;chapter<6;chapter++){
  if(chapter%2===0){
   for(const t of ['cannon','frost','tesla']){await click(p,'tower-'+t);await click(p,'confirm');}
   let s=await save(p);for(const t of s.battle.towers){while(t.level<3&&s.crystals>=60){const stats=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation)),a=stats.towers.find(a=>a.type===t.type);await p.locator('canvas').tap({position:{x:a.x,y:a.y-a.h*.6}});await click(p,'confirm');s=await save(p);t.level=s.battle.towers.find(a=>a.type===t.type).level;}}
  }else{await click(p,'construct');await p.clock.runFor(6000);for(const unit of ['mage','warrior','archer']){const b=p.locator(`[data-action="unit-${unit}"]`);if(await b.isEnabled())await b.click();}await p.clock.runFor(10000);await click(p,'attack');}
  await p.clock.runFor(20);const data=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));const path=`${out}/chapters/${chapter+1}-${data.chapterArt}.png`;await p.screenshot({path});
  if(chapter%2===0){check(`chapter ${chapter+1} resonance active with real ranges`,data.resonance.active&&data.resonance.rangeVisible&&data.resonance.ranges.map(r=>r.radius).join(',')==='160,165,160');}
  else{const people=data.units.filter(a=>['warrior','archer','mage','villager','shieldBearer'].includes(a.type));check(`chapter ${chapter+1} human heights identical and >=48px`,people.length>0&&people.every(a=>a.height>=48&&Math.abs(a.height-people[0].height)<.01));}
  await p.locator('canvas').evaluate(c=>c.dataset.hideLabels='true');const style=await p.addStyleTag({content:'.map-label,.resonance-legend,.unit-card span:not(.unit-portrait),.tower-card>span{visibility:hidden}'});await p.clock.runFor(20);const noLabels=path.replace('.png','-no-labels.png');await p.screenshot({path:noLabels});await style.evaluate(e=>e.remove());await p.locator('canvas').evaluate(c=>delete c.dataset.hideLabels);
  if(chapter===0){
   result.contrast=await p.evaluate(()=>{const lum=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};return ['.feedback','.cards small','.command-head span','.map-label','.field-status'].map(selector=>{const e=document.querySelector(selector),s=getComputedStyle(e);let parent=e,bg=s.backgroundColor;while(bg==='rgba(0, 0, 0, 0)'&&parent.parentElement){parent=parent.parentElement;bg=getComputedStyle(parent).backgroundColor;}const a=lum(s.color),b=lum(bg);return {selector,foreground:s.color,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});});check('small text contrast >=4.5:1',result.contrast.every(r=>r.ratio>=4.5));
  }
  let limit=0;while(!await p.locator('[data-action="next"]').count()&&limit++<240){
   if(chapter%2===0){const b=p.locator('[data-action="wave"]');if(await b.count()&&await b.isEnabled())await b.click();}
   else{const b=p.locator('[data-action="unit-mage"]');if(await b.count()&&await b.isEnabled())await battleClick(p,'unit-mage');const a=p.locator('[data-action="attack"]');if(await a.count()&&await a.isEnabled())await battleClick(p,'attack');}
   await p.clock.runFor(1000);
  }
  const s=await save(p);check(`chapter ${chapter+1} won by actual public commands`,s.battle.result==='won');result.chapters.push({chapter:chapter+1,path,noLabels,presentation:data,time:s.battle.time,hp:s.battle.hp,crystals:s.crystals});if(chapter<5)await click(p,'next');
 }
 await ctx.close();
 // Separate first-wave real-clock capture, never run simultaneously with another server.
 const motion=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:`${out}/motion`,size:{width:390,height:844}}});const q=await motion.newPage();await q.goto(url);await click(q,'begin');for(const t of ['cannon','frost','tesla']){await click(q,'tower-'+t);await click(q,'confirm');}await click(q,'wave');await q.waitForTimeout(8000);const hashes=[];result.motion=[];
 for(let i=0;i<6;i++){if(i)await q.waitForTimeout(1000);const path=`${out}/motion/combat-${i}.png`;await q.screenshot({path});hashes.push(sha(await readFile(path)));result.motion.push({path,presentation:await q.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation))});}check('six real-time frames differ',new Set(hashes).size===6);const video=q.video();await motion.close();result.video=await video.path();check('real-time video exists',(await stat(result.video)).size>0);
 check('no runtime exceptions or asset errors',result.errors.length===0);result.status='VERIFIED';
}catch(e){result.status='BLOCKED';result.failure=e.stack;console.error(e.stack);process.exitCode=1;}
finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/visual-audit.json`,JSON.stringify(result,null,2));console.log(`${result.status}: ${result.checks.length} R3 checks, ${result.chapters.length} naturally played chapter views.`);}
