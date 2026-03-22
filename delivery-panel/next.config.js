const path = require('path');
const { applyBackendEnv } = require(path.join(__dirname, '..', 'backend', 'load-env.js'));
applyBackendEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
}
module.exports = nextConfig
