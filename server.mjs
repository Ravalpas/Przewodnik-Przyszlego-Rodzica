import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
const root = resolve(import.meta.dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const port = Number(process.env.PORT || 3000);
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}).end(data);
  } catch { res.writeHead(404).end('Nie znaleziono pliku'); }
}).listen(port, '0.0.0.0', () => {
  console.log(`Aplikacja: http://localhost:${port}`);
  for(const items of Object.values(networkInterfaces())) for(const n of items || []) if(n.family === 'IPv4' && !n.internal) console.log(`Telefon (ta sama sieć Wi-Fi): http://${n.address}:${port}`);
});
