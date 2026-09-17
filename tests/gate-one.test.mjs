import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import quote from '../api/quote.js';

function response() {
  return { headers: {}, setHeader(k,v){this.headers[k]=v;}, status(code){this.code=code;return this;}, json(body){this.body=body;return this;} };
}
test('disabled inquiry endpoint never returns success or echoes submitted text', () => {
  const res = response();
  quote({method:'POST',body:{email:'<script>private</script>'}}, res);
  assert.equal(res.code,503);
  assert.equal(res.body.success,undefined);
  assert.equal(JSON.stringify(res.body).includes('private'),false);
  assert.match(res.body.error,/bids@galoreprojects.com/);
  assert.equal(res.headers['Cache-Control'],'no-store');
});
test('inquiry endpoint rejects unsupported methods', () => {
  const res = response(); quote({method:'GET'},res);
  assert.equal(res.code,405); assert.equal(res.headers.Allow,'POST');
});
test('review pages preserve approved claims and contact access', async () => {
  for (const file of ['index.html','work/index.html','qualifications/index.html']) {
    const html = await readFile(new URL('../'+file, import.meta.url),'utf8');
    assert.match(html,/mailto:bids@galoreprojects.com/);
    assert.match(html,/tel:\+13236275759/);
    assert.match(html,/#1156432/); assert.match(html,/#2000027910/);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.doesNotMatch(html,/Retail Build-Out|Garage Conversion|144|24 hours|info@|—|&mdash;|&#8212;|three\.js/i);
    assert.doesNotMatch(html,/<form\b/);
  }
});
test('only completed projects appear in the completed work section', async () => {
  const html = await readFile(new URL('../work/index.html',import.meta.url),'utf8');
  const complete = html.split('aria-labelledby="completed-title"')[1].split('</section>')[0];
  assert.match(complete,/San Diego/); assert.match(complete,/Culver City/);
  assert.doesNotMatch(complete,/graded|ground-up|in-home care|In progress/i);
  assert.match(html,/TODO before publishing this entry/);
});
