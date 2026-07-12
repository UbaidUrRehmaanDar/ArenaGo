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
        'rounded-xl transition-all duration-300',
        'text-chalk hover:text-lime hover:bg-white/5',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-2',
        size === 'sm' ? 'h-9 w-9' : 'h-10 w-10',
        'hover:rounded-full',
        showLabel && 'w-auto px-3',
        className
      )}
    >
      {isLight ? (
        <Moon size={size === 'sm' ? 17 : 18} strokeWidth={1.8} aria-hidden />
      ) : (
        <Sun size={size === 'sm' ? 17 : 18} strokeWidth={1.8} className="text-lime" aria-hidden />
      )}
      {showLabel && (
        <span className="text-[13px] font-body pr-0.5 hidden min-[380px]:inline">
          {isLight ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}
