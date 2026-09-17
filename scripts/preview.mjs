import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import quote from '../api/quote.js';
import inquiryConfig from '../api/inquiry-config.js';
import { fixture } from './qa/fixture.js';

const fixtureMode = process.argv.find(arg => arg.startsWith('--fixture='))?.split('=')[1];
if (fixtureMode && !['accepted','rejected','rate-limit','unavailable'].includes(fixtureMode)) throw new Error('Unknown fixture');
const quoteHandler = fixtureMode ? fixture(fixtureMode) : quote;
const production = process.argv.includes('--production');
const securityHeaders = JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8')).headers[0].headers;
const auditEnabled = process.argv.includes('--audit');
const root = fileURLToPath(new URL('../', import.meta.url));
const routes = new Map([
  ['/', 'index.html'], ['/work/', 'work/index.html'],
  ['/qualifications/', 'qualifications/index.html'],
  ['/assets/site.css', 'assets/site.css'], ['/assets/site.js', 'assets/site.js'],
  ['/assets/logo.jpg', 'assets/logo.jpg'], ['/assets/mark.svg', 'assets/mark.svg'],
  ...['assets/logo.webp', 'assets/media/site-drone-poster-mobile.webp', 'assets/inquiry.js', 'assets/media-policy.js', 'assets/fonts/syne-latin.woff2', 'assets/fonts/source-sans-3-latin.woff2', 'assets/media/site-drone-desktop.mp4', 'assets/media/site-drone-mobile.mp4', 'assets/media/site-drone-poster.webp'].map(file => ['/' + file, file]),
]);
if (auditEnabled) {
  routes.set('/__qa/axe.min.js','node_modules/axe-core/axe.min.js');
  routes.set('/__qa/audit.js','scripts/qa/audit.js');
}
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp4':'video/mp4', '.webp':'image/webp' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (['/api/quote','/api/inquiry-config'].includes(url.pathname)) {
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (value) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    if (url.pathname === '/api/inquiry-config') {
      if (fixtureMode && req.method === 'GET') { res.setHeader('Cache-Control','no-store'); return res.status(200).json({enabled:true}); }
      return inquiryConfig(req,res);
    }
    if (fixtureMode) req.headers.origin = 'http://127.0.0.1:4173';
    return quoteHandler(req, res);
  }
  if (['/work','/qualifications'].includes(url.pathname)) {
    res.writeHead(301, { Location: url.pathname + '/' }); return res.end();
  }
  const file = routes.get(url.pathname);
  if (!file) { res.writeHead(404); return res.end('Page not found.'); }
  try {
    let data = await readFile(path.join(root, production && !file.startsWith('scripts/') && !file.startsWith('node_modules/') ? 'public' : '', file));
    if (path.extname(file) === '.html') {
      let html = data.toString();
      if (auditEnabled && url.searchParams.has('audit')) html = html.replace('</head>', '<script src="/__qa/axe.min.js" defer></script><script src="/__qa/audit.js" defer></script></head>');
      if (fixtureMode) html = html.replace('<main id="main"', '<p style="padding:20px;border:2px solid #d5b875">LOCAL FORM TEST: '+fixtureMode+'. No email is sent.</p><main id="main"');
      data = Buffer.from(html);
    }
    if (production) for (const {key,value} of securityHeaders) res.setHeader(key,value);
    const headers = { 'Content-Type': types[path.extname(file)], 'Cache-Control':'no-store', 'Accept-Ranges':'bytes' };
    if (req.headers.range) {
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      const start = Number(range?.[1]);
      const end = Math.min(range?.[2] ? Number(range[2]) : data.length - 1, data.length - 1);
      if (!range || start > end || start >= data.length) {
        res.writeHead(416, { 'Content-Range':`bytes */${data.length}` }); return res.end();
      }
      res.writeHead(206, { ...headers, 'Content-Range':`bytes ${start}-${end}/${data.length}`, 'Content-Length':end-start+1 });
      return res.end(data.subarray(start,end+1));
    }
    res.writeHead(200, { ...headers, 'Content-Length':data.length });
    res.end(data);
  } catch { res.writeHead(500); res.end('Preview unavailable.'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`Galore review: http://127.0.0.1:${port}`));
