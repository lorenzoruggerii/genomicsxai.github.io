// CORS bridge: POST → https://github.com/login/device/code.
// Body: { client_id: string, scope?: string }
// Returns whatever GitHub returns ({ device_code, user_code, verification_uri, ... }).
//
// `scope` is required for OAuth Apps (e.g. "public_repo" for fork+commit+PR).
// GitHub Apps ignore scope — permissions are baked into the App's install —
// so the parameter is optional from the proxy's perspective.
import { setCorsHeaders, originAllowed } from '../_lib/auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!originAllowed(req)) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const clientId = req.body && req.body.client_id;
  if (!clientId || typeof clientId !== 'string') {
    return res.status(400).json({ error: 'missing client_id' });
  }

  const params = { client_id: clientId };
  const scope = req.body && req.body.scope;
  if (scope && typeof scope === 'string') {
    params.scope = scope;
  }

  try {
    const ghRes = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });
    const data = await ghRes.json();
    res.status(ghRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream GitHub error', detail: err.message });
  }
}
