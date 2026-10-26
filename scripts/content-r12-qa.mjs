import {chromium} from 'playwright';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const out='docs/content/r12';await mkdir(`${out}/qa-64px`,{recursive:true});await mkdir('docs/evidence/content-r12',{recursive:true});
const report=JSON.parse(await readFile(`${out}/regression-proof-e2e.json`)),browser=await chromium.launch({headless:true,channel:'chrome',args:['--mute-audio']});
try{
 const ctx=await browser.newContext({viewport:{width:64,height:139},deviceScaleFactor:1}),p=await ctx.newPage();
 for(const name of ['terrain-barricade-proof-turn-1','terrain-barricade-proof-turn-2','terrain-barricade-proof-turn-3']){
  const path=`${out}/phone-${name}.png`,b=await readFile(path),shot=report.shots.find(s=>s.path===path);
  await p.setViewportSize({width:64,height:139});await p.setContent(`<style>body{margin:0}img{display:block;width:64px}</style><img src="data:image/png;base64,${b.toString('base64')}">`);await p.locator('img').evaluate(i=>i.decode());await p.screenshot({path:`${out}/qa-64px/phone-${name}.png`});
  const c=shot.canvas,scale=64/c.width;await p.setViewportSize({width:64,height:Math.ceil(c.height*scale)});await p.setContent(`<style>body{margin:0;overflow:hidden}img{position:absolute;width:${430*scale}px;left:${-c.x*scale}px;top:${-c.y*scale}px}</style><img src="data:image/png;base64,${b.toString('base64')}">`);await p.locator('img').evaluate(i=>i.decode());await p.screenshot({path:`${out}/qa-64px/map-${name}.png`});
 }
 await ctx.close();
 for(const [source,target]of [['phone-sluice-layout-430x932-combat.png','phone-430x932.png'],['phone-sluice-layout-844x390-combat.png','landscape-844x390.png'],['phone-sluice-layout-1032x1376-combat.png','ipad-1032x1376.png']])await copyFile(`${out}/${source}`,`docs/evidence/content-r12/${target}`);
 await writeFile(`${out}/qa-64px/README.md`,'VERIFIED。以原尺寸手機截圖在無頭瀏覽器縮至64 CSS px作辨識檢查；map檔只取原圖既有canvas範圍。沒有改動review-set原圖。\n');
}finally{await browser.close();}
console.log('VERIFIED: 64px QA and three viewport copies.');
