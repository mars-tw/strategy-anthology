import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './serve.mjs';
const out=evidenceDir('content-r13-contrast'),hash=b=>createHash('sha256').update(b).digest('hex');
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const report={status:'EXECUTED',method:'Post-suite contrast-only visual readback through the same public save-import and choice UI. The game bundle is byte-identical to the full suite; one appended CSS text-color rule is the sole style change.',buildSHA256:hash(await readFile('dist/game.js')),styleSHA256:hash(await readFile('dist/style.css')),checks:[],shots:[],errors:[]};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
try{
 const c=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true}),p=await c.newPage();
 p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(![url,'data:','blob:'].some(prefix=>r.url().startsWith(prefix)))report.errors.push(r.url());});
 await p.clock.install({time:new Date('2026-10-20T06:00:00Z')});await p.goto(url);await p.locator('[data-action=begin]').waitFor();await p.clock.pauseAt(new Date('2026-10-20T06:00:05Z'));
 const tap=async action=>{const d=p.locator('dialog[open]');await (await d.count()?d:p).locator(`[data-action="${action}"]`).first().tap();};
 const source=await readFile('docs/content/r11/verification/input-fixtures/attained-quarry-save.json');report.sourceSaveSHA256=hash(source);
 await tap('pause');await tap('saves');await p.locator('#saveCode').fill(JSON.stringify({kind:'trine-frontier-save',campaign:JSON.parse(source)}));await tap('preview');await tap('commit-import');await tap('begin');await p.clock.runFor(25);
 const colors=await p.locator('.quarry-choice .primary .relay-value').evaluate(e=>({foreground:getComputedStyle(e).color,background:getComputedStyle(e.closest('button')).backgroundColor,fontSize:getComputedStyle(e).fontSize}));
 const luminance=text=>{const rgb=text.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 const values=[luminance(colors.foreground),luminance(colors.background)].sort((a,b)=>a-b);report.contrast={...colors,ratio:(values[1]+.05)/(values[0]+.05)};
 check('selected relay value text meets 4.5:1',report.contrast.ratio>=4.5);check('all three range previews remain present',await p.locator('.quarry-choice .relay-range').count()===3);
 const buttons=await p.locator('button').evaluateAll(nodes=>nodes.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {action:e.dataset.action,w:r.width,h:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:hit===e||e.contains(hit)};}));
 for(const b of buttons)check(b.action+' remains reachable >=44px',b.w>=43.9&&b.h>=43.9&&b.inside&&b.hit);
 await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));const path=out+'/phone-relay-value-choices-contrast.png';await p.screenshot({path});report.shots.push({path,viewport:{width:430,height:932},dpr:1,sha256:hash(await readFile(path)),frame:await p.locator('#world').evaluate(e=>JSON.parse(e.dataset.presentation))});
 check('no runtime error or outside request',report.errors.length===0);await c.close();report.status='VERIFIED';
}catch(e){report.status='BLOCKED';report.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await writeFile(out+'/contrast-readback.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,contrast:report.contrast}));}
