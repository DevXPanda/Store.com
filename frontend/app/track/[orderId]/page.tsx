'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { uiTokens } from '@/app/ui-tokens'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

const STATUS_CFG: Record<string, { label:string; color:string; bg:string; icon:any; step:number }> = {
  pending:          { label:'Order Placed',     color:'#f59e0b', bg:'#fef3c7', icon:Clock,        step:0 },
  confirmed:        { label:'Confirmed',         color:'#3b82f6', bg:'#dbeafe', icon:CheckCircle,  step:1 },
  preparing:        { label:'Being Packed',      color:'#8b5cf6', bg:'#ede9fe', icon:Package,      step:2 },
  assigned:         { label:'Rider Assigned',    color:'#06b6d4', bg:'#cffafe', icon:Truck,        step:3 },
  picked_up:        { label:'Picked Up',         color:'#f97316', bg:'#ffedd5', icon:Truck,        step:3 },
  out_for_delivery: { label:'Out for Delivery',  color:'#0ea5e9', bg:'#e0f2fe', icon:Truck,        step:4 },
  delivered:        { label:'Delivered',         color:'#22c55e', bg:'#dcfce7', icon:CheckCircle,  step:5 },
  cancelled:        { label:'Cancelled',         color:'#ef4444', bg:'#fee2e2', icon:Package,      step:-1 },
}

const STEPS = ['Placed','Confirmed','Packed','Assigned','Out for Delivery','Delivered']

export default function TrackOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [cartCount, setCartCount] = useState(0)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetch_() {
      if (!CONVEX_URL) { setLoading(false); return }
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ path:'orders:getAllOrders', args:{ limit:500 } }),
        })
        const data = await res.json()
        const all = data.value || []
        // Match by last 6/8 chars of ID
        const found = all.find((o:any) =>
          o._id === orderId ||
          o._id?.slice(-8).toUpperCase() === orderId.toUpperCase() ||
          o._id?.slice(-6).toUpperCase() === orderId.toUpperCase()
        )
        if (found) setOrder(found)
        else setNotFound(true)
      } catch { setNotFound(true) }
      setLoading(false)
    }
    fetch_()
  }, [orderId])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      if (saved) {
        const cart = JSON.parse(saved)
        setCartCount(cart.reduce((sum: number, item: any) => sum + item.qty, 0))
      }
    } catch {}
  }, [])

  if (loading) return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:120 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, animation:'bounce 1s infinite', marginBottom:12 }}>📦</div>
          <div style={{ fontSize:14, color:'#16a34a' }}>Tracking your order...</div>
          <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
        </div>
      </div>
      <Footer />
    </>
  )

  if (notFound) return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24, paddingTop:120 }}>
        <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:400, textAlign:'center', border:'1px solid #e5e7eb' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', marginBottom:8 }}>Order not found</h2>
          <p style={{ color:'#6b7280', fontSize:14, marginBottom:20 }}>Order #{orderId} could not be found. Check your confirmation email for the correct order ID.</p>
          <Link href="/" style={{ background:'#14532d', color:'white', padding:'12px 28px', borderRadius:12, textDecoration:'none', fontSize:14, fontWeight:600 }}>
            Back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )

  const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending
  const StatusIcon = cfg.icon
  const step = cfg.step

  return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div style={{ minHeight:'100vh', background:'#FEFAE0', paddingTop:96 }}>
        <div style={{ maxWidth:uiTokens.container.account, margin:'0 auto', padding:'32px 20px 64px' }}>
        <button onClick={() => router.back()} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, marginBottom:28 }}>
          <ArrowLeft size={16}/> Back
        </button>

        <div style={{ background:'white', borderRadius:uiTokens.radius.panel, padding:28, border:'1px solid #e5e7eb', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <div style={{ width:52, height:52, background:cfg.bg, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <StatusIcon size={24} color={cfg.color}/>
            </div>
            <div>
              <h1 style={{ ...uiTokens.typography.pageTitle, color:'#111827', margin:0 }}>Order #{order._id?.slice(-8).toUpperCase()}</h1>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#6b7280' }}>Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })}</p>
            </div>
            <span style={{ marginLeft:'auto', background:cfg.bg, color:cfg.color, fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>{cfg.label}</span>
          </div>

          {/* Progress steps */}
          {order.status !== 'cancelled' ? (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
                {STEPS.map((s, i) => {
                  const done = step > i, cur = step === i
                  return (
                    <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      <div style={{ position:'relative', zIndex:1 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                          background:done?'#14532d':cur?'#f0fdf4':'#f3f4f6',
                          color:done?'white':cur?'#14532d':'#9ca3af',
                          border:`2px solid ${done?'#14532d':cur?'#14532d':'#e5e7eb'}`,
                          boxShadow:cur?'0 0 0 4px rgba(20,83,45,0.1)':undefined }}>
                          {done?'✓':i+1}
                        </div>
                        {i < STEPS.length-1 && <div style={{ position:'absolute', top:15, left:'100%', width:'100%', height:2, background:done?'#14532d':'#e5e7eb', zIndex:-1 }}/>}
                      </div>
                      <span style={{ fontSize:10, color:done||cur?'#14532d':'#9ca3af', fontWeight:done||cur?600:400, textAlign:'center', lineHeight:1.3 }}>{s}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:14, color:'#b91c1c' }}>
              ❌ This order was cancelled. {order.cancelReason && `Reason: ${order.cancelReason}`}
            </div>
          )}

          {/* Order info */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['💰 Total', `₹${order.total}`],
              ['💳 Payment', `${order.paymentMethod?.toUpperCase()} · ${order.paymentStatus}`],
              ['📍 Deliver to', order.deliveryAddress?.split(',')[0]],
              ['🛵 Rider', order.assignedDeliveryBoyName||'Being assigned'],
            ].map(([k,v]) => (
              <div key={k} style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:500, color:'#111827' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ETA */}
        {!['delivered','cancelled'].includes(order.status) && (
          <div style={{ background:'#14532d', color:'white', borderRadius:uiTokens.radius.panel, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <Truck size={24} color="#86efac"/>
            <div>
              <div style={{ fontSize:15, fontWeight:700 }}>Estimated delivery in 4–6 hours</div>
              <div style={{ fontSize:12, color:'#86efac' }}>We'll notify you when the rider is nearby</div>
            </div>
          </div>
        )}

        {/* Help */}
        <div style={{ background:'white', borderRadius:uiTokens.radius.panel, padding:'16px 20px', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, color:'#374151' }}>Need help with this order?</div>
          <a href="https://wa.me/919800000001" target="_blank" rel="noreferrer"
            style={{ background:'#25d366', color:'white', padding:'10px 18px', borderRadius:uiTokens.radius.control, textDecoration:'none', fontSize:14, fontWeight:600 }}>
            WhatsApp Us
          </a>
        </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
