import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { addDays, format } from 'date-fns'
import { CalendarDays, Clock3, MapPin, Radar, Star } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { SlotGrid } from '../components/ui/SlotGrid'
import { SportTag } from '../components/ui/SportTag'
import { fetchArenaBySlug, fetchSlotsForArenaDate } from '../services/supabaseData'
import type { Arena, Slot } from '../types'
import { cn, formatPKR, formatTime } from '../utils/formatters'

export default function ArenaSchedule() {
  const { slug } = useParams()
  const [arena, setArena] = useState<Arena | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)
  const [slotMap, setSlotMap] = useState<Record<string, Slot[]>>({})
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [heroImage, setHeroImage] = useState(0)

  // 30-day window
  const days = useMemo(
    () => Array.from({ length: 30 }, (_, index) => addDays(new Date(), index)),
    []
  )

  const selectedDate = format(days[selectedDay], 'yyyy-MM-dd')
  const selectedSlots = slotMap[selectedDate] || []

  useEffect(() => {
    async function loadArena() {
      if (!slug) return
      setLoading(true)
      const data = await fetchArenaBySlug(slug)
      setArena(data ?? null)
      setLoading(false)
    }
    loadArena()
  }, [slug])

  // Lazy-load: fetch only the selected day, cache in slotMap
  useEffect(() => {
    if (!arena) return
    if (slotMap[selectedDate] !== undefined) return   // already cached

    setSlotsLoading(true)
    fetchSlotsForArenaDate(arena.id, selectedDate).then((slots) => {
      setSlotMap((prev) => ({ ...prev, [selectedDate]: slots as Slot[] }))
      setSlotsLoading(false)
    })
  }, [arena, selectedDate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ground text-mist">
        Loading schedule...
      </div>
    )
  }

  if (!arena) {
    return <Navigate to="/arenas" replace />
  }

  const totalAvailable = selectedSlots.filter((slot) => slot.status === 'available').length
  const totalBooked = selectedSlots.filter((slot) => slot.status === 'booked').length
  const peakCount = selectedSlots.filter((slot) => slot.isPeak).length

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-turf overflow-hidden">
            <div className="grid xl:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[320px] md:min-h-[420px]">
                <img
                  src={arena.images[heroImage]}
                  alt={arena.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ground/95 via-ground/65 to-transparent" />
                <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <SportTag sport={arena.sport} />
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-mist bg-ground/70 px-3 py-1 rounded-full border border-line">
                      Live schedule
                    </span>
                  </div>
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-mist font-mono">Arena schedule</p>
                    <h1 className="font-display text-[clamp(2.5rem,8vw,5.8rem)] text-chalk leading-[0.92] mt-3">
                      {arena.name}
                    </h1>
                    <p className="mt-3 text-sm md:text-base text-mist max-w-xl">
                      View daily availability, booking pressure, and peak windows directly from the time slots table.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <BtnLink to={`/arenas/${arena.slug}`} className="px-5 py-3 text-sm">
                        Start Booking
                      </BtnLink>
                      <BtnLink to={`/arenas/${arena.slug}`} variant="outline" className="px-5 py-3 text-sm">
                        Back to detail
                      </BtnLink>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-8 border-t xl:border-t-0 xl:border-l border-line bg-ground/70">
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-2xl border border-line bg-slate p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Location</p>
                    <p className="mt-2 text-chalk flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-lime" />
                      {arena.location.area}, {arena.location.city}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-slate p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Hours</p>
                    <p className="mt-2 text-chalk flex items-center gap-2 text-sm">
                      <Clock3 size={14} className="text-lime" />
                      {arena.operatingHours.open} - {arena.operatingHours.close}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-slate p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Rating</p>
                    <p className="mt-2 text-chalk flex items-center gap-2 text-sm">
                      <Star size={14} className="text-lime fill-lime" />
                      {arena.rating} ({arena.reviewCount} reviews)
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-slate p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Weekday rate</p>
                    <p className="mt-2 text-chalk text-sm">{formatPKR(arena.pricing.weekday)}/hr</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-line bg-slate p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Gallery</p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {arena.images.slice(0, 4).map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setHeroImage(index)}
                        className={cn(
                          'rounded-xl overflow-hidden border transition-colors',
                          heroImage === index ? 'border-lime' : 'border-line opacity-80'
                        )}
                      >
                        <img src={image} alt="" className="w-full h-20 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid xl:grid-cols-[0.72fr_1.28fr] gap-4 md:gap-5 items-start">
            <aside className="rounded-[24px] border border-line bg-turf p-5 md:p-6 xl:sticky xl:top-24">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-chalk">Day picker</h2>
                <CalendarDays size={18} className="text-lime shrink-0" />
              </div>

              {/* Scrollable date strip — works for 30 days */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {days.map((day, index) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const active = selectedDay === index
                  const cached = slotMap[key]
                  const available = cached ? cached.filter((s) => s.status === 'available').length : null

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(index)}
                      className={cn(
                        'shrink-0 rounded-2xl border px-3 py-3 text-center transition-colors w-[72px]',
                        active
                          ? 'border-lime bg-lime/10'
                          : 'border-line bg-slate hover:border-lime/30'
                      )}
                    >
                      <p className={cn('text-[10px] font-mono uppercase tracking-widest', active ? 'text-lime' : 'text-mist')}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={cn('font-display text-xl leading-tight mt-0.5', active ? 'text-chalk' : 'text-chalk/70')}>
                        {format(day, 'd')}
                      </p>
                      <p className={cn('text-[10px] font-mono mt-0.5', active ? 'text-mist' : 'text-mist/50')}>
                        {format(day, 'MMM')}
                      </p>
                      {available !== null && (
                        <p className="text-[9px] font-mono text-lime mt-1">{available} open</p>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-slate p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Selected day</p>
                <p className="mt-2 text-chalk text-sm">
                  {format(days[selectedDay], 'EEEE, d MMM yyyy')}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl border border-line bg-ground/80 p-3">
                    <p className="text-mist text-xs font-mono uppercase">Open</p>
                    <p className="mt-2 text-chalk">{slotsLoading ? '…' : totalAvailable}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-ground/80 p-3">
                    <p className="text-mist text-xs font-mono uppercase">Booked</p>
                    <p className="mt-2 text-chalk">{slotsLoading ? '…' : totalBooked}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-ground/80 p-3">
                    <p className="text-mist text-xs font-mono uppercase">Peak</p>
                    <p className="mt-2 text-chalk">{slotsLoading ? '…' : peakCount}</p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Availability</p>
                  <h2 className="font-display text-3xl text-chalk mt-2">{format(days[selectedDay], 'EEEE')}</h2>
                </div>
                <Radar size={18} className="text-lime shrink-0" />
              </div>

              <div className="mt-5 rounded-2xl border border-line bg-slate p-4 md:p-5">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-mist text-sm font-mono">
                    <span className="w-4 h-4 border-2 border-lime border-t-transparent rounded-full animate-spin" />
                    Loading slots…
                  </div>
                ) : (
                  <SlotGrid slots={selectedSlots} compact />
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectedSlots.slice(0, 6).map((slot) => (
                  <article key={slot.id} className="rounded-2xl border border-line bg-slate p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl text-chalk leading-none">{formatTime(slot.startTime)}</p>
                        <p className="text-xs text-mist font-mono mt-2">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </p>
                      </div>
                      <span className="text-xs uppercase font-mono px-2 py-1 rounded-full border border-line text-mist">
                        {slot.status}
                      </span>
                    </div>
                    <p className="mt-4 text-lime text-sm">
                      {formatPKR(slot.price)} {slot.isPeak ? 'peak' : 'base'}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <BtnLink to={`/arenas/${arena.slug}`} className="px-5 py-3 text-sm">
                  Reserve Slot
                </BtnLink>
                <BtnLink to={`/arenas/${arena.slug}`} variant="outline" className="px-5 py-3 text-sm">
                  View Full Details
                </BtnLink>
              </div>
            </div>
          </section>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
