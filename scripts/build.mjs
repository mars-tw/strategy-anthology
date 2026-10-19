import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await build({entryPoints:['src/main.js'],bundle:true,format:'esm',outfile:'dist/game.js',minify:true,sourcemap:false,target:['safari16','chrome110'],legalComments:'eof'});
await writeFile('dist/style.css',(await readFile('src/art-r1.css','utf8'))+'\n'+(await readFile('src/art-r2.css','utf8'))+'\n'+(await readFile('src/art-r3.css','utf8'))+'\n'+(await readFile('src/art-r4.css','utf8'))+'\n'+(await readFile('src/art-r5.css','utf8'))+'\n'+(await readFile('src/art-r6.css','utf8'))+'\n'+(await readFile('src/art-r7.css','utf8'))+'\n'+(await readFile('src/content-r1.css','utf8'))+'\n'+(await readFile('src/content-r2.css','utf8'))+'\n'+(await readFile('src/content-r4.css','utf8'))+'\n'+(await readFile('src/content-r5.css','utf8')));
await writeFile('dist/style.css',(await readFile('dist/style.css','utf8'))+'\n'+(await readFile('src/content-r6.css','utf8')));
await writeFile('dist/style.css',(await readFile('dist/style.css','utf8'))+'\n'+(await readFile('src/content-r7.css','utf8')));
await writeFile('dist/style.css',(await readFile('dist/style.css','utf8'))+'\n'+(await readFile('src/content-r8.css','utf8')));
await writeFile('dist/style.css',(await readFile('dist/style.css','utf8'))+'\n'+(await readFile('src/content-r9.css','utf8')));
await cp('LICENSE','dist/LICENSE.txt');
await cp('CREDITS.md','dist/CREDITS.md');
await writeFile('dist/THIRD_PARTY_LICENSES.txt',(await readFile('vendor/tower-defense/LICENSE','utf8'))+'\n\n'+(await readFile('vendor/village-siege/LICENSE','utf8')));
const files = [];
async function walk(dir) { for (const e of await readdir(dir,{withFileTypes:true})) { const p=`${dir}/${e.name}`; if(e.isDirectory()) await walk(p); else if(e.name!=='sw.js') files.push(p.replace('dist/','./')); } }
await walk('dist');
const {version}=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/sw.js',`const CACHE='trine-frontier-${version}';\nconst FILES=${JSON.stringify(files)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('trine-frontier-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())));});\n`);
console.log(`Built Trine Frontier ${version}; ${files.length} offline resources.`);
