import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/formatters'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ThemeToggle({
  className,
  showLabel = false,
  size = 'sm',
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-pressed={isLight}
      className={cn(
        'inline-flex items-center justify-center gap-2 shrink-0',
        'rounded-sm border border-line bg-slate/60 text-chalk',
        'transition-colors duration-200 hover:bg-slate hover:border-lime/40',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-2',
        size === 'sm' ? 'h-9 w-9' : 'h-10 w-10',
        showLabel && 'w-auto px-3',
        className
      )}
    >
      {isLight ? (
        <Moon size={size === 'sm' ? 17 : 18} aria-hidden />
      ) : (
        <Sun size={size === 'sm' ? 17 : 18} className="text-lime" aria-hidden />
      )}
      {showLabel && (
        <span className="text-[13px] font-body pr-0.5 hidden min-[380px]:inline">
          {isLight ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}
