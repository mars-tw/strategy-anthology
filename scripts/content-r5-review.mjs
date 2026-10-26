import {chromium} from 'playwright';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const out='docs/content/r5',dest=out+'/review-set';
const source=JSON.parse(await readFile(out+'/e2e.json','utf8'));
assert.equal(source.status,'VERIFIED');
await mkdir(dest,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
const report={status:'EXECUTED',method:'Copy original gameplay PNGs. Five additional portrait two-column evidence sheets display every source at exactly 430x932 physical pixels (215x466 CSS pixels at DPR2), without pixel resampling, cropping, retouching or fabricated gameplay. Sheets are explicitly comparisons, not a single game screen.',sheets:[],selected:[]};
const e=(label,name)=>({label,path:'phone-'+name+'.png'});
try{
 const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:2});
 const p=await ctx.newPage();
 async function sheet(name,title,entries){
  for(const item of entries)assert(source.shots.some(s=>s.path===out+'/'+item.path),'source must be captured gameplay: '+item.path);
  const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;width:430px;background:#f5f1e5;color:#292d38;font:11px "Microsoft JhengHei",sans-serif}h1{box-sizing:border-box;font-size:11px;line-height:15px;height:32px;margin:0;padding:1px 4px}main{display:grid;grid-template-columns:215px 215px}section{width:215px}h2{box-sizing:border-box;font-size:10px;line-height:18px;height:24px;margin:0;padding:3px;background:#e4e9df}img{display:block;width:215px;height:466px;max-width:none}</style><h1>'+title+'<br>原尺寸對照｜每格實體像素 430×932，未重採樣</h1><main>'+entries.map(item=>'<section><h2>'+item.label+'</h2><img src="'+item.path+'" width="215" height="466"></section>').join('')+'</main>';
  const file=out+'/'+name+'.html';await writeFile(file,html);
  await p.goto(pathToFileURL(path.resolve(file)).href);
  await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const frames=await p.locator('img').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),d=devicePixelRatio;return {source:n.getAttribute('src'),x:r.x*d,y:r.y*d,width:r.width*d,height:r.height*d,naturalWidth:n.naturalWidth,naturalHeight:n.naturalHeight};}));
  assert(frames.every(f=>f.width===430&&f.height===932&&f.naturalWidth===430&&f.naturalHeight===932));
  const screenshot='phone-'+name+'.png';await p.screenshot({path:out+'/'+screenshot,fullPage:true});
  report.sheets.push({path:out+'/'+screenshot,html:file,frames,viewport:{width:430,height:932},dpr:2});return screenshot;
 }
 const crystal=await sheet('ford-crystals-three-frames','拆晶：411 → 411 → 501',[e('0ms｜結晶送達後可接續','ford-crystals-flight-1'),e('650ms｜飛向錢包圖示外側','ford-crystals-flight-2'),e('1300ms｜501 完整可讀','ford-crystals-flight-3')]);
 const inspection=await sheet('terrain-inspection-three-elements','逐行點選，核對真實射程',[e('火印塔：零重疊','terrain-inspect-cannon'),e('冰印塔：新路有重疊段','terrain-inspect-frost'),e('雷印塔：零重疊','terrain-inspect-tesla')]);
 const exercises=[];
 for(const [id,title]of [['turn','聚印轉角'],['levee','分守長堤'],['switchback','折返雙隘']]){
  assert.equal(source.exercises[id].complete.budget,source.exercises[id].failed.budget);
  exercises.push(await sheet('exercise-'+title+'-four-states',title+'｜同預算勝敗對照',[
   e('佈陣｜元素名牌與留空塔位','exercise-'+title+'-formation'),
   e('交戰｜同一塔身，實際投射物','exercise-'+title+'-combat'),
   e('完成｜餘額 '+source.exercises[id].complete.budget+'；共鳴 '+(source.exercises[id].complete.trinity?'+30%':'0%'),'exercise-'+title+'-complete'),
   e('同額失敗｜餘額 '+source.exercises[id].failed.budget+'；紅圈首漏點','exercise-'+title+'-failed')
  ]));
 }
 const groups=[
  ['留塔／拆晶',['phone-ford-tower-choice.png','phone-ford-tower-next.png','phone-ford-tower-combat.png','phone-ford-tower-hit.png',crystal]],
  ['改地形',['phone-terrain-flood-before.png','phone-terrain-flood-inside.png','phone-terrain-flood-after.png','phone-terrain-flood-gate.png',inspection]],
  ['三印窄陣',[...exercises,'phone-exercise-聚印轉角-hit.png','phone-exercise-折返雙隘-hit.png']]
 ];
 let n=0;
 for(const [group,names]of groups)for(const name of names){const target=dest+'/'+String(++n).padStart(2,'0')+'-'+name.slice(6);await copyFile(out+'/'+name,target);const original=sha(await readFile(out+'/'+name));assert.equal(sha(await readFile(target)),original);report.selected.push({group,path:target,original:out+'/'+name,sha256:original});}
 assert.equal(n,15);await ctx.close();report.status='VERIFIED';
}finally{await browser.close();await writeFile(out+'/review-set.json',JSON.stringify(report,null,2));}
console.log(report.status+': 15 portrait evidence images, 5 per feature; original source pixels retained.');
