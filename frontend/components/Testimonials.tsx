'use client'

import { Star, BadgeCheck } from 'lucide-react'
import { useConvexQuery } from '@/lib/convexFetch'

type Row = {
  _id: string
  name: string
  location: string
  text: string
  rating: number
  avatarEmoji: string
  verified: boolean
}

export default function Testimonials() {
  const { data: rows, loading } = useConvexQuery<Row[]>('testimonials:listPublic', {})

  if (!loading && (!rows || rows.length === 0)) {
    return null
  }

  return (
    <section className="py-20 bg-forest-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="blob-1 absolute top-0 left-0 w-96 h-96 bg-green-400" />
        <div className="blob-2 absolute bottom-0 right-0 w-80 h-80 bg-green-300" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-green-400 tracking-widest uppercase mb-2">
            · Loved by families ·
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
            What people <span className="italic text-green-400">say</span>
          </h2>
        </div>

        {loading ? (
          <p className="text-center text-green-200/80 text-sm">Loading…</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {(rows ?? []).map((t, i) => (
              <div
                key={t._id}
                className={`bg-forest-800/50 border border-green-800/40 rounded-3xl p-6 space-y-4 hover:border-green-600/40 transition-all duration-300 hover:-translate-y-1 reveal-up stagger-${i + 1}`}
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400" fill={s <= t.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>

                <p className="font-body text-green-100/80 text-sm leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-green-800/40">
                  <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-xl">
                    {t.avatarEmoji}
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
        )}
      </div>
    </section>
  )
}
