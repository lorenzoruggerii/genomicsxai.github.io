// CORS bridge: POST → https://github.com/login/oauth/access_token.
// Body: { client_id: string, device_code: string }
// During Device Flow, the browser polls this endpoint until the user has
// authorized on github.com/login/device. Returns one of:
//   { error: 'authorization_pending' }              → keep polling
//   { error: 'slow_down', interval: <n> }           → poll less frequently
//   { error: 'expired_token' | 'access_denied' }    → stop, terminal failure
//   { access_token, token_type, scope }             → success
import { setCorsHeaders, originAllowed } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!originAllowed(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const clientId = req.body && req.body.client_id;
  const deviceCode = req.body && req.body.device_code;
  if (!clientId || typeof clientId !== 'string' || !deviceCode || typeof deviceCode !== 'string') {
    return res.status(400).json({ error: 'missing client_id or device_code' });
  }

  try {
    const ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const data = await ghRes.json();
    res.status(ghRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream GitHub error', detail: err.message });
  }
}
