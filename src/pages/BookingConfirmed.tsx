import { Navbar } from '../components/layout/Navbar'
import { BtnLink } from '../components/ui/Btn'
import { useBooking } from '../context/BookingContext'
import { formatPKR, formatDate, formatTime } from '../utils/formatters'

export function BookingConfirmed() {
  const { slot, arenaName, reference } = useBooking()

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto border-2 border-lime rounded-full flex items-center justify-center mb-6 text-lime">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 16 L14 22 L24 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="font-mono text-lime text-sm">Booking confirmed!</p>
          <p className="font-mono text-mist text-xs mt-2">{reference ?? 'ARG-2024-00847'}</p>
          {slot && (
            <div className="mt-8 bg-slate p-6 rounded-sm text-left">
              <p className="font-display text-xl">{arenaName}</p>
              <p className="font-mono text-sm text-mist mt-2">
                {formatDate(slot.date)} · {formatTime(slot.startTime)}
              </p>
              <p className="font-mono text-lime mt-2">{formatPKR(slot.price)}</p>
            </div>
          )}
          <div className="flex gap-4 mt-8 justify-center">
            <BtnLink to="/dashboard/player" className="px-6 py-3">
              View Booking
            </BtnLink>
            <BtnLink to="/arenas" variant="outline" className="px-6 py-3">
              Book Another
            </BtnLink>
          </div>
        </div>
      </div>
    </>
  )
}
