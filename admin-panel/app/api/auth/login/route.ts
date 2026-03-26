import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, otp } = body
    if (!email || (!password && !otp)) return NextResponse.json({ success: false, error: 'Fields required' }, { status: 400 })
    if (!CONVEX_URL) {
      return NextResponse.json({ success: false, error: 'NEXT_PUBLIC_CONVEX_URL is missing' }, { status: 500 })
    }

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

    // Initial Login Phase (Password Check)
    if (email && password && !otp) {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'adminAuth:ensureDefaultSuperAdmin', args: {} }),
      }).catch(() => {})

      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'adminAuth:getAdminByEmail', args: { email } }),
      })
      const adminData = await res.json()
      const admin = adminData.value

      if (admin && admin.isActive) {
        const valid = await bcrypt.compare(password, admin.passwordHash)
        if (valid) {
          // Password valid -> Send OTP
          const otpRes = await fetch(`${CONVEX_URL}/api/mutation`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'adminAuth:requestAdminEmailOtp', args: { email } }),
          })
          const otpResult = await otpRes.json()
          if (otpResult.status === "error") throw new Error(otpResult.errorMessage)

          const code = otpResult.value?.devCode
          let emailSent = false
          if (code) {
            const { sendOtpEmail } = await import("@/lib/mail")
            const sent = await sendOtpEmail({ to: email, code })
            emailSent = sent.ok
          }

          return NextResponse.json({ 
            success: true, 
            otpRequired: true, 
            email,
            emailSent,
            devCode: code // Showing for dev convenience
          })
        }
      }
      return NextResponse.json({ success: false, error: 'Invalid credentials or inactive' }, { status: 401 })
    }

    // OTP Verification Phase
    if (email && otp) {
      const verifyRes = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'adminAuth:verifyAdminEmailOtp', args: { email, code: otp } }),
      })
      const verifyData = await verifyRes.json()

      if (verifyData.status === "error" || !verifyData.value?.success) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 401 })
      }

      const user = verifyData.value.user
      const token = await new SignJWT({ userId: user.id, role: user.role, name: user.name })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(JWT_SECRET)

      return NextResponse.json({ success: true, token, user })
    }

    return NextResponse.json({ success: false, error: 'Request invalid' }, { status: 400 })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
