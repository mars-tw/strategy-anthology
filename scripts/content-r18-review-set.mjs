import {basename,join} from 'node:path';
import {mkdir,readFile,copyFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root='docs/content/r18',out=join(root,'review-set'),sha=b=>createHash('sha256').update(b).digest('hex');
const picks=[
 ['00-relay-budget-430.png',join(root,'relay-budget-r18.png'),'Budget is current balance plus the 90-crystal salvage receipt.'],
 ['01-relay-budget-320.png',join(root,'regression/content-r17/phone-relay-320-quote.png'),'Narrow-phone version of the budget chooser.'],
 ['02-relay-budget-location.png',join(root,'regression/content-r17/phone-relay-position-budget-preview.png'),'Selected gate location and its mapped firing lane.'],
 ['03-terrain-choice-430.png',join(root,'terrain-selection-r18.png'),'Selected flood route and exact construction cost.'],
 ['04-terrain-choice-320.png',join(root,'terrain-selection-r18-320x568.png'),'Narrow-phone construction preview without scrolling.'],
 ['05-terrain-choice-844x390.png',join(root,'terrain-selection-r18-844x390.png'),'Short-landscape route choice and cost on the action button.'],
 ['06-relay-three-branches.png',join(root,'regression/content-r17/phone-relay-three-branch-summary.png'),'Three measured first-wave relay branches.'],
 ['07-gate-inherited-hit.png',join(root,'regression/content-r17/phone-relay-gate-inherited-hit.png'),'Inherited tower contributes an actual hit.'],
 ['08-crystals-rebuild-budget.png',join(root,'regression/content-r17/phone-relay-crystals-real-budget.png'),'Salvage budget used to build a replacement tower.'],
 ['09-barricade-preview.png',join(root,'regression/content-r17/phone-terrain-barricade-cost-preview.png'),'Selected north detour with construction preview.'],
 ['10-flood-preview.png',join(root,'regression/content-r17/phone-terrain-flood-cost-preview.png'),'Selected south flood route with construction preview.'],
 ['11-sluice-closed.png',join(root,'regression/content-r17/phone-sluice-closed.png'),'Sluice before activation.'],
 ['12-sluice-opening.png',join(root,'regression/content-r17/phone-sluice-opening.png'),'Sluice panel moving during activation.'],
 ['13-sluice-open.png',join(root,'regression/content-r17/phone-sluice-open.png'),'Sluice fully open with water active.'],
 ['14-sluice-timing-summary.png',join(root,'regression/content-r17/phone-sluice-three-timing-summary.png'),'Measured outcomes for all three timing choices.'],
];
const reports=[JSON.parse(await readFile(join(root,'e2e.json'),'utf8')),JSON.parse(await readFile(join(root,'regression/content-r17/e2e.json'),'utf8'))];
await mkdir(out,{recursive:true});
const game=await readFile('dist/game.js'),style=await readFile('dist/style.css');
const entries=[];
for(const [name,source,purpose]of picks){
 const bytes=await readFile(source),evidence=reports.flatMap(r=>r.shots||[]).find(s=>basename(s.path)===basename(source));
 if(!evidence||evidence.sha256!==sha(bytes))throw new Error(`Screenshot provenance mismatch: ${source}`);
 const dest=join(out,name);await copyFile(source,dest);const copied=await readFile(dest);
 if(!copied.equals(bytes))throw new Error(`Copy verification failed: ${name}`);
 entries.push({name,path:dest,source,sha256:sha(bytes),viewport:evidence.viewport,dpr:evidence.dpr||1,purpose});
}
if(entries.length!==15||new Set(entries.map(e=>e.name)).size!==15)throw new Error('Review set must contain exactly 15 unique originals.');
const manifest={status:'PREPARED',count:entries.length,buildSHA256:sha(game),styleSHA256:sha(style),evidenceReports:['docs/content/r18/e2e.json','docs/content/r18/regression/content-r17/e2e.json'],entries};
await writeFile(join(out,'review-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`PREPARED: ${entries.length} original screenshots bound to source capture hashes and current build/style.`);
