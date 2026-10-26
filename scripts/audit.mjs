import {evidenceDir} from './current-evidence.mjs';
import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifySourceSnapshot} from './source-integrity.mjs';
import path from 'node:path';
const hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(await readFile('docs/evidence/source-baseline.json','utf8'));
const assetManifest=JSON.parse(await readFile('docs/ASSET_MANIFEST.json','utf8'));
const retainedFiles=[];for(const f of assetManifest.files)retainedFiles.push({path:f.path,unchangedCopy:hash(await readFile(f.path))===f.sha256});
const {sourceFiles,repos,baselineSHA256}=await verifySourceSnapshot();
const files=[];async function walk(dir){for(const ent of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.audit-tmp'].includes(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())await walk(p);else files.push(p);}}await walk('.');
const secrets=[];const pattern=new RegExp('sk-proj-'+'[A-Za-z0-9_-]{20,}|sk-'+'[a-z0-9]{40}','g');
for(const file of files){if(/.(png|webp|jpg|woff2|mp4|zip)$/.test(file))continue;const content=await readFile(file,'utf8');if(pattern.test(content))secrets.push(file);pattern.lastIndex=0;}
const shots=[];for(const file of files.filter(f=>f.startsWith(path.join('docs','store','screenshots'))&&f.endsWith('.png'))){const b=await readFile(file);shots.push({path:file.replaceAll('\\','/'),width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:hash(b)});}
const runtime=[];async function runtimeWalk(dir){for(const ent of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())await runtimeWalk(p);else runtime.push({path:p.replaceAll('\\','/'),bytes:(await stat(p)).size,sha256:hash(await readFile(p))});}}await runtimeWalk('dist');
const result={status:secrets.length===0&&sourceFiles.every(f=>f.unchanged)&&retainedFiles.every(f=>f.unchangedCopy)&&repos.every(r=>r.headUnchanged&&r.statusUnchanged)?'VERIFIED':'BLOCKED',version:JSON.parse(await readFile('package.json','utf8')).version,secretScan:{files:files.length,matches:secrets.length,paths:secrets},sourceFiles,retainedFiles,repos,baselineSHA256,screenshots:shots,runtime:{files:runtime.length,bytes:runtime.reduce((n,f)=>n+f.bytes,0),manifest:runtime},productionNoDebugHook:!(await readFile('dist/game.js','utf8')).includes('__TRINE_DEBUG')};
await writeFile(evidenceDir('release-audit')+'/release-audit.json',JSON.stringify(result,null,2));console.log(`${result.status}: ${sourceFiles.length} original source hashes; ${repos.length} immutable source import states; ${files.length} files scanned, ${secrets.length} secret hits; ${shots.length} screenshots.`);if(result.status!=='VERIFIED')process.exitCode=1;
