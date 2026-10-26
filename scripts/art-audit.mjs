import {evidenceDir,evidenceFile} from './current-evidence.mjs';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const server=await serve(0),url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const result={status:'EXECUTED',checks:[],errors:[],missing:[],screenshots:[],sizes:[]};
const out=evidenceDir('art-audit');await mkdir(out,{recursive:true});
function check(name,value){assert.ok(value,name);result.checks.push(name);}
try{
 const sizes=[[320,568],[390,844],[844,390],[768,1024],[1024,768],[1366,600],[1280,640],[1366,768],[1920,1080],[1032,1376]];
 for(const [width,height]of sizes){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1100});
  const p=await context.newPage();p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.missing.push({url:r.url(),status:r.status()});});
  await p.goto(url);await p.locator('[data-action="begin"]').waitFor();await p.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));
  await p.screenshot({path:`${out}/${width}x${height}-opening.png`});result.screenshots.push(`${width}x${height}-opening.png`);
  await p.locator('[data-action="begin"]').click();for(const type of ['cannon','frost','tesla']){await p.locator(`[data-action="tower-${type}"]`).click();await p.locator('[data-action="confirm"]').click();}
  await p.screenshot({path:`${out}/${width}x${height}-defense.png`});result.screenshots.push(`${width}x${height}-defense.png`);
  const geometry=await p.evaluate(()=>{const canvas=document.querySelector('canvas'),field=document.querySelector('.battlefield'),a=canvas.getBoundingClientRect(),b=field.getBoundingClientRect();return {canvas:{w:a.width,h:a.height},field:{w:b.width,h:b.height},overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};});
  check(`${width}x${height}: canvas fills battlefield`,Math.abs(geometry.canvas.w-geometry.field.w)<=5&&Math.abs(geometry.canvas.h-geometry.field.h)<=5);check(`${width}x${height}: no page overflow`,!geometry.overflow);result.sizes.push({width,height,...geometry});
  const canvas=p.locator('canvas'),rect=await canvas.boundingBox();
  if(width<1100)await canvas.tap({position:{x:rect.width*552/960,y:rect.height*264/640}});else await p.mouse.click(rect.x+rect.width*552/960,rect.y+rect.height*264/640);
  await p.locator('[data-action="confirm"]').click();
  const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('trine-frontier:campaign:v1')));
  check(`${width}x${height}: resized canvas touch selects the correct logical tower`,save.battle.towers[0].level===2&&save.crystals===0);
  await p.locator('[data-action="pause"]').click();if(width<1100)check(`${width}x${height}: no keyboard help`,!(await p.locator('.keyboard-help').isVisible()));await context.close();
 }
 const art=JSON.parse(await readFile('docs/art/ASSET_MANIFEST_R1.json','utf8'));
 const hashes=await Promise.all(art.runtime.map(async a=>createHash('sha256').update(await readFile(a.path)).digest('hex')===a.sha256));
 check('runtime files match the exact analyzed asset hashes',hashes.every(Boolean));
 check('28 atlases pass unchanged color thresholds and pose/alpha contracts',art.actorGrades.length===28&&art.actorGrades.every(a=>a.colorGate&&a.alphaUnchanged&&a.distinctPosesPerRow.every(n=>n===4)));
 check('cutout corners are transparent; invisible RGB zero',art.runtime.filter(a=>a.mode==='RGBA').every(a=>a.cornersTransparent&&a.transparentRGBZero));
 check('no page exceptions',result.errors.length===0);check('no missing requests',result.missing.length===0);result.status='VERIFIED';
}catch(e){result.status='BLOCKED';result.failure=e.stack;process.exitCode=1;console.error(e.stack);}
finally{await writeFile(`${out}/visual-audit.json`,JSON.stringify(result,null,2));await browser.close();await new Promise(r=>server.close(r));console.log(`${result.status}: ${result.checks.length} visual checks; ${result.screenshots.length} screenshots.`);}
