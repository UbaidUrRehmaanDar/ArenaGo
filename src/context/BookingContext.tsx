import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Slot } from '../types'

export type BookingStep = 'idle' | 'selected' | 'confirming' | 'confirmed'

interface BookingState {
  arenaId: string | null
  arenaName: string | null
  slot: Slot | null
  step: BookingStep
  reference: string | null
}

interface BookingContextValue extends BookingState {
  selectSlot: (arenaId: string, arenaName: string, slot: Slot) => void
  clearSlot: () => void
  startConfirm: () => void
  completeBooking: () => void
  resetBooking: () => void
  setStep: (step: BookingStep) => void
}

const initialState: BookingState = {
  arenaId: null,
  arenaName: null,
  slot: null,
  step: 'idle',
  reference: null,
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState)

  const selectSlot = (arenaId: string, arenaName: string, slot: Slot) => {
    setState((s) => ({
      ...s,
      arenaId,
      arenaName,
      slot: s.slot?.id === slot.id ? null : slot,
      step: s.slot?.id === slot.id ? 'idle' : 'selected',
      reference: null,
    }))
  }

  const clearSlot = () => setState((s) => ({ ...s, slot: null, step: 'idle' }))

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
