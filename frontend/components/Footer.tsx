'use client'
import { useState } from 'react'
import { Leaf, Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const links = {
  Shop: [
    { label: 'All Products', href: '/#shop' },
    { label: 'Vegetables', href: '/?cat=vegetables' },
    { label: 'Fruits', href: '/?cat=fruits' },
    { label: 'Herbs & Greens', href: '/?cat=herbs' },
    { label: 'Exotic Produce', href: '/?cat=exotic' },
  ],
  Company: [
    { label: 'Our Story', href: '/#about' },
    { label: 'Partner Farms', href: '/#farms' },
    { label: 'Sustainability', href: '/#about' },
    { label: 'Careers', href: 'mailto:careers@vegfru.in' },
    { label: 'Press', href: 'mailto:press@vegfru.in' },
  ],
  Support: [
    { label: 'Track My Order', href: '/orders' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Returns Policy', href: '/#returns' },
    { label: 'Contact Us', href: 'mailto:support@vegfru.in' },
    { label: 'WhatsApp Support', href: 'https://wa.me/919800000001' },
  ],
}

const footerDetails: Record<string, { title: string; details: string; actionHref?: string; actionLabel?: string }> = {
  'Our Story': {
    title: 'Our Story',
    details: 'VegFru connects local farms with city homes. We source fresh produce daily and focus on transparent quality checks.',
    actionHref: '/#about',
    actionLabel: 'Read About Us',
  },
  'Partner Farms': {
    title: 'Partner Farms',
    details: 'We work with trusted farmers across Haryana and nearby regions for seasonal and chemical-safe produce.',
    actionHref: '/#farms',
    actionLabel: 'View Partner Farms',
  },
  Sustainability: {
    title: 'Sustainability',
    details: 'We prioritize low-waste packaging, local sourcing, and route optimization for lower delivery emissions.',
    actionHref: '/#about',
    actionLabel: 'Learn More',
  },
  Careers: {
    title: 'Careers',
    details: 'We are hiring in operations, customer care, and growth roles. Send your resume to careers@vegfru.in.',
    actionHref: 'mailto:careers@vegfru.in',
    actionLabel: 'Email Careers',
  },
  Press: {
    title: 'Press',
    details: 'For media kits, founder interviews, or partnership announcements, contact press@vegfru.in.',
    actionHref: 'mailto:press@vegfru.in',
    actionLabel: 'Contact Press',
  },
  'Track My Order': {
    title: 'Track My Order',
    details: 'Track your order status in real time using your order ID. Updates include packed, out-for-delivery, and delivered.',
    actionHref: '/orders',
    actionLabel: 'Track Now',
  },
  FAQ: {
    title: 'FAQ',
    details: 'Find quick answers on delivery slots, cancellations, substitutions, payment options, and account help.',
    actionHref: '/#faq',
    actionLabel: 'Open FAQ',
  },
  'Returns Policy': {
    title: 'Returns Policy',
    details: 'If an item arrives damaged or below quality, report within the return window for replacement or refund support.',
    actionHref: '/#returns',
    actionLabel: 'Read Policy',
  },
  'Contact Us': {
    title: 'Contact Us',
    details: 'Need help with an order? Email support@vegfru.in or call +91 98000 00001 for quick support.',
    actionHref: 'mailto:support@vegfru.in',
    actionLabel: 'Email Support',
  },
  'WhatsApp Support': {
    title: 'WhatsApp Support',
    details: 'Chat with our support team on WhatsApp for faster order updates and issue resolution.',
    actionHref: 'https://wa.me/919800000001',
    actionLabel: 'Open WhatsApp',
  },
}

export default function Footer() {
  const [activeDetail, setActiveDetail] = useState<(typeof footerDetails)[string] | null>(null)

  return (
    <footer className="bg-forest-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-200" />
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight">Veg<span className="text-green-400">Fru</span></span>
                <span className="block text-[9px] font-mono text-green-600 tracking-widest uppercase -mt-0.5">Farm Fresh</span>
              </div>
            </a>
            <p className="font-body text-green-200/50 text-sm leading-relaxed max-w-xs">
              Bridging the gap between local farms and urban homes. Fresh, honest, direct.
            </p>
            <div className="space-y-2 text-sm text-green-200/50">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>Faridabad, Haryana — Delhi NCR</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><a href="tel:+919800000001" className="hover:text-green-300">+91 98000 00001</a></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><a href="mailto:hello@vegfru.in" className="hover:text-green-300">hello@vegfru.in</a></div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {[
                { Icon: Instagram, href: 'https://instagram.com/vegfru' },
                { Icon: Twitter, href: 'https://twitter.com/vegfru' },
                { Icon: Facebook, href: 'https://facebook.com/vegfru' },
                { Icon: Youtube, href: 'https://youtube.com/vegfru' },
              ].map(({ Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-forest-800 rounded-xl flex items-center justify-center hover:bg-green-700 transition-colors">
                  <Icon className="w-4 h-4 text-green-300" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-display font-bold text-sm text-white mb-4 tracking-wide">{title}</h3>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    {(title === 'Company' || title === 'Support') ? (
                      <button
                        type="button"
                        onClick={() => setActiveDetail(footerDetails[label] || null)}
                        className="font-body text-left text-sm text-green-200/50 hover:text-green-300 transition-colors"
                      >
                        {label}
                      </button>
                    ) : (
                      <a href={href} className="font-body text-sm text-green-200/50 hover:text-green-300 transition-colors">{label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-forest-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-green-200/30 text-center">© {new Date().getFullYear()} VegFru. All rights reserved. Made with 🌿 in India.</p>
          <div className="flex items-center gap-4 text-xs text-green-200/30">
            <a href="/privacy" className="hover:text-green-300 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-green-300 transition-colors">Terms of Service</a>
            <a href="/refund" className="hover:text-green-300 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>

      {activeDetail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close details modal"
            onClick={() => setActiveDetail(null)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <div className="relative z-[121] w-full max-w-xl rounded-2xl border border-forest-700 bg-forest-900 p-5 shadow-2xl sm:p-6">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h4 className="font-display text-lg font-bold text-green-100">{activeDetail.title}</h4>
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="rounded-md border border-forest-700 px-2 py-1 text-xs text-green-200 hover:bg-forest-800"
              >
                Close
              </button>
            </div>
            <p className="font-body text-sm leading-relaxed text-green-200/85">{activeDetail.details}</p>
            {activeDetail.actionHref && (
              <a
                href={activeDetail.actionHref}
                target={activeDetail.actionHref.startsWith('http') ? '_blank' : undefined}
                rel={activeDetail.actionHref.startsWith('http') ? 'noreferrer' : undefined}
                className="mt-4 inline-flex rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white no-underline hover:bg-green-600"
              >
                {activeDetail.actionLabel || 'Open'}
              </a>
            )}
          </div>
        </div>
      )}
    </footer>
  )
}
