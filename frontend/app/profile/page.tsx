'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Mail, MapPin, Save, LogOut, Package, Loader2, CheckCircle, Edit2 } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: 'Faridabad', pincode: '121001' })
  const [orderCount, setOrderCount] = useState<number | null>(null)

  useEffect(() => {
    if (!user) { router.replace('/'); return }
    setForm(f => ({ ...f, name: user.name || '', }))
    // Fetch user order count
    if (CONVEX_URL && user.email) {
      fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'orders:getAllOrders', args: { limit: 200 } }),
      }).then(r => r.json()).then(d => {
        if (d.value) {
          const mine = (d.value as any[]).filter((o: any) => o.customerEmail === user.email)
          setOrderCount(mine.length)
        }
      }).catch(() => {})
    }
  }, [user, router])

  if (!user) return null

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      if (CONVEX_URL && (user as any)._id) {
        await fetch(`${CONVEX_URL}/api/mutation`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'auth:updateUser', args: { id: (user as any)._id, name: form.name, phone: form.phone } }),
        })
      }
      setSaved(true); setEditing(false)
      setTimeout(() => setSaved(false), 2500)
    } catch { setError('Failed to save. Try again.') }
    setSaving(false)
  }

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const Field = ({ icon: Icon, label, value, field, editable = true, readOnly = false }: any) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon size={16} color="#16a34a" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        {editing && editable && !readOnly ? (
          <input value={form[field as keyof typeof form] || value} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fafafa' }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 500, color: readOnly ? '#9ca3af' : '#111827' }}>{value || 'Not set'}</div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0', paddingTop: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, marginBottom: 28 }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Profile Header */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, marginBottom: 16, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #14532d, #166534)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#14532d', margin: 0 }}>{user.name}</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>{user.email}</p>
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
              {user.role?.toUpperCase()}
            </span>
          </div>
          {orderCount !== null && (
            <div style={{ textAlign: 'center', background: '#f0fdf4', borderRadius: 14, padding: '12px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#14532d' }}>{orderCount}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Orders</div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.push('/orders')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, background: '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>My Orders</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Track deliveries</div>
            </div>
          </button>
          <button onClick={() => { logout(); router.push('/') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'white', border: '1px solid #fecaca', borderRadius: 14, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, background: '#fef2f2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={18} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Sign Out</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Log out safely</div>
            </div>
          </button>
        </div>

        {/* Profile Form */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#14532d" /> Personal Information
            </h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <button onClick={() => setEditing(false)} style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#b91c1c' }}>{error}</div>}

          <Field icon={User}  label="Full Name"    value={form.name || user.name} field="name" />
          <Field icon={Mail}  label="Email"        value={user.email} field="email" readOnly />
          <Field icon={Phone} label="Phone"        value={form.phone} field="phone" />
          <Field icon={MapPin} label="Default City" value={form.city} field="city" />

          {editing && (
            <button onClick={handleSave} disabled={saving}
              style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, background: saved ? '#22c55e' : '#14532d', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          )}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </div>
  )
}
