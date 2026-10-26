import {mkdtemp,mkdir,readFile,writeFile,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifySourceSnapshot} from './source-integrity.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),baseline=JSON.parse(await readFile('docs/evidence/source-baseline.json','utf8'));
const positive=await verifySourceSnapshot('.');
if(positive.sourceFiles.length!==baseline.files.length||positive.sourceFiles.some(row=>!row.unchanged||row.evidence!=='vendored-bytes'))throw Error('Current source-41 bytes are not all present and unchanged.');

const fixture=await mkdtemp(join(tmpdir(),'trine-r19-source-missing-')),missing='vendor/tower-defense/scripts/test-config.js';
await mkdir(join(fixture,'docs/evidence'),{recursive:true});await writeFile(join(fixture,'docs/evidence/source-baseline.json'),await readFile('docs/evidence/source-baseline.json'));
for(const row of baseline.files){if(row.path===missing)continue;const target=join(fixture,row.path);await mkdir(dirname(target),{recursive:true});await link(resolve(row.path),target);}
let rejection=null;try{await verifySourceSnapshot(fixture);}catch(error){rejection={code:error.code,message:error.message};}
if(rejection?.code!=='ENOENT'||!rejection.message.includes('test-config.js'))throw Error('Exact missing source file was not rejected.');
console.log(JSON.stringify({status:'VERIFIED',positiveFiles:positive.sourceFiles.length,positiveEvidence:[...new Set(positive.sourceFiles.map(row=>row.evidence))],negativeFixture:{method:'40 hard links plus unchanged manifest; exact target omitted; no source file deleted or moved',missing,rejectedCode:rejection.code},baselineSHA256:positive.baselineSHA256,scriptSHA256:sha(await readFile('scripts/source-integrity.mjs'))}));
