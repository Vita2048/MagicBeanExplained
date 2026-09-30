import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const requested=url.pathname==='/'?'/companion/index.html':decodeURIComponent(url.pathname);
 const file=path.resolve(root,'.'+requested);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const content=fs.readFileSync(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.ttf':'font/ttf','.json':'application/json'}[path.extname(file)]||'text/plain'));res.end(content);}catch{res.writeHead(404).end('Not found');}
});
server.listen(3037,'127.0.0.1',()=>console.log('Companion lab: http://localhost:3037/'));
