// Complete uncut portrait touch journeys: home -> build -> preview -> construct -> wave -> hit.
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out='docs/content/r2',key='trine-frontier:campaign:v1',server=await serve(0),browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const result={status:'EXECUTED',buildSHA256:createHash('sha256').update(await readFile('dist/game.js')).digest('hex'),checks:[],videos:[],shots:[],method:'Uncut native-size browser screenshots, public touch controls only, virtual elapsed time; no injected game state. Silent 8fps evidence, not realtime performance.'};
const check=(name,v)=>{assert.ok(v,name);result.checks.push(name);};
try{
 for(const [width,height,name] of [[320,568,'small'],[430,932,'large']]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await c.newPage(),dir=`.audit-tmp/content-r2/full-touch-${name}`;await mkdir(dir,{recursive:true});
  await p.clock.install({time:new Date('2026-10-19T08:00:00Z')});await p.goto(`http://127.0.0.1:${server.address().port}`);await p.locator('[data-action=begin]').waitFor();await p.clock.pauseAt(new Date('2026-10-19T08:00:05Z'));
  let index=0;const capture=async()=>{await p.clock.runFor(25);await p.screenshot({path:`${dir}/${String(index++).padStart(4,'0')}.png`});};
  const tap=async a=>{await p.locator(`[data-action=${a}]`).tap();await capture();};
  const saved=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  const shot=async state=>{const path=`${out}/phone-${name}-full-${state}.png`;await p.screenshot({path});result.shots.push({path,viewport:{width,height},dpr:1});};
  await capture();await tap('begin');for(const t of ['cannon','frost','tesla']){await tap('tower-'+t);await tap('confirm');}check(name+' builds all three towers',(await saved()).battle.towers.length===3);
  await tap('terrain');await tap('preview-barricade');await tap('preview-flood');await shot('preview');await tap('close');check(name+' cancel free',(await saved()).crystals===60);
  await tap('terrain');await tap('preview-flood');await tap('apply-terrain');check(name+' pays construction once',(await saved()).crystals===30&&(await saved()).battle.terrainChoice==='flood');await shot('constructed');await tap('wave');
  for(let i=0;i<10;i++){await p.clock.runFor(400);await capture();}
  const v=await p.locator('#world').evaluate(c=>JSON.parse(c.dataset.presentation)),u=v.units.find(u=>u.team==='enemy');check(name+' real enemy enters',!!u);const money=(await saved()).crystals;await tap('skill');const r=await p.locator('#world').boundingBox();await p.locator('#world').tap({position:{x:u.nativeX*r.width/960,y:u.nativeY*r.height/640}});await capture();
  const hit=await p.locator('#world').evaluate(c=>JSON.parse(c.dataset.presentation));check(name+' shock hits with exact debit',hit.effects.some(f=>f.kind==='spell')&&(await saved()).crystals===money-20);await shot('shock');for(let i=0;i<4;i++){await p.clock.runFor(100);await capture();}
  const path=`${out}/phone-${name}-full-operation.mp4`;execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','8','-i',`${dir}/%04d.png`,'-frames:v',String(index),'-c:v','libx264','-pix_fmt','yuv420p','-crf','24',path],{windowsHide:true});result.videos.push({path,frames:index,fps:8,uncut:true,viewport:{width,height}});await c.close();
 }
 result.status='VERIFIED';
}catch(e){result.status='BLOCKED';result.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(`${out}/touch-e2e.json`,JSON.stringify(result,null,2));console.log(`${result.status}: ${result.checks.length} full-touch checks, ${result.videos.length} full journeys.`);}
