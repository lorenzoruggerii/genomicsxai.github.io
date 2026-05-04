// Shared auth helpers for the Device Flow proxy endpoints.
// Device Flow does not need OAuth state validation (no redirect_uri to forge)
// or a Client Secret (the client_id is the only credential, and it's public).
// All these endpoints do is bridge browser → github.com to work around CORS.

export const ALLOWED_ORIGINS = [
  'https://genomicsxai.github.io',
  'http://localhost:1313',
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
}

export function originAllowed(req) {
  return ALLOWED_ORIGINS.includes(req.headers.origin);
}
