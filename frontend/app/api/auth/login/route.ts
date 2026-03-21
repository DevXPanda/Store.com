import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

function getJWTSecret() {
  const s = process.env.JWT_SECRET
  if (!s && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production')
  return new TextEncoder().encode(s || 'vegfru-dev-secret-key-2026')
}

async function tryConvexLogin(email: string, password: string) {
  if (!CONVEX_URL) return null
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'auth:getUserByEmail', args: { email } }),
    })
    if (!res.ok) return null
    const user = (await res.json()).value
    if (!user || !user.isActive) return null
    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return null
    // Update last login
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'auth:updateLastLogin', args: { id: user._id } }),
      })
    } catch {}
    return { id: user._id, name: user.name, email: user.email, role: user.role }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const normalizedEmail = String(email ?? '').toLowerCase().trim()
    const normalizedPassword = String(password ?? '')
    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }

    if (!CONVEX_URL) {
      return NextResponse.json(
        { success: false, error: 'Auth service is not configured. Add NEXT_PUBLIC_CONVEX_URL in frontend/.env.local and restart.' },
        { status: 500 }
      )
    }

    const userPayload = await tryConvexLogin(normalizedEmail, normalizedPassword)

    if (!userPayload) return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })

    const JWT_SECRET = getJWTSecret()
    const token = await new SignJWT({ userId: userPayload.id, role: userPayload.role, name: userPayload.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    return NextResponse.json({ success: true, token, user: userPayload })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
