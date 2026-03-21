import { NextRequest, NextResponse } from 'next/server'
import { getProductCatalogForAI, mapConvexProduct } from '@/lib/catalog'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function fetchCatalogForPrompt(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return '(Add NEXT_PUBLIC_CONVEX_URL to load live catalog.)'
  try {
    const r = await fetch(`${url}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'products:getAllProducts', args: { includeInactive: false } }),
    })
    const j = await r.json()
    const list = (j.value || []).map(mapConvexProduct)
    return getProductCatalogForAI(list)
  } catch {
    return '(Catalog temporarily unavailable.)'
  }
}

const buildSystemPrompt = async () => {
  const catalogBlock = await fetchCatalogForPrompt()
  return `You are "Leafy" — VegFru ka friendly AI shopping assistant. VegFru ek premium farm-fresh vegetables aur fruits delivery platform hai — Faridabad, India mein based, Delhi NCR mein deliver karta hai.

🌿 TUMHARI PERSONALITY:
- Warm, helpful, conversational — bilkul ek knowledgeable dost ki tarah jo farmer's market pe mile
- Tum Hindi, Hinglish (Hindi+English mix), aur English TEENO samajhte ho aur respond karte ho
- Agar user Hindi ya Hinglish mein baat kare, tum bhi Hinglish mein reply karo
- Concise raho — 2-4 sentences, jab tak recipe na ho
- Exact prices mention karo catalog se

🛒 TUMHARI CAPABILITIES:
1. PRODUCT SEARCH — naam, category, nutrition, use case, health goal se dhundo
2. RECIPE IDEAS — available produce se dishes suggest karo + kya kharidna hai batao
3. NATURAL LANGUAGE ORDERING — "mujhe 2kg tamatar aur pudina chahiye" → structured order
4. NUTRITION ADVICE — health benefits, vitamins, minerals clearly explain karo
5. SEASONAL GUIDANCE — kya abhi season mein hai aur kyun lena chahiye
6. BUDGET SHOPPING — best value combinations, saste aur nutritious picks
7. COOKING TIPS — specific produce ke liye quick prep tips
8. COMPARISONS — similar products mein se choose karne mein help karo

📦 FULL PRODUCT CATALOG (naam | category | price | unit | tag | origin):
${catalogBlock}

🚚 DELIVERY INFO:
- FREE delivery on orders ₹299+
- Delivery time: 4-6 hours
- Serving: Faridabad, Gurugram, Delhi NCR
- Same day harvest produce

💳 PAYMENT: COD, UPI, Card accepted

📍 ORDERING INTENT — Jab user clearly kuch add karna chahta ho cart mein:
Helpful message ke saath EXACTLY yeh JSON block include karo:
[ORDER_ITEMS: {"items":[{"name":"Cherry Tomatoes","qty":2,"unit":"500g","price":49}]}]
Sirf catalog ke products use karo. Names exactly match karein.

🗣️ HINGLISH EXAMPLES:
- "konsa fruit shi rhega" → Current season fruits suggest karo with prices
- "saste mein kya milega" → Budget options batao
- "kya healthy hai" → Nutrition rich options
- "recipe batao" → Recipe suggest karo with products needed
- "mujhe ye chahiye" → Order intent samjho

🔴 KABHI MAT KARO:
- Catalog mein na ho aise products mat banao
- "4-6 hours" se zyada specific delivery time mat batao
- Competitors ki baat mat karo
- Medical diagnosis mat do (nutrition facts share kar sakte ho)

RESPONSE FORMAT:
- 100 words se kam rakho unless recipe ho
- Product names aur prices ke liye **bold** use karo
- Specific raho — exact prices batao jab relevant ho
- Agar Hindi mein pucha toh Hinglish mein jawab do`
}

function parseOrderItems(text: string) {
  // Avoid `/s` (dotAll) regex flag for wider TS/JS target compatibility.
  // We want the JSON object inside `[ORDER_ITEMS: {...}]`, even if it spans lines.
  // Use a greedy JSON match so nested objects in `items: [{...}]` don't get cut early.
  const match = text.match(/\[ORDER_ITEMS:\s*(\{[\s\S]*\})\]/)
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    return data.items || []
  } catch { return [] }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Something went wrong. Please try again! 🌿", orderItems: [] })
    }

    // `findLast` may not exist in older Node/Next runtimes; scan from the end instead.
    let lastUserMsg = ''
    for (let i = messages.length - 1; i >= 0; i--) {
      const m: any = messages[i]
      if (m?.role === 'user') {
        lastUserMsg = String(m?.content ?? '')
        break
      }
    }
    const apiKey = process.env.GROQ_API_KEY

    // Require real Groq responses only (no demo fallback)
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          message: 'AI service is not configured. Please add `GROQ_API_KEY` in `frontend/.env.local` and restart the frontend server.',
          orderItems: [],
          model: 'unconfigured',
        },
        { status: 500 }
      )
    }

    // Build conversation — last 10 messages for context
    const conversationHistory = messages
      .slice(-10)
      .map((m: any) => ({ role: m.role as 'user'|'assistant', content: String(m.content) }))

    const systemPrompt = await buildSystemPrompt()

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
        stop: null,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API error:', response.status, errText)

      // Model deprecated ya rate limit
      if (response.status === 404 || response.status === 400) {
        // Try fallback model
        const retry = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3-8b-8192',  // Fallback model
            messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory],
            temperature: 0.7,
            max_tokens: 512,
          }),
        })
        if (retry.ok) {
          const retryData = await retry.json()
          const content = retryData.choices?.[0]?.message?.content || ''
          return NextResponse.json({ message: content, orderItems: parseOrderItems(content), model: retryData.model })
        }
      }

      return NextResponse.json(
        {
          message: 'AI service is temporarily unavailable. Please try again in a moment.',
          orderItems: [],
          model: 'error',
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    if (!content) {
      return NextResponse.json(
        {
          message: 'AI service returned an empty response. Please retry.',
          orderItems: [],
          model: data.model || 'unknown',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      message: content,
      orderItems: parseOrderItems(content),
      model: data.model || 'llama-3.3-70b-versatile',
    })

  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json({
      message: "🌿 Ek second — kuch technical issue hua! Dobara try karo, main yahaan hun! 🥕",
      orderItems: [],
    })
  }
}
