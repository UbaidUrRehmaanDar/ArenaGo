import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { format, isFuture, parseISO } from 'date-fns'
import { CalendarClock, ChevronRight, Compass, Sparkles, Trophy } from 'lucide-react'
import { gsap } from 'gsap'
import { Navbar } from '../components/layout/Navbar'
import { ArenaCard } from '../components/ui/ArenaCard'
import { BtnLink } from '../components/ui/Btn'
import { useAuth } from '../context/AuthContext'
import { activityFeed } from '../data/activity'
import { demoOwner } from '../data/users'
import { formatPKR } from '../utils/formatters'
import { fetchArenas, fetchPlayerBookings } from '../services/supabaseData'
import type { Arena, Booking } from '../types'

export function Home() {
  const { user } = useAuth()
  const rootRef = useRef<HTMLElement>(null)

  const [arenas, setArenas] = useState<Arena[]>([])
  const [playerBookings, setPlayerBookings] = useState<Booking[]>([])

  useEffect(() => {
    async function loadData() {
      const fetchedArenas = await fetchArenas()
      setArenas(fetchedArenas)
      
      if (user?.id && user.role === 'player') {
        const bookings = await fetchPlayerBookings(user.id)
        setPlayerBookings(bookings)
      }
    }
    loadData()
  }, [user])

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
  const topStats = role === 'owner'
    ? [
        { label: 'Owned Arenas', value: ownerArenas.length.toString() },
        {
          label: 'Avg Occupancy',
          value: ownerArenas.length > 0 ? `${Math.round(ownerArenas.reduce((acc, arena) => acc + arena.occupancyRate, 0) / ownerArenas.length)}%` : '0%',
        },
        { label: 'Revenue (Demo)', value: formatPKR(demoOwner.totalRevenue) },
      ]
    : [
        { label: 'Upcoming Bookings', value: upcomingBookings.length.toString() },
        { label: 'Preferred Sport', value: 'Football' },
        { label: 'Saved Arenas', value: '3' },
      ]

  const scheduleLink = featuredArenas[0] ? `/arenas/${featuredArenas[0].slug}/schedule` : '/arenas'

  if (!user) return <Navigate to="/login" replace />

  return (
    <>
      <Navbar />
      <main ref={rootRef} className="pt-20 md:pt-24 px-4 md:px-8 lg:px-10 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <section
            data-home-hero
            className="rounded-2xl border border-line bg-gradient-to-br from-turf via-slate/50 to-ground p-5 md:p-8 noise-overlay overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="text-mist font-mono text-xs uppercase tracking-[0.22em]">
                  Signed In Home
                </p>
                <h1 className="font-display text-3xl md:text-5xl text-chalk mt-3">
                  Welcome back, {user.name.split(' ')[0]}
                </h1>
                <p className="text-mist max-w-2xl mt-3 text-sm md:text-base">
                  Your next game should only take a few taps. Check your schedule, discover trending arenas,
                  and jump straight into booking.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <BtnLink to="/booking" className="px-5 py-3 text-sm">
                  Quick Book
                </BtnLink>
                <BtnLink to="/arenas" variant="outline" className="px-5 py-3 text-sm">
                  Explore Arenas
                </BtnLink>
                <BtnLink to="/promotions" variant="outline" className="px-5 py-3 text-sm">
                  Live Offers
                </BtnLink>
              </div>
            </div>
          </section>

          <section data-home-section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {topStats.map((item) => (
              <article key={item.label} data-home-card className="bg-slate rounded-xl border border-line p-4 md:p-5">
                <p className="text-mist text-xs md:text-sm">{item.label}</p>
                <p className="font-display text-2xl md:text-3xl text-chalk mt-2">{item.value}</p>
              </article>
            ))}
          </section>

          <section data-home-section className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4 md:gap-5">
            <div data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl md:text-2xl">Trending Right Now</h2>
                <Link to="/arenas" className="text-mist hover:text-chalk text-sm inline-flex items-center gap-1">
                  See all <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {trendingArenas.map((arena) => (
                  <ArenaCard key={arena.id} arena={arena} variant="carousel" />
                ))}
              </div>
            </div>

            <aside data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-5">
              <h2 className="font-display text-xl">Up Next</h2>
              <div className="mt-4 space-y-3">
                {upcomingBookings.length === 0 && (
                  <div className="rounded-lg bg-slate p-4 text-sm text-mist">
                    No upcoming bookings yet. Pick a venue and lock your slot.
                  </div>
                )}
                {upcomingBookings.map((booking) => {
                  const arena = arenas.find((a) => a.id === booking.arenaId)
                  return (
                    <article key={booking.id} className="rounded-lg bg-slate border border-line p-3.5">
                      <p className="font-body text-chalk">{arena?.name}</p>
                      <p className="text-xs text-mist mt-1">
                        {format(parseISO(booking.date), 'EEE, d MMM')} at {booking.startTime}
                      </p>
                    </article>
                  )
                })}
              </div>
              <BtnLink to="/dashboard/player" variant="outline" className="w-full mt-4 text-sm py-2.5">
                Open Dashboard
              </BtnLink>
            </aside>
          </section>

          <section data-home-section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-4 md:gap-5">
            <div data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
              <h2 className="font-display text-xl md:text-2xl">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: CalendarClock, title: 'Book A Slot', to: '/booking', desc: 'Find next available timings fast.' },
                  { icon: Compass, title: 'Browse Arenas', to: '/arenas', desc: 'Filter by area, sport, and budget.' },
                  { icon: Trophy, title: 'My Profile', to: '/profile', desc: 'See your account, saves, and alerts.' },
                  { icon: Sparkles, title: 'Live Offers', to: '/promotions', desc: 'Open the current promotions feed.' },
                  { icon: Compass, title: 'Arena Schedule', to: scheduleLink, desc: 'Check slot pressure before you book.' },
                ].map((item) => (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="rounded-lg bg-slate border border-line p-4 hover:border-lime/40 transition-colors"
                  >
                    <item.icon size={18} className="text-lime" />
                    <p className="font-body text-chalk mt-3">{item.title}</p>
                    <p className="text-xs text-mist mt-1">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
              <h2 className="font-display text-xl md:text-2xl">Featured Arenas</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {featuredArenas.map((arena) => (
                  <ArenaCard key={arena.id} arena={arena} />
                ))}
              </div>
            </div>
          </section>

          <section data-home-section data-home-card className="bg-turf border border-line rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl md:text-2xl">Live Community Pulse</h2>
              <span className="text-xs text-mist font-mono">Updated moments ago</span>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activityFeed.slice(0, 8).map((activity) => (
                <article key={activity.id} className="rounded-lg bg-slate border border-line p-3">
                  <p className="text-sm text-chalk">
                    <span className="text-lime">{activity.playerName}</span> {activity.action} {activity.arenaName}
                  </p>
                  <p className="text-xs text-mist mt-1">
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
