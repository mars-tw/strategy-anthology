import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const phase=process.argv[2]||'after';
if(!['before','after'].includes(phase))throw Error('phase');
const out=`docs/art/compare/r3/${phase}`;await mkdir(out,{recursive:true});
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const result={status:'EXECUTED',phase,screenshots:[],presentation:[],method:'Fresh public UI, virtual clock, no state injection. Identical steps before and after.'};
try{for(const [width,height]of [[390,844],[844,390],[1032,1376]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});const p=await ctx.newPage();await p.clock.install();await p.goto(url);await p.locator('[data-action="begin"]').waitFor();
 const click=a=>p.locator(`[data-action="${a}"]`).click();
 const shot=async name=>{await p.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));await p.screenshot({path:`${out}/${width}x${height}-${name}.png`});result.screenshots.push(`${width}x${height}-${name}.png`);if(phase==='after'&&name==='siege'){const data=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));if(!data.units.length||data.units.some(a=>a.height<43.999||a.healthWidth<36||a.healthHeight<5))throw Error('siege visible-size gate');const humans=data.units.filter(a=>['warrior','archer','mage','villager','shieldBearer'].includes(a.type));if(Math.max(...humans.map(a=>a.height))-Math.min(...humans.map(a=>a.height))>.01)throw Error('human scale mismatch');result.presentation.push({width,height,...data});}};
 const noLabels=async name=>{await p.locator('canvas').evaluate(c=>c.dataset.hideLabels='true');const style=await p.addStyleTag({content:'.map-label,.resonance-legend,.unit-card span:not(.unit-portrait),.tower-card>span{visibility:hidden}'});await p.clock.runFor(20);await shot(name+'-no-labels');await style.evaluate(e=>e.remove());await p.locator('canvas').evaluate(c=>delete c.dataset.hideLabels);await p.clock.runFor(20);};
 await shot('opening');await click('begin');for(const t of ['cannon','frost','tesla']){await click(`tower-${t}`);await click('confirm');}await shot('defense');
 if(phase==='after'){const stats=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));if(!stats.resonance.active||stats.resonance.bonus!==.3||stats.resonance.ranges.map(r=>r.radius).join(',')!=='160,165,160')throw Error('real range or resonance gate');}
 let i=0;while(!await p.locator('[data-action="next"]').count()&&i++<180){const wave=p.locator('[data-action="wave"]');if(await wave.count()&&await wave.isEnabled())await wave.click();await p.clock.runFor(1000);}
 if(!await p.locator('[data-action="next"]').count())throw Error('defense did not win');await click('next');await click('construct');await p.clock.runFor(6000);await click('unit-mage');await click('unit-warrior');await p.clock.runFor(7000);await click('attack');await shot('siege');if(phase==='after')await noLabels('siege');await ctx.close();
}result.status='VERIFIED';}finally{await writeFile(`${out}/capture.json`,JSON.stringify(result,null,2));await browser.close();await new Promise(r=>server.close(r));}
