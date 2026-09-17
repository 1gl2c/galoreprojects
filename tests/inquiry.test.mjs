import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHandler } from '../api/quote.js';
import { validate, emailMessage, settings, readPayload, rateLimit, LIMIT_SCRIPT, clientNetwork } from '../lib/inquiry.js';

const env = { INQUIRY_FORM_ENABLED:'true', RESEND_API_KEY:'test-key', UPSTASH_REDIS_REST_URL:'https://example.upstash.io', UPSTASH_REDIS_REST_TOKEN:'test-token', INQUIRY_HASH_SECRET:'test-secret-never-used-for-production-1234', VERCEL:'1', VERCEL_ENV:'production' };
const valid = () => ({name:'Jordan Example',email:'jordan@example.com',organization:'Example Agency',details:'Please review the bid invitation for the project.',website:'',requestId:'102b395a-6e84-4db5-bd87-d7d9cb689c9c'});
const req = (body=valid()) => ({method:'POST',headers:{origin:'https://galoreprojects.com','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1'},body});
function response() { return {headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;}}; }
const provider = (value={id:'test-message-123'},status=200) => new Response(JSON.stringify(value),{status});
async function run(request=req(), options={}) {
  const calls=[]; let rateCalls=0;
  const handler=createHandler({env,limiter:async()=>{rateCalls++;return {allowed:true};},fetcher:async(url,init)=>{calls.push({url,init});return provider();},...options});
  const res=response();await handler(request,res);return {res,calls,rateCalls};
}

test('single switch and missing infrastructure always fail closed',async()=>{
  for (const setting of ['INQUIRY_FORM_ENABLED','RESEND_API_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','INQUIRY_HASH_SECRET']) {
    const missing={...env,[setting]:''};assert.equal(settings(missing).enabled,false);
    const {res,calls}=await run(req(),{env:missing});assert.equal(res.code,503);assert.equal(calls.length,0);
  }
  for (const url of ['http://example.upstash.io','https://evil.test','https://a:b@example.upstash.io']) assert.equal(settings({...env,UPSTASH_REDIS_REST_URL:url}).enabled,false);
});
test('provider acceptance uses fixed verified-domain sender and bid recipient only',async()=>{
  const {res,calls}=await run();assert.equal(res.code,202);assert.equal(res.body.accepted,true);
  const data=JSON.parse(calls[0].init.body);
  assert.equal(data.from,'Galore Projects <website@notify.galoreprojects.com>');
  assert.deepEqual(data.to,['bids@galoreprojects.com']);assert.equal(data.reply_to,'jordan@example.com');assert.equal(calls.length,1);
  assert.ok(data.text);assert.ok(data.html);assert.ok(calls[0].init.signal);
});
test('returned errors, missing IDs, bad JSON, network errors, and timeouts never return acceptance',async()=>{
  const failures=[()=>provider({error:{message:'secret-provider-error'}},400),()=>provider({name:'validation_error',message:'secret'},200),()=>provider({}),()=>provider({id:'test-message-123',error:'secret'},200),()=>new Response('not json'),()=>{throw new Error('secret-key');},()=>{throw new DOMException('timeout','TimeoutError');}];
  for (const failure of failures) {
    const {res}=await run(req(),{fetcher:async()=>failure()});assert.ok(res.code>=500);assert.equal(res.body.accepted,undefined);assert.doesNotMatch(JSON.stringify(res.body),/secret|secret-key/);
  }
});
test('user markup is escaped in HTML and kept literal in text',()=>{
  const data=validate({...valid(),name:'<img src=x onerror="alert(1)">',organization:"A&B's <company>",details:'<script>alert("test")</script>\nA real bid.'});
  const mail=emailMessage(data);assert.doesNotMatch(mail.html,/<img|<script>|<company>/);
  assert.match(mail.html,/&lt;script&gt;/);assert.match(mail.html,/A&amp;B&#39;s/);assert.match(mail.text,/<script>/);
});
test('field validation rejects malformed and overlong input before rate limiting or sending',async()=>{
  const bad=[null,[],{...valid(),to:'attacker@example.com'}, {...valid(),name:['name']},{...valid(),name:' '},{...valid(),name:'a'.repeat(101)}, {...valid(),organization:42}, {...valid(),details:'short'},{...valid(),details:'a'.repeat(4001)},{...valid(),email:'A <a@example.com>'},{...valid(),email:'a@example.com\r\nBcc:evil@example.com'},{...valid(),email:'a..b@example.com'},{...valid(),name:'a\nb'},{...valid(),requestId:'bad'},{...valid(),website:'https://spam.test'}];
  for (const body of bad) { const {res,calls,rateCalls}=await run(req(body));assert.ok(res.code>=400&&res.code<500);assert.equal(calls.length,0);assert.equal(rateCalls,0); }
});
test('UTF-8 byte cap covers parsed bodies and streamed bodies',async()=>{
  const request=req({...valid(),details:'🙂'.repeat(5000)});let result=await run(request);assert.equal(result.res.code,413);
  const stream=Readable.from([Buffer.alloc(10000,'a'),Buffer.alloc(10000,'b')]);stream.headers={'content-type':'application/json'};
  await assert.rejects(readPayload(stream),{status:413});
  const exact=Readable.from([JSON.stringify(valid())]);exact.headers={'content-type':'application/json'};
  assert.deepEqual(await readPayload(exact),valid());
});
test('methods, unsupported bodies, cross-site requests and missing trusted IP are rejected',async()=>{
  for (const [modify,code] of [
    [r=>r.method='GET',405], [r=>r.headers['content-type']='text/plain',415],
    [r=>r.headers.origin='https://attacker.example',403], [r=>delete r.headers.origin,403],
    [r=>r.headers['content-length']='99999',413], [r=>r.headers['content-encoding']='gzip',415],
    [r=>delete r.headers['x-vercel-forwarded-for'],503], [r=>r.body='{bad JSON',400],
  ]) {const r=req();modify(r);const {res,calls}=await run(r);assert.equal(res.code,code);assert.equal(calls.length,0);}
});
test('rate limit blocks sends and supplies retry guidance; a failed store fails closed',async()=>{
  let result=await run(req(),{limiter:async()=>({allowed:false,retryAfter:90})});assert.equal(result.res.code,429);assert.equal(result.res.headers['Retry-After'],'90');assert.equal(result.calls.length,0);
  result=await run(req(),{limiter:async()=>{throw new Error('store offline');}});assert.equal(result.res.code,503);assert.equal(result.calls.length,0);
});
test('same submission retries have stable idempotency; edited submissions have a new key',async()=>{
  const a=await run(),b=await run(),c=await run(req({...valid(),details:'Changed project details for a different inquiry.'}));
  assert.equal(a.calls[0].init.headers['Idempotency-Key'],b.calls[0].init.headers['Idempotency-Key']);
  assert.notEqual(a.calls[0].init.headers['Idempotency-Key'],c.calls[0].init.headers['Idempotency-Key']);
});
test('shared rate limiter sends one atomic Lua command, hashes identifiers and uses bounded TTLs',async()=>{
  const commands=[];const config=settings(env);
  const fake=async(url,options)=>{commands.push(JSON.parse(options.body));assert.equal(url,env.UPSTASH_REDIS_REST_URL);return provider({result:[1,0]});};
  await Promise.all([rateLimit(config,'192.0.2.1','jordan@example.com',fake),rateLimit(config,'192.0.2.1','jordan@example.com',fake)]);
  assert.deepEqual(commands[0],commands[1]);assert.equal(commands[0][0],'EVAL');assert.equal(commands[0][1],LIMIT_SCRIPT);
  assert.doesNotMatch(JSON.stringify(commands),/192\.0\.2\.1|jordan@example.com/);
  assert.deepEqual(commands[0].slice(-6),['5','600','3','600','50','3600']);
  const blocked=await rateLimit(config,'192.0.2.1','jordan@example.com',async()=>provider({result:[0,600]}));assert.equal(blocked.allowed,false);
  for (const body of [{error:'offline'}, {result:null},{result:[1]}, {result:[2,0]}]) await assert.rejects(rateLimit(config,'192.0.2.1','jordan@example.com',async()=>provider(body)));
});
test('trusted IP handling prevents spoofing and groups IPv6 addresses by /64',()=>{
  assert.equal(clientNetwork({...req(),socket:{remoteAddress:'127.0.0.1'}},{}),'127.0.0.1');
  const r=req();r.headers['x-vercel-forwarded-for']='2001:db8:1:2::1';const first=clientNetwork(r,env);
  r.headers['x-vercel-forwarded-for']='2001:0db8:0001:0002:ffff:ffff:ffff:ffff';assert.equal(clientNetwork(r,env),first);
  r.headers['x-vercel-forwarded-for']='::ffff:192.0.2.1';assert.equal(clientNetwork(r,env),'192.0.2.1');
  r.headers['x-vercel-forwarded-for']='192.0.2.1, 203.0.113.1';assert.throws(()=>clientNetwork(r,env));
});
