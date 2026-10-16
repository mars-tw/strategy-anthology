import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
export function serve(port=Number(process.env.PORT||8187)) {
 const root=path.resolve('dist');
 const server=http.createServer(async(req,res)=>{
  try { const url=new URL(req.url,'http://localhost'); const pathname=decodeURIComponent(url.pathname); const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   if(!(await stat(file)).isFile())throw Error('not file');
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
  }catch{res.writeHead(404).end('Not found');}
 });return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
if(process.argv[1]===new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')||process.argv[1]?.endsWith('serve.mjs')) {if(!process.env.TRINE_TEST_SERVER) {const s=await serve();console.log(`Trine Frontier http://127.0.0.1:${s.address().port}`);}}
