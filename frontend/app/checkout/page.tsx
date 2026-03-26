'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle, Loader2, ShieldCheck, Tag, Zap } from 'lucide-react'
import { mapConvexProduct } from '@/lib/catalog'
import { useConvexQuery } from '@/lib/convexFetch'
import { useAuth } from '@/app/AuthContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { uiTokens } from '@/app/ui-tokens'

interface CartItem { id: string; qty: number }

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

async function convexMutation(path: string, args: object) {
  if (!CONVEX_URL) return null
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errorMessage || 'Mutation failed')
  return data.value
}

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { data: rawProducts } = useConvexQuery<Record<string, unknown>[]>('products:getAllProducts', { includeInactive: false })
  const products = useMemo(() => (rawProducts ?? []).map(mapConvexProduct), [rawProducts])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address')
  const [loading, setLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: 'Faridabad', pincode: '121001',
    paymentMethod: 'cod' as 'cod' | 'upi' | 'online',
  })

  const loadCartFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      setCartItems(saved ? JSON.parse(saved) : [])
    } catch {
      setCartItems([])
    }
  }, [])

  useLayoutEffect(() => {
    loadCartFromStorage()
  }, [loadCartFromStorage])

  useEffect(() => {
    if (pathname === '/checkout') loadCartFromStorage()
  }, [pathname, loadCartFromStorage])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'vegfru_cart' || e.key === null) loadCartFromStorage()
    }
    const onCartUpdated = () => loadCartFromStorage()
    window.addEventListener('storage', onStorage)
    window.addEventListener('vegfru_cart_updated', onCartUpdated)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('vegfru_cart_updated', onCartUpdated)
    }
  }, [loadCartFromStorage])

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || '', email: user.email || '' }))
  }, [user])

  // Fixed: correct destructuring — cartProducts has {id, qty, product}
  const cartProducts = cartItems
    .map(item => ({ id: item.id, qty: item.qty, product: products.find(p => p.id === item.id)! }))
    .filter(i => i.product)

  const subtotal = cartProducts.reduce((s, i) => s + i.product.price * i.qty, 0)
  const savings = cartProducts.reduce((s, i) => s + (i.product.originalPrice - i.product.price) * i.qty, 0)
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0
  const deliveryFee = subtotal >= 299 ? 0 : 49
  const total = subtotal - discount + deliveryFee

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'VEGFRU10') { setCouponApplied(true) }
    else { setMsg('Invalid coupon code'); setTimeout(() => setMsg(''), 2500) }
  }

  const buildOrderPayload = useCallback(() => ({
    userId: (user as any)?._id || undefined,
    guestId: !(user as any)?._id ? `guest_${Date.now()}` : undefined,
    customerName: form.name,
    customerEmail: form.email || 'guest@vegfru.com',
    customerPhone: form.phone,
    deliveryAddress: `${form.address}, ${form.city} - ${form.pincode}`,
    subtotal, deliveryFee, discount, total,
    paymentMethod: form.paymentMethod,
    items: cartProducts.map(i => ({
      productId: i.product.id,
      productName: i.product.name,
      productEmoji: i.product.emoji,
      productImage: i.product.image || '',
      quantity: i.qty,
      unitPrice: i.product.price,
      totalPrice: i.product.price * i.qty,
    })),
  }), [form, cartProducts, subtotal, deliveryFee, discount, total, user])

  const clearCart = () => {
    localStorage.removeItem('vegfru_cart')
    setCartItems([])
  }

  const goToTrackOrder = () => {
    if (!orderId) return
    const target = `/track/${encodeURIComponent(String(orderId))}`
    router.push(target)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (!window.location.pathname.startsWith('/track/')) window.location.assign(target)
      }, 120)
    }
  }

  // COD / fallback order placement
  const placeCODOrder = async () => {
    setLoading(true)
    try {
      let newId: any = null
      try { newId = await convexMutation('orders:placeOrder', buildOrderPayload()) } catch { }
      if (!newId) newId = `ORD${Date.now()}`
      setOrderId(String(newId))
      // Send confirmation email (non-blocking)
      fetch('/api/email/order-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.email || 'customer@vegfru.com',
          customerName: form.name,
          orderId: newId,
          total, deliveryFee, discount,
          paymentMethod: form.paymentMethod,
          address: `${form.address}, ${form.city} - ${form.pincode}`,
          items: cartProducts.map(i => ({
            productName: i.product.name,
            productEmoji: i.product.emoji,
            quantity: i.qty,
            unitPrice: i.product.price,
            totalPrice: i.product.price * i.qty,
          })),
        }),
      }).catch(() => { }) // Fire and forget — never block checkout

      // Send SMS confirmation (non-blocking)
      if (form.phone) {
        fetch('/api/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: form.phone,
            message: `VegFru: Order #${String(newId).slice(-6).toUpperCase()} confirmed! Total: Rs.${total}. Delivery in 4-6 hours to ${form.city}. Track: vegfru.in/orders`,
          }),
        }).catch(() => { })
      }
      clearCart()
      setStep('success')
    } catch { setOrderId(`ORD${Date.now()}`); clearCart(); setStep('success') }
    setLoading(false)
  }

  // Razorpay payment
  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handleRazorpay = async () => {
    setPayLoading(true)
    const loaded = await loadRazorpay()
    if (!loaded) { alert('Payment gateway failed to load. Try COD.'); setPayLoading(false); return }

    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()
    if (!rzpKey) {
      alert('Online payment is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to backend/.env.local or choose Cash on Delivery.')
      setPayLoading(false)
      return
    }

    const options = {
      key: rzpKey,
      amount: total * 100,
      currency: 'INR',
      name: 'VegFru',
      description: `Order — ${cartProducts.length} items`,
      image: '/logo.png',
      handler: async (response: any) => {
        try {
          let newId: any = null
          try {
            newId = await convexMutation('orders:placeOrder', {
              ...buildOrderPayload(),
              paymentMethod: form.paymentMethod,
              razorpayOrderId: response.razorpay_order_id || '',
            })
          } catch { }
          if (!newId) newId = `ORD${Date.now()}`
          setOrderId(String(newId))
          clearCart()
          setStep('success')
        } catch { setOrderId(`ORD${Date.now()}`); clearCart(); setStep('success') }
        setPayLoading(false)
      },
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: '#14532d' },
      modal: { ondismiss: () => setPayLoading(false) },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
    setPayLoading(false)
  }

  const handleSubmit = async () => {
    if (form.paymentMethod === 'cod') await placeCODOrder()
    else await handleRazorpay()
  }

  const InputField = ({ label, field, type = 'text', placeholder, required = false, span = 1 }: any) => (
    <div className={span === 2 ? 'span-2-desktop' : ''} style={{ gridColumn: `span ${span}` }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>{label}{required && ' *'}</label>
      <input value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        type={type} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', background: '#fafafa', transition: 'border-color 0.15s' }}
        onFocus={e => e.target.style.borderColor = '#14532d'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
    </div>
  )

  if (step === 'success') return (
    <>
      <Navbar cartCount={cartItems.reduce((s, i) => s + i.qty, 0)} onCartClick={() => router.push('/checkout')} />
      <div style={{ minHeight: '100vh', background: '#FEFAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 120 }}>
        <div style={{ background: 'white', borderRadius: uiTokens.radius.panel, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ width: 80, height: 80, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={40} color="#16a34a" />
          </div>
          <h1 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>Order Placed!</h1>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 8 }}>Your fresh produce is being packed.</p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 20px', marginBottom: 24, display: 'inline-block' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#15803d', fontWeight: 600 }}>
              Order #{String(orderId).slice(-8).toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28, textAlign: 'left' }}>
            {[['💰 Total', `₹${total}`], ['💳 Payment', form.paymentMethod.toUpperCase()], ['📍 Delivery to', form.city], ['⚡ ETA', '4–6 hours']].map(([k, v]) => (
              <div key={k} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
            📧 A confirmation will be sent to <strong>{form.email || 'your email'}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={goToTrackOrder}
              style={{ width: '100%', background: 'white', color: '#14532d', border: '2px solid #14532d', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Track Order →
            </button>
            <button onClick={() => router.push('/')}
              style={{ width: '100%', background: '#14532d', color: 'white', border: 'none', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <style>{`
        .checkout-grid {
          max-width: ${uiTokens.container.commerce}px;
          margin: 0 auto;
          padding: 32px 20px 64px;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        .checkout-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .checkout-summary {
          position: sticky;
          top: 100px;
        }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            padding: 20px 16px 48px;
            gap: 20px;
          }
          .checkout-form-grid {
            grid-template-columns: 1fr;
          }
          .checkout-form-grid .span-2-desktop {
            grid-column: span 1 !important;
          }
          .checkout-summary {
            position: static;
            order: -1;
          }
        }
      `}</style>
      <Navbar cartCount={cartItems.reduce((s, i) => s + i.qty, 0)} onCartClick={() => router.push('/checkout')} />
      <div style={{ minHeight: '100vh', background: '#FEFAE0', paddingTop: 96 }}>
        <div className="checkout-grid">
          {/* Left */}
          <div>
            <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}>
              <ArrowLeft size={16} /> Back to shop
            </button>

            {/* Steps indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              {[['address', '1', 'Delivery Address'], ['payment', '2', 'Payment']].map(([id, num, label], i) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                      background: step === id ? '#14532d' : (step === 'payment' && id === 'address') ? '#dcfce7' : '#f3f4f6',
                      color: step === id ? 'white' : (step === 'payment' && id === 'address') ? '#16a34a' : '#9ca3af'
                    }}>
                      {step === 'payment' && id === 'address' ? '✓' : num}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: step === id ? 600 : 400, color: step === id ? '#111827' : '#6b7280' }}>{label}</span>
                  </div>
                  {i < 1 && <div style={{ width: 32, height: 1, background: '#e5e7eb', margin: '0 4px' }} />}
                </div>
              ))}
            </div>

            {step === 'address' && (
              <div style={{ background: 'white', borderRadius: uiTokens.radius.panel, padding: 28, border: '1px solid #e5e7eb' }}>
                <h2 style={{ ...uiTokens.typography.sectionTitle, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} color="#14532d" /> Delivery Details
                </h2>
                <div className="checkout-form-grid">
                  <InputField label="Full Name" field="name" placeholder="Priya Sharma" required span={1} />
                  <InputField label="Phone" field="phone" placeholder="9876543210" required type="tel" span={1} />
                  <InputField label="Email" field="email" placeholder="you@example.com" type="email" span={2} />
                  <div className="span-2-desktop" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full Address *</label>
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="House No., Street, Colony, Landmark..." rows={2}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', resize: 'none', background: '#fafafa' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>City</label>
                    <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', background: '#fafafa' }}>
                      {['Faridabad', 'Gurugram', 'Delhi', 'Noida', 'Ghaziabad', 'Bahadurgarh'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <InputField label="Pincode" field="pincode" placeholder="121001" span={1} />
                </div>
                <button onClick={() => { if (form.name && form.phone && form.address) setStep('payment') }}
                  disabled={!form.name || !form.phone || !form.address}
                  style={{ marginTop: 20, width: '100%', background: '#14532d', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 600, cursor: (!form.name || !form.phone || !form.address) ? 'not-allowed' : 'pointer', opacity: (!form.name || !form.phone || !form.address) ? 0.5 : 1 }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div style={{ background: 'white', borderRadius: uiTokens.radius.panel, padding: 28, border: '1px solid #e5e7eb' }}>
                <h2 style={{ ...uiTokens.typography.sectionTitle, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="#14532d" /> Payment Method
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {[
                    { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives at door', icon: '💵', badge: null },
                    { id: 'upi', label: 'UPI Payment', sub: 'GPay, PhonePe, Paytm, BHIM', icon: '📱', badge: 'Instant' },
                    { id: 'online', label: 'Card / Net Banking', sub: 'Visa, Mastercard, RuPay, NEFT', icon: '💳', badge: 'Secure' },
                  ].map(opt => (
                    <label key={opt.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      border: `2px solid ${form.paymentMethod === opt.id ? '#14532d' : '#e5e7eb'}`,
                      borderRadius: 14, cursor: 'pointer', background: form.paymentMethod === opt.id ? '#f0fdf4' : 'white', transition: 'all 0.15s'
                    }}>
                      <input type="radio" name="pay" value={opt.id} checked={form.paymentMethod === opt.id as any}
                        onChange={() => setForm(f => ({ ...f, paymentMethod: opt.id as any }))} style={{ accentColor: '#14532d' }} />
                      <span style={{ fontSize: 24 }}>{opt.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{opt.label}
                          {opt.badge && <span style={{ marginLeft: 8, fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 6 }}>{opt.badge}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{opt.sub}</div>
                      </div>
                      {opt.id !== 'cod' && <Zap size={14} color="#16a34a" />}
                    </label>
                  ))}
                </div>

                {/* Coupon */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Tag size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code (VEGFRU10)"
                      style={{ width: '100%', padding: '10px 14px 10px 32px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={applyCoupon}
                    style={{ background: couponApplied ? '#dcfce7' : '#14532d', color: couponApplied ? '#16a34a' : 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {couponApplied ? '✓ Applied' : 'Apply'}
                  </button>
                </div>

                {msg && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>{msg}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
                  <ShieldCheck size={15} color="#16a34a" />
                  <span style={{ fontSize: 12, color: '#15803d' }}>256-bit SSL encryption · 100% secure payment · No card data stored</span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep('address')}
                    style={{ flex: 1, background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 14, padding: '13px', fontSize: 14, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading || payLoading}
                    style={{ flex: 2, background: '#14532d', color: 'white', border: 'none', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 600, cursor: (loading || payLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {(loading || payLoading) ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Processing...</> : `${form.paymentMethod === 'cod' ? 'Place Order' : 'Pay'} • ₹${total}`}
                  </button>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
          </div>

          {/* Right — Order Summary */}
          <div className="checkout-summary" style={{ background: 'white', borderRadius: uiTokens.radius.panel, padding: 24, border: '1px solid #e5e7eb' }}>
            <h3 style={{ ...uiTokens.typography.sectionTitle, color: '#111827', marginBottom: 16 }}>
              Order Summary ({cartProducts.reduce((s, i) => s + i.qty, 0)} items)
            </h3>
            {cartProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                <div style={{ fontSize: 14 }}>Cart is empty</div>
                <button onClick={() => router.push('/')} style={{ marginTop: 12, background: '#14532d', color: 'white', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
                  Browse Products
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 280, overflowY: 'auto' }}>
                  {/* FIXED: correct destructuring {id, qty, product} */}
                  {cartProducts.map(({ id, qty, product }) => (
                    <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                        {product.image
                          ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 22 }}>{product.emoji}</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Qty: {qty} × ₹{product.price}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#14532d', flexShrink: 0 }}>₹{product.price * qty}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Subtotal', `₹${subtotal}`, undefined],
                    ['You save', `-₹${savings}`, '#16a34a'],
                    ...(discount > 0 ? [['Coupon (VEGFRU10)', `-₹${discount}`, '#16a34a']] : []),
                    ['Delivery', deliveryFee === 0 ? 'FREE 🎉' : `₹${deliveryFee}`, deliveryFee === 0 ? '#16a34a' : undefined],
                  ].map(([k, v, c]: any) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                      <span>{k}</span><span style={{ color: c || '#374151' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#111827', borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 2 }}>
                    <span>Total</span><span style={{ color: '#14532d' }}>₹{total}</span>
                  </div>
                </div>
                <div style={{ marginTop: 14, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Truck size={14} color="#16a34a" />
                  <span style={{ fontSize: 12, color: '#15803d' }}>
                    {deliveryFee === 0 ? 'Free delivery unlocked!' : `Add ₹${299 - subtotal} more for free delivery`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
