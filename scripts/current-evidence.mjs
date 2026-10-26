// One current destination for rerunning historical checks. Inputs remain unchanged.
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export const CURRENT_EVIDENCE='docs/content/r19';
export function evidenceDir(suite){
 const path=`${CURRENT_EVIDENCE}/regression/${suite}`;mkdirSync(path,{recursive:true});return path;
}
export function evidenceFile(path){
 if(path.startsWith('docs/store/screenshots/'))path=`${evidenceDir('store')}/${path.split('/').at(-1)}`;
 mkdirSync(dirname(path),{recursive:true});return path;
}
