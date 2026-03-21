'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Star, ShoppingCart, Heart, Check, Plus, Minus, Share2, Truck, Shield, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { uiTokens } from '@/app/ui-tokens'
import { mapConvexProduct, type CatalogProduct } from '@/lib/catalog'
import { useConvexQuery } from '@/lib/convexFetch'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const idParam = params?.id
  const idStr = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : ''

  const { data: rawProducts, loading } = useConvexQuery<Record<string, unknown>[]>('products:getAllProducts', { includeInactive: false })
  const products = useMemo(() => (rawProducts ?? []).map(mapConvexProduct), [rawProducts])
  const product = useMemo(() => products.find((p) => p.id === idStr), [products, idStr])

  const related = useMemo(() => {
    if (!product) return []
    return products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  }, [products, product])

  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'nutrition' | 'reviews'>('details')
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState('')

  const discount = product && product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      if (saved) {
        const cart = JSON.parse(saved)
        setCartCount(cart.reduce((s: number, i: { qty: number }) => s + i.qty, 0))
      }
    } catch { /* ignore */ }
  }, [])

  if (!idStr || loading) {
    return (
      <>
        <Navbar cartCount={cartCount} onCartClick={() => router.push('/checkout')} />
        <div style={{ minHeight: '100vh', background: '#FEFAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <p style={{ color: '#6b7280' }}>Loading…</p>
        </div>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navbar cartCount={cartCount} onCartClick={() => router.push('/checkout')} />
        <div style={{ minHeight: '100vh', background: '#FEFAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>Product not found</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>This product may no longer be available.</p>
            <button onClick={() => router.push('/')} style={{ background: '#14532d', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
              Back to Shop
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const handleAddToCart = () => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      const cart = saved ? JSON.parse(saved) : []
      const existing = cart.find((i: { id: string }) => i.id === product.id)
      if (existing) existing.qty += qty
      else cart.push({ id: product.id, qty })
      localStorage.setItem('vegfru_cart', JSON.stringify(cart))
      const newCount = cart.reduce((s: number, i: { qty: number }) => s + i.qty, 0)
      setCartCount(newCount)
    } catch { /* ignore */ }
    setAdded(true)
    setToast(`${qty} × ${product.name} added to cart!`)
    setTimeout(() => { setAdded(false); setToast('') }, 2500)
  }

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, text: `Check out ${product.name} on VegFru — ₹${product.price}/${product.unit}`, url: window.location.href })
    } catch {
      navigator.clipboard?.writeText(window.location.href)
      setToast('Link copied!')
      setTimeout(() => setToast(''), 2000)
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: 'VegFru' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'VegFru' },
    },
    aggregateRating: product.reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
    } : undefined,
  }

  return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/checkout')} />
      <div style={{ minHeight: '100vh', background: '#FEFAE0', paddingTop: 96 }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: uiTokens.container.commerce, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Share2 size={16} /> Share
          </button>
          <Link href="/checkout" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#14532d', color: 'white', padding: '8px 16px', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
            <ShoppingCart size={15} /> Cart {cartCount > 0 && <span style={{ background: '#22c55e', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{cartCount}</span>}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: uiTokens.container.commerce, margin: '0 auto', padding: '0 20px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ borderRadius: uiTokens.radius.panel, overflow: 'hidden', background: 'white', border: '1px solid #e5e7eb', position: 'relative', aspectRatio: '1' }}>
            {product.image && !imgErr ? (
              <img src={product.image} alt={product.name} onError={() => setImgErr(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, #f0fdf4, #dcfce7)` }}>
                <span style={{ fontSize: 120 }}>{product.emoji}</span>
              </div>
            )}
            {product.badge && (
              <span style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(15,83,35,0.92)', color: 'white', padding: '4px 12px', borderRadius: 10, fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(239,68,68,0.9)', color: 'white', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                -{discount}%
              </span>
            )}
            <button onClick={() => setLiked(!liked)}
              style={{ position: 'absolute', bottom: 16, right: 16, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <Heart size={20} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#9ca3af'} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
            {[
              { icon: Truck, label: '4–6h Delivery', sub: 'Express fresh' },
              { icon: Shield, label: 'Quality Guarantee', sub: 'Fresh from trusted farms' },
              { icon: RotateCcw, label: 'Easy Returns', sub: '24h window' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ background: 'white', borderRadius: 14, padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <Icon size={18} color="#16a34a" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{label}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ background: `${product.accent}18`, color: product.accent, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {product.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{product.rating}</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>({product.reviews.toLocaleString()} reviews)</span>
            </div>
          </div>

          <h1 style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 800, color: '#14532d', marginBottom: 8, lineHeight: 1.2 }}>{product.name}</h1>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>{product.description}</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>📍 {product.origin}</p>

          <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#14532d', lineHeight: 1 }}>₹{product.price}</div>
              <div style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.originalPrice} / {product.unit}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>Save ₹{Math.max(0, product.originalPrice - product.price)}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{discount}% off</div>
            </div>
          </div>

          {product.stock > 0 && product.stock < 10 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
              ⚠️ Only {product.stock} left in stock — order soon!
            </div>
          )}
          {product.stock === 0 && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c', fontWeight: 500 }}>
              ❌ Out of stock — check back soon
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ width: 44, height: 52, border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={16} />
              </button>
              <span style={{ width: 44, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#14532d' }}>{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                style={{ width: 44, height: 52, border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={16} />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0}
              style={{ flex: 1, height: 52, background: added ? '#22c55e' : 'linear-gradient(135deg,#14532d,#166534)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: product.stock === 0 ? 0.5 : 1, transition: 'all 0.25s', boxShadow: added ? '0 4px 16px rgba(34,197,94,0.35)' : '0 4px 16px rgba(22,101,52,0.25)' }}>
              {added ? <><Check size={18} />Added!</> : <><ShoppingCart size={18} />Add to Cart — ₹{product.price * qty}</>}
            </button>
          </div>

          <Link href="/checkout" style={{ display: 'block', textAlign: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none', marginBottom: 24, transition: 'all 0.15s' }}>
            Buy Now →
          </Link>

          <div style={{ borderBottom: '2px solid #f3f4f6', display: 'flex', gap: 0, marginBottom: 16 }}>
            {(['details', 'nutrition', 'reviews'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? '#14532d' : '#6b7280', borderBottom: activeTab === t ? '2px solid #14532d' : '2px solid transparent', marginBottom: -2, textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>{product.description}</p>
              {product.nutritionHighlight && <p style={{ color: '#16a34a', fontWeight: 500 }}>🌟 {product.nutritionHighlight}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                {[['Category', product.category], ['Unit', product.unit], ['Tag', product.tag], ['Origin', product.origin || 'Local farm']].map(([k, v]) => (
                  <div key={String(k)} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div style={{ fontSize: 14, color: '#374151' }}>
              <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <p style={{ fontWeight: 600, color: '#14532d', marginBottom: 6 }}>Why {product.name}?</p>
                <p style={{ lineHeight: 1.7 }}>{product.nutritionHighlight || `${product.name} is packed with essential nutrients and is a great addition to a healthy diet.`}</p>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>* Nutritional values may vary based on growing conditions and season.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, background: '#f9fafb', borderRadius: 14, padding: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: '#14532d', lineHeight: 1 }}>{product.rating}</div>
                  <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e7eb'} color={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e7eb'} />)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{product.reviews.toLocaleString()} reviews</div>
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                  Ratings reflect verified purchases and feedback from your VegFru store. Individual review text will appear here as you collect more reviews.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div style={{ maxWidth: uiTokens.container.commerce, margin: '0 auto', padding: '0 20px 48px' }}>
          <h2 style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 700, color: '#14532d', marginBottom: 20 }}>More from {product.category}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {related.map((p: CatalogProduct) => (
              <div key={p.id} onClick={() => router.push(`/product/${encodeURIComponent(p.id)}`)}
                style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                <div style={{ height: 140, overflow: 'hidden', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 60 }}>{p.emoji}</span>}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#14532d', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#14532d' }}>₹{p.price}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{p.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#14532d', color: 'white', padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <Check size={16} /> {toast}
          <Link href="/checkout" style={{ color: '#86efac', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>View Cart →</Link>
        </div>
      )}
      </div>
      <Footer />
    </>
  )
}
