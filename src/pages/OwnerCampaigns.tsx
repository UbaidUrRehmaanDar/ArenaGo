import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CalendarClock, Megaphone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { StatCard } from '../components/ui/StatCard'
import { fetchActivePromotions, fetchArenas } from '../services/supabaseData'
import { useAuth } from '../context/AuthContext'
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

export function OwnerCampaigns() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<PromotionFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      const [promotionData, arenaData] = await Promise.all([fetchActivePromotions(), fetchArenas()])
      const arenaMap = new Map(arenaData.map((arena) => [arena.id, arena]))
      setPromotions(
        promotionData.map((promotion) => ({
          ...promotion,
          arena: arenaMap.get(promotion.arenaId),
        }))
      )
      setLoading(false)
    }
    load()
  }, [user])

  const stats = useMemo(() => {
    const expiringSoon = promotions.filter(
      (promotion) => new Date(promotion.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 5
    ).length
    return {
      total: promotions.length,
      expiringSoon,
      arenas: new Set(promotions.map((promotion) => promotion.arenaId)).size,
      redemptions: promotions.reduce((sum, promotion) => sum + promotion.usedCount, 0),
    }
  }, [promotions])

  if (!user) return <Navigate to="/login" replace />
  if (loading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center text-mist">
        Loading campaigns...
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-end">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <Megaphone size={14} />
                  Campaign Center
                </span>
                <h1 className="font-display text-[clamp(2.4rem,8vw,5.4rem)] text-chalk leading-[0.92]">
                  Keep every live offer tied to the arena it actually supports.
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-mist">
                  This page surfaces active promotions, expiry pressure, and redemption velocity so owners can see which campaigns need attention before bookings slow down.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Active Offers" value={stats.total} />
                <StatCard label="Expiring Soon" value={stats.expiringSoon} />
                <StatCard label="Arenas" value={stats.arenas} />
                <StatCard label="Redemptions" value={stats.redemptions} />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <BtnLink to="/promotions" className="px-5 py-3 text-sm">
                Public Promotions View
              </BtnLink>
              <BtnLink to="/dashboard/owner/analytics" variant="outline" className="px-5 py-3 text-sm">
                See Revenue Impact
              </BtnLink>
            </div>
          </section>

          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-chalk">Active Campaigns</h2>
              <span className="text-[11px] uppercase tracking-[0.22em] text-mist font-mono">
                Live from promotions table
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promotions.length === 0 && (
                <div className="rounded-2xl border border-line bg-slate p-4 text-sm text-mist md:col-span-2 xl:col-span-3">
                  No active campaigns yet. Public promotions will appear here once the table has active rows.
                </div>
              )}

              {promotions.map((promotion) => {
                const isUrgent = new Date(promotion.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3
                const arena = promotion.arena

                return (
                  <article
                    key={promotion.id}
                    className={cn(
                      'rounded-[24px] border p-5 md:p-6 flex flex-col gap-5 bg-slate',
                      isUrgent ? 'border-lime/40 shadow-[0_0_0_1px_rgba(200,255,0,0.1)]' : 'border-line'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-mist">Promo code</p>
                        <h3 className="mt-2 font-display text-3xl text-chalk leading-none">{promotion.code}</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-lime text-on-lime text-xs font-mono uppercase">
                        {formatOfferValue(promotion)}
                      </span>
                    </div>

                    <div>
                      <p className="font-display text-2xl text-chalk">{promotion.title}</p>
                      <p className="text-sm text-mist mt-2 leading-relaxed">{promotion.description}</p>
                    </div>

                    {arena && (
                      <Link
                        to={`/arenas/${arena.slug}`}
                        className="rounded-2xl border border-line bg-ground/70 overflow-hidden flex gap-4 p-3 hover:border-lime/30 transition-colors"
                      >
                        <img src={arena.images[0]} alt={arena.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xl text-chalk truncate">{arena.name}</p>
                          <p className="text-sm text-mist mt-1">
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
                        Open Venue
                      </BtnLink>
                      <BtnLink to="/dashboard/owner/slots" variant="outline" className="px-5 py-3 text-sm">
                        Check Demand
                      </BtnLink>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
