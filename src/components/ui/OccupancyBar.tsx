import { motion } from 'framer-motion'
import { cn } from '../../utils/formatters'

interface OccupancyBarProps {
  percentage: number
  label?: string
  size?: 'sm' | 'md'
}

function getFillColor(pct: number): string {
  if (pct <= 50) return 'bg-lime'
  if (pct <= 75) return 'bg-amber'
  return 'bg-booked'
}

export function OccupancyBar({ percentage, label, size = 'sm' }: OccupancyBarProps) {
  const barH = size === 'sm' ? 'h-1' : 'h-1.5'
  return (
    <div className="w-full">
      {label && (
        <p className="text-body-sm text-mist mb-1.5 font-body text-[13px]">{label}</p>
      )}
      <div className={cn('w-full rounded-sm bg-chalk/10 overflow-hidden', barH)}>
        <motion.div
          className={cn('h-full rounded-sm', getFillColor(percentage))}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
