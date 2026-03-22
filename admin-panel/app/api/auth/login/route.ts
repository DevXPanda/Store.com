import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ success: false, error: 'Fields required' }, { status: 400 })
    if (!CONVEX_URL) {
      return NextResponse.json({ success: false, error: 'NEXT_PUBLIC_CONVEX_URL is missing in backend/.env.local' }, { status: 500 })
    }

    let user: { id: string; name: string; email: string; role: string } | null = null

    const ensureSeedRes = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'adminAuth:ensureDefaultSuperAdmin', args: {} }),
    })
    if (!ensureSeedRes.ok) {
      const errText = await ensureSeedRes.text()
      return NextResponse.json({ success: false, error: `Convex adminAuth not ready: ${errText}` }, { status: 500 })
    }

    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'adminAuth:getAdminByEmail', args: { email } }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ success: false, error: `Failed to query admin: ${errText}` }, { status: 500 })
    }

    const data = await res.json()
    const admin = data.value
    if (admin && admin.role === 'admin' && admin.isActive) {
      const valid = await bcrypt.compare(password, admin.passwordHash)
      if (valid) {
        user = { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
        await fetch(`${CONVEX_URL}/api/mutation`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'adminAuth:updateAdminLastLogin', args: { id: admin._id } }),
        }).catch(() => {})
      }
    }

    if (!user) return NextResponse.json({ success: false, error: 'Invalid credentials for admin panel' }, { status: 401 })

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
