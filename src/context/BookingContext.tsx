import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Slot } from '../types'

export type BookingStep = 'idle' | 'selected' | 'confirming' | 'confirmed'

interface BookingState {
  arenaId: string | null
  arenaName: string | null
  slots: Slot[]
  step: BookingStep
  reference: string | null
}

interface BookingContextValue extends BookingState {
  slot: Slot | null
  selectSlot: (arenaId: string, arenaName: string, slot: Slot) => Slot[]
  clearSlot: () => void
  startConfirm: () => void
  completeBooking: () => void
  resetBooking: () => void
  setStep: (step: BookingStep) => void
}

const initialState: BookingState = {
  arenaId: null,
  arenaName: null,
  slots: [],
  step: 'idle',
  reference: null,
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState)

  const selectSlot = (arenaId: string, arenaName: string, slot: Slot) => {
    let nextSlots: Slot[] = []
    setState((s) => ({
      ...s,
      slots: (() => {
        const sameArena = s.arenaId === arenaId || s.slots.length === 0
        const baseSlots = sameArena ? s.slots : []
        const exists = baseSlots.some((selected) => selected.id === slot.id)
        nextSlots = exists
          ? baseSlots.filter((selected) => selected.id !== slot.id)
          : [...baseSlots, slot]

        return nextSlots.sort((left, right) => left.startTime.localeCompare(right.startTime))
      })(),
      arenaId: nextSlots.length > 0 ? arenaId : null,
      arenaName: nextSlots.length > 0 ? arenaName : null,
      step: nextSlots.length > 0 ? 'selected' : 'idle',
      reference: null,
    }))
    return nextSlots
  }

  const clearSlot = () => setState((s) => ({ ...s, slots: [], step: 'idle', arenaId: null, arenaName: null }))

  const startConfirm = () => setState((s) => ({ ...s, step: 'confirming' }))

  const completeBooking = () => {
    const ref = `ARG-2024-${String(Math.floor(Math.random() * 90000) + 10000)}`
    setState((s) => ({ ...s, step: 'confirmed', reference: ref }))
  }

  const resetBooking = () => setState(initialState)

  const setStep = (step: BookingStep) => setState((s) => ({ ...s, step }))

  return (
    <BookingContext.Provider
      value={{
        ...state,
        slot: state.slots[0] ?? null,
        selectSlot,
        clearSlot,
        startConfirm,
        completeBooking,
        resetBooking,
        setStep,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
