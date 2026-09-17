import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const output = new URL('public/',root);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for (const page of ['index.html','work/index.html','qualifications/index.html']) {
  let html=await readFile(new URL(page,root),'utf8');
  // Pending sections are owner review notes, never production claims.
  html=html.replace(/\s*<section\b[^>]*class="[^"]*pending-section[^"]*"[\s\S]*?<\/section>/g,'');
  if (/TODO|review note|not ready to publish|in-home care/i.test(html)) throw new Error(`Unresolved review content in ${page}`);
  const route=page==='index.html'?'/':'/'+page.replace('index.html','');
  html=html.replace('</head>',`  <link rel="canonical" href="https://galoreprojects.com${route}">\n</head>`);
  const destination=new URL(page,output);await mkdir(new URL('./',destination),{recursive:true});await writeFile(destination,html);
}
await cp(new URL('assets/',root),new URL('assets/',output),{recursive:true});
await writeFile(new URL('robots.txt',output),'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://galoreprojects.com/sitemap.xml\n');
await writeFile(new URL('sitemap.xml',output),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/work/','/qualifications/'].map(route=>`<url><loc>https://galoreprojects.com${route}</loc></url>`).join('')+'</urlset>\n');
console.log(`Production files prepared in ${fileURLToPath(output)}. Inquiry flag remains server-controlled.`);
