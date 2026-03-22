const path = require('path');
const { applyBackendEnv } = require(path.join(__dirname, '..', 'backend', 'load-env.js'));
applyBackendEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
