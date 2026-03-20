'use client'
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

export default function Footer() {
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
                    <a href={href} className="font-body text-sm text-green-200/50 hover:text-green-300 transition-colors">{label}</a>
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
    </footer>
  )
}
