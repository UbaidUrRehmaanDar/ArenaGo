import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Compass, MapPin, Ticket } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { BookingSteps } from '../components/ui/BookingSteps'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import { fetchArenas } from '../services/supabaseData'
import type { Arena } from '../types'
import { formatPKR, formatDate, formatTime } from '../utils/formatters'

export default function BookingFlow() {
  const { user } = useAuth()
  const { arenaId, arenaName, slots: selectedSlots, step, resetBooking } = useBooking()
  const [arenas, setArenas] = useState<Arena[]>([])

  useEffect(() => {
    async function load() {
      const data = await fetchArenas()
      setArenas(data)
    }
    load()
  }, [])

  const featuredArenas = useMemo(() => arenas.filter((arena) => arena.isFeatured).slice(0, 3), [arenas])
  const activeArena = useMemo(
    () => arenas.find((arena) => arena.id === arenaId) ?? null,
    [arenas, arenaId]
  )
  const selectedTotal = selectedSlots.reduce((sum, currentSlot) => sum + currentSlot.price, 0)

  if (!user) return <Navigate to="/login" replace />

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-end">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <Ticket size={14} />
                  Booking Desk
                </span>
                <h1 className="font-display text-[clamp(2.4rem,8vw,5.4rem)] text-chalk leading-[0.92]">
                  {selectedSlots.length > 0
                    ? 'Your slot is selected. Ready to confirm?'
                    : 'Pick an arena to start your booking.'}
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-mist">
                  {selectedSlots.length > 0
                    ? 'Review your selected slot below, then confirm to lock it in. You can also go back to the arena to adjust your selection.'
                    : 'Browse the arena listings, select a time slot, and return here to confirm. Your selection is saved as you go.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Current Arena</p>
                  <p className="mt-2 text-chalk text-xl font-display truncate">{arenaName || 'None selected'}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Selection</p>
                  <p className="mt-2 text-chalk text-xl font-display">{selectedSlots.length} hr{selectedSlots.length === 1 ? '' : 's'}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Price</p>
                  <p className="mt-2 text-chalk text-xl font-display">{selectedSlots.length > 0 ? formatPKR(selectedTotal) : '—'}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">State</p>
                  <p className="mt-2 text-chalk text-xl font-display capitalize">{step}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <BtnLink to="/arenas" className="px-5 py-3 text-sm">
                Pick an Arena
              </BtnLink>
              <BtnLink to="/bookings" variant="outline" className="px-5 py-3 text-sm">
                View My Bookings
              </BtnLink>
            </div>
          </section>

          {selectedSlots.length > 0 && (
            <section className="rounded-[24px] border border-lime/30 bg-lime/5 p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-mist font-mono">Continue booking</p>
                  <h2 className="font-display text-2xl text-chalk mt-2">Your selected slot is ready to confirm.</h2>
                </div>
                {activeArena && (
                  <BtnLink to={`/arenas/${activeArena.slug}`} variant="outline" className="px-4 py-2 text-sm">
                    Open Arena
                  </BtnLink>
                )}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {selectedSlots.map((selectedSlot) => (
                  <div key={selectedSlot.id} className="rounded-2xl border border-line bg-slate p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">{formatDate(selectedSlot.date)}</p>
                    <p className="mt-2 text-chalk text-lg font-display">
                      {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                    </p>
                    <p className="mt-2 text-lime font-mono">{formatPKR(selectedSlot.price)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Compass,
                title: 'Start at arenas',
                body: 'Search, filter, and open the schedule for any venue before booking.',
              },
              {
                icon: CalendarClock,
                title: 'Hold a slot',
                body: 'Selection happens in the arena detail drawer so the chosen slot stays in context.',
              },
              {
                icon: CheckCircle2,
                title: 'Confirm in place',
                body: 'The booking drawer keeps the final confirmation step visually separate and easy to inspect.',
              },
            ].map((item) => (
              <article key={item.title} className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
                <item.icon size={18} className="text-lime" />
                <h3 className="font-display text-xl text-chalk mt-4">{item.title}</h3>
                <p className="text-sm text-mist mt-2 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </section>

          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-chalk">Featured Arenas</h2>
              <span className="text-[11px] uppercase tracking-[0.22em] text-mist font-mono">Best starting points</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {featuredArenas.length === 0 && (
                <div className="rounded-2xl border border-line bg-slate p-4 text-sm text-mist md:col-span-3">
                  No featured arenas yet.
                </div>
              )}
              {featuredArenas.map((arena) => (
                <Link
                  key={arena.id}
                  to={`/arenas/${arena.slug}`}
                  className="rounded-2xl border border-line bg-slate overflow-hidden hover:border-lime/30 transition-colors"
                >
                  <img src={arena.images[0]} alt={arena.name} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <p className="font-display text-2xl text-chalk truncate">{arena.name}</p>
                    <p className="text-sm text-mist mt-2 flex items-center gap-1">
                      <MapPin size={12} className="text-lime" />
                      {arena.location.area}, {arena.location.city}
                    </p>
                    <p className="text-xs text-mist font-mono mt-2">
                      {arena.rating} rating · {arena.reviewCount} reviews
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </PageWrapper>

      <Footer />
      <BookingSteps open={step !== 'idle'} onClose={resetBooking} />
    </>
  )
}
