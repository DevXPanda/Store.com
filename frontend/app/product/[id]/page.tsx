'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Star, ShoppingCart, Heart, Check, Plus, Minus, Share2, Truck, Shield, RotateCcw, LayoutGrid, Package, Leaf, MapPin } from 'lucide-react'
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
  const rawId = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : ''
  let idStr = rawId
  try { idStr = decodeURIComponent(rawId) } catch { /* keep raw id */ }

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

  const mergeProductIntoCart = () => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      const cart = saved ? JSON.parse(saved) : []
      const existing = cart.find((i: { id: string }) => i.id === product.id)
      if (existing) existing.qty += qty
      else cart.push({ id: product.id, qty })
      localStorage.setItem('vegfru_cart', JSON.stringify(cart))
      const newCount = cart.reduce((s: number, i: { qty: number }) => s + i.qty, 0)
      setCartCount(newCount)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('vegfru_cart_updated'))
    } catch { /* ignore */ }
  }

  const handleAddToCart = () => {
    mergeProductIntoCart()
    setAdded(true)
    setToast(`${qty} × ${product.name} added to cart!`)
    setTimeout(() => { setAdded(false); setToast('') }, 2500)
  }

  const handleBuyNow = () => {
    if (product.stock === 0) return
    mergeProductIntoCart()
    queueMicrotask(() => router.push('/checkout'))
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

  const ratingShort = Number(product.rating || 0).toFixed(1)

  const trustCards = (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
      {[
        { icon: Truck, label: '4–6h Delivery', sub: 'Express fresh' },
        { icon: Shield, label: 'Quality', sub: 'Trusted farms' },
        { icon: RotateCcw, label: 'Returns', sub: '24h window' },
      ].map(({ icon: Icon, label, sub }) => (
        <div key={label} className="min-w-0 rounded-xl border border-gray-200 bg-white p-2 text-center sm:p-3">
          <Icon className="mx-auto mb-1" size={18} color="#16a34a" />
          <div className="text-[10px] font-semibold leading-tight text-gray-900 sm:text-[11px]">{label}</div>
          <div className="mt-0.5 hidden text-[9px] text-gray-400 sm:block sm:text-[10px]">{sub}</div>
        </div>
      ))}
    </div>
  )

  const specDetailCards = (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2.5">
      {[
        { Icon: LayoutGrid, title: product.category, sub: 'Category' },
        { Icon: Package, title: product.unit, sub: 'Unit' },
        { Icon: Leaf, title: product.tag, sub: 'Tag' },
        { Icon: MapPin, title: product.origin || 'Local farm', sub: 'Origin' },
      ].map(({ Icon, title, sub }) => (
        <div key={sub} className="min-w-0 rounded-xl border border-gray-200 bg-white p-2 text-center sm:p-3">
          <Icon className="mx-auto mb-1" size={18} color="#16a34a" />
          <div className="text-[10px] font-semibold capitalize leading-tight text-gray-900 sm:text-[11px]">{title}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-gray-400 sm:text-[10px]">{sub}</div>
        </div>
      ))}
    </div>
  )

  const tabBar = (
    <div className="relative z-10 -mx-1 mb-4 flex gap-0 overflow-x-auto border-b-2 border-gray-100 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {(['details', 'nutrition', 'reviews'] as const).map(t => (
        <button key={t} type="button" onClick={() => setActiveTab(t)}
          className={`shrink-0 whitespace-nowrap px-3 py-2.5 text-xs capitalize sm:px-[18px] sm:text-[13px] ${activeTab === t ? 'border-b-2 border-[#14532d] font-bold text-[#14532d]' : 'border-b-2 border-transparent font-normal text-gray-500'}`}
          style={{ marginBottom: -2 }}
        >
          {t === 'nutrition' ? 'Nutrition' : t === 'reviews' ? 'Reviews' : 'Details'}
        </button>
      ))}
    </div>
  )

  const tabPanels = (
    <>
      {activeTab === 'details' && (
        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12 }}>{product.description}</p>
          {product.nutritionHighlight && <p style={{ color: '#16a34a', fontWeight: 500 }}>🌟 {product.nutritionHighlight}</p>}
          <div className="mt-4 lg:hidden">{specDetailCards}</div>
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
          <div className="mb-4 flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="shrink-0 text-center sm:text-left">
              <div className="text-4xl font-extrabold leading-none text-[#14532d]">{ratingShort}</div>
              <div className="mt-1 flex justify-center gap-0.5 sm:justify-start">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e7eb'} color={s <= Math.floor(product.rating) ? '#f59e0b' : '#e5e7eb'} />)}
              </div>
              <div className="mt-1 text-[11px] text-gray-400">{product.reviews.toLocaleString()} reviews</div>
            </div>
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-gray-500">
              Ratings reflect verified purchases and feedback from your VegFru store. Individual review text will appear here as you collect more reviews.
            </div>
          </div>
        </div>
      )}
    </>
  )

  const priceSaveBlock = (
    <div className="flex flex-col gap-2 rounded-xl bg-[#f0fdf4] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-none text-[#14532d] sm:text-3xl lg:text-4xl">₹{product.price}</div>
        <div className="mt-0.5 text-[11px] text-gray-400 line-through sm:text-sm">₹{product.originalPrice} / {product.unit}</div>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-xs font-bold text-green-600 sm:text-sm">Save ₹{Math.max(0, product.originalPrice - product.price)}</div>
        <div className="text-[10px] text-gray-500 sm:text-xs">{discount}% off</div>
      </div>
    </div>
  )

  const qtySelector = (
    <div className="flex h-full w-full min-w-0 items-stretch gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}
        className="flex min-h-0 min-w-0 flex-1 items-center justify-center border-0 bg-transparent text-base text-gray-700 sm:text-lg"
      >
        <Minus size={16} className="shrink-0" />
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center text-center text-sm font-bold tabular-nums text-[#14532d] sm:text-base">{qty}</span>
      <button type="button" onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
        className="flex min-h-0 min-w-0 flex-1 items-center justify-center border-0 bg-transparent text-base text-gray-700 sm:text-lg"
      >
        <Plus size={16} className="shrink-0" />
      </button>
    </div>
  )

  const addToCartButton = () => (
    <button type="button" onClick={handleAddToCart} disabled={product.stock === 0}
      className="box-border flex h-full w-full min-w-0 items-center justify-center gap-1 rounded-xl border border-[#0f3d1f]/20 px-1.5 text-[10px] font-bold leading-tight text-white shadow-sm transition-all hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-1.5 sm:px-2 sm:text-xs lg:px-2.5 lg:text-[13px]"
      style={{
        background: added ? '#22c55e' : 'linear-gradient(135deg,#14532d,#166534)',
        boxShadow: added ? '0 2px 8px rgba(34,197,94,0.3)' : '0 2px 8px rgba(22,101,52,0.18)',
      }}
    >
      {added ? (
        <><Check size={17} className="shrink-0" /><span>Added!</span></>
      ) : (
        <>
          <ShoppingCart size={17} className="shrink-0 opacity-95" />
          <span className="min-w-0 truncate text-center">Add to cart · ₹{product.price * qty}</span>
        </>
      )}
    </button>
  )

  const buyNowButton = () => (
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={product.stock === 0}
      aria-label="Buy now and go to checkout"
      className="box-border flex h-full w-full min-w-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-1.5 text-center text-[10px] font-bold leading-tight text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-2 sm:text-xs lg:px-2.5 lg:text-[13px]"
    >
      <span className="min-w-0 truncate">Buy now →</span>
    </button>
  )

  const qtyAddBuyRow = (
    <div className="grid w-full min-w-0 grid-cols-3 grid-rows-[48px] gap-2 sm:grid-rows-[52px] sm:gap-3">
      <div className="min-h-0 min-w-0 overflow-hidden">{qtySelector}</div>
      <div className="min-h-0 min-w-0 overflow-hidden">{addToCartButton()}</div>
      <div className="min-h-0 min-w-0 overflow-hidden">{buyNowButton()}</div>
    </div>
  )

  const stockAlerts = (
    <>
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
    </>
  )

  const categoryRatingRow = (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <span style={{ background: `${product.accent}18`, color: product.accent, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {product.category}
      </span>
      <div className="flex min-w-0 shrink-0 items-center gap-1">
        <Star size={14} fill="#f59e0b" color="#f59e0b" className="shrink-0" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{ratingShort}</span>
        <span className="hidden text-[13px] text-gray-400 sm:inline">({product.reviews.toLocaleString()} reviews)</span>
        <span className="text-[11px] text-gray-400 sm:hidden">({product.reviews})</span>
      </div>
    </div>
  )

  return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/checkout')} />
      <div className="relative z-40 min-h-screen w-full max-w-full overflow-x-hidden bg-[#FEFAE0] pt-[88px] sm:pt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <div
          className="mx-auto flex w-full min-w-0 max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
          style={{ maxWidth: uiTokens.container.commerce }}
        >
          <button onClick={() => router.back()} className="flex shrink-0 items-center gap-2 border-0 bg-transparent text-sm text-gray-500" type="button">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <button type="button" onClick={handleShare} className="flex items-center gap-1.5 border-0 bg-transparent text-xs text-gray-500 sm:text-sm sm:gap-2">
              <Share2 size={16} className="shrink-0" /> Share
            </button>
            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="flex min-w-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border-0 bg-[#14532d] px-3 py-2 text-xs font-medium text-white sm:gap-2 sm:px-4 sm:text-sm"
            >
              <ShoppingCart size={15} className="shrink-0" /> <span>Cart</span>
              {cartCount > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Mobile: square image full width, details, qty, Add to Cart + Buy Now in one row */}
        <div className="mx-auto w-full min-w-0 px-4 pb-2 lg:hidden" style={{ maxWidth: uiTokens.container.commerce }}>
          <div
            className="relative mx-auto aspect-square w-full max-w-[min(100%,420px)] overflow-hidden border border-gray-200 bg-[#f0fdf4]"
            style={{ borderRadius: uiTokens.radius.panel }}
          >
            {product.image && !imgErr ? (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImgErr(true)}
                className="absolute inset-0 h-full w-full scale-[1.08] object-cover object-center"
                sizes="(max-width: 420px) 100vw, 420px"
                decoding="async"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                <span className="text-7xl">{product.emoji}</span>
              </div>
            )}
            {product.badge && (
              <span className="absolute left-3 top-3 rounded-lg bg-[rgba(15,83,35,0.92)] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span className="absolute right-3 top-3 rounded-lg bg-red-500/90 px-2 py-1 text-[10px] font-bold text-white">-{discount}%</span>
            )}
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border-0 bg-white/90 shadow-md backdrop-blur-sm"
            >
              <Heart size={20} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#9ca3af'} />
            </button>
          </div>
          <div className="mt-4 flex min-w-0 flex-col gap-2">
            {categoryRatingRow}
            <h1 className="font-serif text-xl font-extrabold leading-tight text-[#14532d]">{product.name}</h1>
            {priceSaveBlock}
            {stockAlerts}
          </div>
          <div className="mt-4">{qtyAddBuyRow}</div>
          <div className="mt-4">{trustCards}</div>
          <p className="mt-4 break-words text-[15px] leading-relaxed text-gray-500">{product.description}</p>
          <p className="mt-2 text-xs text-gray-400">📍 {product.origin}</p>
          {tabBar}
          {tabPanels}
        </div>

        {/* Desktop: two columns, no forced empty grid rows */}
        <div
          className="mx-auto hidden w-full min-w-0 grid-cols-2 items-start gap-10 px-5 pb-12 lg:grid"
          style={{ maxWidth: uiTokens.container.commerce }}
        >
          <div className="min-w-0 self-start">
            <div className="mx-auto w-full max-w-full" style={{ borderRadius: uiTokens.radius.panel, overflow: 'hidden', background: '#f0fdf4', border: '1px solid #e5e7eb', position: 'relative', aspectRatio: '1' }}>
              {product.image && !imgErr ? (
                <img
                  src={product.image}
                  alt={product.name}
                  onError={() => setImgErr(true)}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  sizes="(max-width: 1100px) 50vw, 520px"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, #f0fdf4, #dcfce7)` }}>
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
              <button type="button" onClick={() => setLiked(!liked)}
                style={{ position: 'absolute', bottom: 16, right: 16, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <Heart size={20} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#9ca3af'} />
              </button>
            </div>
            <div className="mt-4">{trustCards}</div>
          </div>

          <div className="min-w-0 self-start pt-0 lg:pt-0.5">
            {categoryRatingRow}
            <h1 className="mb-2 break-words font-serif text-2xl font-extrabold leading-tight text-[#14532d] sm:text-3xl lg:text-[32px]">{product.name}</h1>
            <p className="mb-2 break-words text-[15px] leading-relaxed text-gray-500">{product.description}</p>
            <p className="mb-5 text-xs text-gray-400 sm:text-sm">📍 {product.origin}</p>
            <div className="mb-5">{priceSaveBlock}</div>
            {stockAlerts}
            <div className="mb-6">{qtyAddBuyRow}</div>
            <div className="mb-6">{specDetailCards}</div>
            {tabBar}
            {tabPanels}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 pb-12 sm:px-5" style={{ maxWidth: uiTokens.container.commerce }}>
            <h2 className="mb-4 font-serif text-xl font-bold text-[#14532d] sm:mb-5 sm:text-2xl">More from {product.category}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p: CatalogProduct) => (
                <a
                  key={p.id}
                  href={`/product/${encodeURIComponent(p.id)}`}
                  className="block overflow-hidden rounded-2xl border border-gray-200 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                  style={{ background: 'white' }}
                  aria-label={`View ${p.name}`}
                >
                  <div style={{ height: 140, overflow: 'hidden', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 60 }}>{p.emoji}</span>}
                  </div>
                  <div className="min-w-0 px-3 py-3 sm:px-3.5">
                    <div className="mb-1 line-clamp-2 text-xs font-semibold text-[#14532d] sm:text-[13px]">{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#14532d' }}>₹{p.price}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{p.unit}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 left-1/2 z-[999] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl bg-[#14532d] px-4 py-3 text-center text-sm font-medium text-white shadow-xl sm:bottom-6 sm:gap-3 sm:whitespace-nowrap">
            <Check size={16} className="shrink-0" /> <span className="break-words">{toast}</span>
            <Link href="/checkout" className="shrink-0 font-bold text-green-200 no-underline">View Cart →</Link>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
