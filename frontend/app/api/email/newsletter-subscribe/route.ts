import { NextRequest, NextResponse } from 'next/server'
import { isSmtpConfigured, sendMail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json()
    if (!to) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || 'https://vegfru.in'
    const shopUrl = `${baseUrl.replace(/\/$/, '')}/shop`

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
<div style="background:#14532d;padding:24px;text-align:center;"><div style="color:white;font-size:20px;font-weight:700;">🌿 VegFru Newsletter</div></div>
<div style="padding:24px;">
<p style="font-size:15px;color:#374151;">Thanks for subscribing to VegFru updates!</p>
<p style="font-size:14px;color:#4b5563;line-height:1.6;">
You will receive updates about fresh arrivals, seasonal specials, and exclusive offers.
</p>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin:16px 0;">
<div style="font-size:14px;color:#14532d;font-weight:700;">What you'll get:</div>
<ul style="margin:8px 0 0 18px;padding:0;color:#166534;font-size:13px;">
<li>Fresh product drops</li>
<li>Seasonal offers</li>
<li>Farm stories & tips</li>
</ul>
</div>
<div style="text-align:center;margin-top:20px;">
  <a href="${shopUrl}" style="background:#14532d;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Explore Products</a>
</div>
<p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:16px;">No spam. Unsubscribe anytime.</p>
</div>
</div></body></html>`

    if (isSmtpConfigured()) {
      const sent = await sendMail({
        to,
        subject: 'Welcome to VegFru updates 🌿',
        html,
      })
      if (!sent.ok) throw new Error(sent.error)
      return NextResponse.json({ success: true, id: sent.id })
    }

    console.log(`[DEV EMAIL] Newsletter subscribe confirmation to: ${to}`)
    return NextResponse.json({ success: true, dev: true, message: 'SMTP not configured' })
  } catch (err: any) {
    console.error('Newsletter email error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 })
  }
}
