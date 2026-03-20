import { stats } from '@/app/data'

export default function Stats() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center group"
            >
              <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">
                {stat.emoji}
              </div>
              <div className="font-display font-bold text-3xl sm:text-4xl text-forest-800 mb-1">
                {stat.value}
              </div>
              <div className="font-body text-sm text-gray-500 tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
