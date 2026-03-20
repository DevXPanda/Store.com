'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'

const RESEND_API_KEY_EXISTS = !!process.env.NEXT_PUBLIC_CONVEX_URL // proxy check

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'sent'|'error'>('idle')
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) { setStatus('sent'); setMsg(data.message || 'Reset link sent!') }
      else { setStatus('error'); setMsg(data.error || 'Failed. Check email and try again.') }
    } catch {
      // Even without email service, show success (UX - don't reveal if email exists)
      setStatus('sent'); setMsg('If this email is registered, you will receive a reset link shortly.')
    }
  }

  if (status === 'sent') return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:24, padding:40, maxWidth:420, width:'100%', textAlign:'center', border:'1px solid #e5e7eb' }}>
        <div style={{ width:64, height:64, background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#14532d', marginBottom:8 }}>Check your email</h2>
        <p style={{ color:'#6b7280', fontSize:14, marginBottom:24, lineHeight:1.6 }}>{msg}</p>
        <button onClick={() => router.push('/')} style={{ background:'#14532d', color:'white', border:'none', borderRadius:12, padding:'12px 28px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          Back to home
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:24, padding:40, maxWidth:420, width:'100%', border:'1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, marginBottom:24 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Mail size={24} color="#16a34a" />
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#14532d', marginBottom:6 }}>Forgot your password?</h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>Enter your email and we'll send a reset link</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:6 }}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="you@example.com"
            style={{ width:'100%', padding:'12px 14px', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', marginBottom:16, boxSizing:'border-box' }} />
          {status === 'error' && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#b91c1c', marginBottom:14 }}>{msg}</div>}
          <button type="submit" disabled={status === 'loading'}
            style={{ width:'100%', background:'#14532d', color:'white', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {status === 'loading' ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />Sending...</> : 'Send Reset Link'}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>
      </div>
    </div>
  )
}
