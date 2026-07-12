import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { createSupabaseBooking } from '../../services/supabaseData'
import { formatPKR, formatDate, formatTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { Btn } from './Btn'
import { useEffect, useRef, useState } from 'react'

interface BookingStepsProps {
  open: boolean
  onClose: () => void
}

function Checkmark() {
  return (
    <motion.svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      className="mx-auto mb-6 text-lime"
    >
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M20 32 L28 40 L44 24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
    </motion.svg>
  )
}

export function BookingSteps({ open, onClose }: BookingStepsProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookingError, setBookingError] = useState('')
  // Guards against the effect double-firing (unstable deps, StrictMode, etc.)
  const isSubmittingRef = useRef(false)
  const {
    step,
    slot,
    slots,
    arenaName,
    reference,
    startConfirm,
    completeBooking,
    resetBooking,
    setStep,
  } = useBooking()

  useEffect(() => {
    const activeSlots = slots.length > 0 ? slots : slot ? [slot] : []
    if (step !== 'confirming' || activeSlots.length === 0 || !user) return
    // Bail out immediately if a submission is already in flight
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    const activeUser = user
    const bookingSlots = activeSlots

    async function makeBooking() {
      setBookingError('')
      let lastReference = ''
      for (const activeSlot of bookingSlots) {
        const res = await createSupabaseBooking({
          playerId: activeUser.id,
          arenaId: activeSlot.arenaId,
          slotId: activeSlot.id,
          courtId: activeSlot.courtId || '',
          sportId: activeSlot.sportId,
          date: activeSlot.date,
          startTime: activeSlot.startTime,
          endTime: activeSlot.endTime,
          price: activeSlot.price,
        })
        if (!res.success) {
          setBookingError(res.error || 'Failed to confirm booking.')
          setStep('selected')
          isSubmittingRef.current = false
          return
        }
        if (res.reference) lastReference = res.reference
      }
      completeBooking(lastReference)
      // Reset guard only after completing so it can be used for a future booking
      isSubmittingRef.current = false
    }

    makeBooking()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (!open) return null

  const playerName = user?.name ?? 'Player'
  const playerEmail = user?.email ?? ''
  const activeSlots = slots.length > 0 ? slots : slot ? [slot] : []
  const bookingTotal = activeSlots.reduce((sum, currentSlot) => sum + currentSlot.price, 0)
  const bookingCount = activeSlots.length

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-overlay-scrim backdrop-blur-md"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.35 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-turf border-l border-line p-5 sm:p-8 overflow-y-auto"
      >
        {step === 'selected' && activeSlots.length > 0 && (
          <div>
            <h2 className="font-display text-display-md text-chalk mb-6">CONFIRM BOOKING</h2>
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-mist text-[13px] font-body">Arena</p>
                <p className="font-display text-2xl text-chalk">{arenaName}</p>
              </div>
              <div>
                <p className="text-mist text-[13px] mb-2">Selected slots</p>
                <div className="space-y-2">
                  {activeSlots.map((activeSlot) => (
                    <div key={activeSlot.id} className="flex items-center justify-between gap-3 rounded-sm border border-line bg-ground/40 px-3 py-2 min-w-0">
                      <p className="font-mono text-sm text-chalk truncate">
                        {formatDate(activeSlot.date)} · {formatTime(activeSlot.startTime)} – {formatTime(activeSlot.endTime)}
                      </p>
                      <p className="font-mono text-lime text-sm shrink-0">{formatPKR(activeSlot.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-mist text-[13px]">Total price</p>
                <p className="font-mono text-lime text-lg">
                  {bookingCount} hr{bookingCount > 1 ? 's' : ''} · {formatPKR(bookingTotal)}
                </p>
              </div>
              <div className="border-t border-line pt-4">
                <p className="text-mist text-[13px] mb-2">Player</p>
                <p className="font-body">{playerName}</p>
                <p className="font-mono text-xs text-mist">{playerEmail}</p>
              </div>
            </div>
            {bookingError && <p className="text-booked text-sm mb-4">{bookingError}</p>}
            <Btn onClick={startConfirm} className="w-full py-3">
              Confirm Booking
            </Btn>
          </div>
        )}

        {step === 'confirming' && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-12 h-12 border-2 border-lime border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-mist mt-4 text-sm">Confirming your booking...</p>
          </div>
        )}

        {step === 'confirmed' && activeSlots.length > 0 && (
          <div className="text-center">
            <Checkmark />
            <p className="font-mono text-lime text-sm mb-2">Booking confirmed!</p>
            <p className="font-mono text-mist text-xs mb-6">{reference}</p>
            <div className="text-left space-y-3 mb-8 bg-slate p-4 rounded-sm">
              <p className="font-display text-xl">{arenaName}</p>
              <div className="space-y-2">
                {activeSlots.map((activeSlot) => (
                  <p key={activeSlot.id} className="font-mono text-sm text-mist">
                    {formatDate(activeSlot.date)} · {formatTime(activeSlot.startTime)} - {formatTime(activeSlot.endTime)}
                  </p>
                ))}
              </div>
              <p className="font-mono text-lime">
                {bookingCount} hr{bookingCount > 1 ? 's' : ''} · {formatPKR(bookingTotal)}
              </p>
            </div>
            <div className="space-y-3">
              <Btn
                onClick={() => { resetBooking(); onClose(); navigate('/bookings') }}
                className="w-full py-3"
              >
                View Booking
              </Btn>
              <Btn
                variant="outline"
                onClick={() => { resetBooking(); onClose() }}
                className="w-full py-3"
              >
                Book Another
              </Btn>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  )
}
