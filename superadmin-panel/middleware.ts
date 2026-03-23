import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'vegfru-dev-secret')

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public
  if (pathname.startsWith('/superadmin/login') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  if (!pathname.startsWith('/superadmin')) return NextResponse.next()

  const token = req.cookies.get('sa_token')?.value
  const userCookie = req.cookies.get('sa_user')?.value

  // Try JWT first
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload.role === 'superadmin') return NextResponse.next()
    } catch {}
  }

  // Try session cookie
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie)
      if (user.role === 'superadmin') return NextResponse.next()
    } catch {}
  }

  return NextResponse.redirect(new URL('/?signin=1', req.url))
}

export const config = { matcher: ['/superadmin', '/superadmin/:path*'] }
