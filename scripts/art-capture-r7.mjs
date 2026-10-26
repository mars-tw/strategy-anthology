import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const phase=process.argv[2]||'after';
if(!['before','after'].includes(phase))throw Error('phase');
const out=`docs/art/compare/r7/${phase}`;await mkdir(out,{recursive:true});
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const result={status:'EXECUTED',phase,screenshots:[],presentation:[],buildSHA256:createHash('sha256').update(await readFile('dist/game.js')).digest('hex'),styleSHA256:createHash('sha256').update(await readFile('dist/style.css')).digest('hex'),method:'Fresh public UI, virtual clock, no state injection. Same campaign steps; after additionally selects fire to demonstrate focus.'};
try{for(const [width,height]of [[390,844],[844,390],[1032,1376]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:true});const p=await ctx.newPage();await p.clock.install();await p.goto(url);await p.locator('[data-action="begin"]').waitFor();
 const click=a=>p.locator(`[data-action="${a}"]`).click();
 const shot=async name=>{await p.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));await p.screenshot({path:`${out}/${width}x${height}-${name}.png`});result.screenshots.push(`${width}x${height}-${name}.png`);if(phase==='after'&&name==='siege'){const data=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));if(!data.units.length||data.units.some(a=>a.height<43.999||a.healthWidth<36||a.healthHeight<5))throw Error('siege visible-size gate');const humans=data.units.filter(a=>['warrior','archer','mage','villager','shieldBearer'].includes(a.type));if(Math.max(...humans.map(a=>a.height))-Math.min(...humans.map(a=>a.height))>.01)throw Error('human scale mismatch');result.presentation.push({width,height,...data});}};
 const noLabels=async name=>{await p.locator('canvas').evaluate(c=>c.dataset.hideLabels='true');const style=await p.addStyleTag({content:'.brand,.wallet,.top-controls,.map-label,.resonance-legend,.unit-card>span:last-child,.tower-card>span,.field-status,.mission,.journey,.hint,.feedback,.command-head,.placement,.command-row,footer{visibility:hidden}'});await p.clock.runFor(20);await shot(name+'-no-labels');await style.evaluate(e=>e.remove());await p.locator('canvas').evaluate(c=>delete c.dataset.hideLabels);await p.clock.runFor(20);};
 await shot('opening');await click('begin');for(const t of ['cannon','frost','tesla']){await click(`tower-${t}`);await click('confirm');}if(phase==='after'){await p.clock.runFor(20);const f=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation).towers.find(t=>t.type==='cannon'));await p.locator('canvas').tap({position:{x:f.x,y:f.y-f.h*.6}});await click('cancel');}await shot('defense');
 if(phase==='after'){const stats=await p.locator('canvas').evaluate(c=>JSON.parse(c.dataset.presentation));if(!stats.resonance.active||stats.resonance.bonus!==.3||stats.resonance.ranges.map(r=>r.radius).join(',')!=='160,165,160')throw Error('real range or resonance gate');}
 let i=0;while(!await p.locator('[data-action="next"]').count()&&i++<180){const wave=p.locator('[data-action="wave"]');if(await wave.count()&&await wave.isEnabled())await wave.click();await p.clock.runFor(1000);}
 if(!await p.locator('[data-action="next"]').count())throw Error('defense did not win');await click('next');await click('construct');await p.clock.runFor(6000);await click('unit-mage');await click('unit-warrior');await p.clock.runFor(7000);await click('attack');await shot('siege');if(phase==='after')await noLabels('siege');await ctx.close();
}result.status='VERIFIED';}finally{await writeFile(`${out}/capture.json`,JSON.stringify(result,null,2));await browser.close();await new Promise(r=>server.close(r));}
