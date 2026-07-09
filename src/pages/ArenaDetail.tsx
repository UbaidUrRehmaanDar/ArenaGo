import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import {
  Car,
  Clock,
  Droplets,
  Eye,
  Heart,
  Lightbulb,
  MapPin,
  Share2,
  Shield,
  Sofa,
  Users,
  Video,
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ownerAnalytics } from '../data/analytics'
import { fetchArenaBySlug, fetchReviewsForArena, fetchSlotsForArenaDate } from '../services/supabaseData'
import { SportTag } from '../components/ui/SportTag'
import { SlotGrid } from '../components/ui/SlotGrid'
import { PeakHoursChart } from '../components/ui/PeakHoursChart'
import { ReviewCard } from '../components/ui/ReviewCard'
import { BookingSteps } from '../components/ui/BookingSteps'
import { Btn, BtnLink } from '../components/ui/Btn'
import { useBooking } from '../context/BookingContext'
import { formatPKR, formatTime } from '../utils/formatters'
import { cn } from '../utils/formatters'
import type { Slot } from '../types'

const amenityIcons: Record<string, typeof Car> = {
  'Changing Rooms': Users,
  Parking: Car,
  Floodlights: Lightbulb,
  CCTV: Video,
  'Water Cooler': Droplets,
  'First Aid': Shield,
  'Seating Area': Sofa,
  'Spectator Stand': Eye,
}

const allAmenities = [
  'Changing Rooms',
  'Parking',
  'Floodlights',
  'CCTV',
  'Water Cooler',
  'First Aid',
  'Seating Area',
  'Spectator Stand',
]

export function ArenaDetail() {
  const { slug } = useParams()
  const [arena, setArena] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [daySlots, setDaySlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  const [heroImage, setHeroImage] = useState(0)
  const [favourite, setFavourite] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))
  const [selectedDay, setSelectedDay] = useState(0)
  const selectedDate = format(days[selectedDay], 'yyyy-MM-dd')
  const { selectSlot, slot, step, setStep } = useBooking()

  useEffect(() => {
    async function loadArena() {
      if (!slug) return
      setLoading(true)
      const data = await fetchArenaBySlug(slug)
      if (data) {
        setArena(data)
        const arenaReviews = await fetchReviewsForArena(data.id)
        setReviews(arenaReviews)
      }
      setLoading(false)
    }
    loadArena()
  }, [slug])

  useEffect(() => {
    async function loadSlots() {
      if (arena) {
        const slots = await fetchSlotsForArenaDate(arena.id, selectedDate)
        setDaySlots(slots as Slot[])
      }
    }
    loadSlots()
  }, [arena, selectedDate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-mist">Loading arena...</p>
      </div>
    )
  }

  if (!arena) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-mist">Arena not found</p>
      </div>
    )
  }

  const analytics = ownerAnalytics.find((a) => a.arenaId === arena.id) ?? ownerAnalytics[0]

  const handleSlotSelect = (s: Slot) => {
    if (s.status !== 'available') return
    const isDeselect = slot?.id === s.id
    selectSlot(arena.id, arena.name, s)
    if (isDeselect) {
      setDrawerOpen(false)
    } else {
      setDrawerOpen(true)
      setStep('selected')
    }
  }

  const handleConfirm = () => {
    if (slot) {
      setDrawerOpen(true)
      setStep('selected')
    }
  }

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20">
        <div className="w-full">
          <div className="relative h-[300px] md:h-[500px]">
            <img
              src={arena.images[heroImage]}
              alt={arena.name}
              className="w-full h-full object-cover"
            />
            <p className="absolute top-4 left-4 font-mono text-xs text-mist bg-ground/60 px-3 py-1 rounded-sm">
              Arenas &gt; {arena.sport} &gt; {arena.name}
            </p>
            <div className="absolute top-4 right-4 flex gap-2">
              <button type="button" className="p-2 bg-ground/60 rounded-sm text-chalk">
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setFavourite(!favourite)}
                className="p-2 bg-ground/60 rounded-sm"
              >
                <Heart
                  size={18}
                  className={favourite ? 'fill-lime text-lime' : 'text-chalk'}
                />
              </button>
            </div>
          </div>
          <div className="flex gap-1 px-0">
            {arena.images.slice(0, 4).map((img: string, i: number) => (
              <button
                key={img}
                type="button"
                onClick={() => setHeroImage(i)}
                className={`flex-1 h-[100px] md:h-[150px] overflow-hidden ${
                  heroImage === i ? 'ring-2 ring-lime' : 'opacity-70'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="mb-8">
            <h1 className="font-display text-[clamp(1.8rem,6vw,4rem)] text-chalk">{arena.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <SportTag sport={arena.sport} size="md" />
              <span className="flex items-center gap-1 text-mist text-[13px]">
                <MapPin size={12} />
                {arena.location.area}, {arena.location.city}
              </span>
              <span className="flex items-center gap-1 text-mist text-[13px]">
                <Clock size={12} />
                {arena.operatingHours.open} – {arena.operatingHours.close}
              </span>
            </div>
            <p className="mt-2 text-chalk">
              {arena.rating} ★ ({arena.reviewCount} reviews)
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {arena.highlights.map((h: string) => (
                <span
                  key={h}
                  className="font-mono text-xs px-3 py-1 bg-slate border border-line text-mist"
                >
                  {h}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <BtnLink to={`/arenas/${arena.slug}/schedule`} variant="outline" className="px-5 py-3 text-sm">
                View Schedule
              </BtnLink>
              <BtnLink to="/promotions" variant="outline" className="px-5 py-3 text-sm">
                See Offers
              </BtnLink>
            </div>
          </div>

          <div className="grid lg:grid-cols-[65%_35%] gap-10">
            <div>
              <p className="text-[15px] text-chalk/90 leading-relaxed mb-8">
                {arena.description}
              </p>

              {/* Mobile booking panel */}
              <div className="lg:hidden bg-slate p-5 rounded-sm border border-line mb-8">
                <h2 className="font-display text-2xl text-chalk mb-4">BOOK A SLOT</h2>
                <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
                  {days.map((day, i) => {
                    const active = selectedDay === i
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDay(i)}
                        className={cn('btn-day', active ? 'btn-day-active' : 'btn-day-inactive')}
                      >
                        {format(day, 'EEE d')}
                      </button>
                    )
                  })}
                </div>
                <SlotGrid slots={daySlots} selectedId={slot?.id} onSelect={handleSlotSelect} />
                {slot && (
                  <div className="mt-5 pt-5 border-t border-line">
                    <p className="font-mono text-sm text-mist">
                      {format(parseISO(selectedDate), 'd MMM yyyy')} · {formatTime(slot.startTime)}
                    </p>
                    <p className="font-mono text-lime mt-2">
                      1 hr × {formatPKR(slot.price)} = {formatPKR(slot.price)}
                    </p>
                    <Btn onClick={handleConfirm} className="w-full mt-4 py-3">
                      Confirm Booking
                    </Btn>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {allAmenities.map((name) => {
                  const Icon = amenityIcons[name] ?? Users
                  const has = arena.amenities.includes(name)
                  return (
                    <div
                      key={name}
                      className={`flex flex-col items-center gap-2 p-3 ${!has && 'opacity-35'}`}
                    >
                      <Icon size={16} className="text-mist" />
                      <span className="text-[13px] text-mist text-center">{name}</span>
                    </div>
                  )
                })}
              </div>

              <PeakHoursChart data={analytics.peakHours} />

              <div className="mt-12">
                <h3 className="font-display text-2xl text-chalk mb-6">PLAYER REVIEWS</h3>
                {reviews.slice(0, 5).map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
                <button
                  type="button"
                  className="text-mist text-[13px] font-body mt-4 hover:text-chalk"
                >
                  Load more
                </button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-slate p-6 rounded-sm border border-line">
                <h2 className="font-display text-display-md text-chalk mb-6">BOOK A SLOT</h2>
                <div className="flex gap-1 overflow-x-auto mb-6 pb-2">
                  {days.map((day, i) => {
                    const active = selectedDay === i
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDay(i)}
                        className={cn(
                          'btn-day',
                          active ? 'btn-day-active' : 'btn-day-inactive'
                        )}
                      >
                        {format(day, 'EEE d')}
                      </button>
                    )
                  })}
                </div>
                <SlotGrid
                  slots={daySlots}
                  selectedId={slot?.id}
                  onSelect={handleSlotSelect}
                />
                {slot && (
                  <div className="mt-6 pt-6 border-t border-line">
                    <p className="font-mono text-sm text-mist">
                      {format(parseISO(selectedDate), 'd MMM yyyy')} · {formatTime(slot.startTime)}
                    </p>
                    <p className="font-mono text-lime mt-2">
                      1 hr × {formatPKR(slot.price)} = {formatPKR(slot.price)}
                    </p>
                    <Btn onClick={handleConfirm} className="w-full mt-4 py-3">
                      Confirm Booking
                    </Btn>
                    <p className="font-mono text-[11px] text-mist mt-3 text-center">
                      No payment required at this time
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </PageWrapper>
      <Footer />
      <AnimatePresence>
        {drawerOpen && (
          <BookingSteps
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false)
              if (step === 'confirmed') setStep('idle')
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
