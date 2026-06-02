import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../utils/formatters'

export type SortValue = 'popular' | 'price' | 'rating'

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'popular', label: 'Sort: Most Popular' },
  { value: 'price', label: 'Sort: Price Low to High' },
  { value: 'rating', label: 'Sort: Rating' },
]

export function SortDropdown({
  value,
  onChange,
}: {
  value: SortValue
  onChange: (v: SortValue) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(() => {
    return SORT_OPTIONS.find((o) => o.value === value)?.label ?? SORT_OPTIONS[0].label
  }, [value])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    if (!open) {
      gsap.set(menu, { pointerEvents: 'none', opacity: 0, y: -6 })
      return
    }

    gsap.set(menu, { pointerEvents: 'auto', opacity: 0, y: -6 })
    gsap.to(menu, {
      opacity: 1,
      y: 0,
      duration: 0.18,
      ease: 'power3.out',
    })
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'bg-slate text-chalk text-[13px] px-3 py-2 rounded-sm border border-line',
          'focus:outline-none focus:outline focus:outline-2 focus:outline-lime',
          'flex items-center justify-between gap-3 min-w-[170px] sm:min-w-[220px]'
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className="shrink-0 text-mist" />
      </button>

      <div
        ref={menuRef}
        className={cn(
          'absolute right-0 mt-2 w-full rounded-sm border border-line bg-[rgb(var(--color-ground))]',
          'shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden z-50'
        )}
        style={{ transformOrigin: 'top right' }}
      >
        <ul role="listbox" aria-label="Sort options" className="py-1">
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === value
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-[13px] font-body',
                    'transition-colors duration-150',
                    active ? 'bg-lime/10 text-lime' : 'text-chalk hover:bg-white/5'
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate">{opt.label}</span>
                    {active && <Check size={16} className="text-lime shrink-0" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

