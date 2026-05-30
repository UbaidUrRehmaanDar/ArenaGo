import { useCountUp } from '../../hooks/useCountUp'

interface CountUpProps {
  end: number
  duration?: number
  separator?: string
  suffix?: string
  className?: string
}

export function CountUp({ end, duration = 2, separator = ',', suffix = '', className }: CountUpProps) {
  const { ref, value } = useCountUp({ end, duration, separator })
  return (
    <span ref={ref} className={className}>
      {value}{suffix}
    </span>
  )
}
