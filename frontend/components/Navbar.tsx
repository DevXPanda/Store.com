'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, Menu, X, Leaf, MapPin, Bell, User, LogOut, ChevronDown, Eye, EyeOff, Loader2, Package } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { mapConvexProduct, type CatalogProduct } from '@/lib/catalog'
import { useConvexQuery } from '@/lib/convexFetch'

export default function Navbar({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
  const { user, login, setSession, logout, loading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: rawProducts } = useConvexQuery<Record<string, unknown>[]>('products:getAllProducts', { includeInactive: false })
  const products = (rawProducts ?? []).map(mapConvexProduct)
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [registerStep, setRegisterStep] = useState<'details' | 'otp'>('details')
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email')
  const [phoneLoginStep, setPhoneLoginStep] = useState<'input' | 'otp'>('input')
  const [otpCode, setOtpCode] = useState('')
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    const results = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.keywords?.some(k => k.includes(q)) ||
      p.description.toLowerCase().includes(q)
    ).slice(0, 6)
    setSearchResults(results)
  }, [searchQuery, products])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false); setSearchQuery(''); setSearchResults([])
  }

  const handleSearchSelect = (productId: string) => {
    router.push(`/product/${encodeURIComponent(productId)}`)
    setSearchOpen(false); setSearchQuery(''); setSearchResults([])
  }

  const openModal = (register = false) => {
    setIsRegister(register); setError(''); setSuccess('')
    setForm({ name: '', email: '', password: '', phone: '' })
    setRegisterStep('details')
    setLoginMode('email')
    setPhoneLoginStep('input')
    setOtpCode('')
    setDevOtpHint(null)
    setModalOpen(true); setMobileOpen(false)
  }
  const closeModal = () => {
    setModalOpen(false); setError(''); setSuccess('')
    setRegisterStep('details')
    setPhoneLoginStep('input')
    setOtpCode('')
    setDevOtpHint(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      if (isRegister && registerStep === 'otp') {
        const res = await fetch('/api/auth/otp/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, otp: otpCode }),
        })
        const data = await res.json()
        if (!data.success || !data.token || !data.user) {
          setError(data.error || 'Invalid code')
          return
        }
        setSession(data.token, data.user)
        setSuccess('Welcome to VegFru!')
        setTimeout(closeModal, 600)
        return
      }
      if (isRegister) {
        const res = await fetch('/api/auth/otp/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone || undefined,
          }),
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Could not send code')
          return
        }
        if (data.devOtp) setDevOtpHint(String(data.devOtp))
        setRegisterStep('otp')
        setSuccess('Check your email for a verification code.')
        return
      }
      if (loginMode === 'phone' && phoneLoginStep === 'otp') {
        const res = await fetch('/api/auth/phone/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone, otp: otpCode }),
        })
        const data = await res.json()
        if (!data.success || !data.token || !data.user) {
          setError(data.error || 'Invalid code')
          return
        }
        setSession(data.token, data.user)
        setSuccess('Welcome back!')
        setTimeout(closeModal, 600)
        return
      }
      if (loginMode === 'phone') {
        const res = await fetch('/api/auth/phone/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone }),
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Could not send SMS')
          return
        }
        setPhoneLoginStep('otp')
        setSuccess('Enter the code sent to your phone.')
        return
      }
      const result = await login(form.email, form.password)
      if (result.success) { setSuccess('Welcome back!'); setTimeout(closeModal, 600) }
      else setError(result.error || 'Invalid email or password.')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FEFAE0]/95 backdrop-blur-md shadow-sm border-b border-green-100' : 'bg-transparent'}`}>
        <div className="bg-forest-800 text-green-100 text-xs py-1.5 text-center font-body tracking-wide">
          <span className="flex items-center justify-center gap-2">
            <MapPin className="w-3 h-3" />
            Free delivery above ₹299 · 4–6 hour delivery · Serving Delhi NCR
            <Bell className="w-3 h-3 ml-2" />
          </span>
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
                <Leaf className="w-5 h-5 text-green-200" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-forest-800 tracking-tight">Veg<span className="text-green-600">Fru</span></span>
                <span className="block text-[9px] font-mono text-green-600 tracking-widest uppercase -mt-0.5">Farm Fresh</span>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {[['Shop', '/#shop'], ['Seasonal', '/#seasonal'], ['Bundles', '/#bundles'], ['Farms', '/#farms'], ['About', '/#about']].map(([label, href]) => (
                <a key={label} href={href} className="link-underline font-body text-sm font-medium text-gray-700 hover:text-forest-700 transition-colors">{label}</a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-xl hover:bg-green-100 transition-colors text-gray-600 hover:text-forest-700">
                  <Search className="w-5 h-5" />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden z-50">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 px-4 py-3 border-b border-green-50">
                      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search vegetables, fruits, herbs..."
                        className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400" />
                      {searchQuery && <button type="button" onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-gray-400" /></button>}
                    </form>
                    {searchResults.length > 0 ? (
                      <div className="py-2 max-h-64 overflow-y-auto">
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => handleSearchSelect(p.id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left">
                            <span className="text-2xl">{p.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                              <div className="text-xs text-gray-500">{p.category} · ₹{p.price}/{p.unit}</div>
                            </div>
                            <span className="text-xs font-bold text-forest-700">₹{p.price}</span>
                          </button>
                        ))}
                        <button onClick={handleSearchSubmit as any} className="w-full text-center py-2 text-xs text-green-600 hover:bg-green-50 border-t border-green-50">
                          See all results for "{searchQuery}" →
                        </button>
                      </div>
                    ) : searchQuery ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">No results for "{searchQuery}"</div>
                    ) : (
                      <div className="px-4 py-3">
                        <div className="text-xs text-gray-400 mb-2 font-medium">Popular searches</div>
                        <div className="flex flex-wrap gap-2">
                          {['Tomato', 'Spinach', 'Apple', 'Banana', 'Onion'].map(s => (
                            <button key={s} onClick={() => setSearchQuery(s)} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100">{s}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <button onClick={onCartClick} className="relative p-2 rounded-xl hover:bg-green-100 transition-colors text-gray-600 hover:text-forest-700">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">{cartCount}</span>
                )}
              </button>

              {/* Auth */}
              {loading ? (
                <div className="w-9 h-9 rounded-xl bg-green-100 animate-pulse" />
              ) : user ? (
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-forest-800 text-sm font-medium px-3 py-2 rounded-xl transition-all">
                    <div className="w-6 h-6 rounded-lg bg-forest-700 text-white text-[10px] font-bold flex items-center justify-center">{initials}</div>
                    <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                        <p className="text-sm font-medium text-forest-800">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                      </div>
                      <div className="p-2">
                        <button onClick={() => { router.push('/orders'); setDropdownOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-xl transition-colors">
                          <Package className="w-4 h-4" /> My Orders
                        </button>
                        <button onClick={() => { router.push('/profile'); setDropdownOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-xl transition-colors">
                          <User className="w-4 h-4" /> My Profile
                        </button>
                        <hr className="my-1 border-green-100" />
                        <button onClick={() => { logout(); setDropdownOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => openModal(false)} className="hidden sm:flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:shadow-lg active:scale-95">
                  Sign in
                </button>
              )}

              <button className="md:hidden p-2 rounded-xl hover:bg-green-100 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 border-t border-green-100 pt-4 animate-slide-up">
              <div className="flex flex-col gap-3">
                {[['Shop', '/#shop'], ['Seasonal', '/#seasonal'], ['Bundles', '/#bundles']].map(([label, href]) => (
                  <a key={label} href={href} className="font-body text-sm font-medium text-gray-700 hover:text-forest-700 py-1">{label}</a>
                ))}
                {user ? (
                  <div className="mt-2 p-3 bg-green-50 rounded-xl">
                    <p className="text-sm font-medium text-forest-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { router.push('/orders'); setMobileOpen(false) }} className="flex-1 text-sm text-forest-700 py-1.5 border border-green-200 rounded-lg">Orders</button>
                      <button onClick={() => { logout(); setMobileOpen(false) }} className="flex-1 text-sm text-red-600 py-1.5 border border-red-200 rounded-lg">Sign out</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openModal(false)} className="flex-1 bg-forest-700 text-white text-sm font-medium py-2.5 rounded-xl">Sign in</button>
                    <button onClick={() => openModal(true)} className="flex-1 border border-forest-700 text-forest-700 text-sm font-medium py-2.5 rounded-xl">Register</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Sign In / Register Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 pb-8 relative" style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>
              <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-white text-xl font-bold">{isRegister ? 'Create account' : 'Welcome back'}</h2>
              <p className="text-green-200 text-sm mt-1">{isRegister ? 'Create an account to track orders and save your details' : 'Sign in to track orders & get exclusive deals'}</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-4">
              {!isRegister && (
                <div className="flex rounded-xl border border-gray-200 p-0.5 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => { setLoginMode('email'); setPhoneLoginStep('input'); setOtpCode(''); setError('') }}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${loginMode === 'email' ? 'bg-white shadow text-forest-800' : 'text-gray-500'}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMode('phone'); setPhoneLoginStep('input'); setOtpCode(''); setError('') }}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${loginMode === 'phone' ? 'bg-white shadow text-forest-800' : 'text-gray-500'}`}
                  >
                    Phone OTP
                  </button>
                </div>
              )}

              {isRegister && registerStep === 'details' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                    <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Priya Sharma"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters"
                        className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="tel" inputMode="numeric" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile for SMS updates"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <p className="text-xs text-gray-500">We&apos;ll email a verification code to your address. Add SMS-capable Twilio Verify to also sign in with phone.</p>
                </>
              )}

              {isRegister && registerStep === 'otp' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input type="email" readOnly value={form.email} className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Verification code</label>
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="6-digit code"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all tracking-widest font-mono text-center text-lg" />
                  </div>
                  {devOtpHint && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-mono">Dev only: {devOtpHint}</p>
                  )}
                  <button type="button" onClick={() => { setRegisterStep('details'); setOtpCode(''); setError('') }} className="text-sm text-green-700 hover:underline text-left">
                    ← Edit details
                  </button>
                </>
              )}

              {!isRegister && loginMode === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••"
                        className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right -mt-2">
                    <a href="/forgot-password" className="text-xs text-green-600 hover:text-green-700">Forgot password?</a>
                  </div>
                </>
              )}

              {!isRegister && loginMode === 'phone' && phoneLoginStep === 'input' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mobile number</label>
                  <input type="tel" inputMode="numeric" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit number on your account"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all" />
                  <p className="text-xs text-gray-500 mt-1.5">Uses Twilio Verify (same as admin SMS). Configure env on the server.</p>
                </div>
              )}

              {!isRegister && loginMode === 'phone' && phoneLoginStep === 'otp' && (
                <>
                  <p className="text-sm text-gray-600">Code sent to <span className="font-mono font-semibold">+91 {form.phone.replace(/\D/g, '').slice(-10)}</span></p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">SMS code</label>
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter code"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 font-mono tracking-widest text-center text-lg" />
                  </div>
                  <button type="button" onClick={() => { setPhoneLoginStep('input'); setOtpCode(''); setError('') }} className="text-sm text-green-700 hover:underline text-left">
                    ← Change number
                  </button>
                </>
              )}

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl">{success}</div>}
              <button type="submit" disabled={submitting}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Please wait…' : (
                  isRegister
                    ? (registerStep === 'otp' ? 'Verify & continue' : 'Send verification email')
                    : loginMode === 'phone'
                      ? (phoneLoginStep === 'otp' ? 'Verify & sign in' : 'Send SMS code')
                      : 'Sign in'
                )}
              </button>
              <p className="text-center text-sm text-gray-500">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); setRegisterStep('details'); setPhoneLoginStep('input'); setOtpCode('') }} className="text-green-600 hover:text-green-700 font-medium">
                  {isRegister ? 'Sign in' : 'Register free'}
                </button>
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
