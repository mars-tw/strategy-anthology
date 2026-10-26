import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const result={status:'EXECUTED',warning:'Concurrent system load; RAF intervals in headless Chromium emulation, reference only. Not physical iOS or idle-machine certification.',buildSHA256:createHash('sha256').update(await readFile('dist/game.js')).digest('hex'),runs:[],summary:[],physicalDeviceGate:'BLOCKED'};
const click=(p,a)=>p.locator(`[data-action="${a}"]`).click();
try{
 for(const scenario of ['flood','switchback'])for(const [width,height]of [[1366,600],[320,568]])for(let run=1;run<=3;run++){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await ctx.newPage();await p.goto(url);
  if(scenario==='flood'){await click(p,'begin');await click(p,'terrain');await click(p,'preview-flood');await click(p,'apply-terrain');}
  else{await click(p,'exercises');await click(p,'exercise-switchback');}
  for(const t of ['cannon','frost','tesla']){await click(p,'tower-'+t);await click(p,'confirm');}await click(p,'wave');
  const frames=await p.evaluate(()=>new Promise(resolve=>{const a=[];let last;function sample(t){if(last!==undefined)a.push(t-last);last=t;if(a.length<180)requestAnimationFrame(sample);else{const s=a.sort((a,b)=>a-b);resolve({p95:s[Math.floor(s.length*.95)],median:s[Math.floor(s.length*.5)],max:s.at(-1),samples:s.length,unit:'ms',method:'real requestAnimationFrame interval during active new-content play, no virtual clock'});}}requestAnimationFrame(sample);}));
  result.runs.push({scenario,width,height,run,...frames});await ctx.close();
 }
 for(const scenario of ['flood','switchback'])for(const [width,height]of [[1366,600],[320,568]]){const values=result.runs.filter(r=>r.scenario===scenario&&r.width===width).map(r=>r.p95).sort((a,b)=>a-b);result.summary.push({scenario,width,height,medianP95:values[1],threshold:18,referencePass:values[1]<=18});}
 result.status=result.summary.every(s=>s.referencePass)?'VERIFIED':'BLOCKED';if(result.status==='BLOCKED')process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile('docs/content/r2/performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,summary:result.summary}));}
