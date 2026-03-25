'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductsSection from '@/components/ProductsSection'
import CartSidebar from '@/components/CartSidebar'
import Footer from '@/components/Footer'

interface CartItem { id: string; qty: number }

export default function ShopPage() {
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const initialSearch = useMemo(() => (searchParams.get('search') || '').trim(), [searchParams])
  const initialCategory = useMemo(() => (searchParams.get('category') || 'all').trim().toLowerCase(), [searchParams])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      if (saved) setCartItems(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const handleAddToCart = (id: string, qty: number) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === id)
      const updated = exists
        ? prev.map(i => i.id === id ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { id, qty }]
      localStorage.setItem('vegfru_cart', JSON.stringify(updated))
      return updated
    })
    setCartOpen(true)
  }

  const handleRemove = (id: string) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      localStorage.setItem('vegfru_cart', JSON.stringify(updated))
      return updated
    })
  }

  const handleUpdateQty = (id: string, qty: number) => {
    setCartItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty } : i)
      localStorage.setItem('vegfru_cart', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <main style={{ background: '#FEFAE0', minHeight: '100vh' }}>
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <div style={{ paddingTop: 80 }}>
        <ProductsSection
          onAddToCart={handleAddToCart}
          initialSearch={initialSearch}
          initialCategory={initialCategory}
        />
      </div>
      <Footer />
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemove={handleRemove}
        onUpdateQty={handleUpdateQty}
      />
    </main>
  )
}
