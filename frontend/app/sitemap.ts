import { MetadataRoute } from 'next'
import { products } from './data'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vegfru.in'

export default function sitemap(): MetadataRoute.Sitemap {
  const productUrls = products.map(p => ({
    url: `${BASE}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/orders`,  lastModified: new Date(), changeFrequency: 'always',  priority: 0.8 },
    { url: `${BASE}/profile`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/refund`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...productUrls,
  ]
}
