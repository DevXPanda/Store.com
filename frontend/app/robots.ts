import { MetadataRoute } from 'next'
const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vegfru.in'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/checkout', '/orders', '/profile'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
