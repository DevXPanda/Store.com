import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory rate limiter (replace with Upstash Redis in production) ────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = ip
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) return { allowed: false, remaining: 0 }
  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

// ─── Route rate limits ────────────────────────────────────────────────────────
const RATE_LIMITS: Record<string, { limit: number; window: number }> = {
  '/api/auth/login':          { limit: 10, window: 60_000 },
  '/api/auth/register':       { limit: 5,  window: 60_000 },
  '/api/ai':                  { limit: 30, window: 60_000 },
  '/api/email':               { limit: 10, window: 60_000 },
  '/api/sms':                 { limit: 10, window: 60_000 },
  '/api/auth/forgot-password':{ limit: 3,  window: 60_000 },
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown'

  // ── Rate limiting ────────────────────────────────────────────────────────
  for (const [route, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(route)) {
      const { allowed, remaining } = rateLimit(ip, config.limit, config.window)
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait and try again.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(config.window / 1000)),
              'X-RateLimit-Limit': String(config.limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
      // Add rate limit headers to successful responses
      const res = NextResponse.next()
      res.headers.set('X-RateLimit-Limit', String(config.limit))
      res.headers.set('X-RateLimit-Remaining', String(remaining))
      return res
    }
  }

  // ── Bot protection on critical API routes ────────────────────────────────
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/razorpay/webhook')) {
    const ua = req.headers.get('user-agent') || ''
    const suspiciousUA = ['bot', 'crawler', 'spider', 'scraper', 'curl/'].some(s => ua.toLowerCase().includes(s))
    if (suspiciousUA && !ua.includes('Googlebot') && !ua.includes('Bingbot')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon|manifest|icon).*)',
  ],
}
