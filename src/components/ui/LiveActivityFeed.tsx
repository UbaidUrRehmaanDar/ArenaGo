import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { fetchRecentActivity } from '../../services/supabaseData'
import { SportTag } from './SportTag'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import type { ActivityItem } from '../../types'

const VISIBLE = 4

export function LiveActivityFeed() {
  const [allItems, setAllItems] = useState<ActivityItem[]>([])
  const [items, setItems] = useState<ActivityItem[]>([])
  const feedIndex = useRef(VISIBLE)
  const { ref, inView } = useScrollReveal(0.1)

  useEffect(() => {
    fetchRecentActivity(30).then((data) => {
      if (data.length === 0) return
      setAllItems(data)
      setItems(data.slice(0, VISIBLE))
      feedIndex.current = VISIBLE
    })
  }, [])

  useEffect(() => {
    if (allItems.length < 2) return
    const interval = setInterval(() => {
      const next = feedIndex.current % allItems.length
      feedIndex.current = next + 1
      setItems((prev) => {
        const newItem = allItems[next]
        return [newItem, ...prev.slice(0, VISIBLE - 1)]
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [allItems])

  if (items.length === 0) return null

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[600px] mx-auto py-16 px-4"
    >
      <p className="font-mono text-[11px] text-lime tracking-[0.2em] mb-6 text-center">
        LIVE ACTIVITY
      </p>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={`${item.id}-${item.time}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-3 py-4 border-b border-line"
          >
            <span className="w-2 h-2 rounded-full bg-lime mt-2 animate-pulse-dot flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-[15px] text-chalk">
                <span className="font-medium">{item.playerName}</span>{' '}
                <span
                  className={
                    item.action === 'booked'
                      ? 'text-lime'
                      : item.action === 'reviewed'
                        ? 'text-amber'
                        : 'text-booked'
                  }
                >
                  {item.action}
                </span>{' '}
                {item.arenaName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <SportTag sport={item.sport} size="sm" />
                <span className="font-mono text-xs text-mist">{item.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
