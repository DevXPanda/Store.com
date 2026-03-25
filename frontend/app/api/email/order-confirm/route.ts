import { NextRequest, NextResponse } from 'next/server'
import { isSmtpConfigured, sendMail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  try {
    const { to, customerName, orderId, total, items, paymentMethod, address, deliveryFee } = await req.json()
    if (!to || !orderId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const orderIdShort = String(orderId).slice(-8).toUpperCase()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || 'https://vegfru.in'
    const trackUrl = `${baseUrl.replace(/\/$/, '')}/track/${encodeURIComponent(String(orderId))}`

    const itemsHtml = (items || []).map((item: any) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${item.productEmoji || ''} ${item.productName}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:center;">x${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#14532d;font-weight:600;">₹${item.totalPrice}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
<div style="background:#14532d;padding:24px;text-align:center;"><div style="color:white;font-size:20px;font-weight:700;">🌿 VegFru — Order Confirmed!</div></div>
<div style="padding:24px;">
<p style="font-size:15px;color:#374151;">Hi <strong>${customerName}</strong>, your order <strong>#${orderIdShort}</strong> is confirmed and being packed!</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin:16px 0;text-align:center;">
<div style="font-size:18px;font-weight:700;color:#14532d;">Expected delivery: 4–6 hours</div>
</div>
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
<tr style="background:#f9fafb;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr>
${itemsHtml}
<tr><td colspan="2" style="padding:10px 0;font-weight:700;">Total</td><td style="padding:10px 0;text-align:right;font-size:16px;font-weight:700;color:#14532d;">₹${total}</td></tr>
</table>
<p style="font-size:13px;color:#6b7280;margin:0 0 6px;"><strong>Payment:</strong> ${paymentMethod?.toUpperCase()}</p>
<p style="font-size:13px;color:#6b7280;margin:0 0 6px;"><strong>Delivery:</strong> ${deliveryFee === 0 ? 'FREE' : 'Rs.'+deliveryFee}</p>
<p style="font-size:13px;color:#6b7280;margin:0;"><strong>Address:</strong> ${address}</p>
<div style="text-align:center;margin-top:20px;"><a href="${trackUrl}" style="background:#14532d;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Track Order</a></div>
<p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:16px;">Questions? WhatsApp: +91 98000 00001 | support@vegfru.in</p>
</div>
</div></body></html>`

    if (isSmtpConfigured()) {
      const sent = await sendMail({
        to,
        subject: `Order Confirmed #${orderIdShort} — VegFru`,
        html,
      })
      if (!sent.ok) throw new Error(sent.error)
      return NextResponse.json({ success: true, id: sent.id })
    }

    console.log(`[DEV EMAIL] To: ${to}, Order: ${orderIdShort}`)
    return NextResponse.json({ success: true, dev: true, message: 'Add SMTP_HOST, SMTP_USER, SMTP_PASS to send real emails' })
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
