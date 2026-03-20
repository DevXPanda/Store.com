const steps = [
  {
    step: '01',
    emoji: '🌾',
    title: 'Farm Harvest',
    desc: 'Each morning our partner farms harvest fresh produce based on daily orders.',
    color: 'bg-green-50 border-green-100',
  },
  {
    step: '02',
    emoji: '🧺',
    title: 'Hand Sorted',
    desc: 'Expert sorters select only the finest quality produce, rejecting anything below standard.',
    color: 'bg-amber-50 border-amber-100',
  },
  {
    step: '03',
    emoji: '📦',
    title: 'Eco Packed',
    desc: 'Packed in 100% compostable boxes with moisture-retention liners to preserve freshness.',
    color: 'bg-lime-50 border-lime-100',
  },
  {
    step: '04',
    emoji: '🛵',
    title: 'Fast Delivered',
    desc: 'Our cold-chain delivery partners bring it to your door within 6 hours.',
    color: 'bg-blue-50 border-blue-100',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-[#FEFAE0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-green-600 tracking-widest uppercase mb-2">
            · The VegFru Process ·
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-forest-900">
            Farm to <span className="italic text-forest-600">Your Fork</span>
          </h2>
          <p className="font-body text-gray-500 mt-4 max-w-md mx-auto">
            We've obsessed over every step of the journey so your food arrives as nature intended.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`relative rounded-3xl border p-6 ${s.color} group hover:shadow-lg transition-all duration-300`}
            >
              {/* Step number */}
              <span className="font-mono text-5xl font-bold text-gray-100 absolute top-4 right-4 select-none group-hover:text-gray-200 transition-colors">
                {s.step}
              </span>

              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {s.emoji}
              </div>
              <h3 className="font-display font-semibold text-xl text-forest-900 mb-2">
                {s.title}
              </h3>
              <p className="font-body text-gray-600 text-sm leading-relaxed">
                {s.desc}
              </p>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-gray-300 text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
