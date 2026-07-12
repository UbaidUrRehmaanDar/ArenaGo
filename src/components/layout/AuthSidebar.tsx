import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArenaGoLogo } from '../ui/ArenaGoLogo'
import { CountUp } from '../ui/CountUp'
import { ThemeToggle } from '../ui/ThemeToggle'
import { fetchPlatformStats } from '../../services/supabaseData'

interface AuthSidebarProps {
  copy: string
}

export function AuthSidebar({ copy }: AuthSidebarProps) {
  const [stats, setStats] = useState({ players: 0, arenas: 0, bookings: 0 })

  useEffect(() => {
    fetchPlatformStats().then(setStats)
  }, [])

  const displayStats = [
    { value: stats.players, suffix: '+', label: 'Players' },
    { value: stats.arenas, suffix: '', label: 'Arenas' },
    { value: stats.bookings, suffix: '+', label: 'Bookings' },
  ]

  return (
    <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ground/90 via-ground/70 to-ground/40" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <ArenaGoLogo iconSize="h-14 w-14" textSize="text-5xl" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative z-10 max-w-md">
        <p className="text-body-lg text-mist mt-4 leading-relaxed">{copy}</p>
      </div>

      <div className="relative z-10 flex gap-10 flex-wrap">
        {displayStats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-3xl text-lime">
              <CountUp end={stat.value} duration={1.5} suffix={stat.suffix} />
            </p>
            <p className="text-mist text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
