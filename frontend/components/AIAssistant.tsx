'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, ShoppingCart, Leaf, Loader2, Plus, Check, Bot } from 'lucide-react'
import { products, Product } from '@/app/data'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestedProducts?: Product[]
}

interface OrderItem {
  name: string
  qty: number
  unit: string
  price: number
}

interface Props {
  onAddToCart?: (productId: number, qty: number) => void
  cartCount?: number
}

const QUICK_CHIPS = [
  "What's in season? 🌾", "Healthy smoothie combo 🥤", "Best under ₹100?",
  "I want to make a salad 🥗", "Show me superfoods ⚡", "Tell me about mangoes 🥭",
]

function renderMessage(text: string) {
  const clean = text.replace(/\[ORDER_ITEMS:.*?\]/s, '').trim()
  const parts = clean.split(/(\*\*.*?\*\*)/)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

function findProductMatch(name: string): Product | undefined {
  const lower = name.toLowerCase().trim()
  return (
    products.find(p => p.name.toLowerCase() === lower) ||
    products.find(p => p.name.toLowerCase().includes(lower)) ||
    products.find(p => p.keywords.some(k => k.includes(lower)))
  )
}

function extractMentionedProducts(aiText: string): Product[] {
  const mentioned: Product[] = []
  for (const p of products) {
    const firstName = p.name.split(' ')[0].toLowerCase()
    if (aiText.toLowerCase().includes(firstName) && aiText.toLowerCase().includes(p.name.toLowerCase().split(' ').slice(-1)[0])) {
      if (!mentioned.find(m => m.id === p.id)) mentioned.push(p)
    }
  }
  return mentioned.slice(0, 3)
}

export default function AIAssistant({ onAddToCart, cartCount }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "👋 Namaste! I'm **Leafy**, your VegFru AI assistant! I can help you find fresh produce, suggest recipes, check seasonal picks, or take your order by voice or text. What would you like today? 🌿",
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [pendingOrderItems, setPendingOrderItems] = useState<OrderItem[]>([])
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open])

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return
    synthRef.current.cancel()
    const clean = text.replace(/\*\*/g, '').replace(/\[ORDER_ITEMS:.*?\]/s, '').replace(/[🌿🥭🍅🥬🌱🍓🥦🛒🎉⚡🌾👋🥤🥗]/gu, '').slice(0, 220)
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = 'en-IN'; utt.rate = 1.05; utt.pitch = 1.1
    synthRef.current.speak(utt)
  }, [voiceEnabled])

  const startVoice = useCallback(() => {
    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRec) { alert('Voice input needs Chrome or Edge browser.'); return }
    const rec = new SpeechRec()
    rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = false
    rec.onstart = () => setIsListening(true)
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false) }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
  }, [])

  const stopVoice = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false) }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json()
      const aiContent = data.message || "Let me check that for you! 🌿"
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

      const suggestedProducts = extractMentionedProducts(aiContent)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : undefined,
      }])
      speak(aiContent)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '🌿 Had a quick hiccup! Please try again — I\'m ready to help you shop fresh!',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, speak])

  const handleAddOrderItem = (item: OrderItem) => {
    const product = findProductMatch(item.name)
    if (product && onAddToCart) {
      onAddToCart(product.id, item.qty || 1)
      setAddedItems(prev => new Set([...prev, item.name]))
      setTimeout(() => setAddedItems(prev => { const n = new Set(prev); n.delete(item.name); return n }), 2000)
    }
  }

  const handleAddProduct = (product: Product) => {
    onAddToCart?.(product.id, 1)
    setAddedItems(prev => new Set([...prev, product.name]))
    setTimeout(() => setAddedItems(prev => { const n = new Set(prev); n.delete(product.name); return n }), 2000)
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9000,
          width: 62, height: 62, borderRadius: '50%',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(22,101,52,0.45), 0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(22,101,52,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,101,52,0.45)' }}
        title="Talk to Leafy — AI Assistant"
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
        position: 'fixed', bottom: 104, right: 28, zIndex: 9002,
        width: 420, maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 140px)',
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
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'white', fontFamily: '"Playfair Display", serif' }}>
              Leafy — AI Assistant
            </div>
            <div style={{ fontSize: 11, color: '#86efac', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
                display: 'inline-block', animation: 'leafy-pulse 2s ease-in-out infinite',
              }} />
              Powered by Groq · llama3-70b-8192
            </div>
          </div>
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            title={voiceEnabled ? 'Voice responses ON — click to mute' : 'Enable voice responses'}
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
            justifyContent: 'center', color: '#86efac', transition: 'all 0.2s',
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #14532d, #166534)' : 'white',
                  color: msg.role === 'user' ? 'white' : '#111827',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  fontSize: 13.5, lineHeight: 1.65,
                  border: msg.role === 'assistant' ? '1px solid #dcfce7' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 2px 12px rgba(0,0,0,0.06)' : '0 2px 12px rgba(22,101,52,0.15)',
                }}>
                  {renderMessage(msg.content)}
                </div>
                {/* Suggested product chips */}
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
                        {addedItems.has(p.name) ? <Check size={11} color="#22c55e" /> : <Plus size={11} color="#22c55e" />}
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

        {/* Quick chips (show on first open) */}
        {messages.length <= 1 && (
          <div style={{ padding: '4px 14px 10px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 20,
                  background: 'white', border: '1px solid #bbf7d0',
                  fontSize: 12, color: '#14532d', cursor: 'pointer',
                  whiteSpace: 'nowrap', fontFamily: '"DM Sans", sans-serif',
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

        {/* AI Cart (parsed order items) */}
        {pendingOrderItems.length > 0 && (
          <div style={{
            margin: '0 14px 10px',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 16, padding: '10px 12px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#14532d', display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShoppingCart size={13} /> AI Suggested Cart ({pendingOrderItems.length} items)
              </span>
              <button
                onClick={() => setPendingOrderItems([])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}
              >×</button>
            </div>
            {pendingOrderItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: i < pendingOrderItems.length - 1 ? '1px solid #dcfce7' : 'none',
              }}>
                <div style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                  {item.name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>× {item.qty} {item.unit}</span>
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
          padding: '10px 14px 14px',
          borderTop: '1px solid #f0fdf4',
          background: 'white',
          display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
        }}>
          <button
            onClick={isListening ? stopVoice : startVoice}
            title={isListening ? 'Stop listening' : 'Speak your order'}
            style={{
              width: 40, height: 40, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: isListening ? '#fef2f2' : '#f0fdf4',
              color: isListening ? '#ef4444' : '#166534',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
              boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.12)' : 'none',
              animation: isListening ? 'leafy-pulse 1.2s ease-in-out infinite' : 'none',
            }}
          >
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={isListening ? '🎤 Listening…' : 'Ask anything or say "I want…"'}
            style={{
              flex: 1, padding: '10px 14px',
              background: '#f9fafb', border: '1.5px solid #e5e7eb',
              borderRadius: 13, fontSize: 13.5, outline: 'none',
              fontFamily: '"DM Sans", sans-serif', color: '#111827',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#22c55e'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
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
        @keyframes leafy-ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes leafy-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes leafy-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes leafy-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
