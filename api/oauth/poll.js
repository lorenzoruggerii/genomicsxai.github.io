// CORS proxy: forward POST to github.com/login/oauth/access_token.
//
// During Device Flow, the browser polls this endpoint to find out whether
// the user has completed authorization on github.com/login/device.
// GitHub returns either:
//   - { error: 'authorization_pending' }    → keep polling
//   - { error: 'slow_down' }                 → poll less frequently
//   - { error: 'expired_token' | 'access_denied' }  → terminal, stop
//   - { access_token, token_type, scope }    → success
//
// As with /api/oauth/device-code, no client_secret is involved.
import { setCorsHeaders, originAllowed } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!originAllowed(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' });
  }

  const deviceCode = req.body && req.body.device_code;
  if (!deviceCode || typeof deviceCode !== 'string') {
    return res.status(400).json({ error: 'missing device_code' });
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
