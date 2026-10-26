import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
import {acknowledgeRoutePreview} from './r3-onboarding.mjs';

const out='docs/content/r18',key='trine-frontier:campaign:v1',sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome'});
const report={status:'EXECUTED',checks:[],shots:[],errors:[]};
const check=(label,ok)=>{assert.ok(ok,label);report.checks.push(label);};
async function open(){const c=await browser.newContext({viewport:{width:430,height:932},hasTouch:true}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.locator('[data-action=begin]').waitFor();return {c,p};}
async function click(p,action){const root=p.locator('dialog[open]');await (await root.count()?root:p).locator(`[data-action="${action}"]`).first().tap();}
async function shot(p,name){const path=`${out}/${name}.png`;await p.screenshot({path});report.shots.push({path,sha256:sha(await readFile(path)),viewport:p.viewportSize()});}
try{
 const {c,p}=await open(),source=JSON.parse(await readFile('docs/content/r11/verification/input-fixtures/attained-quarry-save.json','utf8'));
 await click(p,'pause');await click(p,'saves');await p.locator('#saveCode').fill(JSON.stringify({kind:'trine-frontier-save',campaign:source}));await click(p,'preview');await click(p,'commit-import');await click(p,'begin');const before=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),key));
 await click(p,'relay-budget');
 for(const [choice,place] of [['upstream','上游長路旁'],['gate','城門前路旁'],['crystals','示意塔位在中段轉角']]){
  await click(p,'quote-'+choice);const html=await p.locator('.relay-quote').innerText();
  check(choice+' displays a named route landmark',html.includes(place));check(choice+' hides raw grid coordinates',!html.match(/\(\d+,\s*\d+\)/));
  check(choice+' updates selected choice',await p.locator(`[data-action="quote-${choice}"]`).getAttribute('aria-pressed')==='true');
  check(choice+' exposes a readable current balance',html.includes(`目前 ${before.crystals}`));if(choice==='crystals'){check('salvage quote states +90 as pending income',html.includes('拆取 90')&&html.includes('拆取收入只在確認這案後入帳'));await shot(p,'relay-budget-r18');}
 }
 await click(p,'close');check('canceling the estimate preserves campaign currency',JSON.parse(await p.evaluate(k=>localStorage.getItem(k),key)).crystals===before.crystals);await c.close();
 const t=await open();await click(t.p,'begin');const terrainBefore=JSON.parse(await t.p.evaluate(k=>localStorage.getItem(k),key)).crystals;await click(t.p,'terrain');
 for(const [choice,label] of [['barricade','堵隘口・敵軍改走北側長路'],['flood','放水・敵軍經南側濕地']]){
  await click(t.p,'preview-'+choice);const dialog=t.p.locator('dialog[open]'),html=await dialog.innerText();
  check(choice+' label matches its route preview',html.includes(label));check(choice+' selected state is unique',await dialog.locator('.terrain-choice[aria-pressed="true"]').count()===1);check(choice+' confirmation includes exact cost',await dialog.locator('[data-action=apply-terrain]').innerText().then(x=>x.includes('30')));if(choice==='flood')await shot(t.p,'terrain-selection-r18');
 }
 await click(t.p,'close');check('canceling construction preserves currency',JSON.parse(await t.p.evaluate(k=>localStorage.getItem(k),key)).crystals===terrainBefore);await t.c.close();
 const small=await open();await click(small.p,'begin');await click(small.p,'terrain');await click(small.p,'preview-flood');await small.p.setViewportSize({width:320,height:568});check('small-phone terrain preview stays visible without scrolling',await small.p.locator('dialog[open]').evaluate(e=>e.scrollHeight-e.clientHeight<=1&&e.getBoundingClientRect().width<=innerWidth&&e.getBoundingClientRect().height<=innerHeight));await shot(small.p,'terrain-selection-r18-320x568');await small.c.close();
 const landscape=await open();await click(landscape.p,'begin');await click(landscape.p,'terrain');await click(landscape.p,'preview-barricade');await landscape.p.setViewportSize({width:844,height:390});check('short-landscape terrain selection and cost stay visible',await landscape.p.locator('[data-action=preview-barricade]').getAttribute('aria-pressed')==='true'&&await landscape.p.locator('[data-action=apply-terrain]').innerText().then(x=>x.includes('30'))&&await landscape.p.locator('dialog[open]').evaluate(e=>e.scrollHeight-e.clientHeight<=1));await shot(landscape.p,'terrain-selection-r18-844x390');await landscape.c.close();
 check('no browser runtime errors',report.errors.length===0);report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/e2e.json`,JSON.stringify(report,null,2));console.log(`${report.status}: ${report.checks.length} assertions, ${report.shots.length} screenshots`);}
