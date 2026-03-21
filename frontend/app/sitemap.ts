import { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vegfru.in'

async function fetchProductIds(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return []
  try {
    const r = await fetch(`${url}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'products:getAllProducts', args: { includeInactive: false } }),
      next: { revalidate: 3600 },
    })
    const j = await r.json()
    return (j.value || []).map((p: { _id: string }) => p._id)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ids = await fetchProductIds()
  const productUrls = ids.map((id) => ({
    url: `${BASE}/product/${encodeURIComponent(id)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/orders`, lastModified: new Date(), changeFrequency: 'always', priority: 0.8 },
    { url: `${BASE}/profile`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/refund`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...productUrls,
  ]
}
