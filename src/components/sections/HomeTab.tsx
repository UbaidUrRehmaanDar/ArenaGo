import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, isFuture, parseISO } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { ArenaCard } from '../ui/ArenaCard'
import { BtnLink } from '../ui/Btn'
import { StatCard } from '../ui/StatCard'
import { SportTag } from '../ui/SportTag'
import { useAuth } from '../../context/AuthContext'
import { activityFeed } from '../../data/activity'
import { arenas } from '../../data/arenas'
import { getPlayerBookings } from '../../data/bookings'
import { demoOwner } from '../../data/users'
import { formatPKR } from '../../utils/formatters'

export function HomeTab() {
  const { user } = useAuth()

  const featuredArenas = useMemo(() => arenas.filter((a) => a.isFeatured).slice(0, 4), [])
  const trendingArenas = useMemo(
    () => [...arenas].sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 3),
    []
  )
  const playerBookings = useMemo(() => getPlayerBookings('player-1'), [])
  const upcomingBookings = useMemo(
    () =>
      playerBookings
        .filter((b) => b.status === 'confirmed' && isFuture(parseISO(b.date)))
        .slice(0, 3),
    [playerBookings]
  )
  const ownerArenas = useMemo(
    () => arenas.filter((arena) => demoOwner.arenaIds.includes(arena.id)),
    []
  )

  const role = user?.role ?? 'player'

  const topStats =
    role === 'owner'
      ? [
          { label: 'Owned Arenas', value: ownerArenas.length.toString() },
          {
            label: 'Avg Occupancy',
            value: `${Math.round(
              ownerArenas.reduce((acc, arena) => acc + arena.occupancyRate, 0) / ownerArenas.length
            )}%`,
          },
          { label: 'Revenue (Demo)', value: formatPKR(demoOwner.totalRevenue) },
        ]
      : [
          { label: 'Upcoming Bookings', value: upcomingBookings.length.toString() },
          { label: 'Preferred Sport', value: 'Football' },
          { label: 'Saved Arenas', value: '3' },
        ]

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-8">
        WELCOME BACK, {user?.name.split(' ')[0].toUpperCase()}
      </h1>

      {/* Quick actions row */}
      <div className="flex flex-wrap gap-2 mb-8">
        <BtnLink to="/booking" className="px-5 py-2.5 text-sm">
          Quick Book
        </BtnLink>
        <BtnLink to="/arenas" variant="outline" className="px-5 py-2.5 text-sm">
          Explore Arenas
        </BtnLink>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {topStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {/* Upcoming Bookings */}
      <h2 className="font-display text-xl text-chalk mb-4">UPCOMING BOOKINGS</h2>
      <div className="space-y-3 mb-10">
        {upcomingBookings.length === 0 && (
          <p className="text-mist text-sm">No upcoming bookings</p>
        )}
        {upcomingBookings.map((b) => {
          const arena = arenas.find((a) => a.id === b.arenaId)
          return (
            <div key={b.id} className="bg-slate p-4 rounded-sm flex justify-between items-center">
              <div>
                <p className="font-display text-lg">{arena?.name}</p>
                <p className="text-mist text-[13px]">
                  {format(parseISO(b.date), 'd MMM')} · {b.startTime}
                </p>
                <SportTag sport={b.sport} className="mt-2" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Trending Arenas */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-chalk">TRENDING RIGHT NOW</h2>
        <Link to="/arenas" className="text-mist hover:text-chalk text-sm inline-flex items-center gap-1">
          See all <ChevronRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {trendingArenas.map((arena) => (
          <ArenaCard key={arena.id} arena={arena} variant="carousel" />
        ))}
      </div>

      {/* Featured Arenas */}
      <h2 className="font-display text-xl text-chalk mb-4">FEATURED ARENAS</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {featuredArenas.map((arena) => (
          <ArenaCard key={arena.id} arena={arena} />
        ))}
      </div>

      {/* Live Activity */}
      <h2 className="font-display text-xl text-chalk mb-4">LIVE COMMUNITY PULSE</h2>
      <div className="relative pl-6 border-l border-line space-y-6">
        {activityFeed.slice(0, 6).map((activity) => (
          <div key={activity.id} className="relative">
            <span className="absolute -left-[29px] w-3 h-3 rounded-full bg-lime top-1" />
            <p className="text-chalk text-[15px]">
              <span className="text-lime">{activity.playerName}</span> {activity.action}{' '}
              {activity.arenaName}
            </p>
            <p className="font-mono text-xs text-mist mt-1">
              {activity.sport} · {activity.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
