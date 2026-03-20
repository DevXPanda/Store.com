import { marqueeItems } from '@/app/data'

export default function Marquee() {
  const doubled = [...marqueeItems, ...marqueeItems]

  return (
    <div className="bg-forest-800 py-3 overflow-hidden relative">
      <div
        className="flex gap-10 whitespace-nowrap animate-marquee"
        style={{ width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-green-200 font-mono text-xs tracking-widest uppercase flex items-center gap-3"
          >
            {item}
            <span className="text-green-600 text-base">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
