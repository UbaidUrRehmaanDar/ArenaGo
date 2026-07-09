import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, MapPin, Ticket } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { fetchActivePromotions } from '../services/supabaseData'
import type { Arena, PromotionRecord } from '../types'
import { cn, formatPKR } from '../utils/formatters'

interface PromotionFeedItem extends PromotionRecord {
  arena?: Arena
}

function formatOfferValue(promotion: PromotionRecord) {
  const type = promotion.promotionType?.toLowerCase() || ''
  if (type.includes('percent')) return `${promotion.value}% off`
  if (type.includes('flat') || type.includes('fixed')) return `${formatPKR(promotion.value)} off`
  return `${formatPKR(promotion.value)} value`
}

export function Promotions() {
  const [promotions, setPromotions] = useState<PromotionFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await fetchActivePromotions()
      setPromotions(data)
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const expiringSoon = promotions.filter(
      (promotion) => new Date(promotion.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 5
    ).length
    return {
      total: promotions.length,
      expiringSoon,
      arenas: new Set(promotions.map((promotion) => promotion.arenaId)).size,
    }
  }, [promotions])

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-slate via-turf to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-end">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <Ticket size={14} />
                  Live Offers
                </span>
                <h1 className="font-display text-[clamp(2.5rem,8vw,5.4rem)] text-chalk leading-[0.92]">
                  Active promotions across the arena network.
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-mist">
                  This page is wired to the live promotions table, so the copy, dates, and linked arenas stay aligned with the backend.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Offers</p>
                  <p className="mt-2 text-chalk text-2xl font-display">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Arenas</p>
                  <p className="mt-2 text-chalk text-2xl font-display">{stats.arenas}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Soon</p>
                  <p className="mt-2 text-chalk text-2xl font-display">{stats.expiringSoon}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <BtnLink to="/arenas" className="px-5 py-3 text-sm">
                Browse Arenas
              </BtnLink>
              <BtnLink to="/booking" variant="outline" className="px-5 py-3 text-sm">
                Book a Slot
              </BtnLink>
            </div>
          </section>

          <section className="grid gap-4 md:gap-5">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-[320px] rounded-[24px] border border-line bg-slate skeleton-shimmer" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {promotions.map((promotion) => {
                  const isUrgent = new Date(promotion.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3
                  const arena = promotion.arena

                  return (
                    <article
                      key={promotion.id}
                      className={cn(
                        'rounded-[24px] border p-5 md:p-6 flex flex-col gap-5 bg-turf',
                        isUrgent ? 'border-lime/40 shadow-[0_0_0_1px_rgba(200,255,0,0.1)]' : 'border-line'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-mono uppercase tracking-[0.2em] text-mist">Promo code</p>
                          <h2 className="mt-2 font-display text-3xl text-chalk leading-none">{promotion.code}</h2>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-lime text-on-lime text-xs font-mono uppercase">
                          {formatOfferValue(promotion)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display text-2xl text-chalk">{promotion.title}</h3>
                        <p className="text-sm text-mist mt-2 leading-relaxed">{promotion.description}</p>
                      </div>

                      {arena && (
                        <Link
                          to={`/arenas/${arena.slug}`}
                          className="rounded-2xl border border-line bg-slate overflow-hidden flex gap-4 p-3 hover:border-lime/30 transition-colors"
                        >
                          <img src={arena.images[0]} alt={arena.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-xl text-chalk truncate">{arena.name}</p>
                            <p className="text-sm text-mist mt-1 flex items-center gap-1">
                              <MapPin size={12} />
                              {arena.location.area}, {arena.location.city}
                            </p>
                            <p className="text-xs text-mist font-mono mt-2">
                              {arena.rating} rating · {arena.reviewCount} reviews
                            </p>
                          </div>
                        </Link>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-line bg-ground/70 p-3">
                          <p className="text-xs font-mono uppercase tracking-[0.18em] text-mist">Min spend</p>
                          <p className="mt-2 text-chalk">{formatPKR(promotion.minAmount)}</p>
                        </div>
                        <div className="rounded-2xl border border-line bg-ground/70 p-3">
                          <p className="text-xs font-mono uppercase tracking-[0.18em] text-mist">Redemptions</p>
                          <p className="mt-2 text-chalk">
                            {promotion.usedCount}{promotion.maxUses ? ` / ${promotion.maxUses}` : ''}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-line bg-ground/70 p-3 col-span-2">
                          <p className="text-xs font-mono uppercase tracking-[0.18em] text-mist">Ends</p>
                          <p className="mt-2 text-chalk flex items-center gap-2">
                            <CalendarClock size={14} className="text-lime" />
                            {format(parseISO(promotion.expiresAt), 'd MMM yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        <BtnLink to={arena ? `/arenas/${arena.slug}` : '/arenas'} className="px-5 py-3 text-sm">
                          View Venue
                        </BtnLink>
                        <BtnLink to="/booking" variant="outline" className="px-5 py-3 text-sm">
                          Use Offer
                        </BtnLink>
                      </div>
                    </article>
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
