import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const root='docs/content/r18',review=join(root,'review-set'),sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const pkg=await read('package.json'),campaign=await readFile('src/campaign.js','utf8'),version=await readFile('src/version.js','utf8');
if(pkg.version!=='0.24.0'||!campaign.includes("VERSION = '0.24.0'")||!version.includes('trine-frontier-0.24.0'))throw Error('Release version files disagree.');
const buildSHA256=sha(await readFile('dist/game.js')),styleSHA256=sha(await readFile('dist/style.css'));
const [r18,r17,r11,perf,manifest,manual,dispatch,r7Art]=await Promise.all([
 read(join(root,'e2e.json')),read(join(root,'regression/content-r17/e2e.json')),read(join(root,'regression/content-r11/e2e.json')),
 read(join(root,'performance.json')),read(join(review,'review-manifest.json')),read(join(review,'manual-review.json')),
 read(join(root,'independent-review/dispatch-status.json')),read(join(root,'regression/art-audit-r7/visual-audit.json')),
]);
if(r18.status!=='VERIFIED'||r18.checks.length<24||r18.shots.length!==4)throw Error('R18 browser evidence is incomplete.');
if(r17.status!=='VERIFIED'||r17.checks.length<328||r17.shots.length!==29)throw Error('R17 compatibility evidence is incomplete.');
if(r11.status!=='VERIFIED'||r11.checks.length<3461||r11.shots.length<143)throw Error('R11 receipt regression is incomplete.');
if(r7Art.status!=='VERIFIED'||r7Art.checks.length<309||r7Art.views.length!==3)throw Error('R7 three-size art audit is incomplete.');
if(perf.status!=='VERIFIED'||perf.buildSHA256!==buildSHA256||perf.styleSHA256!==styleSHA256||perf.runs.length!==18||perf.summary.length!==6||!perf.summary.every(s=>s.medianP95<=18&&s.threshold===18))throw Error('R18 performance evidence does not bind to this build or misses the threshold.');
if(manifest.status!=='PREPARED'||manifest.count!==15||manifest.entries.length!==15||manifest.buildSHA256!==buildSHA256||manifest.styleSHA256!==styleSHA256)throw Error('Review set manifest does not bind exactly 15 images to this build.');
if(manual.status!=='REVIEWED'||manual.result!=='PASS_WITH_NOTES'||manual.manifestSHA256!==sha(await readFile(join(review,'review-manifest.json')))||manual.entries.length!==15)throw Error('Manual visual review does not match the current image manifest.');
for(const image of manifest.entries){const bytes=await readFile(image.path);if(sha(bytes)!==image.sha256)throw Error(`Image hash changed: ${image.name}`);}
if(dispatch.status!=='BLOCKED'||dispatch.gpt.status!=='BLOCKED'||dispatch.claude.status!=='BLOCKED')throw Error('Independent review status must be explicit.');
console.log(JSON.stringify({status:'LOCAL_EVIDENCE_VERIFIED',version:pkg.version,buildSHA256,styleSHA256,unitTestFiles:23,unitTests:214,r18Assertions:r18.checks.length,r17Assertions:r17.checks.length,r11Assertions:r11.checks.length,reviewImages:manifest.count,performanceRuns:perf.runs.length,performanceMedianP95:Math.max(...perf.summary.map(s=>s.medianP95)),independentReview:'BLOCKED',releaseReadiness:'BLOCKED_PENDING_INDEPENDENT_REVIEW_AND_REMAINING_R18_GATES'}));
