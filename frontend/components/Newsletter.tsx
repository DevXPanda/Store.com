'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg('Please enter a valid email address'); setStatus('error'); return
    }
    if (!CONVEX_URL) {
      setMsg('Subscription service is unavailable right now. Please try again.')
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'orders:subscribeNewsletter', args: { email: cleanEmail } }),
      })
      const data = await res.json()
      if (!res.ok || data?.status === 'error') {
        throw new Error(data?.errorMessage || 'Subscription failed')
      }
      if (data.value?.alreadySubscribed) {
        setMsg("You're already subscribed! 🌿")
        setStatus('success')
        return
      }

      // Send welcome/subscription confirmation email (non-blocking to DB success).
      try {
        const mailRes = await fetch('/api/email/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: cleanEmail }),
        })
        const mailData = await mailRes.json()
        if (!mailRes.ok || mailData?.error) throw new Error(mailData?.error || 'Email send failed')
        setMsg('Subscribed! Confirmation email sent 🌿')
      } catch {
        setMsg('Subscribed in database, but confirmation email could not be sent right now.')
      }
      setStatus('success')
      setEmail('')
    } catch {
      setMsg('Could not subscribe right now. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section style={{ padding: '80px 0', background: '#14532d' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
          <Mail size={14} color="#86efac" />
          <span style={{ fontSize: 12, color: '#86efac', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Newsletter</span>
        </div>
        <h2 style={{ fontFamily: 'serif', fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>
          Stay <em style={{ fontStyle: 'italic', color: '#86efac' }}>fresh</em>
        </h2>
        <p style={{ color: '#bbf7d0', fontSize: 16, margin: '0 0 32px', lineHeight: 1.6 }}>
          Get weekly updates on new arrivals, seasonal specials, exclusive deals, and farm stories.
        </p>
        {status === 'success' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 24px', color: '#86efac' }}>
            <CheckCircle size={20} /> <span style={{ fontSize: 15, fontWeight: 500 }}>{msg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setStatus('idle'); setMsg('') }}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '13px 14px 13px 38px', borderRadius: 14, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white' }} />
              </div>
              <button type="submit" disabled={status === 'loading'}
                style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: 14, padding: '13px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                {status === 'loading' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                Subscribe
              </button>
            </div>
            {status === 'error' && <p style={{ color: '#fca5a5', fontSize: 13, marginTop: 8 }}>{msg}</p>}
            <p style={{ color: '#86efac', fontSize: 12, marginTop: 12 }}>No spam. Unsubscribe anytime.</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </form>
        )}
      </div>
    </section>
  )
}
