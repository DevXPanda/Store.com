# 🖥️ VegFru — Admin Panel

Next.js 14 admin dashboard. Runs on **port 3001**.

## Login
| Email | Password |
|-------|----------|
| admin@vegfru.com | admin123 |

## Routes
| Path | Description |
|------|-------------|
| `/admin/login` | Admin sign-in page |
| `/admin` | Full dashboard (5 tabs) |

## Dashboard Tabs
| Tab | Features |
|-----|---------|
| Dashboard | Revenue, orders, delivered today, low-stock alerts |
| Orders | Filter by status, assign delivery boy, update status, detail modal |
| Products | Grid view, search, edit price/stock, activate/deactivate |
| Delivery | Delivery boy cards, active delivery list, advance status |
| Customers | All customers, spend history, order count |

## Folder Structure
```
admin-panel/
├── app/
│   ├── globals.css
│   ├── AuthContext.tsx
│   ├── ConvexClientProvider.tsx
│   └── admin/
│       ├── layout.tsx          ← Admin root layout (dark theme)
│       ├── page.tsx            ← Full dashboard (all 5 tabs)
│       └── login/
│           └── page.tsx        ← Login page
├── components/                 ← (shared components if needed)
├── tailwind.config.js
├── next.config.js
└── .env.local.example
```

## Setup
```bash
npm install
cp .env.local.example .env.local
npm run dev    # → http://localhost:3001/admin/login
```
