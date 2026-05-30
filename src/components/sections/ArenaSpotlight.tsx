import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { arenas } from '../../data/arenas'
import { ArenaCard } from '../ui/ArenaCard'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const featured = arenas.filter((a) => a.isFeatured)

export function ArenaSpotlight() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
    skipSnaps: false,
  })
  const [selected, setSelected] = useState(0)
  const { ref, inView } = useScrollReveal(0.1)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  return (
    <section className="bg-turf noise-overlay py-20 overflow-hidden">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 md:px-8 mb-10"
      >
        <h2 className="font-display text-display-lg text-chalk">FEATURED ARENAS</h2>
      </motion.div>
      <div className="relative">
        <button
          type="button"
          onClick={scrollPrev}
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-10 font-display text-5xl text-chalk hover:text-lime transition-colors duration-200"
          aria-label="Previous"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={scrollNext}
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-10 font-display text-5xl text-chalk hover:text-lime transition-colors duration-200"
          aria-label="Next"
        >
          &gt;
        </button>
        <div className="overflow-visible" ref={emblaRef}>
          <div className="flex gap-6 px-8 md:px-24">
            {featured.map((arena, i) => (
              <div
                key={arena.id}
                className="flex-[0_0_85%] md:flex-[0_0_380px] min-w-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: i === selected ? 'scale(1)' : 'scale(0.93)',
                  opacity: i === selected ? 1 : 0.6,
                }}
              >
                <ArenaCard arena={arena} variant="carousel" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
