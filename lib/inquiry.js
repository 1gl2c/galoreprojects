import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export const RECIPIENT = 'bids@galoreprojects.com';
export const SENDER = 'Galore Projects <website@notify.galoreprojects.com>';
export const UNAVAILABLE = `The inquiry form is unavailable. Please email ${RECIPIENT}.`;
export const MAX_BODY = 16_384;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function settings(env = process.env) {
  let redisUrl;
  try { redisUrl = new URL(env.UPSTASH_REDIS_REST_URL); } catch {}
  const configured = Boolean(env.RESEND_API_KEY && env.UPSTASH_REDIS_REST_TOKEN &&
    env.INQUIRY_HASH_SECRET?.length >= 32 && redisUrl?.protocol === 'https:' &&
    redisUrl.hostname.endsWith('.upstash.io') && !redisUrl.username && !redisUrl.password);
  return { enabled: env.INQUIRY_FORM_ENABLED === 'true' && configured,
    apiKey: env.RESEND_API_KEY, redisUrl: redisUrl?.origin,
    redisToken: env.UPSTASH_REDIS_REST_TOKEN, hashSecret: env.INQUIRY_HASH_SECRET };
}

export class RequestError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}
export function header(req, name) {
  const value = req.headers?.[name];
  return typeof value === 'string' ? value : '';
}
export function checkOrigin(req, env = process.env) {
  const allowed = new Set(['https://galoreprojects.com', 'https://www.galoreprojects.com']);
  if (env.VERCEL_URL) allowed.add(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_ENV !== 'production' && env.VERCEL_BRANCH_URL) allowed.add(`https://${env.VERCEL_BRANCH_URL}`);
  if (!env.VERCEL) { allowed.add('http://127.0.0.1:4173'); allowed.add('http://localhost:4173'); }
  if (!allowed.has(header(req, 'origin')) || header(req, 'sec-fetch-site') === 'cross-site') {
    throw new RequestError(403, 'Open this form on the Galore Projects website and try again.');
  }
}

export async function readPayload(req) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(header(req, 'content-type'))) {
    throw new RequestError(415, 'Send the inquiry using the website form.');
  }
  if (header(req, 'content-encoding') && header(req, 'content-encoding') !== 'identity') {
    throw new RequestError(415, 'Compressed submissions are not supported.');
  }
  const declared = header(req, 'content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY)) {
    throw new RequestError(413, 'Your inquiry is too long. Please shorten it or email the details.');
  }
  let raw;
  if (req.body !== undefined) {
    raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
  } else {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.from(chunk); size += bytes.length;
      if (size > MAX_BODY) throw new RequestError(413, 'Your inquiry is too long. Please shorten it or email the details.');
      chunks.push(bytes);
    }
    raw = Buffer.concat(chunks);
  }
  if (!raw || Buffer.byteLength(raw) > MAX_BODY) throw new RequestError(413, 'Your inquiry is too long. Please shorten it or email the details.');
  try { return JSON.parse(raw.toString()); }
  catch { throw new RequestError(400, 'The inquiry could not be read. Please try again.'); }
}

export function validate(payload) {
  const keys = ['name', 'email', 'organization', 'details', 'requestId', 'website'];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
    Object.keys(payload).some(key => !keys.includes(key))) {
    throw new RequestError(400, 'The inquiry contains unexpected fields. Please reload the page.');
  }
  const fields = {};
  const data = {};
  for (const [field, min, max, label] of [
    ['name', 1, 100, 'Enter your name, up to 100 characters.'],
    ['email', 3, 254, 'Enter a valid email address.'],
    ['organization', 0, 150, 'Use up to 150 characters for the organization.'],
    ['details', 10, 4000, 'Enter between 10 and 4,000 characters about the project.'],
  ]) {
    const value = payload[field] ?? (field === 'organization' ? '' : null);
    const text = typeof value === 'string' ? value.trim().replace(/\r\n?/g, '\n') : '';
    const controls = field === 'details' ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/;
    if (typeof value !== 'string' || text.length < min || text.length > max || controls.test(text)) fields[field] = label;
    data[field] = text;
  }
  // Plain mailbox only. No display names, HTML, whitespace, or header delimiters.
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(data.email) ||
    data.email.split('@')[0].length > 64 || data.email.startsWith('.') || data.email.includes('..') || data.email.includes('.@')) {
    fields.email = 'Enter a valid email address.';
  }
  if (Object.keys(fields).length) throw new RequestError(422, 'Check the highlighted fields.', fields);
  if (typeof payload.requestId !== 'string' || !UUID.test(payload.requestId)) throw new RequestError(400, 'Please reload the page before sending your inquiry.');
  if (payload.website !== undefined && (typeof payload.website !== 'string' || payload.website !== '')) {
    throw new RequestError(400, 'The inquiry could not be accepted. Please email bids@galoreprojects.com.');
  }
  return { ...data, requestId: payload.requestId };
}

export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
export function emailMessage(data) {
  const fields = [['Name', data.name], ['Email', data.email], ['Organization', data.organization || 'Not provided'], ['Project details', data.details]];
  return {
    from: SENDER, to: [RECIPIENT], reply_to: data.email,
    subject: 'Website bid inquiry | Galore Projects',
    text: fields.map(([label, value]) => `${label}:\n${value}`).join('\n\n'),
    html: '<!doctype html><html lang="en"><body><h1>Website bid inquiry</h1>' + fields.map(([label, value]) =>
      `<h2>${label}</h2><p style="white-space:pre-wrap">${escapeHtml(value)}</p>`).join('') + '</body></html>',
  };
}
export function digest(secret, text) { return createHmac('sha256', secret).update(text).digest('hex'); }

export function clientNetwork(req, env = process.env) {
  // Only trust Vercel's overwritten client header on Vercel. Local HTTP uses the socket.
  const ip = env.VERCEL === '1' ? header(req, 'x-vercel-forwarded-for') : req.socket?.remoteAddress;
  if (!isIP(ip || '')) throw new RequestError(503, UNAVAILABLE);
  if (isIP(ip) === 4) return ip;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [left, right] = canonical.split('::');
  let blocks = left ? left.split(':') : [];
  if (right !== undefined) {
    const tail = right ? right.split(':') : [];
    blocks = [...blocks, ...Array(8 - blocks.length - tail.length).fill('0'), ...tail];
  }
  // IPv4-mapped addresses share their IPv4 bucket; all other IPv6 uses a /64.
  if (blocks.slice(0, 5).every(v => parseInt(v, 16) === 0) && parseInt(blocks[5], 16) === 65535) {
    return [parseInt(blocks[6], 16) >> 8, parseInt(blocks[6], 16) & 255, parseInt(blocks[7], 16) >> 8, parseInt(blocks[7], 16) & 255].join('.');
  }
  return blocks.slice(0, 4).map(v => v.padStart(4, '0')).join(':') + '::/64';
}

// One atomic operation checks all buckets before charging them. TTLs use Redis time.
export const LIMIT_SCRIPT = `
local retry = 0
for i,key in ipairs(KEYS) do
  local count = tonumber(redis.call('GET', key) or '0')
  local limit = tonumber(ARGV[(i-1)*2+1])
  if count >= limit then
    retry = math.max(retry, redis.call('TTL', key), 1)
  end
end
if retry > 0 then return {0, retry} end
for i,key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then redis.call('EXPIRE', key, ARGV[(i-1)*2+2]) end
end
return {1, 0}
`;
export async function rateLimit(config, ip, email, fetcher = fetch) {
  const prefix = '{galore-inquiry}:v1:';
  const keys = [prefix + 'ip:' + digest(config.hashSecret, ip), prefix + 'email:' + digest(config.hashSecret, email.toLowerCase()), prefix + 'global'];
  const response = await fetcher(config.redisUrl, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(4000),
    headers: { Authorization: `Bearer ${config.redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', LIMIT_SCRIPT, '3', ...keys, '5', '600', '3', '600', '50', '3600']),
  });
  const body = await response.json();
  if (!response.ok || body.error || !Array.isArray(body.result) || body.result.length !== 2 ||
    ![0, 1].includes(body.result[0]) || !Number.isInteger(body.result[1]) || body.result[1] < 0) throw new Error('Rate limit unavailable');
  return { allowed: body.result[0] === 1, retryAfter: Math.max(1, body.result[1]) };
}
