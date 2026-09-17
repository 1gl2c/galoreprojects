import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('production build omits review content, keeps contacts, and emits only intended public assets',async()=>{
  execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});
  for(const file of ['index.html','work/index.html','qualifications/index.html']) {
    const html=await readFile(new URL('public/'+file,root),'utf8');
    assert.doesNotMatch(html,/TODO|review note|not ready to publish|in-home care|__qa|LOCAL FORM TEST/i);
    assert.match(html,/mailto:bids@galoreprojects.com/);assert.match(html,/rel="canonical"/);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    if(file==='index.html')assert.match(html,/<fieldset disabled>/);
  }
  const work=await readFile(new URL('public/work/index.html',root),'utf8');assert.doesNotMatch(work,/Ground-up build|In progress\./);
  assert.deepEqual((await readdir(new URL('public/',root))).sort(),['assets','index.html','qualifications','robots.txt','sitemap.xml','work']);
});
