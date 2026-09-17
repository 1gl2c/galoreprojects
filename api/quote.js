import { settings, UNAVAILABLE, RequestError, checkOrigin, readPayload, validate, emailMessage, digest, clientNetwork, rateLimit } from '../lib/inquiry.js';

export function createHandler({ env = process.env, fetcher = fetch, limiter = rateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const config = settings(env);
    if (!config.enabled) return res.status(503).json({ error: UNAVAILABLE });
    try {
      checkOrigin(req, env);
      const data = validate(await readPayload(req));
      const limit = await limiter(config, clientNetwork(req, env), data.email, fetcher);
      if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter));
        return res.status(429).json({ error: 'Too many attempts. Please wait before retrying or email bids@galoreprojects.com.', retryAfter: limit.retryAfter });
      }
      const message = emailMessage(data);
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json',
          'Idempotency-Key': 'inquiry-' + digest(config.hashSecret, data.requestId + JSON.stringify(message)) },
        body: JSON.stringify(message),
      });
      const result = await response.json();
      // HTTP errors, provider error objects, and malformed responses never count as acceptance.
      if (!response.ok || result.error || result.name || typeof result.id !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(result.id)) {
        return res.status(502).json({ error: 'We could not confirm acceptance of your inquiry. Retry without changing the details, or email bids@galoreprojects.com.' });
      }
      return res.status(202).json({ accepted: true, message: 'Your inquiry was accepted for email delivery. This does not confirm inbox receipt. For time-sensitive bids, email bids@galoreprojects.com directly.' });
    } catch (error) {
      if (error instanceof RequestError) return res.status(error.status).json({ error: error.message, ...(error.fields ? { fields: error.fields } : {}) });
      // No submitted text, credentials, or raw provider responses are logged or returned.
      return res.status(503).json({ error: 'We could not confirm acceptance of your inquiry. Retry without changing the details, or email bids@galoreprojects.com.' });
    }
  };
}
export default createHandler();
