import { NextRequest, NextResponse } from 'next/server'

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { message: 'GROQ_API_KEY is missing for transcription.' },
        { status: 500 }
      )
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Audio file is required.' }, { status: 400 })
    }

    const payload = new FormData()
    payload.append('file', file)
    payload.append('model', 'whisper-large-v3-turbo')
    payload.append('language', 'hi')
    payload.append('response_format', 'json')

    const res = await fetch(GROQ_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: payload,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.error?.message || 'Transcription failed.' },
        { status: res.status }
      )
    }

    return NextResponse.json({ text: String(data?.text || '') })
  } catch (err: any) {
    return NextResponse.json(
      { message: String(err?.message || 'Transcription error') },
      { status: 500 }
    )
  }
}
