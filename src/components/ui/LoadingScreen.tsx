import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function LoadingScreen() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 bg-ground z-[9999] flex items-center justify-center">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-2 border-lime/20 rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-2 border-2 border-lime/40 rounded-full"
          animate={{
            rotate: -360,
            scale: [1, 0.9, 1],
          }}
          transition={{
            rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-4 border-2 border-lime/60 rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* Center dot */}
        <motion.div
          className="w-16 h-16 bg-lime rounded-full"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [1, 0.6, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Logo text */}
        <motion.div
          className="absolute -bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="font-display text-2xl text-chalk tracking-wider">ARENAGO</p>
        </motion.div>
      </div>
    </div>
  )
}
