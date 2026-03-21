'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import MarqueeTicker from '@/components/Marquee'
import Stats from '@/components/Stats'
import ProductsSection from '@/components/ProductsSection'
import SeasonalBanner from '@/components/SeasonalBanner'
import HowItWorks from '@/components/HowItWorks'
import Testimonials from '@/components/Testimonials'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import CartSidebar from '@/components/CartSidebar'
import AIAssistant from '@/components/AIAssistant'

interface CartItem { id: string; qty: number }

function HomeContent() {
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [initialSearch, setInitialSearch] = useState('')

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      if (saved) setCartItems(JSON.parse(saved))
    } catch {}
  }, [])

  // Handle URL search param
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) {
      setInitialSearch(q)
      setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [searchParams])

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
    <main>
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <Hero />
      <MarqueeTicker />
      <Stats />
      <SeasonalBanner />
      <ProductsSection onAddToCart={handleAddToCart} initialSearch={initialSearch} />
      <HowItWorks />
      <Testimonials />
      <Newsletter />
      <Footer />
      <CartSidebar
        isOpen={cartOpen} onClose={() => setCartOpen(false)}
        items={cartItems} onRemove={handleRemove} onUpdateQty={handleUpdateQty}
      />
      <AIAssistant onAddToCart={handleAddToCart} cartCount={cartCount} />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#FEFAE0' }} />}>
      <HomeContent />
    </Suspense>
  )
}
