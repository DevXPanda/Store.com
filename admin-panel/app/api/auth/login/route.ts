import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

const DEMO: Record<string, { password: string; name: string; role: string }> = {
  'superadmin@vegfru.com': { password: 'superadmin123', name: 'Super Admin', role: 'superadmin' },
  'admin@vegfru.com':      { password: 'admin123',      name: 'Admin User',  role: 'admin'      },
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ success: false, error: 'Fields required' }, { status: 400 })

    let user: { id: string; name: string; email: string; role: string } | null = null

    // Try Convex first
    if (CONVEX_URL) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'auth:getUserByEmail', args: { email } }),
        })
        const data = await res.json()
        const convexUser = data.value
        if (convexUser && ['admin', 'superadmin'].includes(convexUser.role) && convexUser.isActive) {
          const valid = await bcrypt.compare(password, convexUser.passwordHash)
          if (valid) {
            user = { id: convexUser._id, name: convexUser.name, email: convexUser.email, role: convexUser.role }
            // Update last login
            await fetch(`${CONVEX_URL}/api/mutation`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: 'auth:updateLastLogin', args: { id: convexUser._id } }),
            }).catch(() => {})
          }
        }
      } catch {}
    }

    // Demo fallback
    if (!user) {
      const demo = DEMO[email]
      if (demo && demo.password === password) {
        user = { id: `demo-${demo.role}`, name: demo.name, email, role: demo.role }
      }
    }

    if (!user) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })

    const token = await new SignJWT({ userId: user.id, role: user.role, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    return NextResponse.json({ success: true, token, user })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
