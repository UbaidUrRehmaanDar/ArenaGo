import { cn } from '../../utils/formatters'
import type { SportType } from '../../types'

const sportColors: Record<SportType, string> = {
  Football: 'text-lime border-lime/40',
  Cricket: 'text-amber border-amber/40',
  Badminton: 'text-[#00B4D8] border-[#00B4D8]/40',
  Basketball: 'text-[#FF6B35] border-[#FF6B35]/40',
  Tennis: 'text-[#F7DC6F] border-[#F7DC6F]/40',
  Padel: 'text-[#C39BD3] border-[#C39BD3]/40',
  Futsal: 'text-lime border-lime/40',
  Squash: 'text-mist border-mist/40',
}

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

interface SportTagProps {
  sport: SportType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SportTag({ sport, size = 'sm', className }: SportTagProps) {
  return (
    <span
      className={cn(
        'inline-block font-mono uppercase tracking-wide border bg-ground/70 backdrop-blur-sm',
        sportColors[sport],
        sizes[size],
        className
      )}
    >
      {sport}
    </span>
  )
}
