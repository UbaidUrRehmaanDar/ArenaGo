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
import { OwnerBookings as OwnerBookingsPage } from './OwnerBookings'
import { OwnerCampaigns } from './OwnerCampaigns'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { Btn } from '../components/ui/Btn'
import { useAuth } from '../context/AuthContext'
import { fetchArenaById, uploadArenaImage, fetchBlockedSlots, setBlockedSlot, fetchOwnerAnalytics } from '../services/supabaseData'
import { useChartTheme } from '../hooks/useChartTheme'
import { cn, formatPKR } from '../utils/formatters'
import type { Arena } from '../types'

const links = [
  { to: '/dashboard/owner', label: 'Overview' },
  { to: '/dashboard/owner/bookings', label: 'Bookings' },
  { to: '/dashboard/owner/arenas', label: 'Arenas' },
  { to: '/dashboard/owner/campaigns', label: 'Campaigns' },
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
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!user?.arenaIds || user.arenaIds.length === 0) {
        setAnalytics({
          totalBookings: 0,
          totalRevenue: 0,
          averageOccupancy: 0,
          popularSports: [],
          monthlyRevenue: [],
        })
        setLoading(false)
        return
      }

      const data = await fetchOwnerAnalytics(user.arenaIds)
      setAnalytics(data)
      setLoading(false)
    }
    loadAnalytics()
  }, [user])

  if (loading) return <LoadingState message="Loading analytics..." />

  const thisMonthRevenue = analytics?.monthlyRevenue?.[analytics.monthlyRevenue.length - 1]?.revenue || 0
  const lastMonthRevenue = analytics?.monthlyRevenue?.[analytics.monthlyRevenue.length - 2]?.revenue || 0
  const revChange = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-display text-display-md text-chalk mb-6 lg:mb-8">OVERVIEW</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <StatCard
          label="This Month"
          value={formatPKR(thisMonthRevenue)}
        />
        <StatCard
          label="vs Last Month"
          value={`${revChange > 0 ? '+' : ''}${revChange}`}
          unit="%"
          trend={Math.abs(revChange)}
          trendDirection={revChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Total Revenue"
          value={formatPKR(analytics?.totalRevenue || 0)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatCard
          label="Total Bookings"
          value={analytics?.totalBookings || 0}
        />
        <StatCard label="Occupancy Rate" value={`${Math.round((analytics?.averageOccupancy || 0) * 100)}%`} />
        <StatCard label="Popular Sport" value={analytics?.popularSports?.[0]?.sport || 'N/A'} />
      </div>
    </div>
  )
}

function OwnerBookings() {
  return <OwnerBookingsPage embedded={true} />
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

  if (loading) return <LoadingState message="Loading..." />

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-display text-display-md text-chalk mb-6">MY ARENAS</h1>
      {arenas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-mist text-sm mb-4">You don't have any arenas yet.</p>
          <p className="text-mist/60 text-xs mb-6">Contact support to add your arena to the platform.</p>
          <Btn className="inline-block">
            Contact Support
          </Btn>
        </div>
      ) : (
        <div className="grid gap-4">
          {arenas.map(
            (arena) =>
              arena && (
                <div key={arena.id} className="bg-slate p-4 lg:p-6 rounded-sm flex flex-col sm:flex-row gap-4 lg:gap-6">
                  {/* Arena image with upload overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[arena.id]?.click()}
                    className="relative group w-full sm:w-32 h-24 sm:h-24 shrink-0 rounded-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-lime"
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
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl lg:text-2xl truncate">{arena.name}</p>
                    <p className="text-mist text-sm mt-1">
                      {arena.location.area} · {arena.occupancyRate}% occupancy
                    </p>
                    <div className="mt-3 h-1 bg-ground rounded-sm overflow-hidden max-w-full sm:max-w-xs">
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
      )}
    </div>
  )
}

function OwnerAnalytics() {
  const { user } = useAuth()
  const { arenas } = useOwnerData()
  const chart = useChartTheme()
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.arenaIds?.length) { setLoading(false); return }
    fetchOwnerAnalytics(user.arenaIds).then((data) => {
      setAnalyticsData(data)
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState message="Loading analytics..." />

  const tooltipStyle = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    color: chart.tooltipText,
  }

  const revenueData = analyticsData?.monthlyRevenue ?? []
  const sportData = analyticsData?.popularSports ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-8 lg:space-y-12">
      <h1 className="font-display text-display-md text-chalk">ANALYTICS</h1>

      {revenueData.length > 0 && (
        <div>
          <h2 className="font-display text-sm text-chalk mb-4 tracking-wide">REVENUE TREND</h2>
          <div className="h-[250px] lg:h-[280px] bg-slate/50 p-4 rounded-sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatPKR(Number(v)), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke={chart.lime} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sportData.length > 0 && (
        <div>
          <h2 className="font-display text-sm text-chalk mb-4">SPORT BREAKDOWN</h2>
          <div className="h-[250px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sportData}
                  dataKey="count"
                  nameKey="sport"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(p: any) => `${p.sport} (${p.count})`}
                >
                  {sportData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-sm text-chalk mb-4">OCCUPANCY BY ARENA</h2>
        {arenas.map((arena) => {
          if (!arena) return null
          return (
            <div key={arena.id} className="flex items-center gap-3 lg:gap-4 mb-4">
              <span className="font-mono text-xs text-mist w-32 lg:w-40 truncate shrink-0">{arena.name}</span>
              <div className="flex-1 h-2 lg:h-3 bg-slate rounded-sm overflow-hidden min-w-0">
                <div className="h-full bg-lime transition-all" style={{ width: `${arena.occupancyRate}%` }} />
              </div>
              <span className="font-mono text-xs text-lime w-8 lg:w-10 shrink-0">{arena.occupancyRate}%</span>
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
  const [loadingBlocked, setLoadingBlocked] = useState(true)

  useEffect(() => {
    async function loadBlockedSlots() {
      const allBlocked: string[] = []
      for (const arena of arenas) {
        if (arena) {
          const blockedForArena = await fetchBlockedSlots(arena.id)
          allBlocked.push(...blockedForArena)
        }
      }
      setBlocked(new Set(allBlocked))
      setLoadingBlocked(false)
    }
    if (arenas.length > 0) {
      loadBlockedSlots()
    }
  }, [arenas])

  const toggle = async (key: string) => {
    const [arenaId] = key.split('-')
    const isBlocked = blocked.has(key)
    const success = await setBlockedSlot(arenaId, key, !isBlocked)
    if (success) {
      setBlocked((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    } else {
      alert('Failed to update slot status')
    }
  }

  if (loading || loadingBlocked) return <LoadingState message="Loading..." />

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-display text-display-md text-chalk mb-6">SLOT MANAGER</h1>
      <p className="text-mist text-sm mb-6">Click a cell to toggle blocked status</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] lg:min-w-[600px]">
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
                    <td className="font-mono text-xs text-chalk p-2 max-w-[100px] lg:max-w-[120px] truncate">
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
                              'w-full p-1 lg:p-2 rounded-sm font-mono text-[9px] lg:text-[10px] text-center',
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
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="arenas" element={<OwnerArenas />} />
        <Route path="campaigns" element={<OwnerCampaigns embedded={true} />} />
        <Route path="analytics" element={<OwnerAnalytics />} />
        <Route path="slots" element={<SlotManager />} />
      </Route>
    </Routes>
  )
}
