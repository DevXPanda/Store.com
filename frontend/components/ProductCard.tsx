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

  const handleCardClick = () => router.push(`/product/${product.id}`)

  return (
    <div onClick={handleCardClick}
      style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { (e.currentTarget).style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)'; (e.currentTarget).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget).style.transform = 'translateY(0)' }}>
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', flexShrink: 0 }}>
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
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ padding: '2px 8px', borderRadius: 8, background: `${product.accent}18`, color: product.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'monospace' }}>{product.tag}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star style={{ width: 11, height: 11, fill: '#f59e0b', color: '#f59e0b' }} />
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#4b5563', fontWeight: 600 }}>{product.rating}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>({product.reviews.toLocaleString()})</span>
          </div>
        </div>
        <div>
          <h3 style={{ margin: 0, fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 15.5, color: '#14532d', lineHeight: 1.3 }}>{product.name}</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.description}</p>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><span>📍</span>{product.origin}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, fontSize: 22, color: '#14532d' }}>₹{product.price}</span>
          <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
          <span style={{ fontSize: 11.5, color: '#6b7280' }}>/ {product.unit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f9fafb', borderRadius: 12, padding: '4px 6px', border: '1px solid #f3f4f6' }}>
            <button onClick={e => { e.stopPropagation(); setQty(Math.max(1, qty - 1)) }} style={{ width: 26, height: 26, borderRadius: 8, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>−</button>
            <span style={{ width: 24, textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#14532d' }}>{qty}</span>
            <button onClick={e => { e.stopPropagation(); setQty(qty + 1) }} style={{ width: 26, height: 26, borderRadius: 8, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>+</button>
          </div>
          <button onClick={handleAdd}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 13, border: 'none', cursor: 'pointer', background: added ? '#22c55e' : 'linear-gradient(135deg, #14532d, #166534)', color: 'white', fontSize: 13.5, fontWeight: 600, fontFamily: '"DM Sans", sans-serif', boxShadow: added ? '0 4px 16px rgba(34,197,94,0.3)' : '0 4px 16px rgba(22,101,52,0.25)', transition: 'all 0.25s' }}>
            {added ? <><Check size={15} />Added!</> : <><Plus size={15} />Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  )
}
