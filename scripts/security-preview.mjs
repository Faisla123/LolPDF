// Local production preview with the response headers in vercel.json.
// This checks configuration locally; it does not prove a deployed host applies it.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const rules = JSON.parse(fs.readFileSync('vercel.json')).headers;
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
http.createServer((req,res) => {
  let pathname; try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400);res.end();return; }
  let file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) && file!==root) { res.writeHead(403);res.end();return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
  if (!fs.existsSync(file)) file=path.join(root,'index.html');
  for (const h of rules[0].headers) res.setHeader(h.key,h.value);
  if (pathname==='/sw.js') res.setHeader('Cache-Control','no-cache');
  res.setHeader('Content-Type', mime[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('Header-aware preview at http://localhost:4173'));
