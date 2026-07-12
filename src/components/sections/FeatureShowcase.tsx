import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SlotGrid } from '../ui/SlotGrid'
import { fetchArenas, fetchSlotsForArenaDate, fetchOwnerAnalytics } from '../../services/supabaseData'
import { format } from 'date-fns'
import { formatPKR } from '../../utils/formatters'
import type { Arena, Slot } from '../../types'

gsap.registerPlugin(ScrollTrigger)

const sectionClass =
  'relative isolate flex items-center py-20 px-4 md:px-8 max-lg:mb-16 max-lg:border-b max-lg:border-line lg:feature-pin lg:min-h-screen lg:py-20 lg:mb-0 lg:border-none'

export function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { ref: revealRef, inView } = useScrollReveal()
  const [arenas, setArenas] = useState<Arena[]>([])
  const [demoSlots, setDemoSlots] = useState<Slot[]>([])
  const [revenue, setRevenue] = useState(0)
  const [occupancy, setOccupancy] = useState(0)

  useEffect(() => {
    fetchArenas().then(async (data) => {
      setArenas(data)
      if (data[0]) {
        const slots = await fetchSlotsForArenaDate(data[0].id, format(new Date(), 'yyyy-MM-dd'))
        setDemoSlots(slots.slice(6, 14))

        // Pull real analytics for the first arena's owner
        const ownerIds = data.slice(0, 3).map((a) => a.id)
        const analytics = await fetchOwnerAnalytics(ownerIds)
        setRevenue(analytics.totalRevenue)
        setOccupancy(Math.round((analytics.averageOccupancy ?? 0) * 100))
      }
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const mm = gsap.matchMedia()

    mm.add('(max-width: 1023px)', () => {
      ScrollTrigger.getAll().forEach((t) => { if (t.vars.pin) t.kill(true) })
      ScrollTrigger.refresh()
    })

    mm.add('(min-width: 1024px)', () => {
      const triggers: ScrollTrigger[] = []
      container.querySelectorAll('.feature-pin').forEach((section) => {
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: true,
            invalidateOnRefresh: true,
          })
        )
      })
      ScrollTrigger.refresh()
      return () => { triggers.forEach((t) => t.kill()) }
    })

    return () => mm.revert()
  }, [arenas])

  return (
    <div ref={containerRef} className="bg-ground max-lg:pb-8 lg:pb-0">
      {/* 01 — Instant Booking */}
      <section className={sectionClass}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
          <div ref={revealRef}>
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-display text-4xl md:text-display-xl text-lime leading-none">01</p>
              <h2 className="font-display text-[clamp(1.8rem,5vw,4rem)] text-chalk mt-4">Instant Booking</h2>
              <p className="text-mist font-body mt-4 max-w-md leading-relaxed">
                Pick your slot from a live grid. See what is available, what is peak, and what is
                already taken — before you commit.
              </p>
              <p className="text-mist font-body mt-2 max-w-md leading-relaxed">
                No phone calls. No waiting for the owner to check a notebook.
              </p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-slate p-6 rounded-sm border border-line mt-8 md:mt-0"
          >
            {demoSlots.length > 0
              ? <SlotGrid slots={demoSlots} readOnly />
              : <div className="h-24 skeleton-shimmer rounded-sm" />}
          </motion.div>
        </div>
      </section>

      {/* 02 — Live Occupancy */}
      <section className={`${sectionClass} bg-turf`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
          <div className="order-2 md:order-1 space-y-3">
            {arenas.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="font-mono text-xs text-mist w-24 truncate">{a.name}</span>
                <div className="flex-1 h-6 bg-ground rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full bg-lime"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${a.occupancyRate}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="font-mono text-xs text-lime w-10">{a.occupancyRate}%</span>
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <p className="font-display text-4xl md:text-display-xl text-lime leading-none">02</p>
            <h2 className="font-display text-[clamp(1.8rem,5vw,4rem)] text-chalk mt-4">Live Occupancy</h2>
            <p className="text-mist font-body mt-4 max-w-md">
              See how full each arena is before you book. Real occupancy data across Lahore.
            </p>
          </div>
        </div>
      </section>

      {/* 03 — Built for Arena Owners */}
      <section className={sectionClass}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
          <div>
            <p className="font-display text-4xl md:text-display-xl text-lime leading-none">03</p>
            <h2 className="font-display text-[clamp(1.8rem,5vw,4rem)] text-chalk mt-4">
              Built for Arena Owners
            </h2>
            <p className="text-mist font-body mt-4 max-w-md">
              Revenue tracking, booking heatmaps, and slot management — everything you need to run
              your venue without WhatsApp chaos.
            </p>
          </div>
          <div className="bg-slate p-6 rounded-sm border border-line space-y-4 mt-8 md:mt-0">
            <div className="flex justify-between">
              <span className="text-mist text-sm">Total Revenue</span>
              <span className="font-display text-2xl text-lime">
                {revenue > 0 ? formatPKR(revenue) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist text-sm">Avg Occupancy</span>
              <span className="font-mono text-lime">{occupancy > 0 ? `${occupancy}%` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist text-sm">Arenas Live</span>
              <span className="font-mono text-chalk">{arenas.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 04 — Mobile First */}
      <section className={`${sectionClass} bg-turf max-lg:mb-0 max-lg:border-b-0`}>
        <div className="max-w-7xl mx-auto w-full text-center">
          <p className="font-display text-4xl md:text-display-xl text-lime leading-none mb-8">04</p>
          <h2 className="font-display text-[clamp(1.8rem,5vw,4rem)] text-chalk mb-10 lg:mb-12">Mobile First</h2>
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-[240px] h-[400px] sm:w-[280px] sm:h-[480px] lg:w-[280px] lg:h-[560px] border-2 border-line rounded-[2rem] p-3 relative"
          >
            <div className="w-full h-full bg-ground rounded-[1.5rem] overflow-hidden flex flex-col items-center justify-center p-6 border border-line">
              <div className="w-12 h-12 rounded-full border-2 border-lime flex items-center justify-center mb-4 text-lime">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 12 L10 16 L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-mono text-lime text-xs mb-2">ARG-2024-00847</p>
              <p className="font-display text-xl text-chalk">BOOKING CONFIRMED</p>
              <p className="text-mist text-sm mt-2 text-center">
                {arenas[0]?.name ?? 'Sports Arena'}
              </p>
              <p className="font-mono text-xs text-mist mt-1">Today · 7:00 PM</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
