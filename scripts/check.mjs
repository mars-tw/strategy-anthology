import {spawnSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const npmCli=path.resolve(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const checks=[];
for(const [name,args]of [['unit',['test']],['build',['run','build']],['e2e',['run','test:e2e']],['audit',['exec','--','node','scripts/audit.mjs']]]){
 const start=Date.now();const run=spawnSync(process.execPath,[npmCli,...args],{encoding:'utf8',maxBuffer:32e6});await writeFile(`docs/evidence/${name}.txt`,(run.stdout||'')+(run.stderr||''));
 const record={name,command:`npm ${args.join(' ')}`,exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.message||null};checks.push(record);console.log(JSON.stringify(record));if(run.status!==0)break;
}
const status=checks.length===4&&checks.every(c=>c.exitCode===0)?'VERIFIED':'BLOCKED';
await writeFile('docs/evidence/verification.json',JSON.stringify({status,version:JSON.parse(await readFile('package.json','utf8')).version,checks,scope:'Local web implementation only; no push, deployment, store action, native binary or human beta.'},null,2));if(status!=='VERIFIED')process.exitCode=1;
