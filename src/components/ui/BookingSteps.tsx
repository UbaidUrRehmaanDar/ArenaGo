import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { updateSlotStatus } from '../../data/slots'
import { formatPKR, formatDate, formatTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { demoPlayer } from '../../data/users'
import { Btn } from './Btn'
import { useEffect } from 'react'

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
  const {
    step,
    slot,
    arenaName,
    reference,
    startConfirm,
    completeBooking,
    resetBooking,
  } = useBooking()

  useEffect(() => {
    if (step === 'confirming' && slot) {
      updateSlotStatus(slot.id, 'booked')
      const timer = setTimeout(() => {
        completeBooking()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [step, slot, completeBooking])

  if (!open) return null

  const playerName = user?.name ?? demoPlayer.name
  const playerEmail = user?.email ?? demoPlayer.email

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
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-turf border-l border-line p-8 overflow-y-auto"
      >
        {step === 'selected' && slot && (
          <div>
            <h2 className="font-display text-display-md text-chalk mb-6">CONFIRM BOOKING</h2>
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-mist text-[13px] font-body">Arena</p>
                <p className="font-display text-2xl text-chalk">{arenaName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-mist text-[13px]">Date</p>
                  <p className="font-mono text-sm">{formatDate(slot.date)}</p>
                </div>
                <div>
                  <p className="text-mist text-[13px]">Time</p>
                  <p className="font-mono text-sm">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-mist text-[13px]">Price</p>
                <p className="font-mono text-lime text-lg">{formatPKR(slot.price)}</p>
              </div>
              <div className="border-t border-line pt-4">
                <p className="text-mist text-[13px] mb-2">Player</p>
                <p className="font-body">{playerName}</p>
                <p className="font-mono text-xs text-mist">{playerEmail}</p>
              </div>
            </div>
            <Btn onClick={startConfirm} className="w-full py-3">
              Confirm Booking
            </Btn>
          </div>
        )}

        {step === 'confirming' && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-12 h-12 border-2 border-lime border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-mist mt-4 text-sm">Confirming your slot...</p>
          </div>
        )}

        {step === 'confirmed' && slot && (
          <div className="text-center">
            <Checkmark />
            <p className="font-mono text-lime text-sm mb-2">Booking confirmed!</p>
            <p className="font-mono text-mist text-xs mb-6">{reference}</p>
            <div className="text-left space-y-3 mb-8 bg-slate p-4 rounded-sm">
              <p className="font-display text-xl">{arenaName}</p>
              <p className="font-mono text-sm text-mist">
                {formatDate(slot.date)} · {formatTime(slot.startTime)}
              </p>
              <p className="font-mono text-lime">{formatPKR(slot.price)}</p>
            </div>
            <div className="space-y-3">
              <Btn
                onClick={() => { resetBooking(); onClose(); navigate('/dashboard/player') }}
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
