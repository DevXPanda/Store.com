'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Mail, MapPin, Save, LogOut, Package, Loader2, CheckCircle, Edit2, LucideIcon } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
interface CartItem { id: number; qty: number }

interface ProfileFieldProps {
  icon: LucideIcon
  label: string
  value: string
  field: keyof FormState
  editing: boolean
  editable?: boolean
  readOnly?: boolean
  onChange: (field: keyof FormState, value: string) => void
}

interface FormState {
  name: string
  phone: string
  address: string
  city: string
  pincode: string
}

function ProfileField({
  icon: Icon,
  label,
  value,
  field,
  editing,
  editable = true,
  readOnly = false,
  onChange,
}: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 py-4">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-green-50">
        <Icon size={16} color="#16a34a" />
      </div>
      <div className="flex-1">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
        {editing && editable && !readOnly ? (
          <input
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-green-700"
          />
        ) : (
          <div className={`text-sm font-medium ${readOnly ? 'text-gray-400' : 'text-gray-900'}`}>
            {value || 'Not set'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', phone: '', address: '', city: 'Faridabad', pincode: '121001' })
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

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('vegfru_cart')
      if (savedCart) setCartItems(JSON.parse(savedCart))
    } catch {}
  }, [])

  if (!user) return null

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

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

  const onFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => router.push('/')} />
      <div className="min-h-screen bg-[#FEFAE0] pt-24">
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-8">
          <button
            onClick={() => router.back()}
            className="mb-7 flex items-center gap-2 text-sm text-gray-500 transition hover:text-forest-700"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="mb-4 flex items-center gap-4 rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-800 to-green-700 text-2xl font-bold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="m-0 text-2xl font-bold text-forest-800">{user.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                {user.role?.toUpperCase()}
              </span>
            </div>
            {orderCount !== null && (
              <div className="rounded-2xl bg-green-50 px-5 py-3 text-center">
                <div className="text-2xl font-bold text-forest-800">{orderCount}</div>
                <div className="text-xs text-gray-500">Orders</div>
              </div>
            )}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-green-200 hover:bg-green-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <Package size={18} color="#16a34a" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">My Orders</div>
                <div className="text-xs text-gray-500">Track deliveries</div>
              </div>
            </button>
            <button
              onClick={() => { logout(); router.push('/') }}
              className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white p-4 text-left transition hover:bg-red-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <LogOut size={18} color="#dc2626" />
              </div>
              <div>
                <div className="text-sm font-semibold text-red-600">Sign Out</div>
                <div className="text-xs text-gray-500">Log out safely</div>
              </div>
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="m-0 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User size={18} color="#14532d" /> Personal Information
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 transition hover:bg-green-100"
                >
                  <Edit2 size={13} /> Edit
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
              )}
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <ProfileField
              icon={User}
              label="Full Name"
              value={form.name || user.name}
              field="name"
              editing={editing}
              onChange={onFieldChange}
            />
            <ProfileField
              icon={Mail}
              label="Email"
              value={user.email}
              field="name"
              editing={editing}
              readOnly
              onChange={onFieldChange}
            />
            <ProfileField
              icon={Phone}
              label="Phone"
              value={form.phone}
              field="phone"
              editing={editing}
              onChange={onFieldChange}
            />
            <ProfileField
              icon={MapPin}
              label="Default City"
              value={form.city}
              field="city"
              editing={editing}
              onChange={onFieldChange}
            />

            {editing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`mt-5 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                  saved ? 'bg-green-500' : 'bg-forest-800 hover:bg-green-800'
                }`}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                  <CheckCircle size={16} />
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
