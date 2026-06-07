import { motion } from 'framer-motion'
import { CountUp } from '../ui/CountUp'
import { BtnLink, Btn } from '../ui/Btn'
import { arenas } from '../../data/arenas'
import { activityFeed } from '../../data/activity'
import { SportTag } from '../ui/SportTag'

const featured = arenas.find((a) => a.isFeatured) ?? arenas[0]
const latestActivity = activityFeed[0]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[20vw] text-chalk/[0.03] whitespace-nowrap pointer-events-none select-none tracking-wider">
        ARENAGO
      </p>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 w-full py-12 lg:py-0">
        <div className="grid lg:grid-cols-[60%_40%] gap-8 lg:gap-12 items-center">
          <div>
            <p className="font-mono text-[11px] text-lime tracking-[0.2em] mb-4">
              LAHORE
            </p>
            <h1 className="font-display text-[clamp(2.8rem,10vw,7rem)] text-chalk leading-[0.95]">
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                BOOK YOUR GAME.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                SHOW UP AND{' '}
                <span className="text-stroke-lime">PLAY.</span>
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-body-lg text-mist max-w-md mt-6 font-body"
            >
              Find and reserve sports arenas in your city. No calls, no waiting, no hassle.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-3 mt-8"
            >
              <BtnLink to="/arenas" className="px-6 py-3">
                Browse Arenas
              </BtnLink>
              <Btn variant="outline" className="px-6 py-3">
                Watch Demo
              </Btn>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.8 }}
              className="flex flex-wrap gap-6 md:gap-8 mt-10 md:mt-12 pt-8 border-t border-line"
            >
              {[
                { value: 2400, suffix: '+', label: 'Active Players' },
                { value: 38, suffix: '', label: 'Arenas Listed' },
                { value: 12000, suffix: '+', label: 'Bookings Completed' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-3xl md:text-5xl text-lime">
                    <CountUp end={stat.value} duration={2} suffix={stat.suffix} />
                  </p>
                  <p className="text-[13px] text-mist font-body mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[400px] hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 left-0 w-[280px] bg-slate border border-lime/15 rounded-sm p-5 shadow-xl z-10"
            >
              <SportTag sport={featured.sport} />
              <h3 className="font-display text-2xl text-chalk mt-3">{featured.name}</h3>
              <p className="text-mist text-sm mt-1">{featured.rating} rating</p>
              <p className="font-mono text-lime text-sm mt-3">Next: Today 7:00 PM</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-24 right-0 w-[240px] bg-slate border border-lime/15 rounded-sm p-4 -rotate-3 shadow-xl z-20"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-lime rounded-full animate-pulse-dot" />
                <p className="text-[13px] text-chalk font-body">
                  {latestActivity.playerName} just booked {latestActivity.arenaName}
                </p>
              </div>
              <p className="font-mono text-xs text-mist mt-1">{latestActivity.time}</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-0 right-8 w-[200px] bg-slate border border-lime/15 rounded-sm p-4 rotate-2 shadow-xl"
            >
              <p className="font-display text-3xl text-lime">{featured.occupancyRate}%</p>
              <p className="text-mist text-[13px]">Occupied Tonight</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
