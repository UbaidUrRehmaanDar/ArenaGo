import { addDays, format } from 'date-fns'
import type { Slot, SlotStatus } from '../types'
import { arenas } from './arenas'
import { getSlotPrice } from '../utils/formatters'

const HOURS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 6
  return `${h.toString().padStart(2, '0')}:00`
})

function isPeakHour(hour: number): boolean {
  return (hour >= 6 && hour < 10) || (hour >= 17 && hour < 22)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateStatus(arenaIndex: number, dayIndex: number, hourIndex: number): SlotStatus {
  const hour = hourIndex + 6
  const peak = isPeakHour(hour)
  const seed = arenaIndex * 1000 + dayIndex * 100 + hourIndex
  const r = seededRandom(seed)

  if (r < 0.08) return 'blocked'
  if (peak && r < 0.62) return 'booked'
  if (peak && r < 0.72) return 'pending'
  if (!peak && r < 0.15) return 'booked'
  if (!peak && r < 0.2) return 'pending'
  return 'available'
}

function buildSlots(): Slot[] {
  const slots: Slot[] = []
  const today = new Date()

  arenas.forEach((arena, arenaIndex) => {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const date = format(addDays(today, dayIndex), 'yyyy-MM-dd')
      HOURS.forEach((startTime, hourIndex) => {
        const hour = hourIndex + 6
        const endHour = hour + 1
        const endTime = `${endHour.toString().padStart(2, '0')}:00`
        const peak = isPeakHour(hour)
        const status = generateStatus(arenaIndex, dayIndex, hourIndex)
        const basePrice = getSlotPrice(
          arena.pricing.weekday,
          arena.pricing.weekend,
          arena.pricing.peak,
          date,
          peak
        )

        slots.push({
          id: `slot-${arena.id}-${date}-${startTime}`,
          arenaId: arena.id,
          date,
          startTime,
          endTime,
          status,
          price: basePrice,
          isPeak: peak,
        })
      })
    }
  })

  return slots
}

export const slots: Slot[] = buildSlots()

export function getSlotsForArena(arenaId: string, date: string): Slot[] {
  return slots.filter((s) => s.arenaId === arenaId && s.date === date)
}

export function getSlotsForArenaDate(arenaId: string, date: string): Slot[] {
  return getSlotsForArena(arenaId, date).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )
}

export function updateSlotStatus(slotId: string, status: SlotStatus): void {
  const slot = slots.find((s) => s.id === slotId)
  if (slot) slot.status = status
}
