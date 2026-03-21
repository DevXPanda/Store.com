'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, ShoppingCart, Leaf, Loader2, Plus, Check } from 'lucide-react'
import { mapConvexProduct, type CatalogProduct } from '@/lib/catalog'
import { useConvexQuery } from '@/lib/convexFetch'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestedProducts?: CatalogProduct[]
}

interface OrderItem {
  name: string
  qty: number
  unit: string
  price: number
}

interface Props {
  onAddToCart?: (productId: string, qty: number) => void
  cartCount?: number
}

const QUICK_CHIPS = [
  "Konsa fruit seasonal hai? 🌾",
  "Healthy smoothie combo 🥤",
  "₹200 mein kya milega?",
  "Salad ke liye kya chahiye 🥗",
  "Superfoods dikhao ⚡",
  "Mango ke baare mein batao 🥭",
]

function renderMessage(text: string) {
  const clean = text.replace(/\[ORDER_ITEMS:[\s\S]*?\]/, '').trim()
  const parts = clean.split(/(\*\*.*?\*\*)/)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

function findProductMatch(catalog: CatalogProduct[], name: string): CatalogProduct | undefined {
  const lower = name.toLowerCase().trim()
  return (
    catalog.find(p => p.name.toLowerCase() === lower) ||
    catalog.find(p => p.name.toLowerCase().includes(lower)) ||
    catalog.find(p => lower.includes(p.name.toLowerCase().split(' ')[0])) ||
    catalog.find(p => p.keywords?.some((k: string) => k.includes(lower)))
  )
}

function extractMentionedProducts(catalog: CatalogProduct[], aiText: string): CatalogProduct[] {
  const mentioned: CatalogProduct[] = []
  const lower = aiText.toLowerCase()
  for (const p of catalog) {
    const words = p.name.toLowerCase().split(' ')
    // Match if at least 2 words of product name appear in text
    const matchCount = words.filter(w => w.length > 3 && lower.includes(w)).length
    if (matchCount >= Math.min(2, words.length) && !mentioned.find(m => m.id === p.id)) {
      mentioned.push(p)
    }
  }
  return mentioned.slice(0, 3)
}

export default function AIAssistant({ onAddToCart, cartCount }: Props) {
  const { data: rawProducts } = useConvexQuery<Record<string, unknown>[]>('products:getAllProducts', { includeInactive: false })
  const products = useMemo(() => (rawProducts ?? []).map(mapConvexProduct), [rawProducts])
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "👋 Namaste! Main **Leafy** hun — VegFru ka AI assistant! Fresh produce dhundhna ho, recipe chahiye ho, ya order karna ho — sab mein help karunga. Hindi ya English dono mein baat kar sakte ho! 🌿",
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [pendingOrderItems, setPendingOrderItems] = useState<OrderItem[]>([])
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [modelName, setModelName] = useState('llama-3.3-70b-versatile')

  // Use ref for messages to fix stale closure bug
  const messagesRef = useRef<Message[]>(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingTimeoutRef = useRef<number | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    setVoiceSupported(Boolean(SpeechRec))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.()
      if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current)
      mediaRecorderRef.current?.stop?.()
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const clean = text
      .replace(/\*\*/g, '')
      .replace(/\[ORDER_ITEMS:[\s\S]*?\]/, '')
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
      .slice(0, 220)
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = 'en-IN'; utt.rate = 1.05; utt.pitch = 1.1
    synthRef.current.speak(utt)
  }, [voiceEnabled])

  const transcribeAudio = useCallback(async (blob: Blob) => {
    try {
      const form = new FormData()
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
      form.append('file', new File([blob], `voice.${ext}`, { type: blob.type || 'audio/webm' }))

      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`)

      const text = String(data?.text || '').trim()
      if (!text) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🎤 Voice suna, but text detect nahi hua. Ek baar aur clear bolke try karo.',
          timestamp: new Date(),
        }])
        return
      }
      setInput(text)
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎤 Voice transcription failed: ${String(err?.message || 'unknown error')}`,
        timestamp: new Date(),
      }])
    }
  }, [])

  const startRecorderFallback = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Recorder not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType =
        (MediaRecorder as any).isTypeSupported?.('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
          : (MediaRecorder as any).isTypeSupported?.('audio/webm') ? 'audio/webm'
            : (MediaRecorder as any).isTypeSupported?.('audio/mp4') ? 'audio/mp4'
              : ''

      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = rec
      const chunks: Blob[] = []

      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }
      rec.onstart = () => setIsListening(true)
      rec.onstop = async () => {
        setIsListening(false)
        if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current)
        recordingTimeoutRef.current = null
        mediaStreamRef.current?.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null

        if (chunks.length === 0) return
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
        await transcribeAudio(blob)
      }
      rec.onerror = () => {
        setIsListening(false)
        mediaStreamRef.current?.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🎤 Recorder error hua. Please mic access check karke dubara try karo.',
          timestamp: new Date(),
        }])
      }

      rec.start()
      // Auto-stop after 6s so user can single-tap mic and speak.
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      }, 6000)
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎤 Recorder start failed: ${String(err?.message || 'unknown')}`,
        timestamp: new Date(),
      }])
    }
  }, [transcribeAudio])

  const startVoice = useCallback(() => {
    if (isListening) return
    if (!voiceSupported) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '🎤 Voice input is not supported in this browser. Please use Chrome or Edge.',
        timestamp: new Date(),
      }])
      return
    }

    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRec) return

    // Speech recognition generally needs secure context (HTTPS) except localhost.
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '🎤 Voice input ke liye HTTPS required hai. Please secure URL par app open karo.',
        timestamp: new Date(),
      }])
      return
    }

    const languageFallbacks = ['hi-IN', 'en-IN', 'en-US']

    const tryStart = (langIdx: number) => {
      const rec = new SpeechRec()
      rec.lang = languageFallbacks[langIdx]
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 1

      rec.onstart = () => setIsListening(true)
      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || ''
        if (transcript) setInput(transcript)
        setIsListening(false)
      }
      rec.onend = () => setIsListening(false)
      rec.onerror = (e: any) => {
        const code = String(e?.error || '')

        // Some browsers fail with `network` for one locale but work for another.
        if ((code === 'network' || code === 'language-not-supported') && langIdx < languageFallbacks.length - 1) {
          tryStart(langIdx + 1)
          return
        }

        // If browser speech service is blocked, fallback to direct audio recording + server transcription.
        if (code === 'network') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '🎤 Browser voice service blocked. Recorder mode pe switch kar raha hun — ab bolo.',
            timestamp: new Date(),
          }])
          void startRecorderFallback()
          return
        }

        setIsListening(false)
        const message =
          code === 'not-allowed' || code === 'service-not-allowed'
            ? '🎤 Microphone permission denied. Mic access allow karo aur phir try karo.'
            : code === 'audio-capture'
              ? '🎤 Mic device detect nahi ho raha. Check karo mic connected/allowed hai.'
              : code === 'network'
                ? '🎤 Voice service blocked lag raha hai (browser side). Chrome/Edge me mic permission + site settings allow karke try karo.'
                : code === 'aborted'
                  ? '🎤 Voice capture ruk gaya. Mic button ek baar fir press karke normal pace me bolo.'
                : code === 'no-speech'
                  ? '🎤 Awaaz detect nahi hui. Thoda clear bolke dubara try karo.'
                  : '🎤 Voice input start nahi ho paaya. Please once more try karo.'
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        }])
      }

      recognitionRef.current?.stop?.()
      recognitionRef.current = rec
      try {
        rec.start()
      } catch (err: any) {
        if (langIdx < languageFallbacks.length - 1) {
          tryStart(langIdx + 1)
          return
        }
        setIsListening(false)
        const raw = String(err?.message || err?.name || 'unknown')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎤 Voice input start nahi ho paaya (${raw}). Mic permission aur browser voice settings check karo.`,
          timestamp: new Date(),
        }])
      }
    }

    tryStart(0)
  }, [isListening, startRecorderFallback, voiceSupported])

  const stopVoice = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      return
    }
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // ── FIXED sendMessage — uses ref to avoid stale closure ──────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loadingRef.current) return

    loadingRef.current = true
    setLoading(true)

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() }

    // Use functional update + ref to always get latest messages
    setMessages(prev => [...prev, userMsg])
    setInput('')

    try {
      // Build history from ref (always fresh, no stale closure)
      const currentMessages = messagesRef.current
      const history = [...currentMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const aiContent: string = data.message || "🌿 Kuch issue hua — dobara try karo!"

      // Update model name shown in header
      if (data.model && data.model !== 'demo' && data.model !== 'demo-fallback') {
        setModelName(data.model)
      }

      // Parse order items from response
      const aiOrderItems: OrderItem[] = data.orderItems || []
      if (aiOrderItems.length > 0) {
        setPendingOrderItems(prev => {
          const merged = [...prev]
          aiOrderItems.forEach((item: OrderItem) => {
            const idx = merged.findIndex(e => e.name.toLowerCase() === item.name.toLowerCase())
            if (idx >= 0) merged[idx].qty += item.qty
            else merged.push(item)
          })
          return merged
        })
      }

      // Find products mentioned in response for quick-add chips
      const suggestedProducts = extractMentionedProducts(products, aiContent)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : undefined,
      }])

      speak(aiContent)

    } catch (err) {
      console.error('AI chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '🌿 Ek second — network issue hua! Dobara try karo, main yahaan hun! 🥕',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [speak]) // ← No 'messages' dependency — fixes stale closure!

  const handleAddOrderItem = (item: OrderItem) => {
    const product = findProductMatch(products, item.name)
    if (product && onAddToCart) {
      onAddToCart(product.id, item.qty || 1)
      setAddedItems(prev => new Set([...prev, item.name]))
      setTimeout(() => setAddedItems(prev => { const n = new Set(prev); n.delete(item.name); return n }), 2500)
    }
  }

  const handleAddProduct = (product: CatalogProduct) => {
    onAddToCart?.(product.id, 1)
    setAddedItems(prev => new Set([...prev, product.name]))
    setTimeout(() => setAddedItems(prev => { const n = new Set(prev); n.delete(product.name); return n }), 2500)
  }

  const displayModel = modelName === 'demo' || modelName === 'demo-fallback'
    ? 'Demo Mode'
    : modelName.includes('3.3') ? 'llama-3.3-70b' : modelName.split('-').slice(0, 3).join('-')

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9000,
          width: 62, height: 62, borderRadius: '50%',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          color: 'white', border: 'none', cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(22,101,52,0.45), 0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        title="Leafy AI Assistant se baat karo"
      >
        <Sparkles size={24} />
        <span style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: '2px solid rgba(74,222,128,0.4)',
          animation: 'leafy-ping 2.5s ease-in-out infinite',
        }} />
        {cartCount && cartCount > 0 ? (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#f43f5e', color: 'white', borderRadius: '50%',
            width: 20, height: 20, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{cartCount > 9 ? '9+' : cartCount}</span>
        ) : null}
      </button>

      {/* Backdrop */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9001,
          background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)',
        }} />
      )}

      {/* Chat window */}
      <div style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9002,
        width: 420, maxWidth: 'calc(100vw - 40px)',
        height: 600, maxHeight: 'calc(100vh - 56px)',
        background: '#FFFDF5',
        borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(22,101,52,0.08)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'all 0.32s cubic-bezier(0.34,1.4,0.64,1)',
        fontFamily: '"DM Sans", -apple-system, sans-serif',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>🌿</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'white', fontFamily: '"Playfair Display", serif' }}>
              Leafy — AI Assistant
            </div>
            <div style={{ fontSize: 11, color: '#86efac', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
                display: 'inline-block', animation: 'leafy-pulse 2s ease-in-out infinite', flexShrink: 0,
              }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Powered by Groq · {displayModel}
              </span>
            </div>
          </div>

          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            title={voiceEnabled ? 'Voice ON — mute karo' : 'Voice enable karo'}
            style={{
              width: 34, height: 34, borderRadius: 12,
              background: voiceEnabled ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${voiceEnabled ? '#4ade80' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: voiceEnabled ? '#4ade80' : '#86efac', transition: 'all 0.2s',
            }}
          >
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button onClick={() => setOpen(false)} style={{
            width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#86efac',
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #14532d, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0, boxShadow: '0 2px 8px rgba(22,101,52,0.3)',
                }}>🌿</div>
              )}
              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #14532d, #166534)'
                    : 'white',
                  color: msg.role === 'user' ? 'white' : '#111827',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  fontSize: 13.5, lineHeight: 1.65,
                  border: msg.role === 'assistant' ? '1px solid #dcfce7' : 'none',
                  boxShadow: msg.role === 'assistant'
                    ? '0 2px 12px rgba(0,0,0,0.06)'
                    : '0 2px 12px rgba(22,101,52,0.15)',
                  wordBreak: 'break-word',
                }}>
                  {renderMessage(msg.content)}
                </div>

                {/* Quick-add product chips */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {msg.suggestedProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: addedItems.has(p.name) ? '#f0fdf4' : 'white',
                          border: `1px solid ${addedItems.has(p.name) ? '#22c55e' : '#bbf7d0'}`,
                          borderRadius: 20, padding: '5px 11px', fontSize: 12,
                          cursor: 'pointer', color: '#14532d', fontWeight: 500,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{p.emoji}</span>
                        <span>{p.name}</span>
                        <span style={{ color: '#15803d', fontWeight: 700 }}>₹{p.price}</span>
                        {addedItems.has(p.name)
                          ? <Check size={11} color="#22c55e" />
                          : <Plus size={11} color="#22c55e" />}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 10, color: '#9ca3af', paddingLeft: msg.role === 'user' ? 0 : 4 }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #14532d, #15803d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}>🌿</div>
              <div style={{
                background: 'white', border: '1px solid #dcfce7',
                borderRadius: '4px 18px 18px 18px', padding: '12px 16px',
                display: 'flex', gap: 5, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                    animation: `leafy-bounce 1.2s ease-in-out ${delay}s infinite`,
                    display: 'inline-block',
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips — show only on first message */}
        {messages.length <= 1 && !loading && (
          <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                  background: 'white', border: '1px solid #bbf7d0',
                  fontSize: 12, color: '#14532d', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#22c55e' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#bbf7d0' }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* AI Suggested Cart */}
        {pendingOrderItems.length > 0 && (
          <div style={{
            margin: '0 14px 10px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 16, padding: '10px 12px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#14532d', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShoppingCart size={13} /> AI Cart ({pendingOrderItems.length} items)
              </span>
              <button
                onClick={() => setPendingOrderItems([])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1 }}
              >×</button>
            </div>
            {pendingOrderItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: i < pendingOrderItems.length - 1 ? '1px solid #dcfce7' : 'none',
              }}>
                <div style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                  {item.name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>× {item.qty}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>₹{item.price * item.qty}</span>
                  <button
                    onClick={() => handleAddOrderItem(item)}
                    style={{
                      background: addedItems.has(item.name) ? '#22c55e' : '#166534',
                      color: 'white', border: 'none', borderRadius: 8,
                      padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                      fontWeight: 600, transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {addedItems.has(item.name) ? <><Check size={10} /> Added</> : '+ Add'}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #dcfce7', textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                Total: ₹{pendingOrderItems.reduce((s, i) => s + i.price * i.qty, 0)}
              </span>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: '10px 14px 14px', borderTop: '1px solid #f0fdf4',
          background: 'white', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
        }}>
          <button
            onClick={isListening ? stopVoice : startVoice}
            title={!voiceSupported ? 'Voice not supported in this browser' : (isListening ? 'Sunna band karo' : 'Bol ke order karo')}
            disabled={!voiceSupported}
            style={{
              width: 40, height: 40, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: !voiceSupported ? '#f3f4f6' : (isListening ? '#fef2f2' : '#f0fdf4'),
              color: !voiceSupported ? '#9ca3af' : (isListening ? '#ef4444' : '#166534'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
              boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.12)' : 'none',
              animation: isListening ? 'leafy-pulse 1.2s ease-in-out infinite' : 'none',
              opacity: voiceSupported ? 1 : 0.75,
            }}
          >
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !loading) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder={isListening ? '🎤 Sun raha hun…' : 'Kuch bhi pucho ya "mujhe chahiye…" bolo'}
            style={{
              flex: 1, padding: '10px 14px',
              background: '#f9fafb', border: '1.5px solid #e5e7eb',
              borderRadius: 13, fontSize: 13.5, outline: 'none',
              fontFamily: '"DM Sans", sans-serif', color: '#111827',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#22c55e'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            disabled={loading}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 40, height: 40, borderRadius: 13, border: 'none',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #14532d, #166534)'
                : '#e5e7eb',
              color: input.trim() && !loading ? 'white' : '#9ca3af',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
              boxShadow: input.trim() && !loading ? '0 4px 16px rgba(22,101,52,0.25)' : 'none',
            }}
          >
            {loading
              ? <Loader2 size={17} style={{ animation: 'leafy-spin 1s linear infinite' }} />
              : <Send size={17} />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes leafy-ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes leafy-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes leafy-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes leafy-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
