'use client'
import { ArrowRight, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SeasonalBanner() {
  const router = useRouter()

  const shopCategory = (cat: string) => {
    router.push(`/?search=${cat}`)
    setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 200)
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1 — Mango season */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white min-h-[240px] flex flex-col justify-between group cursor-pointer"
            onClick={() => shopCategory('mango')}>
            <span className="absolute right-6 bottom-4 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 select-none">🥭</span>
            <div>
              <span className="tag-badge bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-3">MANGO SEASON 2026</span>
              <h3 className="font-display font-bold text-3xl mb-2">Alphonso Fever</h3>
              <p className="font-body text-white/80 text-sm max-w-xs">Limited window. The finest Ratnagiri Alphonsos arrive weekly, hand-sorted and chilled.</p>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">Seasonal</span>
              </div>
              <button className="flex items-center gap-2 bg-white text-orange-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg transition-all">
                Order Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2 — Organic box */}
          <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-white min-h-[240px] flex flex-col justify-between group cursor-pointer"
            onClick={() => shopCategory('vegetables')}>
            <span className="absolute right-6 bottom-4 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 select-none">🥦</span>
            <div>
              <span className="tag-badge bg-green-600/40 text-green-300 px-3 py-1 rounded-full inline-block mb-3">WEEKLY BOX</span>
              <h3 className="font-display font-bold text-3xl mb-2">The Green Box</h3>
              <p className="font-body text-green-200/80 text-sm max-w-xs">A curated weekly selection of 10 seasonal vegetables, fresh from the farm.</p>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div>
                <span className="font-display font-bold text-2xl text-green-300">₹449</span>
                <span className="text-green-400/60 text-sm"> /week</span>
              </div>
              <button className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg transition-all">
                Shop Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
