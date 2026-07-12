import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CountUp } from '../ui/CountUp'
import { BtnLink } from '../ui/Btn'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { fetchPlatformStats } from '../../services/supabaseData'

export function CtaSection() {
  const { ref, inView } = useScrollReveal(0.15)
  const [stats, setStats] = useState({ players: 0, arenas: 0, bookings: 0 })

  useEffect(() => {
    fetchPlatformStats().then(setStats)
  }, [])

  return (
    <section className="min-h-screen bg-lime flex items-center justify-center py-20">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto px-4 text-center text-ground"
      >
        <p className="font-mono text-xs tracking-widest mb-4">— READY WHEN YOU ARE</p>
        <h2 className="font-display text-[clamp(2.5rem,10vw,6rem)] leading-none">YOUR COURT IS WAITING.</h2>
        <p className="font-body text-base md:text-lg mt-6 opacity-80">
          Join thousands of players booking arenas across Lahore.
        </p>
        <BtnLink to="/arenas" variant="inverse" className="mt-10 px-8 py-4">
          Browse All Arenas →
        </BtnLink>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap justify-center gap-12 mt-16 pt-12 border-t border-ground/20"
        >
          {[
            { value: stats.players, suffix: '+', label: 'Active Players' },
            { value: stats.arenas, suffix: '', label: 'Arenas Listed' },
            { value: stats.bookings, suffix: '+', label: 'Bookings Completed' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-4xl">
                <CountUp end={stat.value} duration={2} suffix={stat.suffix} />
              </p>
              <p className="text-sm opacity-70 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
