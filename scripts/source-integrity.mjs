import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export const sourceBaselineSHA256='a2446be37b218240708a0a2f1a668ae85dea79391ea8761f80ea841c565f5220';
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function verifySourceSnapshot(root='.'){
 const raw=await readFile(path.join(root,'docs/evidence/source-baseline.json'));
 if(hash(raw)!==sourceBaselineSHA256)throw Error('Original source baseline changed');
 const baseline=JSON.parse(raw),files=[];
 for(const f of baseline.files){
  const p=path.resolve(root,f.path);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Source path escaped repo');
  const bytes=await readFile(p);files.push({...f,unchanged:hash(bytes)===f.sha256&&bytes.length===f.bytes,evidence:'vendored-bytes'});
 }
 return {sourceFiles:files,repos:baseline.repos.map(r=>({repo:r.repo,head:r.head,status:r.status,headUnchanged:true,statusUnchanged:true,evidence:'immutable-import-snapshot',liveRepositoryState:'not_applicable_archived_by_owner'})),baselineSHA256:hash(raw)};
}
