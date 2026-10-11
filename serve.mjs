import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=process.cwd();
const args=process.argv.slice(2),host=args.includes('--host')?args[args.indexOf('--host')+1]:'127.0.0.1',port=args.includes('--port')?Number(args[args.indexOf('--port')+1]):4173;
if(!host||!Number.isInteger(port)||port<1||port>65535)throw new Error('Usage: node serve.mjs [--host 127.0.0.1] [--port 4173]');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain','.md':'text/plain'};
http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.split(/[\\/]/).some(part=>part.startsWith('.')&&part!=='.nojekyll')){res.writeHead(403).end();return;}
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)) { res.writeHead(403).end(); return; }
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port,host,()=>console.log(`Fury Arena: http://${host}:${port}`));
