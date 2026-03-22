/**
 * Single source of truth for VegFru env: backend/.env then backend/.env.local
 * (same convention as Next — .env.local overrides .env).
 * Call at the top of each panel's next.config.js so values override any per-app .env
 * loaded earlier by Next.
 */
const fs = require('fs');
const path = require('path');

function applyBackendEnv(panelDir) {
  let dotenv;
  try {
    dotenv = require('dotenv');
  } catch {
    console.warn(
      '[vegfru] Missing `dotenv`. From repo root run: cd backend && npm install'
    );
    return;
  }
  const backendRoot = path.resolve(panelDir, '..', 'backend');
  for (const name of ['.env', '.env.local']) {
    const p = path.join(backendRoot, name);
    if (fs.existsSync(p)) {
      dotenv.config({ path: p, override: true });
    }
  }
}

module.exports = { applyBackendEnv };
