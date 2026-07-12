import useEmblaCarousel from 'embla-carousel-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArenaCard } from '../ui/ArenaCard'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { fetchArenas } from '../../services/supabaseData'
import type { Arena } from '../../types'

export function ArenaSpotlight() {
  const [featured, setFeatured] = useState<Arena[]>([])
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true, skipSnaps: false })
  const [selected, setSelected] = useState(0)
  const { ref, inView } = useScrollReveal(0.1)

  useEffect(() => {
    fetchArenas().then((data) => setFeatured(data.filter((a) => a.isFeatured)))
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  if (featured.length === 0) return null

  const total = featured.length
  const thumbWidth = 100 / total
  const thumbOffset = total > 1 ? (selected / (total - 1)) * (100 - thumbWidth) : 0

  return (
    <section className="bg-turf noise-overlay py-20 overflow-hidden">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 md:px-8 mb-10"
      >
        <h2 className="font-display text-[clamp(2rem,7vw,5rem)] text-chalk">FEATURED ARENAS</h2>
      </motion.div>
      <div className="relative">
        <div className="overflow-visible cursor-grab active:cursor-grabbing select-none" ref={emblaRef}>
          <div className="flex items-stretch gap-6 px-8 md:px-24">
            {featured.map((arena, i) => (
              <div
                key={arena.id}
                className="flex-[0_0_85%] md:flex-[0_0_380px] min-w-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex"
                style={{ transform: i === selected ? 'scale(1)' : 'scale(0.93)', opacity: i === selected ? 1 : 0.6 }}
              >
                <ArenaCard arena={arena} variant="carousel" className="w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div
          className="relative h-[3px] bg-chalk/15 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            const index = Math.round(ratio * (total - 1))
            emblaApi?.scrollTo(Math.max(0, Math.min(total - 1, index)))
          }}
        >
          <motion.div
            className="absolute top-0 h-full bg-lime rounded-full"
            style={{ width: `${thumbWidth}%` }}
            animate={{ left: `${thumbOffset}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-mono text-[11px] text-chalk/40 uppercase tracking-widest">
            {String(selected + 1).padStart(2, '0')}
          </span>
          <span className="font-mono text-[11px] text-chalk/40 uppercase tracking-widest">
            {String(total).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  )
}
