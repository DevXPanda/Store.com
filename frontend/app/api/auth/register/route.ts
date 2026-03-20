import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

function validate(data: any): string | null {
  if (!data.name || data.name.trim().length < 2) return 'Name must be at least 2 characters'
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Valid email required'
  if (!data.password || data.password.length < 6) return 'Password must be at least 6 characters'
  if (data.password.length > 128) return 'Password too long'
  if (data.name.length > 100) return 'Name too long'
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validationError = validate(body)
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 })

    const { name, email, password, phone } = body
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(password.trim(), 10)

    let userId = `guest_${Date.now()}`

    if (CONVEX_URL) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'auth:createUser', args: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role: 'customer', phone } }),
        })
        const data = await res.json()
        if (data.errorMessage?.includes('already registered')) {
          return NextResponse.json({ success: false, error: 'This email is already registered. Please sign in.' }, { status: 409 })
        }
        if (data.value) userId = data.value
      } catch {}
    }

    const token = await new SignJWT({ userId, role: 'customer', name: name.trim() })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    return NextResponse.json({
      success: true, token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'customer' },
    })
  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json({ success: false, error: 'Server error. Try again.' }, { status: 500 })
  }
}
