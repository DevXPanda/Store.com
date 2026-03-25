const path = require('path');
const { applyBackendEnv } = require(path.join(__dirname, '..', 'backend', 'load-env.js'));
applyBackendEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'plus.unsplash.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'nodemailer'],
  },
  // Compress responses
  compress: true,
  // Power by header off
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || 'https://vegfru.in' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        // Cache static assets
        source: '/(.*)\\.(ico|svg|png|jpg|jpeg|webp|avif|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Prevent caching API routes
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/cart', destination: '/', permanent: false },
      {
        source: '/admin',
        destination: '/admin/login',
        permanent: false,
        missing: [{ type: 'cookie', key: 'vegfru_token' }],
      },
    ]
  },
}
module.exports = nextConfig
