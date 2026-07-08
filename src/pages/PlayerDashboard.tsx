import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { format, parseISO, isFuture } from 'date-fns'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { StatCard } from '../components/ui/StatCard'
import { HomeTab } from '../components/sections/HomeTab'
import { SportTag } from '../components/ui/SportTag'
import { useAuth } from '../context/AuthContext'
import { demoPlayer } from '../data/users'
import { formatPKR } from '../utils/formatters'
import { cn } from '../utils/formatters'
import { fetchPlayerBookings, fetchArenaById } from '../services/supabaseData'
import type { Booking, Arena } from '../types'

const links = [
  { to: '/dashboard/player/home', label: 'Home' },
  { to: '/dashboard/player', label: 'Overview' },
  { to: '/dashboard/player/bookings', label: 'My Bookings' },
  { to: '/dashboard/player/favourites', label: 'Favourite Arenas' },
  { to: '/dashboard/player/activity', label: 'Activity' },
]

function useDashboardData() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [arenas, setArenas] = useState<Record<string, Arena>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const b = await fetchPlayerBookings(user.id);
      setBookings(b);
      
      const arenaIds = Array.from(new Set(b.map(x => x.arenaId)));
      const arenaObj: Record<string, Arena> = {};
      
      // Load favourite arenas too if we want them, or just use demoPlayer for now
      // since the DB table for favorites is not fetched.
      
      for (const id of arenaIds) {
        const a = await fetchArenaById(id);
        if (a) arenaObj[id] = a;
      }
      setArenas(arenaObj);
      setLoading(false);
    }
    load();
  }, [user]);

  return { bookings, arenas, loading };
}

function Overview() {
  const { bookings, arenas, loading } = useDashboardData();

  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' && isFuture(parseISO(b.date))
  )
  const hoursPlayed = bookings.filter((b) => b.status === 'completed').length
  const arenasVisited = new Set(bookings.map((b) => b.arenaId)).size
  const sportCounts: Record<string, number> = {}
  bookings.forEach((b) => {
    // using sportId as sport name fallback if sport name isn't on booking
    const sportName = b.sportId || 'Football';
    sportCounts[sportName] = (sportCounts[sportName] ?? 0) + 1
  })
  const favSport =
    Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Football'

  const timeline = bookings.slice(0, 5).map((b) => {
    const arena = arenas[b.arenaId]
    return {
      id: b.id,
      text: `${b.status === 'cancelled' ? 'Cancelled' : 'Booked'} ${arena?.name || 'an arena'}`,
      date: b.date,
      type: b.status === 'cancelled' ? 'cancel' : 'book',
    }
  })

  if (loading) return <div className="text-mist">Loading...</div>

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-8">OVERVIEW</h1>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatCard label="Total Bookings" value={bookings.length} />
        <StatCard label="Hours Played" value={hoursPlayed} />
        <StatCard label="Favourite Sport" value={favSport} />
        <StatCard label="Arenas Visited" value={arenasVisited} />
      </div>

      <h2 className="font-display text-xl text-chalk mb-4">UPCOMING BOOKINGS</h2>
      <div className="space-y-3 mb-10">
        {upcoming.slice(0, 3).map((b) => {
          const arena = arenas[b.arenaId]
          return (
            <div key={b.id} className="bg-slate p-4 rounded-sm flex justify-between items-center">
              <div>
                <p className="font-display text-lg">{arena?.name}</p>
                <p className="text-mist text-[13px]">
                  {format(parseISO(b.date), 'd MMM')} · {b.startTime}
                </p>
                <SportTag sport={b.sportId || 'Football'} className="mt-2" />
              </div>
              <button type="button" className="text-mist text-sm hover:text-chalk">
                Cancel
              </button>
            </div>
          )
        })}
        {upcoming.length === 0 && (
          <p className="text-mist text-sm">No upcoming bookings</p>
        )}
      </div>

      <h2 className="font-display text-xl text-chalk mb-4">YOUR BADGES</h2>
      <div className="flex flex-wrap gap-3 mb-10">
        {demoPlayer.badges.map((badge) => (
          <span
            key={badge.id}
            className={cn(
              'px-4 py-2 bg-slate border-t-2 border-lime font-mono text-xs',
              !badge.earned && 'opacity-35 border-mist'
            )}
          >
            {badge.name}
          </span>
        ))}
      </div>

      <h2 className="font-display text-xl text-chalk mb-4">RECENT ACTIVITY</h2>
      <div className="relative pl-6 border-l border-line space-y-6">
        {timeline.map((e) => (
          <div key={e.id} className="relative">
            <span
              className={cn(
                'absolute -left-[29px] w-3 h-3 rounded-full top-1',
                e.type === 'cancel' ? 'bg-amber' : 'bg-lime'
              )}
            />
            <p className="text-chalk text-[15px]">{e.text}</p>
            <p className="font-mono text-xs text-mist mt-1">
              {format(parseISO(e.date), 'd MMM yyyy')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MyBookings() {
  const { bookings, arenas, loading } = useDashboardData();
  const [tab, setTab] = useState<'All' | 'Upcoming' | 'Completed' | 'Cancelled'>('All')

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (tab === 'Upcoming')
        return b.status === 'confirmed' && isFuture(parseISO(b.date))
      if (tab === 'Completed') return b.status === 'completed'
      if (tab === 'Cancelled') return b.status === 'cancelled'
      return true
    })
  }, [tab, bookings])

  if (loading) return <div className="text-mist">Loading...</div>

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-6">MY BOOKINGS</h1>
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['All', 'Upcoming', 'Completed', 'Cancelled'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn('btn-chip', tab === t ? 'btn-chip-active' : 'btn-chip-inactive')}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-0">
        {filtered.map((b) => {
          const arena = arenas[b.arenaId]
          return (
            <div
              key={b.id}
              className="grid grid-cols-2 md:grid-cols-6 gap-4 py-4 border-b border-line items-center"
            >
              <span className="font-body text-chalk md:col-span-1">{arena?.name}</span>
              <SportTag sport={b.sportId || 'Football'} size="sm" />
              <span className="font-mono text-xs text-mist">
                {format(parseISO(b.date), 'd MMM')} {b.startTime}
              </span>
              <span className="text-mist text-sm hidden md:block">1 hr</span>
              <span className="font-mono text-sm">{formatPKR(b.price || 0)}</span>
              <span
                className={cn(
                  'text-xs font-mono uppercase px-2 py-1 rounded-sm w-fit',
                  b.status === 'confirmed' && 'bg-lime/20 text-lime',
                  b.status === 'completed' && 'bg-slate text-mist',
                  b.status === 'cancelled' && 'bg-booked/20 text-booked'
                )}
              >
                {b.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Favourites() {
  const [favourites, setFavourites] = useState<Arena[]>([])
  
  useEffect(() => {
    async function load() {
      const favs = [];
      for (const id of demoPlayer.favoriteArenas) {
        const a = await fetchArenaById(id);
        if (a) favs.push(a);
      }
      setFavourites(favs);
    }
    load();
  }, [])

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-6">FAVOURITE ARENAS</h1>
      <div className="grid gap-4">
        {favourites.map(
          (arena) =>
            arena && (
              <Link
                key={arena.id}
                to={`/arenas/${arena.slug}`}
                className="bg-slate p-4 rounded-sm flex gap-4 hover:-translate-y-1 transition-transform"
              >
                <img
                  src={arena.images[0]}
                  alt=""
                  className="w-24 h-24 object-cover rounded-sm"
                />
                <div>
                  <p className="font-display text-xl">{arena.name}</p>
                  <p className="text-mist text-sm">
                    {arena.location.area}, {arena.location.city}
                  </p>
                </div>
              </Link>
            )
        )}
      </div>
    </div>
  )
}

function Activity() {
  const { bookings, arenas, loading } = useDashboardData();

  if (loading) return <div className="text-mist">Loading...</div>

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-6">ACTIVITY</h1>
      <div className="relative pl-6 border-l border-line space-y-8">
        {bookings.map((b) => {
          const arena = arenas[b.arenaId]
          return (
            <div key={b.id} className="relative">
              <span className="absolute -left-[29px] w-3 h-3 rounded-full bg-lime top-1" />
              <p className="text-chalk">
                {b.status === 'completed' ? 'Played at' : 'Booked'} {arena?.name}
              </p>
              <p className="font-mono text-xs text-mist mt-1">
                {format(parseISO(b.date), 'd MMM yyyy HH:mm')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PlayerDashboard() {
  const { user } = useAuth()
  if (!user || user.role !== 'player') {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route element={<DashboardLayout role="player" links={links} />}>
        <Route index element={<Overview />} />
        <Route path="home" element={<HomeTab />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="favourites" element={<Favourites />} />
        <Route path="activity" element={<Activity />} />
      </Route>
    </Routes>
  )
}
