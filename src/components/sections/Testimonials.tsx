import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReviewCard } from '../ui/ReviewCard'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { fetchTopReviews } from '../../services/supabaseData'
import type { Review } from '../../types'

export function Testimonials() {
  const [topReviews, setTopReviews] = useState<Review[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const { ref, inView } = useScrollReveal(0.1)

  useEffect(() => {
    fetchTopReviews(10, 4.5).then(setTopReviews)
  }, [])

  useEffect(() => {
    if (topReviews.length < 2) return
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % Math.min(5, topReviews.length))
    }, 5000)
    return () => clearInterval(interval)
  }, [topReviews])

  const quoteReviews = topReviews.slice(0, 5)
  const cardReviews = topReviews.slice(0, 6)

  if (topReviews.length === 0) return null

  return (
    <section className="py-20 bg-turf">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center min-h-[300px]"
        >
          <p className="font-mono text-[11px] text-lime tracking-[0.2em] mb-6">WHAT PLAYERS SAY</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(1.6rem,5vw,3.5rem)] text-chalk leading-tight"
            >
              "{quoteReviews[quoteIndex]?.comment}"
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-2 mt-8">
            {quoteReviews.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuoteIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === quoteIndex ? 'w-8 bg-lime' : 'w-2 bg-mist/40 hover:bg-mist'
                }`}
                aria-label={`Quote ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-h-[500px] overflow-y-auto pr-2 space-y-0"
        >
          {cardReviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <ReviewCard review={review} arenaName={review.arenaName} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
