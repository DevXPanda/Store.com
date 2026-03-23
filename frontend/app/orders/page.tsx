'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, ChevronDown, ChevronUp, ShoppingBag, RefreshCw, X } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { uiTokens } from '@/app/ui-tokens'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:          { label:'Pending',         color:'#f59e0b', bg:'#fef3c7', icon:Clock },
  confirmed:        { label:'Confirmed',        color:'#3b82f6', bg:'#dbeafe', icon:CheckCircle },
  preparing:        { label:'Preparing',        color:'#8b5cf6', bg:'#ede9fe', icon:Package },
  assigned:         { label:'Assigned',         color:'#06b6d4', bg:'#cffafe', icon:Truck },
  picked_up:        { label:'Picked Up',        color:'#f97316', bg:'#ffedd5', icon:Truck },
  out_for_delivery: { label:'Out for Delivery', color:'#0ea5e9', bg:'#e0f2fe', icon:Truck },
  delivered:        { label:'Delivered',        color:'#22c55e', bg:'#dcfce7', icon:CheckCircle },
  cancelled:        { label:'Cancelled',        color:'#ef4444', bg:'#fee2e2', icon:XCircle },
}

function timeAgo(ts: number) {
  const d = Date.now() - ts
  if (d < 60000)    return 'just now'
  if (d < 3600000)  return `${Math.floor(d/60000)}m ago`
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`
  return new Date(ts).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [cancelling, setCancelling] = useState<string|null>(null)
  const [cancelModal, setCancelModal] = useState<any>(null)

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    if (CONVEX_URL && user?.email) {
      try {
        // Use email-based query for accurate filtering
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'orders:getOrdersByEmail', args: { email: user.email } }),
        })
        const data = await res.json()
        if (data.value) { setOrders(data.value); setLoading(false); setRefreshing(false); return }
      } catch {}
    }

    setLoading(false); setRefreshing(false)
  }, [user])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vegfru_cart')
      if (saved) {
        const cart = JSON.parse(saved)
        setCartCount(cart.reduce((sum: number, item: any) => sum + item.qty, 0))
      }
    } catch {}
  }, [])

  // Auto-refresh every 20s when there are active orders
  useEffect(() => {
    const hasActive = orders.some(o => !['delivered','cancelled'].includes(o.status))
    if (!hasActive) return
    const t = setInterval(() => fetchOrders(true), 20000)
    return () => clearInterval(t)
  }, [orders, fetchOrders])

  const handleCancel = async (order: any, reason: string) => {
    if (!user?.email) return
    setCancelling(order._id)
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'orders:cancelOrderByCustomer', args: { orderId: order._id, customerEmail: user.email, reason } }),
      })
      setOrders(prev => prev.map(o => o._id === order._id ? {...o, status:'cancelled', cancelReason: reason} : o))
      setCancelModal(null)
    } catch (err: any) { alert(err.message || 'Could not cancel order') }
    setCancelling(null)
  }

  if (authLoading) return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24, paddingTop:120 }}>
        <div style={{ background:'white', borderRadius:20, padding:32, maxWidth:380, textAlign:'center', border:'1px solid #e5e7eb', color:'#6b7280', fontSize:14 }}>
          Loading your orders...
        </div>
      </div>
      <Footer />
    </>
  )

  if (!user) return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24, paddingTop:120 }}>
        <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:400, textAlign:'center', border:'1px solid #e5e7eb' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🔒</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#14532d', marginBottom:8 }}>Sign in to view orders</h2>
          <p style={{ color:'#6b7280', fontSize:14, marginBottom:20 }}>Your order history is tied to your account.</p>
          <Link href="/" style={{ background:'#14532d', color:'#fff', padding:'12px 28px', borderRadius:12, textDecoration:'none', fontSize:14, fontWeight:600 }}>
            Go to Home
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div style={{ minHeight:'100vh', background:'#FEFAE0', paddingTop:96 }}>
        <div style={{ maxWidth:uiTokens.container.account, margin:'0 auto', padding:'32px 20px 64px' }}>

        <button onClick={() => router.push('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, marginBottom:28 }}>
          <ArrowLeft size={16} /> Back to shop
        </button>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:48, height:48, background:'#dcfce7', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShoppingBag size={24} color="#16a34a" />
            </div>
            <div>
              <h1 style={{ ...uiTokens.typography.pageTitle, color:'#14532d', margin:0 }}>My Orders</h1>
              <p style={{ fontSize:13, color:'#6b7280', margin:0 }}>{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <button onClick={() => fetchOrders(true)} disabled={refreshing}
            style={{ display:'flex', alignItems:'center', gap:6, background:'white', border:'1px solid #e5e7eb', borderRadius:uiTokens.radius.control, padding:'10px 16px', fontSize:14, cursor:'pointer', color:'#374151' }}>
            <RefreshCw size={14} style={{ animation:refreshing?'spin 1s linear infinite':'' }} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i => <div key={i} style={{ background:'white', borderRadius:16, height:80, border:'1px solid #f3f4f6', opacity:0.6+i*0.1 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background:'white', borderRadius:uiTokens.radius.panel, padding:56, textAlign:'center', border:'1px solid #e5e7eb' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📦</div>
            <h3 style={{ fontSize:18, fontWeight:600, color:'#14532d', marginBottom:8 }}>No orders yet</h3>
            <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>Start shopping to see your order history here.</p>
            <Link href="/#shop" style={{ background:'#14532d', color:'#fff', padding:'12px 28px', borderRadius:12, textDecoration:'none', fontSize:14, fontWeight:600 }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {orders.map((order: any) => {
              const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending
              const StatusIcon = cfg.icon
              const isExpanded = expanded === order._id
              const canCancel = ['pending','confirmed'].includes(order.status)
              return (
                <div key={order._id} style={{ background:'white', borderRadius:uiTokens.radius.panel, border:'1px solid #e5e7eb', overflow:'hidden', transition:'box-shadow 0.2s' }}>
                  <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : order._id)}>
                    <div style={{ width:44, height:44, borderRadius:12, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <StatusIcon size={20} color={cfg.color} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>
                          #{order._id?.slice(-8).toUpperCase()}
                        </span>
                        <span style={{ background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>
                        {timeAgo(order.createdAt)} · {order.paymentMethod?.toUpperCase()} · {order.subtotal&&order.discount>0?`₹${order.discount} saved`:''}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                      <span style={{ fontSize:16, fontWeight:700, color:'#14532d' }}>₹{order.total}</span>
                      {isExpanded ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop:'1px solid #f3f4f6', padding:'16px 20px' }}>
                      {/* Progress tracker */}
                      <div style={{ display:'flex', alignItems:'center', marginBottom:20, overflow:'hidden' }}>
                        {['pending','confirmed','preparing','out_for_delivery','delivered'].map((s, i, arr) => {
                          const statuses = ['pending','confirmed','preparing','assigned','picked_up','out_for_delivery','delivered']
                          const curIdx = statuses.indexOf(order.status)
                          const stepIdx2 = statuses.indexOf(s)
                          const done = curIdx >= stepIdx2
                          const cur = order.status === s || (s==='out_for_delivery' && ['assigned','picked_up','out_for_delivery'].includes(order.status))
                          return (
                            <div key={s} style={{ display:'flex', alignItems:'center', flex:i<arr.length-1?1:'none' }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                                <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700,
                                  background:done?'#14532d':'#f3f4f6', color:done?'#fff':'#9ca3af',
                                  border:cur?'2px solid #22c55e':'none', outline:cur?'3px solid #dcfce7':'none' }}>
                                  {done?'✓':i+1}
                                </div>
                                <span style={{ fontSize:9, color:done?'#14532d':'#9ca3af', whiteSpace:'nowrap', fontWeight:done?600:400 }}>
                                  {STATUS_CFG[s]?.label || s}
                                </span>
                              </div>
                              {i<arr.length-1 && <div style={{ flex:1, height:2, background:curIdx>stepIdx2?'#14532d':'#e5e7eb', margin:'0 4px', marginBottom:18 }} />}
                            </div>
                          )
                        })}
                      </div>

                      {/* Info grid */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                        {[
                          ['📍 Address', order.deliveryAddress],
                          ['🛵 Delivery', order.assignedDeliveryBoyName||'Not yet assigned'],
                          ['💳 Payment', `${order.paymentMethod?.toUpperCase()} · ${order.paymentStatus}`],
                          ['📅 Placed', new Date(order.createdAt).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})],
                        ].map(([k,v]) => (
                          <div key={k} style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', gridColumn:k==='📍 Address'?'span 2':'span 1' }}>
                            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>{k}</div>
                            <div style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Pricing */}
                      <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                        {[
                          ['Subtotal', `₹${order.subtotal}`],
                          ...(order.discount>0 ? [['Discount saved', `-₹${order.discount}`]] : []),
                          ['Delivery', order.deliveryFee===0?'FREE 🎉':`₹${order.deliveryFee}`],
                        ].map(([k,v]) => (
                          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#6b7280', marginBottom:4 }}>
                            <span>{k}</span><span style={{ color:String(v).includes('-')||String(v).includes('FREE')?'#16a34a':'#374151' }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:700, color:'#111827', borderTop:'1px solid #e5e7eb', paddingTop:8, marginTop:4 }}>
                          <span>Total</span><span style={{ color:'#14532d' }}>₹{order.total}</span>
                        </div>
                      </div>

                      {/* Cancel button */}
                      {canCancel && order.status !== 'cancelled' && (
                        <button onClick={() => setCancelModal(order)}
                          style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:10, padding:'9px 16px', fontSize:13, cursor:'pointer', fontWeight:500, width:'100%' }}>
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>

        {/* Cancel Modal */}
        {cancelModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}
            onClick={() => setCancelModal(null)}>
            <div style={{ background:'white', borderRadius:20, padding:28, maxWidth:400, width:'100%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <span style={{ fontSize:17, fontWeight:700, color:'#111827' }}>Cancel Order?</span>
                <button onClick={() => setCancelModal(null)} style={{ background:'#f3f4f6', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15}/></button>
              </div>
              <p style={{ fontSize:14, color:'#6b7280', marginBottom:16 }}>Order #{cancelModal._id?.slice(-8).toUpperCase()} · ₹{cancelModal.total}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {['Changed my mind','Ordered by mistake','Found better price elsewhere','Delivery time too long'].map(reason => (
                  <button key={reason} onClick={() => handleCancel(cancelModal, reason)} disabled={!!cancelling}
                    style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px', fontSize:13, cursor:'pointer', textAlign:'left', color:'#374151' }}>
                    {reason}
                  </button>
                ))}
              </div>
              <button onClick={() => setCancelModal(null)} style={{ width:'100%', background:'#f3f4f6', border:'none', borderRadius:12, padding:'12px', fontSize:14, cursor:'pointer', color:'#374151' }}>
                Keep Order
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
