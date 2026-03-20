import { NextRequest, NextResponse } from 'next/server'
import { getProductCatalogForAI } from '@/app/data'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const buildSystemPrompt = () => `You are "Leafy" — VegFru's friendly, knowledgeable AI shopping assistant. VegFru is a premium farm-fresh vegetables and fruits delivery platform based in Faridabad, India, delivering to Delhi NCR.

🌿 YOUR PERSONALITY:
- Warm, enthusiastic about fresh produce, concise (2–4 sentences unless giving a recipe)
- Use light produce emojis naturally (not excessively)
- Address the customer's actual need immediately, then offer follow-up help
- Never be robotic — sound like a knowledgeable friend at a farmer's market

🛒 YOUR CAPABILITIES:
1. PRODUCT SEARCH — find products by name, category, nutrition, cooking use, health goal, or cuisine
2. RECIPE IDEAS — suggest dishes using available produce; mention what to buy
3. NATURAL LANGUAGE ORDERING — parse "I want 2kg tomatoes and some basil" into structured order items
4. NUTRITION ADVICE — explain health benefits, vitamins, minerals in clear language
5. SEASONAL GUIDANCE — what's in season right now and why to grab it
6. BUDGET SHOPPING — best value combinations, cheap but nutritious picks
7. COOKING TIPS — quick prep tips for specific produce
8. COMPARISONS — help choose between similar products

📦 FULL PRODUCT CATALOG (name | category | price | unit | tag | origin):
${getProductCatalogForAI()}

🚚 DELIVERY INFO:
- FREE delivery on orders ₹299+
- Delivery time: 4–6 hours after ordering
- Serving: Faridabad, Gurugram, Delhi NCR
- All produce harvested same day or previous morning
- No artificial ripening agents used

💳 PAYMENT: COD, UPI, Card accepted

📍 ORDERING INTENT — When a user clearly wants to add something to cart:
Respond with a helpful message AND include this JSON block EXACTLY:
[ORDER_ITEMS: {"items":[{"name":"Cherry Tomatoes","qty":2,"unit":"500g","price":49}]}]
Only include products from the catalog above. Match names exactly.

🔴 NEVER:
- Make up products not in the catalog
- Promise specific delivery times beyond "4–6 hours"
- Discuss competitors
- Give medical diagnoses (you can share nutrition facts)

RESPONSE FORMAT:
- Keep responses under 100 words unless giving a recipe
- Use **bold** for product names and prices
- Be specific: mention exact prices when relevant`

function getDemoResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase()

  if (msg.includes('mango') || msg.includes('alphonso') || msg.includes('hapus')) {
    return "🥭 Amazing choice! Our **Alphonso Mangoes** (₹299/kg) from Ratnagiri are at peak season right now — fibreless, saffron flesh with incredible aroma. We also have **Kesar Mangoes** from Gujarat at ₹249/kg, perfect for aamras. Both are very limited stock, so grab them while you can!"
  }
  if (msg.includes('smoothie') || msg.includes('detox') || msg.includes('healthy juice')) {
    return "🌱 Perfect detox smoothie combo: **Baby Spinach** (₹39/250g) + **Orange Carrots** (₹35/500g) + **Amla/Gooseberry** (₹49/250g) + **Meyer Lemons** (₹69/500g). That's ₹192 total, free delivery included! Blend with water for a power-packed vitamin hit. 💪"
  }
  if (msg.includes('recipe') || msg.includes('cook') || msg.includes('make') || msg.includes('dish')) {
    return "👨‍🍳 How about **Mango Salsa**? Dice 2 Alphonso mangoes + cherry tomatoes + red onion + green chilli + fresh coriander. Add lime juice, serve with anything grilled! You'll need: Mangoes ₹299, Cherry Tomatoes ₹49, Coriander ₹15 — ₹363 total. Want me to add them to your cart? 🎉"
  }
  if (msg.includes('cheap') || msg.includes('budget') || msg.includes('₹100') || msg.includes('affordable')) {
    return "💚 Budget champion picks today: **Coriander** ₹15, **Green Chillies** ₹25, **Fresh Mint** ₹25, **Cucumber** ₹29, **Red Tomatoes** ₹35, **White Onion** ₹35. All are ₹35 or under! Perfect daily essentials under ₹200 total. 🛒"
  }
  if (msg.includes('salad') || msg.includes('bowl')) {
    return "🥗 Dream salad kit: **Iceberg Lettuce** (₹45) + **Cherry Tomatoes** (₹49) + **Cucumber** (₹29) + **Red Bell Pepper** (₹79) + **Baby Arugula** (₹69) for peppery bite. Dress with **Meyer Lemon** (₹69) juice + olive oil. Total: ₹340 — shall I add these to your cart? 🌿"
  }
  if (msg.includes('fruit') || msg.includes('fruits') || msg.includes('seasonal')) {
    return "🍎 Freshest picks right now: **Alphonso Mangoes** (₹299, seasonal!), **Lychee** (₹149, last few days!), **Strawberries** (₹129), **Himachali Apple** (₹149/kg), and **Cherries** (₹299, very limited). The mangoes and lychees won't be around much longer! 🥭"
  }
  if (msg.includes('herb') || msg.includes('herbs')) {
    return "🌿 Fresh herbs in stock: **Coriander** (₹15/100g), **Fresh Mint** (₹25/50g), **Curry Leaves** (₹15/50g), **Fresh Basil** (₹29/50g), **Rosemary** (₹45/30g), **Thyme** (₹40/30g), **Microgreens Mix** (₹149/100g). All harvested this morning! What are you cooking?"
  }
  if (msg.includes('superfood') || msg.includes('immunity') || msg.includes('vitamin')) {
    return "⚡ Top immunity superfoods: **Amla/Gooseberry** (₹49 — 20× Vitamin C of oranges!), **Curly Kale** (₹59 — superfood!), **Drumstick/Moringa** (₹45), **Watercress** (₹89 — CDC's #1 nutrient-dense food), **Blueberries** (₹249 — antioxidant powerhouse). Want me to suggest a daily immunity booster plan?"
  }
  if (msg.includes('delivery') || msg.includes('time') || msg.includes('when') || msg.includes('how long')) {
    return "⚡ We deliver in **4–6 hours** across Faridabad, Gurugram, and Delhi NCR. Order before 2 PM for same-day delivery. **FREE delivery on ₹299+ orders**. All produce is harvested same day — literally farm-to-doorstep freshness! 🌾"
  }
  if (msg.includes('order') || msg.includes('want') || msg.includes('add') || msg.includes('buy') || msg.includes('cart')) {
    return "🛒 I'd love to help! Just tell me what you need — like 'I want 1kg tomatoes, some mint, and a dozen bananas' — and I'll organise your order! Or use the + button on any product card. What are you shopping for today? 🌿"
  }
  if (msg.includes('exotic') || msg.includes('special') || msg.includes('rare') || msg.includes('gourmet')) {
    return "✨ Rare & gourmet finds: **Dragon Fruit** (₹189), **Rambutan** (₹199), **Medjool Dates** (₹249), **Jerusalem Artichoke** (₹89), **Blood Oranges** (₹129), **Lotus Root** (₹99), **Purple Yam** (₹69). These move fast — want me to hold some for your cart? 🌟"
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('namaste')) {
    return "👋 Namaste! I'm **Leafy**, your VegFru AI assistant! I can help you find the freshest produce, suggest recipes, check what's in season, or organise your entire order by voice or text. What would you like today? 🌿"
  }
  return "🌿 I'm **Leafy**, your VegFru AI! Ask me about fresh produce, recipes, seasonal picks, nutrition tips, or just say 'I want 2kg tomatoes and some coriander' — I'll get it sorted! What can I help you with? 🛒"
}

function parseOrderItems(text: string) {
  const match = text.match(/\[ORDER_ITEMS:\s*(\{.*?\})\]/s)
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    return data.items || []
  } catch { return [] }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastUserMsg = messages?.findLast((m: any) => m.role === 'user')?.content || ''

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      const demoMsg = getDemoResponse(lastUserMsg)
      return NextResponse.json({
        message: demoMsg,
        orderItems: parseOrderItems(demoMsg),
        model: 'demo',
      })
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...messages.slice(-12).map((m: any) => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.65,
        max_tokens: 1024,
        stream: false,
      }),
    })

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text())
      const fallback = getDemoResponse(lastUserMsg)
      return NextResponse.json({ message: fallback, orderItems: parseOrderItems(fallback), model: 'demo-fallback' })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      message: content,
      orderItems: parseOrderItems(content),
      model: data.model || 'llama-3.3-70b-versatile',
      usage: data.usage,
    })

  } catch (err) {
    console.error('AI route error:', err)
    return NextResponse.json({
      message: "🌿 I had a little hiccup! Please try again — I'm here to help you find the freshest produce in Faridabad! 🥕",
      orderItems: [],
    })
  }
}
