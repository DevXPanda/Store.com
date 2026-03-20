import { NextRequest, NextResponse } from 'next/server'

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json()
    if (!phone || !message) return NextResponse.json({ error: 'phone and message required' }, { status: 400 })

    // Strip leading +91 or 91
    const cleanPhone = phone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })

    if (FAST2SMS_KEY) {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: message.slice(0, 160), // SMS limit
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      })
      const data = await res.json()
      if (data.return) return NextResponse.json({ success: true, data })
      throw new Error(data.message || 'SMS failed')
    }

    // Dev mode — log instead
    console.log(`[DEV SMS] To: ${cleanPhone}\nMessage: ${message}`)
    return NextResponse.json({ success: true, dev: true, message: 'Add FAST2SMS_API_KEY to send real SMS' })
  } catch (err: any) {
    console.error('SMS error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
