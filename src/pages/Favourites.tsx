import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { fetchFavoritesForUser } from '../services/supabaseData'
import { formatPKR } from '../utils/formatters'
import type { Arena } from '../types'

export default function Favourites() {
  const { user } = useAuth()
  const [favourites, setFavourites] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchFavoritesForUser(user.id).then((data) => {
      setFavourites(data)
      setLoading(false)
    })
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <LoadingState message="Loading your favourites..." />

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
                  <Heart size={14} />
                  Saved Arenas
                </span>
                <h1 className="font-display text-[clamp(2.4rem,8vw,5rem)] text-chalk leading-[0.92]">
                  Your Favourite Venues
                </h1>
                <p className="max-w-xl text-sm md:text-base text-mist">
                  Arenas you've saved for quick access. Tap any card to book a slot.
                </p>
              </div>
              <BtnLink to="/arenas" variant="outline" className="px-5 py-3 text-sm shrink-0">
                Browse More
              </BtnLink>
            </div>
          </section>

          {/* Grid */}
          {favourites.length === 0 ? (
            <section className="rounded-[24px] border border-line bg-turf p-8 text-center">
              <Heart size={32} className="text-mist mx-auto mb-4" />
              <p className="text-chalk font-display text-2xl mb-2">Nothing saved yet</p>
              <p className="text-mist text-sm mb-6">Tap the heart icon on any arena page to save it here.</p>
              <BtnLink to="/arenas" className="inline-block px-6 py-3">
                Discover Arenas
              </BtnLink>
            </section>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favourites.map((arena) => (
                <Link
                  key={arena.id}
                  to={`/arenas/${arena.slug}`}
                  className="group rounded-[20px] border border-line bg-turf overflow-hidden hover:border-lime/40 transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={arena.images[0]}
                      alt={arena.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ground/60 to-transparent" />
                    <Heart size={16} className="absolute top-3 right-3 fill-lime text-lime" />
                  </div>
                  <div className="p-4">
                    <p className="font-display text-xl text-chalk leading-tight">{arena.name}</p>
                    <p className="text-mist text-sm mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {arena.location.area}, {arena.location.city}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-chalk text-sm">From {formatPKR(arena.pricing.weekday)}/hr</p>
                      <span className="font-mono text-xs text-lime">{arena.rating} ★</span>
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
