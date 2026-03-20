import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ success: false, error: 'Fields required' }, { status: 400 })

    let user: { id: string; name: string; email: string; role: string } | null = null

    // Try Convex DB
    if (CONVEX_URL) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'auth:getUserByEmail', args: { email } }),
        })
        const data = await res.json()
        const u = data.value
        if (u && u.role === 'superadmin' && u.isActive) {
          const valid = await bcrypt.compare(password, u.passwordHash)
          if (valid) {
            user = { id: u._id, name: u.name, email: u.email, role: 'superadmin' }
            // Log the login
            await fetch(`${CONVEX_URL}/api/mutation`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: 'auth:updateLastLogin', args: { id: u._id } }),
            }).catch(() => {})
          }
        }
      } catch {}
    }

    // Demo fallback (superadmin only)
    if (!user && email === 'superadmin@vegfru.com' && password === 'superadmin123') {
      user = { id: 'demo-superadmin', name: 'Super Admin', email, role: 'superadmin' }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Access denied. Superadmin credentials required.' }, { status: 401 })
    }

    const token = await new SignJWT({ userId: user.id, role: user.role, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')  // Shorter expiry for superadmin
      .setIssuedAt()
      .sign(JWT_SECRET)

    // Log to activity
    if (CONVEX_URL) {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'auth:getActivityLog', args: { limit: 1 } }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, token, user })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
