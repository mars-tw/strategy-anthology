import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {acknowledgeRoutePreview} from './r3-onboarding.mjs';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const result={status:'EXECUTED',checks:[],errors:[],sizes:[],screenshots:[],method:'Public UI, live renderer alpha-bbox telemetry, real-clock video; no reward/game-state injection.',buildSHA256:createHash('sha256').update(await readFile('dist/game.js')).digest('hex')};
result.styleSHA256=createHash('sha256').update(await readFile('dist/style.css')).digest('hex');
const check=(name,ok)=>{assert.ok(ok,name);result.checks.push(name);};
const hash=b=>createHash('sha256').update(b).digest('hex');
const out=evidenceDir('art-audit-r2');await mkdir(`${out}/motion`,{recursive:true});
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
try{
 const art=JSON.parse(await readFile('docs/art/ASSET_MANIFEST_R2.json','utf8'));
 for(const a of [...art.runtime,...art.actorGrades])check(`${a.path}: analyzed hash`,hash(await readFile(a.path))===a.sha256);
 check('28 inherited atlases pass unchanged color and pose gates',art.actorGrades.length===28&&art.actorGrades.every(a=>a.colorGate&&a.alphaUnchanged&&a.distinctPosesPerRow.every(n=>n===4)));
 check('6 iron-blue enemy direction atlases retain exact alpha',art.derivedAtlases.length===6&&art.derivedAtlases.every(a=>a.alphaUnchanged));
 const commander=art.runtime.find(a=>a.path.endsWith('/commander.png')).metrics;
 check('new commander passes the same color double gate',commander.meanLuminance>=.30&&commander.meanLuminance<=.75&&commander.nearBlackRatio<.35&&commander.meanSaturation>=.32&&commander.lowSaturationRatio<.20);
 const alpha=JSON.parse(await readFile('docs/art/r2/alpha-gate.json','utf8'));check('shared Wave 0 alpha gate passes all R2 cutouts',alpha.status==='VERIFIED'&&alpha.files.length===13&&alpha.files.every(a=>a.pass));
 for(const [width,height]of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1366,600],[1280,640],[1366,768],[1920,1080],[1032,1376]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1100});const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.errors.push(`${r.status()} ${r.url()}`);});
  await p.goto(url);await p.locator('[data-action="begin"]').click();for(const t of ['cannon','frost','tesla']){await p.locator(`[data-action="tower-${t}"]`).click();await p.locator('[data-action="confirm"]').click();}
  await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.presentation||'{}').towers?.length===3);
  const stats=await p.locator('canvas').evaluate(c=>({rect:{width:c.clientWidth,height:c.clientHeight},...JSON.parse(c.dataset.presentation)}));
  check(`${width}x${height}: all three tower silhouettes >=44px`,stats.towers.every(t=>t.h*240/256>=44));
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const a=stats.towers[i],b=stats.towers[j];check(`${width}x${height}: ${a.type}/${b.type} have separate bodies`,Math.abs(a.x-b.x)>=a.h*.6||Math.abs(a.y-b.y)>=a.h*.9);}
  // Rotate through all three DISPLAYED tower bodies across the matrix.
  const type=['cannon','frost','tesla'][result.sizes.length%3],target=stats.towers.find(t=>t.type===type),canvas=p.locator('canvas');
  if(width<1100)await canvas.tap({position:{x:target.x,y:target.y-target.h*.6}});else{const box=await canvas.boundingBox();await p.mouse.click(box.x+target.x,box.y+target.y-target.h*.6);}
  await p.locator('[data-action="confirm"]').click();const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('trine-frontier:campaign:v1')));check(`${width}x${height}: displayed ${type} upgrades correct native tower`,save.battle.towers.find(t=>t.type===type).level===2&&save.crystals===0);
  await p.locator('[data-action="wave"]').click();await acknowledgeRoutePreview(p);await p.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.presentation||'{}').units?.length>0);
  const data=await canvas.evaluate(c=>JSON.parse(c.dataset.presentation));check(`${width}x${height}: actual live unit bbox >=44 and health >=36x5`,data.units.every(a=>a.height>=43.999&&a.healthWidth>=36&&a.healthHeight===5));
  result.sizes.push({width,height,towers:stats.towers,units:data.units});await ctx.close();
 }
 // Five seconds of actual gameplay motion, no synthetic clock. Preserve video
 // plus six stills to inspect authored walk/hurt/death, projectiles and reward.
 const ctx=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:`${out}/motion`,size:{width:390,height:844}}});const p=await ctx.newPage();await p.goto(url);await p.locator('[data-action="begin"]').click();for(const t of ['cannon','frost','tesla']){await p.locator(`[data-action="tower-${t}"]`).click();await p.locator('[data-action="confirm"]').click();}await p.locator('[data-action="wave"]').click();await acknowledgeRoutePreview(p);
 // Let the first enemy reach native tower range before sampling action.
 await p.waitForTimeout(8000);
 const frames=[];for(let i=0;i<=5;i++){if(i)await p.waitForTimeout(1000);const file=`${out}/motion/defense-${i}.png`;await p.screenshot({path:file});frames.push(hash(await readFile(file)));result.screenshots.push(file);}
 check('six real-time motion stills differ',new Set(frames).size===6);const video=p.video();await ctx.close();result.video=await video.path();
 check('no missing assets or page exceptions',result.errors.length===0);result.status='VERIFIED';
}catch(e){result.status='BLOCKED';result.failure=e.stack;console.error(e.stack);process.exitCode=1;}
finally{await writeFile(`${out}/visual-audit.json`,JSON.stringify(result,null,2));await browser.close();await new Promise(r=>server.close(r));console.log(`${result.status}: ${result.checks.length} R2 checks.`);}
