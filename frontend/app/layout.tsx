import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ConvexClientProvider } from './ConvexClientProvider'
import { AuthProvider } from './AuthContext'
import Analytics from '@/components/Analytics'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vegfru.in'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#14532d',
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'VegFru — Farm Fresh Vegetables & Fruits Delivery',
    template: '%s | VegFru',
  },
  description: 'Premium farm-fresh vegetables and fruits delivered to your door in 4–6 hours. 100+ products, free delivery above ₹299. Serving Faridabad, Gurugram & Delhi NCR.',
  keywords: ['fresh vegetables', 'fresh fruits', 'online grocery delivery', 'farm fresh', 'organic vegetables', 'faridabad delivery', 'delhi ncr grocery', 'vegfru'],
  authors: [{ name: 'VegFru', url: BASE }],
  creator: 'VegFru',
  publisher: 'VegFru',
  category: 'food & grocery',
  applicationName: 'VegFru',
  referrer: 'origin-when-cross-origin',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: 'VegFru — Farm Fresh Delivery in Delhi NCR',
    description: 'Premium farm-fresh produce delivered in 4–6 hours. 100+ products, free delivery above ₹299.',
    url: BASE,
    siteName: 'VegFru',
    locale: 'en_IN',
    type: 'website',
    images: [
      { url: '/og-image.jpg', width: 1200, height: 630, alt: 'VegFru — Farm Fresh Vegetables & Fruits' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VegFru — Farm Fresh Delivery',
    description: 'Premium farm-fresh produce delivered in 4–6 hours. Serving Delhi NCR.',
    images: ['/og-image.jpg'],
    creator: '@vegfru',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-site-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="grain-overlay">
        <Analytics />
        <ConvexClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
