'use client'
import { ArrowRight, Clock, Leaf } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SeasonalBanner() {
  const router = useRouter()

  const shopCategory = (cat: string) => {
    const target = `/shop?category=${encodeURIComponent(cat)}`
    router.push(target)
    // Fallback for cases where client-side transition does not fire.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (!window.location.pathname.startsWith('/shop')) window.location.assign(target)
      }, 120)
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white min-h-[240px] flex flex-col justify-between group cursor-pointer"
            onClick={() => shopCategory('fruits')}>
            <span className="absolute right-6 bottom-4 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 select-none">🥭</span>
            <div>
              <span className="tag-badge bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-3">SEASONAL PICKS</span>
              <h3 className="font-display font-bold text-3xl mb-2">Fresh fruits</h3>
              <p className="font-body text-white/80 text-sm max-w-xs">Browse what&apos;s in season — stock and varieties update from your live catalog.</p>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">Updated daily</span>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); shopCategory('fruits') }} className="flex items-center gap-2 bg-white text-orange-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg transition-all">
                Shop fruits <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-white min-h-[240px] flex flex-col justify-between group cursor-pointer"
            onClick={() => shopCategory('vegetables')}>
            <span className="absolute right-6 bottom-4 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 select-none">🥦</span>
            <div>
              <span className="tag-badge bg-green-600/40 text-green-300 px-3 py-1 rounded-full inline-block mb-3">GREENS &amp; MORE</span>
              <h3 className="font-display font-bold text-3xl mb-2">Vegetables &amp; leafy greens</h3>
              <p className="font-body text-green-200/80 text-sm max-w-xs">Everything listed comes straight from your Convex catalog — no sample inventory.</p>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2 text-green-300">
                <Leaf className="w-5 h-5" />
                <span className="text-sm font-medium">Farm-first sourcing</span>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); shopCategory('vegetables') }} className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg transition-all">
                Browse veg <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
