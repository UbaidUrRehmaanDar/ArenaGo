import { Navbar } from '../components/layout/Navbar'
import { BtnLink } from '../components/ui/Btn'
import { useBooking } from '../context/BookingContext'
import { formatPKR, formatDate, formatTime } from '../utils/formatters'

export default function BookingConfirmed() {
  const { slot, slots, arenaName, reference } = useBooking()
  const activeSlots = slots.length > 0 ? slots : slot ? [slot] : []
  const total = activeSlots.reduce((sum, currentSlot) => sum + currentSlot.price, 0)

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto border-2 border-lime rounded-full flex items-center justify-center mb-6 text-lime animate-pulse">
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
          {reference && (
            <p className="font-mono text-mist text-xs mt-2">{reference}</p>
          )}
          {activeSlots.length > 0 && (
            <div className="mt-8 bg-slate p-6 rounded-sm text-left">
              <p className="font-display text-xl">{arenaName}</p>
              <div className="mt-2 space-y-1">
                {activeSlots.map((activeSlot) => (
                  <p key={activeSlot.id} className="font-mono text-sm text-mist">
                    {formatDate(activeSlot.date)} · {formatTime(activeSlot.startTime)} - {formatTime(activeSlot.endTime)}
                  </p>
                ))}
              </div>
              <p className="font-mono text-lime mt-2">
                {activeSlots.length} hr{activeSlots.length > 1 ? 's' : ''} · {formatPKR(total)}
              </p>
            </div>
          )}
          <div className="flex gap-4 mt-8 justify-center">
            <BtnLink to="/bookings" className="px-6 py-3">
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
