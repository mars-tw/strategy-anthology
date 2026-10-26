import {join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root='docs/content/r18/review-set',sha=b=>createHash('sha256').update(b).digest('hex');
const manifestBytes=await readFile(join(root,'review-manifest.json'));
const manifest=JSON.parse(manifestBytes);
if(manifest.status!=='PREPARED'||manifest.count!==15||manifest.entries.length!==15)throw new Error('Expected an exact 15-image review manifest.');
const observations={
 '00-relay-budget-430.png':'Amount equation is readable: current 390 plus pending salvage 90 equals 480; follow-up costs are recalculated from that total.',
 '01-relay-budget-320.png':'All choices and both dialog actions fit in the narrow phone view; smaller helper text remains secondary and visible.',
 '02-relay-budget-location.png':'Selected gate choice maps to the gate firing lane and says 城門前路旁; no grid coordinates appear.',
 '03-terrain-choice-430.png':'Flood choice, selected state, route preview and 30-crystal cost agree; all tower rows and actions are visible.',
 '04-terrain-choice-320.png':'The 320x568 modal has no scroll bar; selected route, tower rows, cost and confirmation remain visible.',
 '05-terrain-choice-844x390.png':'The short-landscape view retains the north detour preview, single selected option and 30-crystal confirmation cost.',
 '06-relay-three-branches.png':'The first-wave comparison shows all three branches with durability, leaks and elapsed time; the table stays within the dialog.',
 '07-gate-inherited-hit.png':'The inherited gate tower has a visible hit marker and damage callout; the scene remains identifiable at phone size.',
 '08-crystals-rebuild-budget.png':'The top balance label explains the 90-crystal salvage once; each tower card shows its own tower and purchase status.',
 '09-barricade-preview.png':'The barricade selection uses the north route preview; selected label and 30-crystal confirmation agree.',
 '10-flood-preview.png':'The flood selection matches the marked south-side water route; selected label and 30-crystal confirmation agree.',
 '11-sluice-closed.png':'The closed gate state and next activation control are visible before the water starts.',
 '12-sluice-opening.png':'The opening state shows remaining slow time and affected entrants without covering the main enemies.',
 '13-sluice-open.png':'The open state clearly differs from the opening frame and keeps the active water lane visible.',
 '14-sluice-timing-summary.png':'All three measured outcomes are listed, and the copy says the summary does not establish why the results differ.'
};
const entries=[];
for(const item of manifest.entries){
 const bytes=await readFile(item.path);if(sha(bytes)!==item.sha256)throw new Error(`Reviewed image hash changed: ${item.name}`);
 if(!observations[item.name])throw new Error(`No visual observation for ${item.name}`);
 entries.push({name:item.name,sha256:item.sha256,result:'PASS',observation:observations[item.name]});
}
if(entries.length!==15||Object.keys(observations).length!==15)throw new Error('Manual review must cover exactly 15 images.');
const report={status:'REVIEWED',result:'PASS_WITH_NOTES',reviewedAt:new Date().toISOString(),method:'Displayed and inspected each original image individually at high detail; no contact sheet used.',manifestSHA256:sha(manifestBytes),criteria:['selected option agrees with map preview and cost','critical text and actions are visible without unintended clipping','no raw grid coordinates in the updated budget preview','screenshots match their verified source capture hashes'],entries,scopeNotes:['The 320x568 layout is compact; supporting copy is intentionally smaller than action labels.','This is a visual review of the 15 bound screenshots. Remaining release gates are listed separately in the R18 response report.']};
await writeFile(join(root,'manual-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(`REVIEWED: ${entries.length} individual images; manifest SHA ${report.manifestSHA256}`);
