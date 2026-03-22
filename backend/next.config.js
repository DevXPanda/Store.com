const path = require('path');
const { applyBackendEnv } = require('./load-env.js');
applyBackendEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
};

module.exports = nextConfig;
