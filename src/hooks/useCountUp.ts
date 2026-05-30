import { useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface UseCountUpOptions {
  end: number
  duration?: number
  separator?: string
}

export function useCountUp({ end, duration = 2, separator = ',' }: UseCountUpOptions) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true

    const startTime = performance.now()
    const totalMs = duration * 1000

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / totalMs, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * end)
      setCount(current)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [inView, end, duration])

  const formatted = separator
    ? count.toLocaleString('en-US')
    : String(count)

  return { ref, value: formatted }
}
