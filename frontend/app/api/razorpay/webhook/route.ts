import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

async function convexMutation(path: string, args: object) {
  if (!CONVEX_URL) return null
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  })
  return (await res.json()).value
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    // Verify Razorpay signature — MUST match before trusting event
    if (RAZORPAY_SECRET && signature) {
      const expectedSig = crypto
        .createHmac('sha256', RAZORPAY_SECRET)
        .update(body)
        .digest('hex')
      if (expectedSig !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const orderId = payment.notes?.orderId
      if (orderId) {
        await convexMutation('orders:updatePaymentStatus', {
          orderId, paymentStatus: 'paid', razorpayPaymentId: payment.id,
        })
        await convexMutation('orders:updateOrderStatus', {
          orderId, status: 'confirmed', note: `Payment verified: ${payment.id}`,
        })
      }
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.notes?.orderId
      if (orderId) {
        await convexMutation('orders:updatePaymentStatus', { orderId, paymentStatus: 'failed' })
        await convexMutation('orders:updateOrderStatus', { orderId, status: 'cancelled', note: 'Payment failed' })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
