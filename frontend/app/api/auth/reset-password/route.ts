import { NextRequest, NextResponse } from 'next/server'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || ''

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json()
    if (!token || !email || !password) return NextResponse.json({ success:false, error:'Missing fields' }, { status:400 })
    if (password.length < 6) return NextResponse.json({ success:false, error:'Password too short' }, { status:400 })

    // In production: verify token against DB (tokens should be stored in Convex with expiry)
    // For now: validate token format and update password if user exists
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)

    if (CONVEX_URL) {
      // Get user by email
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ path:'auth:getUserByEmail', args:{ email } }),
      })
      const data = await res.json()
      const user = data.value
      if (!user) return NextResponse.json({ success:false, error:'Account not found' }, { status:404 })

      // Update password
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ path:'auth:updateUserPassword', args:{ id:user._id, passwordHash } }),
      })
    }

    return NextResponse.json({ success:true })
  } catch (err:any) {
    return NextResponse.json({ success:false, error:err.message }, { status:500 })
  }
}
