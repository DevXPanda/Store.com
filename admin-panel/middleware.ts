import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')
const PUBLIC = ['/admin/login', '/admin/onboarding', '/admin/pending', '/_next', '/favicon', '/api']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Check JWT cookie first
  const token = req.cookies.get('vegfru_token')?.value

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.next()
    } catch {}
  }

  // Check user cookie (for demo logins)
  const userCookie = req.cookies.get('vegfru_user')?.value
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie)
      if (user.role === 'admin') return NextResponse.next()
    } catch {}
  }

  // Check localStorage via custom header (set by client)
  const adminHeader = req.headers.get('x-vegfru-admin')
  if (adminHeader === 'true') return NextResponse.next()

  return NextResponse.redirect(new URL('/', req.url))
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
