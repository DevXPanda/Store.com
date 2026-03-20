# VegFru — 5-Minute Setup Guide

## Step 1: Convex Database
```bash
cd backend
npm install
npx convex login     # One-time browser login
npx convex dev       # Keep running — copy the URL shown
```

## Step 2: Seed Database
New terminal (keep convex dev running):
```bash
npx convex run auth:seedAdminAndDelivery
npx convex run products:seedProducts
```

## Step 3: Environment Variables
```bash
# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit and fill: NEXT_PUBLIC_CONVEX_URL, JWT_SECRET, GROQ_API_KEY

# Admin Panel
cp admin-panel/.env.local.example admin-panel/.env.local
# Edit and fill: NEXT_PUBLIC_CONVEX_URL, JWT_SECRET (same as frontend)

# Delivery Panel
cp delivery-panel/.env.local.example delivery-panel/.env.local
# Edit and fill: NEXT_PUBLIC_CONVEX_URL
```

## Step 4: Run All 3 Panels
```bash
cd frontend       && npm install && npm run dev   # localhost:3000
cd admin-panel    && npm install && npm run dev   # localhost:3001
cd delivery-panel && npm install && npm run dev   # localhost:3002
```

## Login Credentials
| Role        | Email                    | Password       |
|-------------|--------------------------|----------------|
| Super Admin | superadmin@vegfru.com    | superadmin123  |
| Admin       | admin@vegfru.com         | admin123       |
| Delivery    | ravi@vegfru.com          | delivery123    |
| Customer    | customer@vegfru.com      | customer123    |

## Production Checklist
- [ ] NEXT_PUBLIC_CONVEX_URL — from `npx convex deploy`
- [ ] JWT_SECRET — `openssl rand -base64 32`
- [ ] GROQ_API_KEY — console.groq.com (free)
- [ ] NEXT_PUBLIC_RAZORPAY_KEY_ID — razorpay.com
- [ ] RAZORPAY_KEY_SECRET — razorpay.com
- [ ] RESEND_API_KEY — resend.com (3K emails/month free)
- [ ] FROM_EMAIL — orders@yourdomain.com
- [ ] FAST2SMS_API_KEY — fast2sms.com (₹0.20/SMS)
- [ ] NEXT_PUBLIC_APP_URL — https://vegfru.in
- [ ] NEXT_PUBLIC_GA_ID — Google Analytics (optional)

## Razorpay Webhook
URL: https://yourdomain.com/api/razorpay/webhook
Events: payment.captured, payment.failed
