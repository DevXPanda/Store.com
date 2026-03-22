# 🛵 VegFru — Delivery Panel

Mobile-first Next.js 14 delivery partner app. Runs on **port 3002**.

## Login
| Email | Password |
|-------|----------|
| delivery@vegfru.com | delivery123 |

## Route
| Path | Description |
|------|-------------|
| `/delivery` | Full delivery app (4 tabs) |

## App Tabs
| Tab | Features |
|-----|---------|
| Active | All assigned orders, tap to view details |
| History | Completed deliveries list |
| Stats | Earnings card, delivery count, weekly bar chart |
| Profile | Online/offline toggle, vehicle info, sign out |

## Order Detail Sheet (bottom sheet)
- Visual status timeline (Assigned → Picked Up → Out for Delivery → Delivered)
- Delivery address with Google Maps navigation link
- Call customer button
- Items list with COD / PAID badge
- One-tap status advance button
- Confirm delivery modal for final step

## Folder Structure
```
delivery-panel/
├── app/
│   ├── globals.css
│   ├── AuthContext.tsx
│   ├── ConvexClientProvider.tsx
│   └── delivery/
│       ├── layout.tsx          ← Delivery root layout
│       └── page.tsx            ← Full app (login + 4 tabs + modals)
├── tailwind.config.js
├── next.config.js   # loads ../backend/.env.local
```

## Setup
```bash
npm install
# Secrets: backend/.env.local (see backend/.env.local.example at repo root)
npm run dev    # → http://localhost:3002/delivery
```
