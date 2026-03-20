# 🌿 VegFru — Production Full Stack Platform

Complete farm-to-door e-commerce platform with real-time DB, AI assistant, payments, emails, SMS, and 3 role-based dashboards.

---

## Architecture

```
vegfru-ai/
├── frontend/        Next.js 14  → Customer storefront      (port 3000)
├── admin-panel/     Next.js 14  → Admin & Super Admin       (port 3001)
├── delivery-panel/  Next.js 14  → Delivery partner app      (port 3002)
└── backend/         Convex      → Real-time DB + mutations  (cloud)
```

---

## 🚀 Setup (3 steps)

### 1. Start Convex
```bash
cd backend && npm install
npx convex login        # one-time
npx convex dev          # copy the URL shown
```

### 2. Seed Database
```bash
# Keep convex dev running. Open new terminal:
npx convex run auth:seedAdminAndDelivery
npx convex run products:seedProducts
```

### 3. Run All Panels
```bash
# Copy env files first:
cp frontend/.env.local.example frontend/.env.local
cp admin-panel/.env.local.example admin-panel/.env.local
cp delivery-panel/.env.local.example delivery-panel/.env.local
# Edit each .env.local and paste your NEXT_PUBLIC_CONVEX_URL

# Then run:
cd frontend       && npm install && npm run dev   # :3000
cd admin-panel    && npm install && npm run dev   # :3001
cd delivery-panel && npm install && npm run dev   # :3002
```

---

## 🔐 Credentials

| Role         | Email                      | Password        | URL                    |
|--------------|---------------------------|-----------------|------------------------|
| Super Admin  | superadmin@vegfru.com     | superadmin123   | :3001/admin/login      |
| Admin        | admin@vegfru.com          | admin123        | :3001/admin/login      |
| Delivery 1   | ravi@vegfru.com           | delivery123     | :3002/login            |
| Delivery 2   | sunil@vegfru.com          | delivery123     | :3002/login            |
| Customer     | customer@vegfru.com       | customer123     | :3000                  |

---

## 👑 Role Permissions

| Feature                   | Customer | Admin | Super Admin |
|---------------------------|----------|-------|-------------|
| Browse & order            | ✅       | —     | —           |
| View orders (admin)       | —        | ✅    | ✅          |
| Update order status       | —        | ✅    | ✅          |
| Manage products           | —        | ✅    | ✅          |
| Delete products           | —        | ❌    | ✅          |
| View User Management tab  | —        | ❌    | ✅          |
| Create/edit/delete users  | —        | ❌    | ✅          |
| View Activity Log         | —        | ❌    | ✅          |
| View revenue analytics    | —        | ✅    | ✅          |

---

## 🛠 Services You Need

| Service    | Purpose               | Cost              | Link                    |
|------------|----------------------|-------------------|-------------------------|
| Convex     | Real-time database   | Free (1M/mo)      | convex.dev              |
| Vercel     | Hosting              | Free              | vercel.com              |
| Groq       | AI Assistant         | Free              | console.groq.com        |
| Razorpay   | UPI/Card payments    | 2% per txn        | razorpay.com            |
| Resend     | Email confirmations  | Free (3K/mo)      | resend.com              |
| Fast2SMS   | SMS notifications    | ~₹0.20/SMS        | fast2sms.com            |
| Domain     | vegfru.in            | ~₹800/year        | namecheap.com           |

**Monthly cost: ~₹0–500 + payment fees**

---

## 📦 Features Checklist

### Customer Storefront (:3000)
- ✅ 102 products with real Unsplash images
- ✅ Live search with dropdown results
- ✅ Category filter + sort (6 options)
- ✅ Product detail page with related products
- ✅ Cart with localStorage persistence
- ✅ Guest checkout (no account required)
- ✅ Full checkout: Address → Payment → Confirmation
- ✅ COD / UPI / Card via Razorpay
- ✅ Coupon code: VEGFRU10 (10% off)
- ✅ Order confirmation email (Resend)
- ✅ SMS confirmation (Fast2SMS)
- ✅ Leafy AI Assistant (Groq llama-3.3-70b-versatile)
  - Voice input (Web Speech API)
  - Voice output (SpeechSynthesis)
  - Natural language ordering
- ✅ Sign in / Register with JWT auth
- ✅ Forgot password flow
- ✅ Order tracking page (/orders)
- ✅ User profile page (/profile) — saves to Convex
- ✅ Newsletter subscription → Convex DB
- ✅ SEO: Open Graph, Twitter Card, sitemap.xml, robots.txt
- ✅ PWA manifest (installable on mobile)
- ✅ Google Analytics support
- ✅ Privacy Policy, Terms, Refund Policy pages
- ✅ Error, 404, Loading pages
- ✅ Security: Rate limiting, JWT, bcrypt, security headers

### Admin Panel (:3001)
- ✅ Dark enterprise UI
- ✅ Super Admin vs Admin role differentiation
- ✅ Protected by JWT middleware
- ✅ Dashboard: Revenue stats + 7-day chart + order breakdown
- ✅ Top selling products by revenue
- ✅ Low stock alerts
- ✅ Orders: full table, filter by status, view details, update status, cancel, assign delivery
- ✅ Products: search, edit, activate/deactivate, add (superadmin), delete (superadmin)
- ✅ Delivery: delivery boy cards with stats, active deliveries list
- ✅ Customers: derived from order history
- ✅ User Management (superadmin only): full CRUD on all users
- ✅ Activity Log (superadmin only): all admin actions logged
- ✅ Real-time data (auto-refresh every 20s)
- ✅ Notification bell with pending order count
- ✅ Toast notifications for all actions

### Delivery Panel (:3002)
- ✅ Per-delivery-boy login
- ✅ Dark mobile-first UI
- ✅ Active tab: orders with progress tracker, call, navigate, next status
- ✅ COD cash collection reminder
- ✅ Confirm delivery modal
- ✅ History tab: delivered orders with earnings
- ✅ Stats tab: 4 metric cards + real weekly chart
- ✅ Profile tab: info, online/offline toggle
- ✅ Auto-refresh every 20s
- ✅ Real Convex DB (no dummy data)

### Backend (Convex)
- ✅ 7 tables: users, products, orders, orderItems, aiChatSessions, deliveryTracking, newsletters, activityLog
- ✅ 4 roles: superadmin, admin, delivery, customer
- ✅ Full CRUD mutations for all entities
- ✅ Revenue analytics queries (by day, top products)
- ✅ Stock deduction on order placement
- ✅ Activity logging for superadmin audit trail
- ✅ Last login tracking

---

## 🚀 Deploy to Production

### Step 1: Deploy Convex
```bash
cd backend && npx convex deploy
# Note the production URL
```

### Step 2: Deploy to Vercel (3 projects)
```bash
# Create 3 separate GitHub repos and import to Vercel
# Set environment variables for each:

# frontend/.env.production:
NEXT_PUBLIC_CONVEX_URL=https://your-prod.convex.cloud
JWT_SECRET=your-prod-secret
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=re_...
FROM_EMAIL=orders@vegfru.in
FAST2SMS_API_KEY=...
NEXT_PUBLIC_APP_URL=https://vegfru.in
NEXT_PUBLIC_GA_ID=G-...

# admin-panel/.env.production:
NEXT_PUBLIC_CONVEX_URL=https://your-prod.convex.cloud
JWT_SECRET=your-prod-secret  # SAME as frontend

# delivery-panel/.env.production:
NEXT_PUBLIC_CONVEX_URL=https://your-prod.convex.cloud
```

### Step 3: Razorpay Webhook
In Razorpay Dashboard → Webhooks → Add URL:
`https://vegfru.in/api/razorpay/webhook`
Events: `payment.captured`, `payment.failed`

### Step 4: Seed Production DB
```bash
npx convex run auth:seedAdminAndDelivery --prod
npx convex run products:seedProducts --prod
```

---

## 🔧 Convex Commands

```bash
npx convex dev                              # Dev server
npx convex deploy                           # Production deploy
npx convex run auth:seedAdminAndDelivery    # Seed users
npx convex run products:seedProducts        # Seed 25 products
npx convex dashboard                        # Open dashboard
npx convex logs                             # View function logs
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `_generated/api` missing | Run `npx convex dev` |
| Login fails on admin panel | Try demo accounts shown on login page |
| Products show empty | Run `npx convex run products:seedProducts` |
| Emails not sending | Add `RESEND_API_KEY` + `FROM_EMAIL` to .env.local |
| SMS not sending | Add `FAST2SMS_API_KEY` to .env.local |
| Razorpay not loading | Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to .env.local |
| Admin panel not protecting | Check `JWT_SECRET` is same in admin + frontend |
