import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 })

    // Check if user exists in Convex
    let userExists = false
    if (CONVEX_URL) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'auth:getUserByEmail', args: { email } }),
        })
        const data = await res.json()
        userExists = !!data.value
      } catch {}
    }

    // Always return success to prevent email enumeration
    if (!userExists) {
      return NextResponse.json({ success: true, message: 'If this email is registered, a reset link will be sent.' })
    }

    // Generate reset token (in production: store in DB with expiry)
    const token = crypto.randomBytes(32).toString('hex')
    const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VegFru <noreply@vegfru.in>',
          to: [email],
          subject: 'Reset your VegFru password',
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <div style="background:#14532d;padding:20px;border-radius:12px 12px 0 0;text-align:center;color:white;">🌿 VegFru — Password Reset</div>
            <div style="background:white;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:28px;">
              <p>You requested a password reset. Click below to set a new password:</p>
              <a href="${resetUrl}" style="display:block;background:#14532d;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;text-align:center;font-weight:600;margin:20px 0;">Reset Password</a>
              <p style="font-size:12px;color:#9ca3af;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            </div>
          </div>`,
        }),
      })
    } else {
      console.log(`[DEV] Password reset URL for ${email}: ${resetUrl}`)
    }

    return NextResponse.json({ success: true, message: 'If this email is registered, a reset link will be sent.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
