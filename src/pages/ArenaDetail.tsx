import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { fetchArenaBySlug, fetchReviewsForArena, fetchSlotsForArenaDate, fetchArenaHourlyData, isFavorited, addFavorite, removeFavorite } from '../services/supabaseData'
import { SportTag } from '../components/ui/SportTag'
import { SlotGrid } from '../components/ui/SlotGrid'
import { PeakHoursChart } from '../components/ui/PeakHoursChart'
import { ReviewCard } from '../components/ui/ReviewCard'
import { BookingSteps } from '../components/ui/BookingSteps'
import { Btn, BtnLink } from '../components/ui/Btn'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { formatPKR, formatTime } from '../utils/formatters'
import { cn } from '../utils/formatters'
import type { HourlyData, Slot } from '../types'

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

export default function ArenaDetail() {
  const { slug } = useParams()
  const [arena, setArena] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [daySlots, setDaySlots] = useState<Slot[]>([])
  const [peakHours, setPeakHours] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()
  const { selectSlot, slots: selectedSlots, step, setStep, resetBooking } = useBooking()

  const [heroImage, setHeroImage] = useState(0)
  const [favourite, setFavourite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const days = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
  const [selectedDay, setSelectedDay] = useState(0)
  const selectedDate = format(days[selectedDay], 'yyyy-MM-dd')

  useEffect(() => {
    async function loadArena() {
      if (!slug) return
      setLoading(true)
      const data = await fetchArenaBySlug(slug)
      if (data) {
        setArena(data)
        const [arenaReviews, hourlyData] = await Promise.all([
          fetchReviewsForArena(data.id),
          fetchArenaHourlyData(data.id),
        ])
        setReviews(arenaReviews)
        setPeakHours(hourlyData)
        // Load favourite state for logged-in users
        if (user?.id) {
          const faved = await isFavorited(user.id, data.id)
          setFavourite(faved)
        }
      }
      setLoading(false)
    }
    loadArena()
  }, [slug])

  useEffect(() => {
    async function loadSlots() {
      if (!arena) return
      const slots = await fetchSlotsForArenaDate(arena.id, selectedDate)
      setDaySlots(slots as Slot[])
    }
    loadSlots()
  }, [arena, selectedDate])

  // Re-fetch slots after a booking is confirmed so booked slots grey out immediately
  useEffect(() => {
    if (step !== 'confirmed' || !arena) return
    fetchSlotsForArenaDate(arena.id, selectedDate).then((slots) => {
      setDaySlots(slots as Slot[])
    })
  }, [step])

  if (loading) return <LoadingState message="Loading arena..." />

  if (!arena) return <LoadingState message="Arena not found" />

  const selectedTotal = selectedSlots.reduce((sum, currentSlot) => sum + currentSlot.price, 0)

  const handleToggleFavourite = async () => {
    if (!user) {
      console.warn('Not logged in — cannot save favourite')
      return
    }
    console.log('Toggle fav — user:', user.id, 'arena:', arena.id, 'current:', favourite)
    if (favLoading) return
    setFavLoading(true)
    if (favourite) {
      const ok = await removeFavorite(user.id, arena.id)
      if (ok) setFavourite(false)
    } else {
      const ok = await addFavorite(user.id, arena.id)
      if (ok) setFavourite(true)
    }
    setFavLoading(false)
  }
  const handleSlotSelect = (s: Slot) => {
    if (s.status !== 'available') return
    const nextSlots = selectSlot(arena.id, arena.name, s)
    if (nextSlots.length === 0) {
      setDrawerOpen(false)
      setStep('idle')
      return
    }

    setDrawerOpen(true)
    setStep('selected')
  }

  const handleConfirm = () => {
    if (selectedSlots.length > 0) {
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
            <nav className="absolute top-4 left-4 flex items-center gap-1 font-mono text-xs text-mist bg-ground/60 px-3 py-1 rounded-sm" aria-label="Breadcrumb">
              <Link to="/arenas" className="hover:text-chalk transition-colors">Arenas</Link>
              <span className="mx-1 opacity-40">&gt;</span>
              <Link to={`/arenas?sport=${arena.sport}`} className="hover:text-chalk transition-colors">{arena.sport}</Link>
              <span className="mx-1 opacity-40">&gt;</span>
              <span className="text-chalk">{arena.name}</span>
            </nav>
            <div className="absolute top-4 right-4 flex gap-2">
              <button type="button" className="p-2 bg-ground/60 rounded-sm text-chalk">
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={handleToggleFavourite}
                disabled={favLoading || !user}
                className={`p-2 bg-ground/60 rounded-sm transition-opacity ${favLoading ? 'opacity-50' : ''} ${!user ? 'cursor-default' : ''}`}
                title={!user ? 'Sign in to save' : favourite ? 'Remove from favourites' : 'Save to favourites'}
              >
                <Heart
                  size={18}
                  className={favourite ? 'fill-lime text-lime' : 'text-chalk'}
                />
              </button>
            </div>
          </div>
          <div className="flex gap-3 px-4 py-3 bg-ground">
            {arena.images.slice(0, 4).map((img: string, i: number) => (
              <button
                key={img}
                type="button"
                onClick={() => setHeroImage(i)}
                className={`flex-1 h-[80px] md:h-[120px] overflow-hidden rounded-sm transition-all ${
                  heroImage === i ? 'ring-2 ring-lime ring-offset-2 ring-offset-ground' : 'opacity-70 hover:opacity-100'
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
                <SlotGrid
                  slots={daySlots}
                  selectedIds={selectedSlots.map((selectedSlot) => selectedSlot.id)}
                  onSelect={handleSlotSelect}
                />
                {selectedSlots.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-line">
                    <div className="space-y-2">
                      <p className="font-mono text-sm text-mist">
                        {format(parseISO(selectedDate), 'd MMM yyyy')} · {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSlots.map((selectedSlot) => (
                          <span
                            key={selectedSlot.id}
                            className="font-mono text-[11px] px-2 py-1 rounded-full border border-line text-chalk bg-ground/70"
                          >
                            {formatTime(selectedSlot.startTime)}-{formatTime(selectedSlot.endTime)}
                          </span>
                        ))}
                      </div>
                      <p className="font-mono text-lime mt-2">
                        Total {selectedSlots.length} hr{selectedSlots.length > 1 ? 's' : ''} = {formatPKR(selectedTotal)}
                      </p>
                    </div>
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

              <PeakHoursChart data={peakHours} />

              <div className="mt-12">
                <h3 className="font-display text-2xl text-chalk mb-6">PLAYER REVIEWS</h3>
                {(showAllReviews ? reviews : reviews.slice(0, 5)).map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
                {reviews.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                    className="text-mist text-[13px] font-body mt-4 hover:text-chalk transition-colors"
                  >
                    {showAllReviews ? 'Show fewer' : `Load more (${reviews.length - 5} remaining)`}
                  </button>
                )}
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
                        className={cn('btn-day', active ? 'btn-day-active' : 'btn-day-inactive')}
                      >
                        {format(day, 'EEE d')}
                      </button>
                    )
                  })}
                </div>
                <SlotGrid
                  slots={daySlots}
                  selectedIds={selectedSlots.map((selectedSlot) => selectedSlot.id)}
                  onSelect={handleSlotSelect}
                />
                {selectedSlots.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-line">
                    <div className="space-y-2">
                      <p className="font-mono text-sm text-mist">
                        {format(parseISO(selectedDate), 'd MMM yyyy')} · {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSlots.map((selectedSlot) => (
                          <span
                            key={selectedSlot.id}
                            className="font-mono text-[11px] px-2 py-1 rounded-full border border-line text-chalk bg-ground/70"
                          >
                            {formatTime(selectedSlot.startTime)}-{formatTime(selectedSlot.endTime)}
                          </span>
                        ))}
                      </div>
                      <p className="font-mono text-lime mt-2">
                        Total {selectedSlots.length} hr{selectedSlots.length > 1 ? 's' : ''} = {formatPKR(selectedTotal)}
                      </p>
                    </div>
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
              if (step === 'confirmed') {
                // Optimistically grey out the confirmed slots before the re-fetch arrives
                setDaySlots((prev) =>
                  prev.map((s) =>
                    selectedSlots.some((sel) => sel.id === s.id)
                      ? { ...s, status: 'booked' as const }
                      : s
                  )
                )
                resetBooking()
                setStep('idle')
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
