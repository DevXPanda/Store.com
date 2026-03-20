/** Environment variable validation & typed access */
function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value && process.env.NODE_ENV === 'production' && !fallback) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || fallback || ''
}

export const env = {
  convexUrl:     process.env.NEXT_PUBLIC_CONVEX_URL || '',
  jwtSecret:     requireEnv('JWT_SECRET', 'vegfru-dev-secret-minimum-32-chars!!'),
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  razorpaySecret:process.env.RAZORPAY_KEY_SECRET || '',
  groqApiKey:    process.env.GROQ_API_KEY || '',
  resendApiKey:  process.env.RESEND_API_KEY || '',
  fromEmail:     process.env.FROM_EMAIL || 'orders@vegfru.in',
  fast2smsKey:   process.env.FAST2SMS_API_KEY || '',
  appUrl:        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  gaId:          process.env.NEXT_PUBLIC_GA_ID || '',
  get isProduction() { return process.env.NODE_ENV === 'production' },
  get hasPayments()  { return !!this.razorpayKeyId && !!this.razorpaySecret },
  get hasEmail()     { return !!this.resendApiKey },
  get hasSMS()       { return !!this.fast2smsKey },
  get hasAI()        { return !!this.groqApiKey },
}
