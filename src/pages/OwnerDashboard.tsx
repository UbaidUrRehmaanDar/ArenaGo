import { useState, useEffect, useRef, useCallback } from 'react'
import { Navigate, Route, Routes, Link } from 'react-router-dom'
import {
  Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  Camera, TrendingUp, TrendingDown, CalendarCheck, Users, DollarSign,
  BarChart2, MapPin, Clock, Plus, ChevronRight, AlertCircle, CheckCircle2,
  XCircle, RefreshCw, Lock, Unlock, Star, Activity,
  Mail, Phone, Pencil, KeyRound, X, RotateCw,
} from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { format, isFuture, parseISO } from 'date-fns'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { StatCard } from '../components/ui/StatCard'
import { OwnerBookings as OwnerBookingsPage } from './OwnerBookings'
import { OwnerCampaigns } from './OwnerCampaigns'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { Btn, BtnLink } from '../components/ui/Btn'
import { SportTag } from '../components/ui/SportTag'
import { OccupancyBar } from '../components/ui/OccupancyBar'
import { CustomDropdown } from '../components/ui/CustomDropdown'
import { useAuth } from '../context/AuthContext'
import {
  fetchArenaById, uploadArenaImage, fetchBlockedSlots, setBlockedSlot,
  fetchOwnerAnalytics, fetchTimeSlotsForArenaRange, fetchCities, createArena,
  fetchProfileRecord, updateProfile, uploadAvatar, fetchOwnerRecord,
  upsertOwnerRecord,
} from '../services/supabaseData'
import { supabase } from '../lib/supabase'
import { useChartTheme } from '../hooks/useChartTheme'
import { cn, formatPKR } from '../utils/formatters'
import type { Arena, TimeSlot, ProfileRecord, OwnerRecord } from '../types'

// ── Nav links (no external /profile escape) ──────────────────────────────────
const links = [
  { to: '/dashboard/owner',           label: 'Overview'      },
  { to: '/dashboard/owner/bookings',  label: 'Bookings'      },
  { to: '/dashboard/owner/arenas',    label: 'Arenas'        },
  { to: '/dashboard/owner/campaigns', label: 'Campaigns'     },
  { to: '/dashboard/owner/analytics', label: 'Analytics'     },
  { to: '/dashboard/owner/slots',     label: 'Slot Manager'  },
  { to: '/dashboard/owner/profile',   label: 'Profile'       },
]

const PIE_COLORS = ['#C8FF00', '#FF9500', '#00B4D8', '#FF6B35', '#C39BD3']

// ── Shared avatar-crop helper (same algorithm as Profile page) ────────────────
async function getCroppedBlob(imageSrc: string, croppedArea: Area, rotation: number): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const size = 400
  canvas.width = size; canvas.height = size
  const rad = (rotation * Math.PI) / 180
  ctx.translate(size / 2, size / 2); ctx.rotate(rad); ctx.translate(-size / 2, -size / 2)
  const scaleX = size / croppedArea.width; const scaleY = size / croppedArea.height
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(image, -croppedArea.x, -croppedArea.y, image.naturalWidth, image.naturalHeight)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('toBlob failed')) }, 'image/jpeg', 0.92)
  })
}

// ── Shared data hook ──────────────────────────────────────────────────────────
function useOwnerData() {
  const { user } = useAuth()
  const [arenas, setArenas] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      if (!user?.arenaIds) { setLoading(false); return }
      const loaded: Arena[] = []
      for (const id of user.arenaIds) { const a = await fetchArenaById(id); if (a) loaded.push(a) }
      setArenas(loaded); setLoading(false)
    }
    load()
  }, [user])
  return { user, arenas, loading }
}

// ── Reusable section header ───────────────────────────────────────────────────
function SectionHeader({ label, title, action }: { label: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6 md:mb-8">
      <div>
        <p className="font-mono text-[11px] text-lime uppercase tracking-[0.2em] mb-1">{label}</p>
        <h1 className="font-display text-3xl md:text-4xl text-chalk">{title}</h1>
      </div>
      {action}
    </div>
  )
}

// ── Reusable card wrapper ─────────────────────────────────────────────────────
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-turf p-5 md:p-6', className)}>
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
function OwnerOverview() {
  const { user } = useAuth()
  const { arenas } = useOwnerData()
  const chart = useChartTheme()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.arenaIds?.length) {
        setAnalytics({ totalBookings: 0, totalRevenue: 0, averageOccupancy: 0, popularSports: [], monthlyRevenue: [] })
        setLoading(false); return
      }
      const data = await fetchOwnerAnalytics(user.arenaIds)
      setAnalytics(data); setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <LoadingState message="Loading overview..." />

  const rev = analytics?.monthlyRevenue ?? []
  const thisMonth = rev[rev.length - 1]?.revenue ?? 0
  const lastMonth = rev[rev.length - 2]?.revenue ?? 0
  const revChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0
  const tooltipStyle = { background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, color: chart.tooltipText, borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }

  const kpis = [
    { label: 'This Month Revenue', value: formatPKR(thisMonth), icon: DollarSign, accent: 'lime' as const,
      sub: revChange !== 0 ? { val: `${revChange > 0 ? '+' : ''}${revChange}%`, up: revChange >= 0 } : null },
    { label: 'Total Revenue', value: formatPKR(analytics?.totalRevenue ?? 0), icon: TrendingUp, accent: 'lime' as const, sub: null },
    { label: 'Total Bookings', value: analytics?.totalBookings ?? 0, icon: CalendarCheck, accent: 'lime' as const, sub: null },
    { label: 'Avg Occupancy', value: `${Math.round((analytics?.averageOccupancy ?? 0) * 100)}%`, icon: BarChart2, accent: 'amber' as const, sub: null },
  ]

  return (
    <div className="space-y-6 md:space-y-7">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <p className="font-mono text-[11px] text-lime uppercase tracking-[0.22em] mb-1">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-chalk leading-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="text-lime">{(user?.name ?? 'Owner').split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mist px-3 py-1.5 rounded-full border border-line bg-slate/50">
            {arenas.length} {arenas.length === 1 ? 'Arena' : 'Arenas'}
          </span>
          <Link to="/dashboard/owner/arenas"
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-on-lime bg-lime hover:brightness-110 px-3 py-1.5 rounded-full transition-all">
            <Plus size={11} />Manage
          </Link>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {kpis.map(({ label, value, icon: Icon, accent, sub }) => (
          <div key={label} className={cn(
            'rounded-2xl border p-5 flex flex-col gap-3 relative overflow-hidden',
            accent === 'lime' ? 'border-line bg-turf' : 'border-amber/20 bg-amber/5'
          )}>
            {/* faint watermark icon */}
            <Icon size={52} className={cn('absolute -bottom-2 -right-2 opacity-[0.05]', accent === 'lime' ? 'text-lime' : 'text-amber')} />
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest leading-tight pr-8">{label}</p>
              <span className={cn('w-8 h-8 flex items-center justify-center rounded-xl shrink-0',
                accent === 'lime' ? 'bg-lime/10' : 'bg-amber/15')}>
                <Icon size={14} className={accent === 'lime' ? 'text-lime' : 'text-amber'} />
              </span>
            </div>
            <p className={cn('font-display text-2xl md:text-3xl leading-none', accent === 'lime' ? 'text-lime' : 'text-amber')}>{value}</p>
            {sub && (
              <div className={cn('flex items-center gap-1 text-[11px] font-mono', sub.up ? 'text-lime' : 'text-amber')}>
                {sub.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {sub.val} vs last month
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main content grid ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">

        {/* Revenue chart */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest">Revenue Trend</p>
              <p className="font-display text-xl text-chalk mt-0.5">Monthly Overview</p>
            </div>
            <span className="font-mono text-xs text-lime">{rev.length} months</span>
          </div>
          {rev.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rev}>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatPKR(Number(v)), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke={chart.lime} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center border border-dashed border-line rounded-xl">
              <p className="text-mist text-sm font-mono">No revenue data yet</p>
            </div>
          )}
        </Card>

        {/* Arena occupancy */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest">Occupancy</p>
              <p className="font-display text-xl text-chalk mt-0.5">By Arena</p>
            </div>
            <BarChart2 size={16} className="text-lime" />
          </div>
          {arenas.length > 0 ? (
            <div className="space-y-4">
              {arenas.map((arena) => arena && (
                <div key={arena.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-chalk truncate max-w-[75%]">{arena.name}</span>
                    <span className="font-mono text-xs text-lime shrink-0 ml-2">{arena.occupancyRate}%</span>
                  </div>
                  <OccupancyBar percentage={arena.occupancyRate} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <MapPin size={20} className="text-mist" />
              <p className="text-sm text-mist">No arenas added yet</p>
              <Link to="/dashboard/owner/arenas" className="text-xs font-mono text-lime hover:underline">Add your first arena →</Link>
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick nav cards ───────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-mono text-mist uppercase tracking-widest mb-3">Quick Access</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/dashboard/owner/bookings',  label: 'Bookings',      sub: 'Manage incoming', icon: CalendarCheck, color: 'lime' },
            { to: '/dashboard/owner/arenas',    label: 'Arenas',        sub: 'Edit venues',      icon: MapPin,        color: 'lime' },
            { to: '/dashboard/owner/slots',     label: 'Slot Manager',  sub: 'Block / open',    icon: Clock,         color: 'lime' },
            { to: '/dashboard/owner/campaigns', label: 'Campaigns',     sub: 'Run promos',       icon: Users,         color: 'lime' },
          ].map(({ to, label, sub, icon: Icon, color }) => (
            <Link key={to} to={to}
              className="group rounded-2xl border border-line bg-turf hover:border-lime/30 hover:bg-lime/5 p-4 flex flex-col gap-3 transition-all duration-200">
              <span className={cn('w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
                color === 'lime' ? 'bg-lime/10 group-hover:bg-lime/20' : 'bg-amber/10 group-hover:bg-amber/20')}>
                <Icon size={16} className={color === 'lime' ? 'text-lime' : 'text-amber'} />
              </span>
              <div>
                <p className="font-body font-semibold text-chalk text-sm">{label}</p>
                <p className="text-[11px] text-mist font-body">{sub}</p>
              </div>
              <ChevronRight size={13} className="text-mist/0 group-hover:text-lime transition-colors self-end" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BOOKINGS (thin wrapper — embedded mode)
// ════════════════════════════════════════════════════════════════════════════
function OwnerBookingsWrapper() {
  return <OwnerBookingsPage embedded={true} />
}

// ════════════════════════════════════════════════════════════════════════════
// ARENAS
// ════════════════════════════════════════════════════════════════════════════
function OwnerArenas() {
  const { user, refreshUser } = useAuth()
  const [arenas, setArenas] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)
  const [arenaImages, setArenaImages] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    name: '', area: '', address: '', cityId: '',
    weekdayPrice: 1500, weekendPrice: 2000, peakPrice: 2500, description: '',
  })
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const newImageInputRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const load = async () => {
    if (!user?.arenaIds?.length) { setArenas([]); setLoading(false); return }
    const loaded: Arena[] = []
    for (const id of user.arenaIds) { const a = await fetchArenaById(id); if (a) loaded.push(a) }
    setArenas(loaded); setLoading(false)
  }

  useEffect(() => { load(); fetchCities().then(setCities) }, [user])

  const handleImageChange = async (arenaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading((p) => ({ ...p, [arenaId]: true }))
    const url = await uploadArenaImage(arenaId, file)
    if (url) setArenaImages((p) => ({ ...p, [arenaId]: url }))
    setUploading((p) => ({ ...p, [arenaId]: false }))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return
    if (!form.name.trim() || !form.area.trim() || !form.cityId) { setAddError('Name, area, and city are required.'); return }
    setAddError(''); setAdding(true)
    const { arena: created, error: createError } = await createArena({
      ownerId: user.id, name: form.name.trim(), area: form.area.trim(),
      address: form.address.trim() || form.area.trim(), cityId: form.cityId,
      weekdayPrice: Number(form.weekdayPrice), weekendPrice: Number(form.weekendPrice),
      peakPrice: Number(form.peakPrice), description: form.description.trim(),
      openTime: '06:00', closeTime: '23:00',
    })
    if (!created) {
      setAdding(false)
      setAddError(createError ?? 'Could not create arena. Please try again.')
      return
    }
    for (const file of newImages) { await uploadArenaImage(created.id, file) }
    setAdding(false)
    setArenas((p) => [...p, created])
    newPreviews.forEach(URL.revokeObjectURL)
    setForm({ name: '', area: '', address: '', cityId: '', weekdayPrice: 1500, weekendPrice: 2000, peakPrice: 2500, description: '' })
    setNewImages([]); setNewPreviews([]); setAddError(''); setShowAdd(false)
    await refreshUser()
  }

  const cityNames = cities.map((c) => c.name)
  const selectedCityName = cities.find((c) => c.id === form.cityId)?.name ?? ''
  const handleCityChange = (name: string) => {
    const found = cities.find((c) => c.name === name)
    setForm((f) => ({ ...f, cityId: found?.id ?? '' }))
  }

  if (loading) return <LoadingState message="Loading arenas..." />

  return (
    <div className="max-w-7xl mx-auto">
      <SectionHeader label="Your Venues" title="MY ARENAS"
        action={<Btn type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm px-4 py-2.5"><Plus size={16} />Add Arena</Btn>} />

      {arenas.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-lime/10 flex items-center justify-center mx-auto mb-4">
            <MapPin size={22} className="text-lime" />
          </div>
          <p className="font-display text-xl text-chalk mb-2">No arenas yet</p>
          <p className="text-sm text-mist mb-6">Add your first arena to start managing bookings.</p>
          <Btn type="button" onClick={() => setShowAdd(true)}>Add Arena</Btn>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-5">
          {arenas.map((arena) => arena && (
            <Card key={arena.id} className="flex flex-col sm:flex-row gap-4 md:gap-6 p-0 overflow-hidden">
              {/* Image */}
              <button type="button" onClick={() => fileInputRefs.current[arena.id]?.click()}
                className="relative group sm:w-48 md:w-56 shrink-0 overflow-hidden focus:outline-none">
                <img src={arenaImages[arena.id] ?? arena.images[0]} alt=""
                  className="w-full h-40 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className={cn('absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ground/70 transition-opacity',
                  uploading[arena.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                  {uploading[arena.id]
                    ? <span className="text-[10px] font-mono text-lime">Uploading…</span>
                    : <><Camera size={18} className="text-chalk" /><span className="text-[10px] font-mono text-chalk">Change photo</span></>}
                </span>
              </button>
              <input type="file" accept="image/*" className="hidden"
                ref={(el) => { fileInputRefs.current[arena.id] = el }}
                onChange={(e) => handleImageChange(arena.id, e)} />

              {/* Details */}
              <div className="flex-1 min-w-0 p-5 md:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-2xl text-chalk leading-tight">{arena.name}</h3>
                    <SportTag sport={arena.sport} size="sm" />
                  </div>
                  <p className="text-sm text-mist flex items-center gap-1.5 mb-4">
                    <MapPin size={13} className="text-lime" />{arena.location.area}, {arena.location.city}
                  </p>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-mono text-mist">Occupancy</span>
                    <span className="text-xs font-mono text-lime">{arena.occupancyRate}%</span>
                  </div>
                  <OccupancyBar percentage={arena.occupancyRate} />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <div className="flex gap-4">
                    <div><p className="text-[10px] font-mono text-mist uppercase tracking-widest">Weekday</p><p className="font-mono text-sm text-chalk mt-0.5">{formatPKR(arena.pricing.weekday)}</p></div>
                    <div><p className="text-[10px] font-mono text-mist uppercase tracking-widest">Weekend</p><p className="font-mono text-sm text-chalk mt-0.5">{formatPKR(arena.pricing.weekend)}</p></div>
                    <div><p className="text-[10px] font-mono text-mist uppercase tracking-widest">Peak</p><p className="font-mono text-sm text-amber mt-0.5">{formatPKR(arena.pricing.peak)}</p></div>
                  </div>
                  <BtnLink to={`/arenas/${arena.slug}`} variant="outline" className="text-xs px-3 py-2">View Page</BtnLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add Arena Modal ──────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-turf border border-line rounded-2xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <div>
                <p className="font-mono text-[10px] text-lime uppercase tracking-[0.2em]">Dashboard</p>
                <h3 className="font-display text-xl text-chalk">Add New Arena</h3>
              </div>
              <button type="button" onClick={() => { newPreviews.forEach(URL.revokeObjectURL); setNewImages([]); setNewPreviews([]); setAddError(''); setShowAdd(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-mist hover:text-chalk hover:bg-slate transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* Scrollable body */}
            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
              <div>
                <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">Arena Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate text-chalk px-4 py-2.5 rounded-xl border border-line focus:outline-none focus:border-lime text-sm font-body" placeholder="e.g. DHA Sports Complex" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">Area</label>
                  <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="w-full bg-slate text-chalk px-4 py-2.5 rounded-xl border border-line focus:outline-none focus:border-lime text-sm font-body" placeholder="e.g. DHA Phase 5" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">City</label>
                  <CustomDropdown options={cityNames} value={selectedCityName} onChange={handleCityChange} placeholder="Select city" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">Street Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate text-chalk px-4 py-2.5 rounded-xl border border-line focus:outline-none focus:border-lime text-sm font-body" placeholder="Full address" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">Pricing (PKR / hr)</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['weekdayPrice', 'weekendPrice', 'peakPrice'] as const).map((key, i) => (
                    <div key={key}>
                      <p className="text-[10px] text-mist font-mono mb-1.5">{['Weekday', 'Weekend', 'Peak'][i]}</p>
                      <input type="number" min={0} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                        className="w-full bg-slate text-chalk px-3 py-2.5 rounded-xl border border-line focus:outline-none focus:border-lime text-sm font-body" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate text-chalk px-4 py-2.5 rounded-xl border border-line focus:outline-none focus:border-lime text-sm font-body resize-none" rows={3} placeholder="Facilities, sports, vibe…" />
              </div>
              {/* Photo upload */}
              <div>
                <label className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5">Photos <span className="text-mist/50 normal-case tracking-normal">(up to 5)</span></label>
                <input ref={newImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).slice(0, 5 - newImages.length)
                  setNewImages((p) => [...p, ...files])
                  setNewPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
                  if (newImageInputRef.current) newImageInputRef.current.value = ''
                }} />
                {newPreviews.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {newPreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { URL.revokeObjectURL(newPreviews[i]); setNewImages((p) => p.filter((_, idx) => idx !== i)); setNewPreviews((p) => p.filter((_, idx) => idx !== i)) }}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                    {newImages.length < 5 && (
                      <button type="button" onClick={() => newImageInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-mist hover:text-lime hover:border-lime/40 transition-colors">
                        <Camera size={16} /><span className="text-[9px] font-mono">Add</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => newImageInputRef.current?.click()}
                    className="w-full py-7 border-2 border-dashed border-line rounded-xl flex flex-col items-center justify-center gap-2 text-mist hover:text-chalk hover:border-lime/40 transition-colors group">
                    <span className="w-10 h-10 rounded-full bg-slate flex items-center justify-center group-hover:bg-lime/10 transition-colors"><Camera size={18} /></span>
                    <span className="text-sm">Add arena photos</span>
                    <span className="text-xs font-mono text-mist/50">Up to 5 images</span>
                  </button>
                )}
              </div>
              {addError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400">{addError}</p>
                </div>
              )}
              <Btn type="submit" disabled={adding} className="w-full py-3">
                {adding ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-on-lime/30 border-t-on-lime rounded-full animate-spin" />Creating…</span> : 'Create Arena'}
              </Btn>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════════════════
function OwnerAnalytics() {
  const { user } = useAuth()
  const { arenas } = useOwnerData()
  const chart = useChartTheme()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.arenaIds?.length) { setLoading(false); return }
    fetchOwnerAnalytics(user.arenaIds).then((d) => { setData(d); setLoading(false) })
  }, [user])

  if (loading) return <LoadingState message="Loading analytics..." />

  const tooltipStyle = { background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, color: chart.tooltipText, borderRadius: '12px', padding: '10px 14px' }
  const rev = data?.monthlyRevenue ?? []
  const sports = data?.popularSports ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <SectionHeader label="Performance Data" title="ANALYTICS" />

      {/* Revenue trend */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-mono text-mist uppercase tracking-widest">Revenue Trend</p>
          <span className="text-xs font-mono text-lime">{rev.length} months</span>
        </div>
        {rev.length > 0 ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rev}>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatPKR(Number(v)), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke={chart.lime} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-mist text-sm font-mono">No revenue data yet</div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Sport breakdown */}
        <Card>
          <p className="text-xs font-mono text-mist uppercase tracking-widest mb-5">Sport Breakdown</p>
          {sports.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sports} dataKey="count" nameKey="sport" cx="50%" cy="50%" outerRadius={75}
                    label={(p: any) => p.sport}>
                    {sports.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-mist text-sm font-mono">No sport data yet</div>
          )}
        </Card>

        {/* Occupancy by arena */}
        <Card>
          <p className="text-xs font-mono text-mist uppercase tracking-widest mb-5">Occupancy by Arena</p>
          {arenas.length > 0 ? (
            <div className="space-y-4">
              {arenas.map((arena) => arena && (
                <div key={arena.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-body text-chalk truncate max-w-[70%]">{arena.name}</span>
                    <span className="font-mono text-xs text-lime">{arena.occupancyRate}%</span>
                  </div>
                  <OccupancyBar percentage={arena.occupancyRate} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-mist text-sm font-mono">No arenas found</div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SLOT MANAGER
// ════════════════════════════════════════════════════════════════════════════
function SlotManager() {
  const { arenas, loading } = useOwnerData()
  const [days, setDays] = useState<{ date: string; label: string; short: string }[]>([])
  const [slotsByArena, setSlotsByArena] = useState<Record<string, TimeSlot[]>>({})
  const [blocked, setBlocked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedArena, setSelectedArena] = useState<string | null>(null)

  useEffect(() => {
    const list = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i)
      return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d'), short: format(d, 'EEE') }
    })
    setDays(list)
  }, [])

  useEffect(() => {
    async function load() {
      if (arenas.length === 0) { setLoadingData(false); return }
      if (!selectedArena) setSelectedArena(arenas[0]?.id ?? null)
      const from = days[0]?.date; const to = days[days.length - 1]?.date
      const byArena: Record<string, TimeSlot[]> = {}; const blockedAll: string[] = []
      for (const arena of arenas) {
        if (!arena) continue
        const [slots, bSlots] = await Promise.all([
          from && to ? fetchTimeSlotsForArenaRange(arena.id, from, to) : Promise.resolve([]),
          fetchBlockedSlots(arena.id),
        ])
        byArena[arena.id] = slots; blockedAll.push(...bSlots)
      }
      setSlotsByArena(byArena); setBlocked(new Set(blockedAll)); setLoadingData(false)
    }
    if (days.length > 0) load()
  }, [arenas, days])

  const dayStats = (arenaId: string, date: string) => {
    const slots = (slotsByArena[arenaId] ?? []).filter((s) => s.date === date)
    const open = slots.filter((s) => s.status !== 'booked')
    const available = open.filter((s) => !blocked.has(s.id)).length
    return { total: slots.length, openCount: open.length, available, hasData: slots.length > 0 }
  }

  const toggleDay = async (arenaId: string, date: string) => {
    const { openCount, available } = dayStats(arenaId, date)
    if (openCount === 0) return
    const doBlock = available > 0; setBusy(true)
    const slots = (slotsByArena[arenaId] ?? []).filter((s) => s.date === date && s.status !== 'booked')
    const next = new Set(blocked)
    for (const slot of slots) {
      const isBlocked = next.has(slot.id)
      if (doBlock && !isBlocked) { const ok = await setBlockedSlot(arenaId, slot.id, true); if (ok) next.add(slot.id) }
      else if (!doBlock && isBlocked) { const ok = await setBlockedSlot(arenaId, slot.id, false); if (ok) next.delete(slot.id) }
    }
    setBlocked(next); setBusy(false)
  }

  if (loading || loadingData) return <LoadingState message="Loading slot data..." />

  if (arenas.length === 0) return (
    <div className="max-w-7xl mx-auto">
      <SectionHeader label="Availability" title="SLOT MANAGER" />
      <Card className="text-center py-12">
        <Clock size={24} className="text-lime mx-auto mb-4" />
        <p className="font-display text-xl text-chalk mb-2">No arenas yet</p>
        <p className="text-sm text-mist">Add an arena first to manage its slots.</p>
      </Card>
    </div>
  )

  const active = selectedArena ?? arenas[0]?.id
  const activeArena = arenas.find((a) => a?.id === active)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SectionHeader label="Availability" title="SLOT MANAGER" />
      <p className="text-sm text-mist -mt-4">Click any day cell to block or unblock all open slots for that day.</p>

      {/* Arena selector */}
      {arenas.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {arenas.map((arena) => arena && (
            <button key={arena.id} type="button"
              onClick={() => setSelectedArena(arena.id)}
              className={cn('px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                active === arena.id ? 'bg-lime text-on-lime border-transparent' : 'bg-slate text-mist border-line hover:text-chalk hover:border-lime/30')}>
              {arena.name}
            </button>
          ))}
        </div>
      )}

      {/* 7-day grid */}
      {activeArena && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const stats = dayStats(activeArena.id, d.date)
            const fullyBlocked = stats.available === 0 && stats.openCount > 0
            const noData = !stats.hasData
            return (
              <div key={d.date} className="flex flex-col gap-2">
                {/* Day header */}
                <div className="text-center">
                  <p className="text-[10px] font-mono text-mist uppercase">{d.short}</p>
                  <p className="font-display text-lg text-chalk leading-tight">{d.label.split(' ')[1]}</p>
                </div>
                {/* Day cell */}
                <button type="button" disabled={busy || noData} onClick={() => toggleDay(activeArena.id, d.date)}
                  className={cn('w-full aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200',
                    noData ? 'border-line/30 bg-ground/30 cursor-default' :
                    fullyBlocked ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20' :
                    'border-lime/30 bg-lime/5 text-lime hover:bg-lime/15',
                    busy && 'opacity-50 cursor-wait')}>
                  {noData ? <span className="text-mist text-xs font-mono">—</span> : (
                    <>
                      {fullyBlocked ? <Lock size={14} /> : <Unlock size={14} />}
                      <span className="text-[10px] font-mono leading-none">
                        {fullyBlocked ? 'BLOCKED' : `${stats.available}/${stats.openCount}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs font-mono text-mist">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-lime/20 border border-lime/30" />Available</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />Blocked</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-ground/30 border border-line/30" />No slots</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PROFILE (embedded — no Navbar/Footer)
// ════════════════════════════════════════════════════════════════════════════
function OwnerProfile() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [ownerRecord, setOwnerRecord] = useState<OwnerRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Crop state
  const [cropSrc, setCropSrc] = useState(''); const [showCrop, setShowCrop] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1)
  const [cropRot, setCropRot] = useState(0); const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)
  const onCropComplete = useCallback((_: Area, p: Area) => setCroppedPixels(p), [])

  // Edit fields
  const [editName, setEditName] = useState(''); const [editPhone, setEditPhone] = useState('')
  const [editSaving, setEditSaving] = useState(false); const [editSuccess, setEditSuccess] = useState(false)
  // Business fields
  const [bizName, setBizName] = useState(''); const [bizEmail, setBizEmail] = useState(''); const [bizPhone, setBizPhone] = useState('')
  const [bizSaving, setBizSaving] = useState(false); const [bizSuccess, setBizSuccess] = useState(false)
  // Password
  const [curPw, setCurPw] = useState(''); const [newPw, setNewPw] = useState(''); const [confPw, setConfPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false); const [pwError, setPwError] = useState(''); const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([fetchProfileRecord(user.id), fetchOwnerRecord(user.id)]).then(([p, o]) => {
      setProfile(p); setOwnerRecord(o); setAvatarUrl(p?.avatarUrl ?? user.avatar)
      setEditName(p?.fullName ?? user.name ?? ''); setEditPhone(p?.phone ?? '')
      setBizName(o?.businessName ?? ''); setBizEmail(o?.businessEmail ?? ''); setBizPhone(o?.businessPhone ?? '')
      setLoading(false)
    })
  }, [user])

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f); setCropSrc(url); setCrop({ x: 0, y: 0 }); setZoom(1); setCropRot(0); setShowCrop(true)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleApplyCrop = async () => {
    if (!cropSrc || !croppedPixels || !user) return
    setShowCrop(false)
    const blob = await getCroppedBlob(cropSrc, croppedPixels, cropRot)
    const preview = URL.createObjectURL(blob); setAvatarUrl(preview); setAvatarUploading(true)
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const remote = await uploadAvatar(user.id, file)
    if (remote) setAvatarUrl(remote)
    setAvatarUploading(false)
  }

  const handleSaveProfile = async () => {
    if (!user) return; setEditSaving(true)
    await updateProfile(user.id, { fullName: editName.trim() || undefined, phone: editPhone.trim() || undefined })
    setEditSaving(false); setEditSuccess(true); setTimeout(() => setEditSuccess(false), 2500)
    await refreshUser()
  }

  const handleSaveBiz = async () => {
    if (!user) return; setBizSaving(true)
    await upsertOwnerRecord(user.id, { businessName: bizName.trim(), businessEmail: bizEmail.trim(), businessPhone: bizPhone.trim() })
    setBizSaving(false); setBizSuccess(true); setTimeout(() => setBizSuccess(false), 2500)
  }

  const handleChangePw = async () => {
    setPwError(''); if (!newPw || !curPw) { setPwError('Fill in all fields.'); return }
    if (newPw.length < 6) { setPwError('Min 6 characters.'); return }
    if (newPw !== confPw) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: profile?.email ?? user?.email ?? '', password: curPw })
    if (signInErr) { setPwError('Current password is incorrect.'); setPwSaving(false); return }
    const { error: updErr } = await supabase.auth.updateUser({ password: newPw })
    if (updErr) setPwError(updErr.message)
    else { setPwSuccess(true); setCurPw(''); setNewPw(''); setConfPw(''); setTimeout(() => setPwSuccess(false), 3000) }
    setPwSaving(false)
  }

  if (loading) return <LoadingState message="Loading profile..." />

  const inputCls = 'w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime text-sm font-body transition-colors'
  const labelCls = 'text-[10px] font-mono text-mist uppercase tracking-[0.18em] block mb-1.5'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader label="Account" title="MY PROFILE" />

      {/* Avatar + name hero */}
      <Card>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => avatarInputRef.current?.click()}
            className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-line focus:outline-none focus:ring-2 focus:ring-lime shrink-0">
            <img src={avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'O')}&background=random`}
              alt="" className="w-full h-full object-cover" />
            <span className={cn('absolute inset-0 flex items-center justify-center bg-ground/70 transition-opacity rounded-2xl',
              avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
              {avatarUploading ? <span className="text-[10px] font-mono text-lime">Saving…</span>
                : <Camera size={18} className="text-chalk" />}
            </span>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
          <div>
            <h2 className="font-display text-2xl text-chalk">{profile?.fullName ?? user?.name}</h2>
            <p className="text-sm text-mist mt-0.5 flex items-center gap-1.5"><Mail size={12} />{profile?.email ?? user?.email}</p>
            <span className="mt-2 inline-block font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime">Arena Owner</span>
          </div>
        </div>
      </Card>

      {/* Personal info */}
      <Card>
        <div className="flex items-center gap-2 mb-5"><Pencil size={14} className="text-lime" /><p className="text-xs font-mono text-mist uppercase tracking-widest">Personal Info</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Full Name</label><input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} placeholder="Your name" /></div>
          <div><label className={labelCls}>Phone</label><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputCls} placeholder="+92 or 0..." /></div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Btn type="button" onClick={handleSaveProfile} disabled={editSaving} className="px-6 py-2.5 text-sm">
            {editSaving ? 'Saving…' : editSuccess ? '✓ Saved' : 'Save Changes'}
          </Btn>
        </div>
      </Card>

      {/* Business info */}
      <Card>
        <div className="flex items-center gap-2 mb-5"><MapPin size={14} className="text-lime" /><p className="text-xs font-mono text-mist uppercase tracking-widest">Business Info</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Business Name</label><input value={bizName} onChange={(e) => setBizName(e.target.value)} className={inputCls} placeholder="Arena business name" /></div>
          <div><label className={labelCls}>Business Email</label><input value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} className={inputCls} placeholder="contact@arena.com" /></div>
          <div><label className={labelCls}>Business Phone</label><input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} className={inputCls} placeholder="+92..." /></div>
        </div>
        <div className="mt-4">
          <Btn type="button" onClick={handleSaveBiz} disabled={bizSaving} className="px-6 py-2.5 text-sm">
            {bizSaving ? 'Saving…' : bizSuccess ? '✓ Saved' : 'Save Business Info'}
          </Btn>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <div className="flex items-center gap-2 mb-5"><KeyRound size={14} className="text-lime" /><p className="text-xs font-mono text-mist uppercase tracking-widest">Change Password</p></div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[['Current Password', curPw, setCurPw], ['New Password', newPw, setNewPw], ['Confirm New', confPw, setConfPw]].map(([label, val, setter]: any) => (
            <div key={label}><label className={labelCls}>{label}</label>
              <input type="password" value={val} onChange={(e) => setter(e.target.value)} className={inputCls} placeholder="••••••••" />
            </div>
          ))}
        </div>
        {pwError && <p className="mt-3 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={13} />{pwError}</p>}
        {pwSuccess && <p className="mt-3 text-sm text-lime flex items-center gap-2"><CheckCircle2 size={13} />Password updated</p>}
        <div className="mt-4">
          <Btn type="button" onClick={handleChangePw} disabled={pwSaving} className="px-6 py-2.5 text-sm">
            {pwSaving ? 'Updating…' : 'Update Password'}
          </Btn>
        </div>
      </Card>

      {/* Crop modal */}
      {showCrop && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-turf border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="font-display text-lg text-chalk">Crop Photo</h3>
              <button onClick={() => setShowCrop(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-mist hover:text-chalk hover:bg-slate transition-colors"><X size={16} /></button>
            </div>
            <div className="relative bg-black" style={{ height: 260 }}>
              <Cropper image={cropSrc} crop={crop} zoom={zoom} rotation={cropRot} aspect={1} cropShape="round" showGrid={false}
                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}
                style={{ cropAreaStyle: { border: '2px solid rgba(200,255,0,0.8)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' } }} />
            </div>
            <div className="p-5 space-y-3">
              <div><label className={labelCls}>Zoom</label><input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-lime" /></div>
              <div><label className={labelCls}>Rotation</label><input type="range" min={0} max={360} step={1} value={cropRot} onChange={(e) => setCropRot(Number(e.target.value))} className="w-full accent-lime" /></div>
              <div className="flex gap-2 pt-1">
                <Btn type="button" variant="outline" onClick={() => setCropRot((r) => (r + 90) % 360)} className="flex-none flex items-center gap-1.5 text-sm px-4"><RotateCw size={14} />90°</Btn>
                <Btn type="button" onClick={handleApplyCrop} className="flex-1 text-sm">Apply Crop</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT — route tree
// ════════════════════════════════════════════════════════════════════════════
export default function OwnerDashboard() {
  const { user } = useAuth()
  if (!user || user.role !== 'owner') return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<DashboardLayout role="owner" links={links} />}>
        <Route index element={<OwnerOverview />} />
        <Route path="bookings"  element={<OwnerBookingsWrapper />} />
        <Route path="arenas"    element={<OwnerArenas />} />
        <Route path="campaigns" element={<OwnerCampaigns embedded={true} />} />
        <Route path="analytics" element={<OwnerAnalytics />} />
        <Route path="slots"     element={<SlotManager />} />
        <Route path="profile"   element={<OwnerProfile />} />
      </Route>
    </Routes>
  )
}
