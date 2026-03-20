import { Star, BadgeCheck } from 'lucide-react'
import { testimonials } from '@/app/data'

export default function Testimonials() {
  return (
    <section className="py-20 bg-forest-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="blob-1 absolute top-0 left-0 w-96 h-96 bg-green-400" />
        <div className="blob-2 absolute bottom-0 right-0 w-80 h-80 bg-green-300" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-green-400 tracking-widest uppercase mb-2">
            · Loved by families ·
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
            What people <span className="italic text-green-400">say</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`bg-forest-800/50 border border-green-800/40 rounded-3xl p-6 space-y-4 hover:border-green-600/40 transition-all duration-300 hover:-translate-y-1 reveal-up stagger-${i + 1}`}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-body text-green-100/80 text-sm leading-relaxed">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-green-800/40">
                <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-body font-semibold text-white text-sm">{t.name}</span>
                    {t.verified && <BadgeCheck className="w-4 h-4 text-green-400" />}
                  </div>
                  <span className="font-mono text-xs text-green-500">{t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
