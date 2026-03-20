import { NextRequest, NextResponse } from 'next/server'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL

async function convexMutation(path: string, args: object) {
  if (!CONVEX_URL) return null
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  })
  if (!res.ok) throw new Error(await res.text())
  return (await res.json()).value
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const orderId = await convexMutation('orders:placeOrder', body)
    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    const fallbackId = `ORD${Date.now()}`
    return NextResponse.json({ success: true, orderId: fallbackId, fallback: true })
  }
}

export async function GET() {
  try {
    if (!CONVEX_URL) return NextResponse.json({ orders: [] })
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'orders:getAllOrders', args: { limit: 50 } }),
    })
    const data = await res.json()
    return NextResponse.json({ orders: data.value || [] })
  } catch {
    return NextResponse.json({ orders: [] })
  }
}
