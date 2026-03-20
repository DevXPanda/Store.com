'use client'
import { useState, useMemo, useEffect } from 'react'
import { SlidersHorizontal, Search, X, ChevronDown } from 'lucide-react'
import { categories, products, productsByKeyword } from '@/app/data'
import ProductCard from './ProductCard'

const ITEMS_PER_PAGE = 24

interface Props {
  onAddToCart: (id: number, qty: number) => void
  initialSearch?: string
}

export default function ProductsSection({ onAddToCart, initialSearch = '' }: Props) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Sync initialSearch when it changes (from URL)
  useEffect(() => {
    if (initialSearch) { setSearchQuery(initialSearch); setActiveCategory('all') }
  }, [initialSearch])

  const filtered = useMemo(() => {
    let base = searchQuery.trim()
      ? productsByKeyword(searchQuery.trim())
      : products.filter(p => activeCategory === 'all' || p.category === activeCategory)

    return [...base].sort((a, b) => {
      if (sortBy === 'price-asc')  return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'rating')     return b.rating - a.rating
      if (sortBy === 'reviews')    return b.reviews - a.reviews
      if (sortBy === 'discount')   return (b.originalPrice - b.price) - (a.originalPrice - a.price)
      const aB = a.badge ? 1 : 0; const bB = b.badge ? 1 : 0
      return bB - aB || b.rating - a.rating
    })
  }, [activeCategory, sortBy, searchQuery])

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = paginated.length < filtered.length

  const handleCatChange = (cat: string) => { setActiveCategory(cat); setSearchQuery(''); setPage(1) }

  return (
    <section id="shop" style={{ padding: '80px 0', background: '#FEFAE0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 32 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#15803d', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>· What's fresh today ·</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <h2 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, fontSize: 42, color: '#14532d', margin: 0, lineHeight: 1.1 }}>
              Our <em style={{ fontStyle: 'italic', color: '#166534' }}>Produce</em>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                  placeholder="Search produce…"
                  style={{ paddingLeft: 34, paddingRight: searchQuery ? 32 : 16, paddingTop: 8, paddingBottom: 8, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, outline: 'none', width: 200, transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setPage(1) }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Sort */}
              <div style={{ position: 'relative' }}>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}
                  style={{ appearance: 'none', paddingLeft: 12, paddingRight: 32, paddingTop: 8, paddingBottom: 8, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="discount">Best Discount</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 32, scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleCatChange(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 40, border: '1.5px solid', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, fontWeight: 500,
                background: activeCategory === cat.id ? '#14532d' : 'white',
                borderColor: activeCategory === cat.id ? '#14532d' : '#e5e7eb',
                color: activeCategory === cat.id ? 'white' : '#374151' }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            {searchQuery ? `${filtered.length} results for "${searchQuery}"` : `Showing ${paginated.length} of ${filtered.length} products`}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer' }}>Clear search</button>
          )}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, color: '#14532d', marginBottom: 8 }}>No products found</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Try a different search term or category</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('all') }} style={{ marginTop: 16, background: '#14532d', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
              Show all products
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {paginated.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
              Showing {paginated.length} of {filtered.length} products
            </p>
            <button onClick={() => setPage(p => p + 1)}
              style={{ background: 'white', border: '2px solid #14532d', color: '#14532d', padding: '12px 32px', borderRadius: 40, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#14532d'; (e.target as HTMLButtonElement).style.color = 'white' }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'white'; (e.target as HTMLButtonElement).style.color = '#14532d' }}>
              Load More Products
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
