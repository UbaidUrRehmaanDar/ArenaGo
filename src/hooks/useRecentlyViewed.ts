import { useState, useEffect } from 'react'
import type { Arena } from '../types'

const RECENTLY_VIEWED_KEY = 'arenago_recently_viewed'
const MAX_RECENTLY_VIEWED = 6

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Arena[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse recently viewed', e)
      }
    }
  }, [])

  const addRecentlyViewed = (arena: Arena) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(a => a.id !== arena.id)
      const updated = [arena, ...filtered].slice(0, MAX_RECENTLY_VIEWED)
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
    localStorage.removeItem(RECENTLY_VIEWED_KEY)
  }

  return { recentlyViewed, addRecentlyViewed, clearRecentlyViewed }
}
