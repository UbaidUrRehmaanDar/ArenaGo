import { cn } from '../../utils/formatters'
import type { Slot } from '../../types'

interface SlotGridProps {
  slots: Slot[]
  selectedId?: string | null
  onSelect?: (slot: Slot) => void
  compact?: boolean
  readOnly?: boolean
}

export function SlotGrid({
  slots,
  selectedId,
  onSelect,
  compact = false,
  readOnly = false,
}: SlotGridProps) {
  const peakSlots = slots.filter((s) => s.isPeak)
  const peakStart = peakSlots[0]?.startTime
  const peakEnd = peakSlots[peakSlots.length - 1]?.endTime

  return (
    <div>
      {peakStart && peakEnd && (
        <div className="relative mb-2 h-4">
          <span className="font-mono text-[10px] text-amber uppercase tracking-widest">
            PEAK
          </span>
        </div>
      )}
      <div className={cn('flex flex-wrap gap-2', compact && 'gap-1.5')}>
        {slots.map((slot) => {
          const isSelected = selectedId === slot.id
          const isBooked = slot.status === 'booked' || slot.status === 'blocked'
          const isPending = slot.status === 'pending'

          return (
            <button
              key={slot.id}
              type="button"
              disabled={isBooked || readOnly}
              onClick={() => !isBooked && !readOnly && onSelect?.(slot)}
              style={{
                borderRadius: isSelected ? '10px' : '4px',
                transition: 'border-radius 350ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms ease, color 150ms ease',
              }}
              className={cn(
                'font-mono text-xs w-20 h-10 border',
                'focus:outline focus:outline-2 focus:outline-lime focus:outline-offset-2',
                isBooked &&
                  'bg-[rgba(255,68,68,0.2)] border-transparent text-mist line-through cursor-not-allowed',
                isPending && !isBooked && 'border-amber/50 text-chalk opacity-70',
                !isBooked && !isSelected && !isPending &&
                  'bg-slate border-lime/50 text-lime hover:scale-105 hover:bg-slate/80',
                !isBooked && !isSelected && isPending &&
                  'bg-slate border-lime/30 text-chalk',
                slot.isPeak && !isBooked && !isSelected && 'border-l-amber border-l-[3px]',
                isSelected && 'bg-lime text-ground border-lime scale-105'
              )}
            >
              {slot.startTime}
            </button>
          )
        })}
      </div>
    </div>
  )
}
