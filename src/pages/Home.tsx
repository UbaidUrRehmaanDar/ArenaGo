import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { format, isFuture, parseISO } from 'date-fns'
import { CalendarClock, ChevronRight, Compass, Map, Sparkles, Trophy } from 'lucide-react'
import { gsap } from 'gsap'
import { Navbar } from '../components/layout/Navbar'
import { ArenaCard } from '../components/ui/ArenaCard'
import { BtnLink } from '../components/ui/Btn'
import { useAuth } from '../context/AuthContext'
import { formatPKR } from '../utils/formatters'
import { fetchArenas, fetchPlayerBookings, fetchOwnerRevenue, fetchRecentActivity, fetchFavoritesForUser } from '../services/supabaseData'
import type { Arena, Booking, ActivityItem } from '../types'

export default function Home() {
  const { user } = useAuth()
  const rootRef = useRef<HTMLElement>(null)

  const [arenas, setArenas] = useState<Arena[]>([])
  const [playerBookings, setPlayerBookings] = useState<Booking[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [ownerRevenue, setOwnerRevenue] = useState(0)
  const [favouriteCount, setFavouriteCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [fetchedArenas, activity] = await Promise.all([
        fetchArenas(),
        fetchRecentActivity(8),
      ])
      setArenas(fetchedArenas)
      setRecentActivity(activity)

      if (user?.id && user.role === 'player') {
        const [{ bookings }, favs] = await Promise.all([
          fetchPlayerBookings(user.id),
          fetchFavoritesForUser(user.id),
        ])
        setPlayerBookings(bookings)
        setFavouriteCount(favs.length)
      }
      if (user?.role === 'owner' && user.arenaIds?.length) {
        const revenue = await fetchOwnerRevenue(user.arenaIds)
        setOwnerRevenue(revenue)
      }
      setLoading(false)
    }
    loadData()
  }, [user?.id])

  useLayoutEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-home-hero]',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
      gsap.fromTo(
        '[data-home-section]',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      )
      gsap.fromTo(
        '[data-home-card]',
        { opacity: 0, y: 18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  const featuredArenas = useMemo(() => arenas.filter((a) => a.isFeatured).slice(0, 4), [arenas])
  const trendingArenas = useMemo(
    () => [...arenas].sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 3),
    [arenas]
  )
  const upcomingBookings = useMemo(
    () =>
      playerBookings
        .filter((b) => b.status === 'confirmed' && isFuture(parseISO(b.date)))
        .slice(0, 3),
    [playerBookings]
  )

  const ownerArenas = useMemo(
    () => arenas.filter((arena) => user?.arenaIds?.includes(arena.id)),
    [arenas, user]
  )

  const role = user?.role ?? 'player'

  // Derive preferred sport from booking history
  const sportCounts: Record<string, number> = {}
  playerBookings.forEach((b) => {
    const s = b.sportId || 'Football'
    sportCounts[s] = (sportCounts[s] ?? 0) + 1
  })
  const preferredSport =
    Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const topStats = role === 'owner'
    ? [
        { label: 'Owned Arenas', value: ownerArenas.length.toString() },
        {
          label: 'Avg Occupancy',
          value: ownerArenas.length > 0
            ? `${Math.round(ownerArenas.reduce((acc, a) => acc + a.occupancyRate, 0) / ownerArenas.length)}%`
            : '0%',
        },
        { label: 'Total Revenue', value: formatPKR(ownerRevenue) },
      ]
    : [
        { label: 'Upcoming Bookings', value: upcomingBookings.length.toString() },
        { label: 'Preferred Sport',   value: playerBookings.length > 0 ? preferredSport : '—' },
        { label: 'Saved Arenas',      value: favouriteCount.toString() },
      ]
  const scheduleLink = featuredArenas[0] ? `/arenas/${featuredArenas[0].slug}/schedule` : '/arenas'

  if (!user) return <Navigate to="/login" replace />

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-20 md:pt-24 px-4 md:px-6 lg:px-8 pb-24 md:pb-10">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            <div className="h-36 md:h-44 rounded-2xl skeleton-shimmer" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4 md:gap-5">
              <div className="h-56 rounded-2xl skeleton-shimmer" />
              <div className="h-56 rounded-2xl skeleton-shimmer" />
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main ref={rootRef} className="pt-20 md:pt-24 px-4 md:px-6 lg:px-8 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <section
            data-home-hero
            className="rounded-2xl border border-line bg-gradient-to-br from-turf via-slate/50 to-ground p-4 md:p-6 lg:p-8 noise-overlay overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-6">
              <div className="min-w-0">
                <p className="text-mist font-mono text-[10px] md:text-xs uppercase tracking-[0.22em]">
                  {role === 'owner' ? 'Owner Dashboard' : 'Player Home'}
                </p>
                <h1 className="font-display text-2xl md:text-3xl lg:text-5xl text-chalk mt-2 md:mt-3 truncate">
                  Welcome back, {user.name.split(' ')[0]}
                </h1>
                <p className="text-mist max-w-2xl mt-2 md:mt-3 text-xs md:text-sm lg:text-base">
                  Your next game should only take a few taps. Check your schedule, discover trending arenas,
                  and jump straight into booking.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <BtnLink to="/booking" className="px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm">
                  Quick Book
                </BtnLink>
                <BtnLink to="/arenas" variant="outline" className="px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm">
                  Explore Arenas
                </BtnLink>
                <BtnLink to="/promotions" variant="outline" className="px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm">
                  Live Offers
                </BtnLink>
              </div>
            </div>
          </section>

          <section data-home-section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {topStats.map((item) => (
              <article key={item.label} data-home-card className="bg-slate rounded-xl border border-line p-3 md:p-4 lg:p-5">
                <p className="text-mist text-[11px] md:text-xs lg:text-sm">{item.label}</p>
                <p className="font-display text-xl md:text-2xl lg:text-3xl text-chalk mt-1 md:mt-2">{item.value}</p>
              </article>
            ))}
          </section>

          <section data-home-section className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4 md:gap-5">
            <div data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg md:text-xl lg:text-2xl">Trending Right Now</h2>
                <Link to="/arenas" className="text-mist hover:text-chalk text-xs md:text-sm inline-flex items-center gap-1">
                  See all <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {trendingArenas.map((arena) => (
                  <ArenaCard key={arena.id} arena={arena} variant="carousel" />
                ))}
              </div>
            </div>

            {/* Up Next — player only */}
            {role === 'player' && (
              <aside data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-5">
                <h2 className="font-display text-lg md:text-xl">Up Next</h2>
                <div className="mt-4 space-y-3">
                  {upcomingBookings.length === 0 && (
                    <div className="rounded-lg bg-slate p-3 md:p-4 text-xs md:text-sm text-mist">
                      No upcoming bookings yet. Pick a venue and lock your slot.
                    </div>
                  )}
                  {upcomingBookings.map((booking) => {
                    const arena = arenas.find((a) => a.id === booking.arenaId)
                    return (
                      <article key={booking.id} className="rounded-lg bg-slate border border-line p-3 md:p-3.5">
                        <p className="font-body text-chalk text-sm md:text-base truncate">{arena?.name}</p>
                        <p className="text-[11px] md:text-xs text-mist mt-1">
                          {format(parseISO(booking.date), 'EEE, d MMM')} at {booking.startTime}
                        </p>
                      </article>
                    )
                  })}
                </div>
                <BtnLink to="/bookings" variant="outline" className="w-full mt-4 text-xs md:text-sm py-2 md:py-2.5">
                  My Bookings
                </BtnLink>
              </aside>
            )}
            {/* Owner quick-links — owner only */}
            {role === 'owner' && (
              <aside data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-5">
                <h2 className="font-display text-lg md:text-xl">Quick Links</h2>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'View Bookings',  to: '/dashboard/owner/bookings'  },
                    { label: 'Analytics',      to: '/dashboard/owner/analytics' },
                    { label: 'Slot Manager',   to: '/dashboard/owner/slots'     },
                    { label: 'Campaigns',      to: '/dashboard/owner/campaigns' },
                  ].map((lnk) => (
                    <Link
                      key={lnk.to}
                      to={lnk.to}
                      className="block rounded-lg bg-slate border border-line px-4 py-3 text-sm text-chalk hover:border-lime/40 transition-colors"
                    >
                      {lnk.label}
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </section>

          <section data-home-section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-4 md:gap-5">
            <div data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
              <h2 className="font-display text-lg md:text-xl lg:text-2xl">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: CalendarClock, title: 'Book A Slot',     to: '/arenas',     desc: 'Find an arena and pick your slot.' },
                  { icon: Compass,       title: 'Browse Arenas',   to: '/arenas',     desc: 'Filter by area, sport, and budget.' },
                  { icon: Trophy,        title: 'My Profile',      to: '/profile',    desc: 'See your account, saves, and alerts.' },
                  { icon: Sparkles,      title: 'Live Offers',     to: '/promotions', desc: 'Open the current promotions feed.' },
                  { icon: Map,           title: 'Arena Schedule',  to: scheduleLink,  desc: 'Check slot pressure before you book.' },
                ].map((item) => (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="rounded-lg bg-slate border border-line p-3 md:p-4 hover:border-lime/40 transition-colors"
                  >
                    <item.icon size={16} className="text-lime" />
                    <p className="font-body text-chalk mt-2 md:mt-3 text-sm md:text-base">{item.title}</p>
                    <p className="text-[11px] md:text-xs text-mist mt-1">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
              <h2 className="font-display text-lg md:text-xl lg:text-2xl">Featured Arenas</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {featuredArenas.map((arena) => (
                  <ArenaCard key={arena.id} arena={arena} />
                ))}
              </div>
            </div>
          </section>

          <section data-home-section data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg md:text-xl lg:text-2xl">Live Community Pulse</h2>
              <span className="text-[10px] md:text-xs text-mist font-mono">Updated moments ago</span>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
              {recentActivity.map((activity) => (
                <article key={activity.id} className="rounded-lg bg-slate border border-line p-2.5 md:p-3">
                  <p className="text-xs md:text-sm text-chalk">
                    <span className="text-lime">{activity.playerName}</span> {activity.action} {activity.arenaName}
                  </p>
                  <p className="text-[10px] md:text-xs text-mist mt-1">
                    {activity.sport} - {activity.time}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
