import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import quote from '../api/quote.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = new Map([
  ['/', 'index.html'], ['/work/', 'work/index.html'],
  ['/qualifications/', 'qualifications/index.html'],
  ['/assets/site.css', 'assets/site.css'], ['/assets/site.js', 'assets/site.js'],
  ['/assets/logo.jpg', 'assets/logo.jpg'], ['/assets/mark.svg', 'assets/mark.svg'],
]);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/quote') {
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (value) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    return quote(req, res);
  }
  if (['/work','/qualifications'].includes(url.pathname)) {
    res.writeHead(301, { Location: url.pathname + '/' }); return res.end();
  }
  const file = routes.get(url.pathname);
  if (!file) { res.writeHead(404); return res.end('Page not found.'); }
  try {
    const data = await readFile(path.join(root, file));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control':'no-store' });
    res.end(data);
  } catch { res.writeHead(500); res.end('Preview unavailable.'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`Galore review: http://127.0.0.1:${port}`));
