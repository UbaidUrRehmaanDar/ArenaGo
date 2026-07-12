import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CalendarClock, CircleSlash, MapPin, Ticket } from 'lucide-react'
import { format, isFuture, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink, Btn } from '../components/ui/Btn'
import { StatCard } from '../components/ui/StatCard'
import { SportTag } from '../components/ui/SportTag'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { cancelSupabaseBooking, fetchArenas, fetchPlayerBookings } from '../services/supabaseData'
import type { Arena, Booking, SportType } from '../types'
import { cn, formatPKR } from '../utils/formatters'

const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'] as const

type BookingTab = (typeof tabs)[number]

export function PlayerBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [arenas, setArenas] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingTab>('All')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    const [{ bookings: bookingData }, arenaData] = await Promise.all([
      fetchPlayerBookings(user.id, 1, 50),
      fetchArenas(),
    ])
    setBookings(bookingData)
    setArenas(arenaData)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const arenaMap = useMemo(() => new Map(arenas.map((arena) => [arena.id, arena])), [arenas])

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        if (activeTab === 'Upcoming') return booking.status === 'confirmed' && isFuture(parseISO(booking.date))
        if (activeTab === 'Completed') return booking.status === 'completed'
        if (activeTab === 'Cancelled') return booking.status === 'cancelled'
        return true
      })
      .sort((left, right) => {
        const leftValue = new Date(`${left.date}T${left.startTime}`).getTime()
        const rightValue = new Date(`${right.date}T${right.startTime}`).getTime()
        return rightValue - leftValue
      })
  }, [activeTab, bookings])

  const upcomingBookings = bookings.filter(
    (booking) => booking.status === 'confirmed' && isFuture(parseISO(booking.date))
  )
  const completedBookings = bookings.filter((booking) => booking.status === 'completed')
  const cancelledBookings = bookings.filter((booking) => booking.status === 'cancelled')
  const totalSpend = bookings.reduce((sum, booking) => sum + Number(booking.amountPaid ?? booking.price ?? 0), 0)

  const handleCancel = async (booking: Booking) => {
    setCancellingId(booking.id)
    const success = await cancelSupabaseBooking(booking.id, booking.timeSlotId ?? booking.slotId)
    setCancellingId(null)
    if (success) {
      await loadData()
    }
  }

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <LoadingState message="Loading your bookings..." />

  const content = (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-end">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <Ticket size={14} />
                  My Bookings
                </span>
                <h1 className="font-display text-[clamp(2.4rem,8vw,5.4rem)] text-chalk leading-[0.92]">
                  Everything you’ve locked in, in one clean view.
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-mist">
                  Upcoming slots, completed matches, and cancellations live here. Use this page to review your history and jump back into booking when you’re ready.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Upcoming" value={upcomingBookings.length} />
                <StatCard label="Completed" value={completedBookings.length} />
                <StatCard label="Cancelled" value={cancelledBookings.length} />
                <StatCard label="Total Spend" value={formatPKR(totalSpend)} />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <BtnLink to="/booking" className="px-5 py-3 text-sm">
                Book Another Slot
              </BtnLink>
              <BtnLink to="/arenas" variant="outline" className="px-5 py-3 text-sm">
                Browse Arenas
              </BtnLink>
            </div>
          </section>

          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-chalk">Booking History</h2>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn('btn-chip', activeTab === tab ? 'btn-chip-active' : 'btn-chip-inactive')}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredBookings.length === 0 && (
                <div className="rounded-2xl border border-line bg-slate p-4 text-sm text-mist">
                  No bookings in this view yet. Pick a venue and your reservations will appear here.
                </div>
              )}

              {filteredBookings.map((booking) => {
                const arena = arenaMap.get(booking.arenaId)
                const canCancel = booking.status === 'confirmed' && isFuture(parseISO(booking.date))

                return (
                  <article key={booking.id} className="rounded-2xl border border-line bg-slate p-4 md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-xl md:text-2xl text-chalk truncate">
                            {arena?.name || 'Unknown arena'}
                          </p>
                          <span
                            className={cn(
                              'text-[10px] uppercase font-mono px-2 py-1 rounded-full border',
                              booking.status === 'confirmed' && 'border-lime/30 bg-lime/10 text-lime',
                              booking.status === 'completed' && 'border-line bg-ground/70 text-mist',
                              booking.status === 'cancelled' && 'border-booked/30 bg-booked/10 text-booked'
                            )}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-mist">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={14} className="text-lime" />
                            {format(parseISO(booking.date), 'd MMM yyyy')}
                          </span>
                          <span>{booking.startTime} - {booking.endTime}</span>
                          {arena && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={14} className="text-lime" />
                              {arena.location.area}, {arena.location.city}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <SportTag sport={(booking.sportId || arena?.sport || 'Football') as SportType} />
                          {arena && (
                            <BtnLink to={`/arenas/${arena.slug}`} variant="outline" className="px-4 py-2 text-xs">
                              View Arena
                            </BtnLink>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                        <p className="font-mono text-lime text-lg">
                          {formatPKR(Number(booking.amountPaid ?? booking.price ?? 0))}
                        </p>
                        {canCancel ? (
                          <Btn
                            type="button"
                            onClick={() => handleCancel(booking)}
                            disabled={cancellingId === booking.id}
                            variant="outline"
                            className="px-5 py-2.5 text-sm"
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </Btn>
                        ) : (
                          <p className="text-[11px] text-mist flex items-center gap-1">
                            <CircleSlash size={12} />
                            {booking.status === 'cancelled' ? 'Cancelled booking' : 'History only'}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
  )

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-20 md:pb-16">
        {content}
      </PageWrapper>
      <Footer />
    </>
  )
}
