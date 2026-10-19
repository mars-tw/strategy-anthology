import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome'});
const result={status:'EXECUTED',warning:'Concurrent system load; RAF intervals in headless Chromium emulation, reference only. Not physical iOS or idle-machine certification.',buildSHA256:createHash('sha256').update(await readFile('dist/game.js')).digest('hex'),runs:[],summary:[],physicalDeviceGate:'BLOCKED'};
result.environment={startedAt:new Date().toISOString(),logicalCPUs:os.cpus().length,totalMemoryGiB:os.totalmem()/2**30,freeMemoryGiB:os.freemem()/2**30};
const click=(p,a)=>p.locator(`[data-action="${a}"]`).click();
try{
 for(const scenario of ['flood','hollow'])for(const [width,height]of [[1366,600],[320,568]])for(let run=1;run<=3;run++){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await ctx.newPage();await p.goto(url);
  if(scenario==='flood'){await click(p,'begin');await click(p,'terrain');await click(p,'preview-flood');await click(p,'apply-terrain');}
  else{await click(p,'exercises');await click(p,'exercise-hollow');}
  for(const t of ['cannon','frost','tesla']){await click(p,'tower-'+t);await click(p,'confirm');}await click(p,'wave');
  await p.waitForFunction(scenario=>{const v=JSON.parse(document.querySelector('#world').dataset.presentation);return scenario==='flood'?v.contentR2.slowIds.length>=3:v.units.filter(u=>u.team==='enemy').length>=5&&v.shotEvents.length>0;},scenario,{timeout:45000});
  const phase=await p.locator('#world').evaluate(c=>{const v=JSON.parse(c.dataset.presentation);return {enemies:v.units.filter(u=>u.team==='enemy').length,wetEnemies:v.contentR2.slowIds.length,shots:v.shotEvents.length};});
  const frames=await p.evaluate(()=>new Promise(resolve=>{const a=[];let last;function sample(t){if(last!==undefined)a.push(t-last);last=t;if(a.length<180)requestAnimationFrame(sample);else{const s=a.sort((a,b)=>a-b);resolve({p95:s[Math.floor(s.length*.95)],median:s[Math.floor(s.length*.5)],max:s.at(-1),samples:s.length,unit:'ms',method:'real requestAnimationFrame interval after three enemies enter water or five enemies reach active puzzle combat; no virtual clock'});}}requestAnimationFrame(sample);}));
  result.runs.push({scenario,width,height,run,phase,...frames});await ctx.close();
 }
 for(const scenario of ['flood','hollow'])for(const [width,height]of [[1366,600],[320,568]]){const values=result.runs.filter(r=>r.scenario===scenario&&r.width===width).map(r=>r.p95).sort((a,b)=>a-b);result.summary.push({scenario,width,height,medianP95:values[1],maxP95:values.at(-1),threshold:18,referencePass:values.every(value=>value<=18)});}
 result.status=result.summary.every(s=>s.referencePass)?'VERIFIED':'BLOCKED';if(result.status==='BLOCKED')process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile('docs/content/r7/performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,summary:result.summary}));}
