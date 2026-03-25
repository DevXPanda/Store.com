'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Plus, Check, Heart } from 'lucide-react'
import type { CatalogProduct } from '@/lib/catalog'

export default function ProductCard({ product, onAddToCart }: { product: CatalogProduct; onAddToCart: (id: string, qty: number) => void }) {
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [qty, setQty] = useState(1)
  const [imgErr, setImgErr] = useState(false)
  const discount = product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  const isLowStock = product.stock < 10

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdded(true); onAddToCart(product.id, qty); setTimeout(() => setAdded(false), 2000)
  }

  const handleCardClick = () => {
    if (!product.id) return
    const target = `/product/${encodeURIComponent(product.id)}`
    router.push(target)
    // Fallback for cases where client routing doesn't commit.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (window.location.pathname !== target) window.location.assign(target)
      }, 120)
    }
  }

  return (
    <div onClick={handleCardClick}
      style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { (e.currentTarget).style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)'; (e.currentTarget).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget).style.transform = 'translateY(0)' }}>
      {/* Image — square on all sizes for consistent grid tiles */}
      <div className="relative w-full shrink-0 overflow-hidden aspect-square">
        {product.image && !imgErr ? (
          <>
            <img src={product.image} alt={product.name} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 55%)' }} />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${product.bg}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 72, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{product.emoji}</span>
          </div>
        )}
        {product.badge && (
          <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15,83,35,0.92)', color: 'white', padding: '3px 9px', borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase', fontFamily: 'monospace', backdropFilter: 'blur(8px)' }}>
            {product.badge}
          </span>
        )}
        <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.88)', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
          -{discount}%
        </span>
        {isLowStock && <span style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(239,68,68,0.9)', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>Only {product.stock} left!</span>}
        <button onClick={e => { e.stopPropagation(); setLiked(!liked) }}
          style={{ position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Heart style={{ width: 15, height: 15, fill: liked ? '#ef4444' : 'none', color: liked ? '#ef4444' : '#9ca3af', transition: 'all 0.2s' }} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ padding: '2px 8px', borderRadius: 8, background: `${product.accent}18`, color: product.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 88 }}>
            {product.tag}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star style={{ width: 11, height: 11, fill: '#f59e0b', color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#4b5563', fontWeight: 600 }}>
              {Number(product.rating || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>({product.reviews.toLocaleString()})</span>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-[13px] font-bold leading-snug text-[#14532d] sm:text-[15.5px]">{product.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500 sm:text-[12.5px]">{product.description}</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 sm:text-[11px]"><span>📍</span><span className="truncate">{product.origin}</span></div>
        <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5">
          <span className="font-display text-lg font-extrabold text-[#14532d] sm:text-[22px]">₹{product.price}</span>
          <span className="text-[10px] text-gray-400 line-through sm:text-xs">₹{product.originalPrice}</span>
          <span className="text-[10px] text-gray-600 sm:text-[11.5px]">/ {product.unit}</span>
        </div>
        <div className="mt-auto flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center justify-center gap-0.5 self-center rounded-[10px] border border-gray-100 bg-gray-50 p-0.5 sm:self-auto">
            <button type="button" onClick={e => { e.stopPropagation(); setQty(Math.max(1, qty - 1)) }} className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-0 bg-white text-sm font-bold text-gray-700 shadow-sm">−</button>
            <span className="w-5 text-center font-mono text-xs font-bold text-[#14532d] sm:w-[18px] sm:text-[13px]">{qty}</span>
            <button type="button" onClick={e => { e.stopPropagation(); setQty(qty + 1) }} className="flex h-[22px] w-[22px] items-center justify-center rounded-md border-0 bg-white text-sm font-bold text-gray-700 shadow-sm">+</button>
          </div>
          <button type="button" onClick={handleAdd}
            className="flex min-h-[38px] w-full items-center justify-center gap-1 rounded-[11px] border-0 px-2 text-xs font-semibold text-white transition-all sm:min-h-[38px] sm:flex-1 sm:text-[12.5px]"
            style={{
              background: added ? '#22c55e' : 'linear-gradient(135deg, #14532d, #166534)',
              boxShadow: added ? '0 4px 16px rgba(34,197,94,0.3)' : '0 4px 16px rgba(22,101,52,0.25)',
              fontFamily: '"DM Sans", sans-serif',
            }}>
            {added ? <><Check size={15} />Added!</> : <><Plus size={15} />Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  )
}
