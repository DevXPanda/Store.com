# 🌿 VegFru — Frontend (Customer Storefront)

Next.js 14 customer-facing storefront. Runs on **port 3000**.

## Routes
| Path | Description |
|------|-------------|
| `/` | Home — Hero, Products, Cart sidebar |
| `/checkout` | Checkout with address + payment |

## Folder Structure
```
frontend/
├── app/
│   ├── page.tsx              ← Home page (assembles all sections)
│   ├── layout.tsx            ← Root layout + Convex + fonts
│   ├── globals.css           ← Custom animations, fonts, grain
│   ├── data.ts               ← Static product/category data
│   ├── AuthContext.tsx       ← Auth state (login/logout/session)
│   ├── ConvexClientProvider.tsx ← Wraps app in Convex real-time
│   └── checkout/
│       └── page.tsx          ← Checkout form + order placement
├── components/
│   ├── Navbar.tsx            ← Sticky nav, cart badge, search
│   ├── Hero.tsx              ← Full-screen hero with animations
│   ├── Marquee.tsx           ← Scrolling produce ticker
│   ├── Stats.tsx             ← 4-stat trust bar
│   ├── ProductCard.tsx       ← Individual product card
│   ├── ProductsSection.tsx   ← Grid with filters & sort
│   ├── CartSidebar.tsx       ← Slide-in cart with totals
│   ├── SeasonalBanner.tsx    ← Promo banners
│   ├── HowItWorks.tsx        ← 4-step process
│   ├── Testimonials.tsx      ← Customer reviews
│   ├── Newsletter.tsx        ← Email subscribe
│   └── Footer.tsx            ← Full footer
├── tailwind.config.js
├── next.config.js   # loads ../backend/.env.local
```

## Setup
```bash
npm install
# Secrets: copy backend/.env.local.example → backend/.env.local (repo root)
npm run dev                         # → http://localhost:3000
```
