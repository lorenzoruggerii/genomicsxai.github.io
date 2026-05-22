// Shared helpers for the Device Flow CORS proxy.
//
// These two endpoints exist solely because GitHub's /login/device/code and
// /login/oauth/access_token don't send Access-Control-Allow-Origin, so the
// browser can't call them directly. There's no secret involved — the GitHub
// App's Client ID is public — so this proxy holds no auth state.

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
