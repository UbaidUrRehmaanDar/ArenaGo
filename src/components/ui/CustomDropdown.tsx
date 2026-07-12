import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/formatters'

interface CustomDropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CustomDropdown({ options, value, onChange, placeholder = 'Select an option', className }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt === value)

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body flex items-center justify-between text-left"
      >
        <span className={cn(!selectedOption && 'text-mist')}>
          {selectedOption || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn('text-mist transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-[100] w-full mt-1 bg-slate border border-line rounded-sm shadow-lg max-h-60 overflow-y-auto"
          onWheel={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-4 py-3 text-left font-body transition-colors whitespace-nowrap',
                'hover:bg-lime/10 hover:text-lime',
                option === value ? 'text-lime bg-lime/5' : 'text-chalk'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
