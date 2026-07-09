import { useState, useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Camera } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { StatCard } from '../components/ui/StatCard'
import { HomeTab } from '../components/sections/HomeTab'
import { useAuth } from '../context/AuthContext'
import { getAnalyticsForOwner, heatmapData, HEATMAP_DAYS, HEATMAP_HOURS } from '../data/analytics'
import { fetchArenaById, uploadArenaImage } from '../services/supabaseData'
import { useChartTheme } from '../hooks/useChartTheme'
import { cn, formatPKR } from '../utils/formatters'
import type { Arena } from '../types'

const links = [
  { to: '/dashboard/owner/home', label: 'Home' },
  { to: '/dashboard/owner', label: 'Overview' },
  { to: '/dashboard/owner/bookings', label: 'Bookings' },
  { to: '/dashboard/owner/arenas', label: 'Arenas' },
  { to: '/dashboard/owner/analytics', label: 'Analytics' },
  { to: '/dashboard/owner/slots', label: 'Slot Manager' },
  { to: '/profile', label: 'Profile' },
]

const PIE_COLORS = ['#C8FF00', '#FF9500', '#00B4D8', '#FF6B35', '#C39BD3']

function useOwnerData() {
  const { user } = useAuth()
  const [arenas, setArenas] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user || !user.arenaIds) return
      const loaded: Arena[] = []
      for (const id of user.arenaIds) {
        const a = await fetchArenaById(id)
        if (a) loaded.push(a)
      }
      setArenas(loaded)
      setLoading(false)
    }
    load()
  }, [user])

  return { user, arenas, loading }
}

function OwnerOverview() {
  const { user } = useAuth()
  const analytics = getAnalyticsForOwner(user?.arenaIds || [])
  const combined = analytics[0] || { revenue: { thisMonth: 0, lastMonth: 1, thisWeek: 0 }, bookings: { thisMonth: 0, completionRate: 0 } }
  const revChange = Math.round(
    ((combined.revenue.thisMonth - combined.revenue.lastMonth) /
      combined.revenue.lastMonth) *
      100
  )

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-8">OVERVIEW</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="This Month"
          value={formatPKR(
            analytics.reduce((s, a) => s + a.revenue.thisMonth, 0)
          )}
        />
        <StatCard
          label="vs Last Month"
          value={`${revChange > 0 ? '+' : ''}${revChange}`}
          unit="%"
          trend={Math.abs(revChange)}
          trendDirection={revChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="This Week"
          value={formatPKR(analytics.reduce((s, a) => s + a.revenue.thisWeek, 0))}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Bookings This Month"
          value={analytics.reduce((s, a) => s + a.bookings.thisMonth, 0)}
        />
        <StatCard label="Completion Rate" value={`${combined.bookings.completionRate}%`} />
        <StatCard label="Peak Booking Day" value="Friday" />
      </div>
    </div>
  )
}

function OwnerBookings() {
  const { user } = useAuth()
  const analytics = getAnalyticsForOwner(user?.arenaIds || [])[0]
  if (!analytics) return null
  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-6">BOOKINGS</h1>
      <div className="space-y-3">
        {analytics.bookings.trend.map((d) => (
          <div key={d.date} className="flex items-center gap-4">
            <span className="font-mono text-sm text-mist w-12">{d.date}</span>
            <div className="flex-1 h-4 bg-slate rounded-sm overflow-hidden">
              <div
                className="h-full bg-lime"
                style={{ width: `${(d.count / 45) * 100}%` }}
              />
            </div>
            <span className="font-mono text-sm text-chalk w-8">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OwnerArenas() {
  const { arenas, loading } = useOwnerData()
  const [arenaImages, setArenaImages] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleImageChange = async (arenaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading((prev) => ({ ...prev, [arenaId]: true }))
    const newUrl = await uploadArenaImage(arenaId, file)
    if (newUrl) setArenaImages((prev) => ({ ...prev, [arenaId]: newUrl }))
    setUploading((prev) => ({ ...prev, [arenaId]: false }))
  }

  if (loading) return <div className="text-mist">Loading...</div>

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-6">MY ARENAS</h1>
      <div className="grid gap-4">
        {arenas.map(
          (arena) =>
            arena && (
              <div key={arena.id} className="bg-slate p-6 rounded-sm flex gap-6">
                {/* Arena image with upload overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[arena.id]?.click()}
                  className="relative group w-32 h-24 shrink-0 rounded-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-lime"
                  aria-label="Upload arena photo"
                >
                  <img
                    src={arenaImages[arena.id] ?? arena.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ground/70 transition-opacity',
                    uploading[arena.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    {uploading[arena.id]
                      ? <span className="text-[10px] font-mono text-lime">Uploading…</span>
                      : <>
                          <Camera size={16} className="text-chalk" />
                          <span className="text-[10px] font-mono text-chalk">Change photo</span>
                        </>
                    }
                  </span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[arena.id] = el }}
                  onChange={(e) => handleImageChange(arena.id, e)}
                />
                <div className="flex-1">
                  <p className="font-display text-2xl">{arena.name}</p>
                  <p className="text-mist text-sm mt-1">
                    {arena.location.area} · {arena.occupancyRate}% occupancy
                  </p>
                  <div className="mt-3 h-1 bg-ground rounded-sm overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-lime"
                      style={{ width: `${arena.occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  )
}

function OwnerAnalytics() {
  const { user } = useAuth()
  const analytics = getAnalyticsForOwner(user?.arenaIds || [])[0]
  const { arenas } = useOwnerData()
  const chart = useChartTheme()

  if (!analytics) return null

  const tooltipStyle = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    color: chart.tooltipText,
  }

  return (
    <div className="space-y-12">
      <h1 className="font-display text-display-md text-chalk">ANALYTICS</h1>

      <div>
        <h2 className="font-display text-sm text-chalk mb-4 tracking-wide">REVENUE TREND</h2>
        <div className="h-[280px] bg-slate/50 p-4 rounded-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.revenue.trend}>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatPKR(Number(v)), 'Revenue']} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={chart.lime}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="font-display text-sm text-chalk mb-4 tracking-wide">BOOKING HEATMAP</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-1 pl-12">
              {HEATMAP_HOURS.map((h) => (
                <span key={h} className="flex-1 font-mono text-[9px] text-mist text-center">
                  {h}
                </span>
              ))}
            </div>
            {heatmapData.map((row, dayIdx) => (
              <div key={HEATMAP_DAYS[dayIdx]} className="flex items-center gap-1 mb-1">
                <span className="w-10 font-mono text-[10px] text-mist">{HEATMAP_DAYS[dayIdx]}</span>
                <div className="flex flex-1 gap-0.5">
                  {row.map((intensity, hourIdx) => (
                    <div
                      key={hourIdx}
                      className="flex-1 h-6 rounded-sm min-w-[12px]"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${chart.lime} ${Math.round(intensity * 100)}%, transparent)`,
                      }}
                      title={`${intensity * 100}%`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-sm text-chalk mb-4">SPORT BREAKDOWN</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics.sportBreakdown}
                dataKey="percentage"
                nameKey="sport"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props) => {
                  const entry = props as unknown as { sport: string; percentage: number }
                  return `${entry.sport} ${entry.percentage}%`
                }}
              >
                {analytics.sportBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="font-display text-sm text-chalk mb-4">OCCUPANCY BY ARENA</h2>
        {arenas.map((arena) => {
          if (!arena) return null
          return (
            <div key={arena.id} className="flex items-center gap-4 mb-4">
              <span className="font-mono text-xs text-mist w-40 truncate">{arena.name}</span>
              <div className="flex-1 h-3 bg-slate rounded-sm overflow-hidden">
                <div
                  className="h-full bg-lime transition-all"
                  style={{ width: `${arena.occupancyRate}%` }}
                />
              </div>
              <span className="font-mono text-xs text-lime w-10">{arena.occupancyRate}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SlotManager() {
  const { arenas, loading } = useOwnerData()
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const [blocked, setBlocked] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setBlocked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) return <div className="text-mist">Loading...</div>

  return (
    <div>
      <h1 className="font-display text-display-md text-chalk mb-6">SLOT MANAGER</h1>
      <p className="text-mist text-sm mb-6">Click a cell to toggle blocked status (local only)</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-mist text-xs font-mono p-2">Arena</th>
              {days.map((d) => (
                <th key={d} className="text-mist text-xs font-mono p-2">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {arenas.map(
              (arena) =>
                arena && (
                  <tr key={arena.id}>
                    <td className="font-mono text-xs text-chalk p-2 max-w-[120px] truncate">
                      {arena.name}
                    </td>
                    {days.map((d) => {
                      const key = `${arena.id}-${d}`
                      const isBlocked = blocked.has(key)
                      const available = Math.floor(8 + Math.random() * 6)
                      return (
                        <td key={d} className="p-1">
                          <button
                            type="button"
                            onClick={() => toggle(key)}
                            className={cn(
                              'w-full p-2 rounded-sm font-mono text-[10px] text-center',
                              isBlocked
                                ? 'bg-booked/30 text-booked'
                                : 'bg-slate text-lime hover:bg-lime/20'
                            )}
                          >
                            {isBlocked ? 'BLOCK' : `${available}/${available + 2}`}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function OwnerDashboard() {
  const { user } = useAuth()
  if (!user || user.role !== 'owner') {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route element={<DashboardLayout role="owner" links={links} />}>
        <Route index element={<OwnerOverview />} />
        <Route path="home" element={<HomeTab />} />
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="arenas" element={<OwnerArenas />} />
        <Route path="analytics" element={<OwnerAnalytics />} />
        <Route path="slots" element={<SlotManager />} />
      </Route>
    </Routes>
  )
}
