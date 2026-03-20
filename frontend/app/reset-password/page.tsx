'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [msg, setMsg] = useState('')

  if (!token || !email) return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24, paddingTop:80 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:400, textAlign:'center', border:'1px solid #e5e7eb' }}>
        <AlertCircle size={40} color="#ef4444" style={{ margin:'0 auto 16px' }} />
        <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', marginBottom:8 }}>Invalid reset link</h2>
        <p style={{ color:'#6b7280', fontSize:14, marginBottom:20 }}>This link is invalid or has expired. Please request a new one.</p>
        <button onClick={() => router.push('/forgot-password')} style={{ background:'#14532d', color:'white', border:'none', borderRadius:12, padding:'11px 24px', fontSize:14, cursor:'pointer', fontWeight:600 }}>
          Request New Link
        </button>
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) { setMsg('Password must be at least 6 characters'); setStatus('error'); return }
    if (form.password !== form.confirm) { setMsg('Passwords do not match'); setStatus('error'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password: form.password }),
      })
      const data = await res.json()
      if (data.success) { setStatus('success') }
      else { setStatus('error'); setMsg(data.error || 'Failed to reset password') }
    } catch {
      setStatus('error'); setMsg('Server error. Please try again.')
    }
  }

  if (status === 'success') return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:24, padding:40, maxWidth:400, textAlign:'center', border:'1px solid #e5e7eb' }}>
        <div style={{ width:64, height:64, background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#14532d', marginBottom:8 }}>Password reset!</h2>
        <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>Your password has been updated. You can now sign in with your new password.</p>
        <button onClick={() => router.push('/')} style={{ background:'#14532d', color:'white', border:'none', borderRadius:12, padding:'12px 28px', fontSize:14, cursor:'pointer', fontWeight:600 }}>
          Sign In
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:24, padding:40, maxWidth:420, width:'100%', border:'1px solid #e5e7eb' }}>
        <button onClick={() => router.push('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, marginBottom:24 }}>
          <ArrowLeft size={16} /> Back to home
        </button>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Lock size={24} color="#16a34a" />
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#14532d', marginBottom:6 }}>Set new password</h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>For account: <strong>{email}</strong></p>
        </div>
        <form onSubmit={handleSubmit}>
          {['New Password', 'Confirm Password'].map((label, i) => (
            <div key={label} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:6 }}>{label}</label>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'}
                  value={i===0 ? form.password : form.confirm}
                  onChange={e => setForm(f => i===0 ? {...f, password:e.target.value} : {...f, confirm:e.target.value})}
                  placeholder={i===0 ? 'Min 6 characters' : 'Repeat password'} required
                  style={{ width:'100%', padding:'12px 44px 12px 14px', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                {i===0 && <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>}
              </div>
            </div>
          ))}
          {status==='error' && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#b91c1c', display:'flex', gap:8, alignItems:'center' }}><AlertCircle size={14}/>{msg}</div>}
          <button type="submit" disabled={status==='loading'}
            style={{ width:'100%', background:'#14532d', color:'white', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {status==='loading' && <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/>}
            {status==='loading' ? 'Resetting...' : 'Set New Password'}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>
}
