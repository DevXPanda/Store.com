'use client'

import { ArrowRight, Star, Truck, Leaf, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()
  const heroImages = {
    center: '/images/hero/center.jpg',
    chips: [
      '/images/hero/chip-1.jpg',
      '/images/hero/chip-3.jpg',
      '/images/hero/chip-5.jpg',
      '/images/hero/chip-4.jpg',
    ],
    // organic: '/images/hero/organic.jpg',
    // express: '/images/hero/express.jpg',
  }

  const scrollToShop = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToFarms = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#FEFAE0] pt-20">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute -top-32 -left-32 w-96 h-96 bg-green-200/40" />
        <div className="blob-2 absolute -bottom-20 -right-32 w-80 h-80 bg-amber-200/40" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 blob-1 bg-lime-100/60" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, #166534 0, #166534 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #166534 0, #166534 1px, transparent 0, transparent 50%)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="space-y-8">
            <div className="reveal-up stagger-1 inline-flex items-center gap-2 bg-green-100 border border-green-200 text-forest-700 text-xs font-mono tracking-wider px-4 py-2 rounded-full uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Farm-fresh delivery · Delhi NCR
            </div>

            <div className="reveal-up stagger-2 space-y-2">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-forest-900">
                Nature's
                <span className="block italic text-forest-600">finest,</span>
                <span className="block text-green-600">at your door.</span>
              </h1>
            </div>

            <p className="reveal-up stagger-3 font-body text-gray-600 text-lg leading-relaxed max-w-md">
              Hand-picked vegetables & fruits from trusted local farms. Delivered within 6 hours — no chemicals, no compromise.
            </p>

            <div className="reveal-up stagger-4 flex flex-wrap gap-4">
              <button
                onClick={scrollToShop}
                className="group flex items-center gap-3 bg-forest-700 hover:bg-forest-800 text-white font-body font-medium px-7 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-green-900/25 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={scrollToFarms}
                className="flex items-center gap-2 bg-white hover:bg-green-50 text-forest-800 font-body font-medium px-7 py-4 rounded-2xl border border-green-200 transition-all hover:border-green-400 hover:shadow-md active:scale-95"
              >
                <Leaf className="w-4 h-4 text-green-600" />
                Our Story
              </button>
            </div>

            {/* Trust signals */}
            <div className="reveal-up stagger-5 flex flex-wrap items-end gap-6 pt-2">
              <div className="flex items-center gap-2">
                {/* <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-forest-600" />
                    </div>
                  ))}
                </div> */}
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-xs text-gray-500">Trusted by families across Delhi NCR</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 pb-0.5">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm">Free delivery above ₹299</span>
              </div>
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 to-emerald-100 opacity-60" />
              <div className="absolute inset-4 rounded-full bg-white/50 backdrop-blur-sm border border-green-200/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white/80 shadow-2xl animate-float">
                  <img src={heroImages.center} alt="Fresh vegetables" className="w-full h-full object-cover" />
                </div>
              </div>
              {[
                { top: '-12%', left: '50%', delay: '0s' },
                { top: '20%', right: '-12%', delay: '1.5s' },
                { bottom: '-8%', left: '55%', delay: '0.8s' },
                { top: '25%', left: '-10%', delay: '2s' },
              ].map(({ top, left, right, bottom, delay }, i) => (
                <div key={i} className="absolute w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-green-100 animate-float overflow-hidden"
                  style={{ top, left, right, bottom, animationDelay: delay }}>
                  <img src={heroImages.chips[i]} alt="Fresh produce" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="absolute top-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3 border border-green-50 animate-float">
              {/* <div className="w-10 h-10 bg-green-100 rounded-xl overflow-hidden border border-green-200">
                <img src={heroImages.organic} alt="Organic produce" className="w-full h-full object-cover" />
              </div> */}
              <div>
                <p className="text-xs font-mono text-green-600 uppercase tracking-wide">100% Organic</p>
                <p className="text-sm font-semibold text-forest-800">No pesticides</p>
              </div>
            </div>

            <div className="absolute bottom-8 -right-4 bg-forest-800 rounded-2xl shadow-xl p-3 flex items-center gap-3 animate-float-delay">
              {/* <div className="w-10 h-10 bg-green-700 rounded-xl overflow-hidden border border-green-600">
                <img src={heroImages.express} alt="Express delivery produce" className="w-full h-full object-cover" />
              </div> */}
              <div>
                <p className="text-xs font-mono text-green-300 uppercase tracking-wide">Express</p>
                <p className="text-sm font-semibold text-white">4–6hr delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="white" fillOpacity="0.3" />
        </svg>
      </div>
    </section>
  )
}
