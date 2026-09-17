// Gate 1: fail closed until the verified sender, durable rate limiter, and
// end-to-end delivery checks are ready. Never accept or email an inquiry here.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  return res.status(503).json({
    error: 'The inquiry form is unavailable. Please email bids@galoreprojects.com.',
  });
}
