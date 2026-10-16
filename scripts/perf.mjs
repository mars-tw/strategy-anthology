import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome'});
const data={status:'EXECUTED',buildSHA256:createHash('sha256').update(await readFile('dist/game.js')).digest('hex'),warning:'並發載量測，僅供參考；Chromium emulation, not idle-machine or physical-device release qualification.',runs:[],releaseGate:'BLOCKED'};
try{for(const viewport of [{width:1366,height:600},{width:844,height:390}])for(let run=1;run<=3;run++){
 const context=await browser.newContext({viewport});const page=await context.newPage();await page.goto(url);await page.locator('[data-action="begin"]').click();
 for(const type of ['cannon','frost','tesla']){await page.locator(`[data-action="tower-${type}"]`).click();await page.locator('[data-action="confirm"]').click();}
 await page.locator('[data-action="wave"]').click();
 const measurement=await page.evaluate(()=>new Promise(resolve=>{const frames=[];let last=performance.now();function sample(t){frames.push(t-last);last=t;if(frames.length<181)requestAnimationFrame(sample);else{const sorted=frames.slice(1).sort((a,b)=>a-b);resolve({p95:sorted[Math.floor(sorted.length*.95)],median:sorted[Math.floor(sorted.length*.5)],max:Math.max(...sorted),samples:sorted.length,unit:'ms',method:'requestAnimationFrame interval, live first defense, no virtual clock'});}}requestAnimationFrame(sample);}));
 data.runs.push({viewport,run,...measurement});await context.close();
}for(const size of ['1366x600','844x390']){const values=data.runs.filter(r=>`${r.viewport.width}x${r.viewport.height}`===size).map(r=>r.p95).sort((a,b)=>a-b);data[size]={medianP95:values[1],referenceThreshold:18,referencePass:values[1]<=18};}}
finally{await writeFile('docs/evidence/performance.json',JSON.stringify(data,null,2));await browser.close();await new Promise(r=>server.close(r));console.log(JSON.stringify(data));}
