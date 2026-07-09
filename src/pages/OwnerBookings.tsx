import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CalendarClock, MapPin, ShieldCheck, Users } from 'lucide-react'
import { format, isFuture, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../context/AuthContext'
import { fetchArenaBookings, fetchArenas, fetchProfileRecord } from '../services/supabaseData'
import type { Arena, Booking, ProfileRecord } from '../types'
import { cn, formatPKR } from '../utils/formatters'

const tabs = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'] as const

type BookingTab = (typeof tabs)[number]

export function OwnerBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [arenas, setArenas] = useState<Arena[]>([])
  const [profiles, setProfiles] = useState<ProfileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingTab>('All')

  const loadData = async () => {
    if (!user?.arenaIds?.length) return
    setLoading(true)
    const [arenaData, bookingGroups] = await Promise.all([
      fetchArenas(),
      Promise.all(user.arenaIds.map((arenaId) => fetchArenaBookings(arenaId))),
    ])

    const allBookings = bookingGroups.flat().sort((left, right) => {
      const leftValue = new Date(`${left.date}T${left.startTime}`).getTime()
      const rightValue = new Date(`${right.date}T${right.startTime}`).getTime()
      return rightValue - leftValue
    })

    const uniquePlayerIds = [...new Set(allBookings.map((booking) => booking.playerId))]
    const playerProfiles = await Promise.all(uniquePlayerIds.map((id) => fetchProfileRecord(id)))

    setArenas(arenaData)
    setBookings(allBookings)
    setProfiles(playerProfiles.filter((profile): profile is ProfileRecord => Boolean(profile)))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const arenaMap = useMemo(() => new Map(arenas.map((arena) => [arena.id, arena])), [arenas])
  const profileMap = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])

  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.amountPaid ?? booking.price ?? 0), 0)
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayBookings = bookings.filter((booking) => booking.date === todayKey)
  const upcomingBookings = bookings.filter((booking) => booking.status === 'confirmed' && isFuture(parseISO(booking.date)))
  const completedBookings = bookings.filter((booking) => booking.status === 'completed')
  const cancelledBookings = bookings.filter((booking) => booking.status === 'cancelled')

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (activeTab === 'Today') return booking.date === todayKey
      if (activeTab === 'Upcoming') return booking.status === 'confirmed' && isFuture(parseISO(booking.date))
      if (activeTab === 'Completed') return booking.status === 'completed'
      if (activeTab === 'Cancelled') return booking.status === 'cancelled'
      return true
    })
  }, [activeTab, bookings, todayKey])

  if (!user) return <Navigate to="/login" replace />
  if (loading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center text-mist">
        Loading your bookings...
      </div>
    )
  }

  if (!user.arenaIds?.length) {
    return (
      <>
        <Navbar />
        <PageWrapper className="pt-20 md:pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <section className="rounded-[28px] border border-line bg-turf p-6 md:p-8 text-center">
              <ShieldCheck size={24} className="text-lime mx-auto mb-4" />
              <h1 className="font-display text-display-md text-chalk">OWNER BOOKING CONTROL</h1>
              <p className="mt-4 text-mist max-w-xl mx-auto text-sm md:text-base">
                Once your owner profile is connected to one or more arenas, the live booking board, customer profiles, and daily queue will appear here.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <BtnLink to="/profile" className="px-5 py-3 text-sm">
                  Review Profile
                </BtnLink>
                <BtnLink to="/dashboard/owner/analytics" variant="outline" className="px-5 py-3 text-sm">
                  View Analytics
                </BtnLink>
              </div>
            </section>
          </div>
        </PageWrapper>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-end">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <Users size={14} />
                  Booking Operations
                </span>
                <h1 className="font-display text-[clamp(2.4rem,8vw,5.4rem)] text-chalk leading-[0.92]">
                  Owner control for every live booking, at a glance.
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-mist">
                  This page shows the live queue, the day’s demand, and the customer behind each reservation so you can manage the arena instead of guessing from summary charts.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Today" value={todayBookings.length} />
                <StatCard label="Upcoming" value={upcomingBookings.length} />
                <StatCard label="Completed" value={completedBookings.length} />
                <StatCard label="Revenue" value={formatPKR(totalRevenue)} />
                <StatCard label="Cancelled" value={cancelledBookings.length} />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <BtnLink to="/dashboard/owner/slots" className="px-5 py-3 text-sm">
                Open Slot Manager
              </BtnLink>
              <BtnLink to="/dashboard/owner/analytics" variant="outline" className="px-5 py-3 text-sm">
                See Analytics
              </BtnLink>
            </div>
          </section>

          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-chalk">Booking Board</h2>
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
                  No bookings in this slice yet.
                </div>
              )}

              {filteredBookings.map((booking) => {
                const arena = arenaMap.get(booking.arenaId)
                const profile = profileMap.get(booking.playerId)

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
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-mist">
                          <span>Customer:</span>
                          <span className="text-chalk">
                            {profile?.fullName || profile?.email || booking.playerId}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3">
                        <p className="font-mono text-lime text-lg">
                          {formatPKR(Number(booking.amountPaid ?? booking.price ?? 0))}
                        </p>
                        {arena ? (
                          <BtnLink to={`/arenas/${arena.slug}`} variant="outline" className="px-5 py-2.5 text-sm">
                            Open Arena
                          </BtnLink>
                        ) : (
                          <span className="text-[11px] text-mist">Arena record missing</span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
