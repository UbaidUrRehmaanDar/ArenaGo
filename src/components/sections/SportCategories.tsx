import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const categories = [
  {
    sport: 'Football',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    sport: 'Cricket',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
    span: 'md:col-span-2',
  },
  {
    sport: 'Badminton',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
    span: '',
  },
  {
    sport: 'Basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
    span: '',
  },
  {
    sport: 'Tennis',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    span: '',
  },
  {
    sport: 'Padel',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80',
    span: '',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function SportCategories() {
  const { ref, inView } = useScrollReveal(0.1)

  return (
    <section className="py-20 bg-ground">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
        <h2 className="font-display text-[clamp(2rem,7vw,5rem)] text-chalk">BROWSE BY SPORT</h2>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[160px] md:auto-rows-[200px]"
        >
          {categories.map((cat) => (
            <motion.div key={cat.sport} variants={itemVariants} className={`min-h-[160px] ${cat.span}`}>
              <Link
                to={`/arenas?sport=${cat.sport}`}
                className="relative overflow-hidden rounded-sm group w-full h-full block"
              >
                <img
                  src={cat.image}
                  alt={cat.sport}
                  className="absolute inset-0 w-full h-full object-cover grayscale-[60%] brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-lime/0 group-hover:bg-lime/20 mix-blend-multiply transition-all duration-500" />
                <div className="absolute bottom-0 left-0 p-3 md:p-6 z-10">
                  <h3 className="font-display text-xl md:text-display-md text-chalk">{cat.sport}</h3>
                  <p className="text-lime font-body text-sm translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    Book Now →
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
