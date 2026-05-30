const sports = [
  'FOOTBALL',
  'CRICKET',
  'PADEL',
  'TENNIS',
  'BASKETBALL',
  'BADMINTON',
  'FUTSAL',
  'SQUASH',
]

const locations = [
  'DHA LAHORE',
  'GULBERG',
  'JOHAR TOWN',
  'MODEL TOWN',
  'BAHRIA TOWN',
  'CANTT',
]

interface MarqueeRowProps {
  items: string[]
  separator: string
  separatorClass: string
  itemClass: string
  duration: string
  reverse?: boolean
}

function MarqueeRow({
  items,
  separator,
  separatorClass,
  itemClass,
  duration,
  reverse = false,
}: MarqueeRowProps) {
  // Duplicate items so the loop is seamless
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max"
        style={{
          animation: `marquee-scroll ${duration} linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className={itemClass}>{item}</span>
            <span className={`mx-6 ${separatorClass}`}>{separator}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function TrustMarquee() {
  return (
    <section className="bg-turf border-y border-line py-6 overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <MarqueeRow
        items={sports}
        separator="+"
        separatorClass="text-lime text-xl"
        itemClass="font-display text-2xl md:text-3xl text-chalk tracking-wide"
        duration="18s"
      />

      <div className="mt-4">
        <MarqueeRow
          items={locations}
          separator="·"
          separatorClass="text-lime/50"
          itemClass="font-display text-xl md:text-2xl text-mist tracking-wide"
          duration="16s"
          reverse
        />
      </div>
    </section>
  )
}
