import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../utils/formatters'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: number
  trendDirection?: 'up' | 'down'
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  trendDirection,
  className,
}: StatCardProps) {
  return (
    <div className={cn('bg-slate p-5 rounded-sm', className)}>
      <p className="font-display text-display-md text-lime leading-none">
        {value}
        {unit && <span className="text-body-md font-body text-mist ml-1">{unit}</span>}
      </p>
      <p className="text-[13px] text-mist font-body mt-2">{label}</p>
      {trend !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-mono',
            trendDirection === 'up' ? 'text-lime' : 'text-amber'
          )}
        >
          {trendDirection === 'up' ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}
          {trend}%
        </div>
      )}
    </div>
  )
}
