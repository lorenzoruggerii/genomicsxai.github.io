// CORS proxy: forward POST to github.com/login/device/code.
//
// GitHub's OAuth endpoints don't always send Access-Control-Allow-Origin,
// so the browser can't call them directly. This function does the call
// server-side and returns the JSON with our own CORS headers.
//
// No secrets are involved in Device Flow — the GitHub App's client_id is
// public. This proxy holds no auth state and writes no cookies.
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

  try {
    const ghRes = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // GitHub Apps don't use OAuth scopes — permissions are declared on the App itself.
      body: new URLSearchParams({ client_id: clientId }),
    });

    const data = await ghRes.json();
    res.status(ghRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream GitHub error', detail: err.message });
  }
}
