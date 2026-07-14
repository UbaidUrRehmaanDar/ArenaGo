import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Activity as ActivityIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { fetchPlayerBookings, fetchArenaById } from '../services/supabaseData'
import { cn } from '../utils/formatters'
import type { Booking, Arena } from '../types'

export default function Activity() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [arenas, setArenas] = useState<Record<string, Arena>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { bookings: b } = await fetchPlayerBookings(user!.id, 1, 50)
      setBookings(b)
      const ids = Array.from(new Set(b.map(x => x.arenaId)))
      const map: Record<string, Arena> = {}
      for (const id of ids) {
        const a = await fetchArenaById(id)
        if (a) map[id] = a
      }
      setArenas(map)
      setLoading(false)
    }
    load()
  }, [user?.id])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <LoadingState message="Loading your activity..." />

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-20 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          {/* Hero */}
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <ActivityIcon size={14} />
                  Activity Feed
                </span>
                <h1 className="font-display text-[clamp(2.4rem,8vw,5rem)] text-chalk leading-[0.92]">
                  Your Booking Timeline
                </h1>
                <p className="max-w-xl text-sm md:text-base text-mist">
                  Every arena you've visited, every slot you've locked in.
                </p>
              </div>
              <BtnLink to="/booking" className="px-5 py-3 text-sm shrink-0">
                Book a Slot
              </BtnLink>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon size={32} className="text-mist mx-auto mb-4" />
                <p className="text-chalk font-display text-2xl mb-2">No activity yet</p>
                <p className="text-mist text-sm mb-6">Your booking history will appear here once you start playing.</p>
                <BtnLink to="/arenas" className="inline-block px-6 py-3">Book an Arena</BtnLink>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-line space-y-6 md:space-y-8">
                {bookings
                  .sort((a, b) => new Date(b.date + 'T' + b.startTime).getTime() - new Date(a.date + 'T' + a.startTime).getTime())
                  .map((b) => {
                    const arena = arenas[b.arenaId]
                    const isCancelled = b.status === 'cancelled'
                    const isCompleted = b.status === 'completed'
                    return (
                      <div key={b.id} className="relative">
                        <span className={cn(
                          'absolute -left-[29px] w-3 h-3 rounded-full top-1',
                          isCancelled ? 'bg-booked' : isCompleted ? 'bg-mist' : 'bg-lime'
                        )} />
                        <p className="text-chalk text-[15px]">
                          <span className={cn(
                            'font-medium',
                            isCancelled ? 'text-booked' : isCompleted ? 'text-mist' : 'text-lime'
                          )}>
                            {isCancelled ? 'Cancelled' : isCompleted ? 'Played at' : 'Booked'}
                          </span>
                          {' '}{arena?.name || 'an arena'}
                        </p>
                        <p className="font-mono text-xs text-mist mt-1">
                          {format(parseISO(b.date), 'd MMM yyyy')} · {b.startTime}
                          {arena && ` · ${arena.location.area}`}
                        </p>
                      </div>
                    )
                  })}
              </div>
            )}
          </section>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
