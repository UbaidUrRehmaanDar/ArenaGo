import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Megaphone, Tag, TrendingUp, AlertTriangle, BarChart2, ExternalLink, Clock } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { fetchActivePromotions, fetchArenas } from '../services/supabaseData'
import { useAuth } from '../context/AuthContext'
import type { Arena, PromotionRecord } from '../types'
import { cn, formatPKR } from '../utils/formatters'

interface PromotionFeedItem extends PromotionRecord {
  arena?: Arena
}

function formatOfferValue(promotion: PromotionRecord) {
  const type = promotion.promotionType?.toLowerCase() || ''
  if (type.includes('percent')) return `${promotion.value}%`
  if (type.includes('flat') || type.includes('fixed')) return formatPKR(promotion.value)
  return formatPKR(promotion.value)
}

function formatOfferLabel(promotion: PromotionRecord) {
  const type = promotion.promotionType?.toLowerCase() || ''
  if (type.includes('percent')) return 'discount'
  return 'off'
}

// Days until expiry — negative means expired
function daysUntil(dateStr: string) {
  return differenceInDays(parseISO(dateStr), new Date())
}

export function OwnerCampaigns({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<PromotionFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      const [promotionData, arenaData] = await Promise.all([fetchActivePromotions(), fetchArenas()])
      const arenaMap = new Map(arenaData.map((a) => [a.id, a]))
      const ownerArenaIds = new Set(user.arenaIds ?? [])
      setPromotions(
        promotionData
          .filter((p) => ownerArenaIds.size === 0 || ownerArenaIds.has(p.arenaId))
          .map((p) => ({ ...p, arena: arenaMap.get(p.arenaId) }))
      )
      setLoading(false)
    }
    load()
  }, [user])

  const stats = useMemo(() => ({
    total: promotions.length,
    expiringSoon: promotions.filter((p) => daysUntil(p.expiresAt) <= 5 && daysUntil(p.expiresAt) >= 0).length,
    arenas: new Set(promotions.map((p) => p.arenaId)).size,
    redemptions: promotions.reduce((sum, p) => sum + p.usedCount, 0),
  }), [promotions])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <LoadingState message="Loading campaigns..." />

  const content = (
    <div className="space-y-6 md:space-y-7">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-lime uppercase tracking-[0.22em] mb-1">Campaign Center</p>
          <h1 className="font-display text-3xl md:text-4xl text-chalk leading-tight">CAMPAIGNS</h1>
        </div>
        <BtnLink to="/promotions" variant="outline" className="flex items-center gap-2 text-sm px-4 py-2.5 shrink-0">
          <ExternalLink size={14} />
          Public View
        </BtnLink>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Active Offers',   value: stats.total,       icon: Tag,          accent: 'lime'  },
          { label: 'Expiring Soon',   value: stats.expiringSoon, icon: AlertTriangle, accent: stats.expiringSoon > 0 ? 'amber' : 'lime' },
          { label: 'Arenas Covered',  value: stats.arenas,      icon: BarChart2,    accent: 'lime'  },
          { label: 'Redemptions',     value: stats.redemptions, icon: TrendingUp,   accent: 'lime'  },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className={cn(
            'rounded-2xl border p-5 flex flex-col gap-3 relative overflow-hidden',
            accent === 'amber' ? 'border-amber/25 bg-amber/5' : 'border-line bg-turf'
          )}>
            <Icon size={48} className={cn('absolute -bottom-2 -right-2 opacity-[0.05]', accent === 'amber' ? 'text-amber' : 'text-lime')} />
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest pr-6 leading-tight">{label}</p>
              <span className={cn('w-8 h-8 flex items-center justify-center rounded-xl shrink-0',
                accent === 'amber' ? 'bg-amber/15' : 'bg-lime/10')}>
                <Icon size={14} className={accent === 'amber' ? 'text-amber' : 'text-lime'} />
              </span>
            </div>
            <p className={cn('font-display text-3xl leading-none', accent === 'amber' ? 'text-amber' : 'text-lime')}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Campaign cards ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest">Active Promotions</p>
          <span className="text-[10px] font-mono text-mist">Live from database</span>
        </div>

        {promotions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-turf p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-lime/10 flex items-center justify-center">
              <Megaphone size={20} className="text-lime" />
            </div>
            <p className="font-display text-xl text-chalk">No active campaigns</p>
            <p className="text-sm text-mist max-w-xs">Promotions added to your arenas will appear here automatically.</p>
            <BtnLink to="/promotions" variant="outline" className="text-sm px-5 py-2.5 mt-2">Browse Public Promotions</BtnLink>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {promotions.map((promo) => {
              const days = daysUntil(promo.expiresAt)
              const isUrgent = days <= 3 && days >= 0
              const isWarningSoon = days > 3 && days <= 7
              const usagePercent = promo.maxUses ? Math.min(100, Math.round((promo.usedCount / promo.maxUses) * 100)) : null

              return (
                <article key={promo.id} className={cn(
                  'rounded-2xl border bg-turf flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
                  isUrgent ? 'border-amber/40' : 'border-line'
                )}>
                  {/* Top accent bar */}
                  <div className={cn('h-1 w-full shrink-0',
                    isUrgent ? 'bg-amber' : isWarningSoon ? 'bg-amber/50' : 'bg-lime')} />

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-mist uppercase tracking-widest mb-1">Promo Code</p>
                        <h3 className="font-display text-2xl text-chalk leading-none truncate">{promo.code}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('font-display text-2xl leading-none', isUrgent ? 'text-amber' : 'text-lime')}>
                          {formatOfferValue(promo)}
                        </p>
                        <p className="text-[10px] font-mono text-mist mt-0.5">{formatOfferLabel(promo)}</p>
                      </div>
                    </div>

                    {/* Title + description */}
                    <div>
                      <p className="font-body font-semibold text-chalk">{promo.title}</p>
                      <p className="text-xs text-mist mt-1 leading-relaxed line-clamp-2">{promo.description}</p>
                    </div>

                    {/* Arena pill */}
                    {promo.arena && (
                      <Link to={`/arenas/${promo.arena.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-line bg-slate/60 hover:border-lime/30 transition-colors group">
                        <img src={promo.arena.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-chalk truncate">{promo.arena.name}</p>
                          <p className="text-xs text-mist font-mono">{promo.arena.location.area}</p>
                        </div>
                        <ExternalLink size={12} className="text-mist/0 group-hover:text-lime transition-colors shrink-0" />
                      </Link>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-line bg-slate/50 p-3">
                        <p className="text-[10px] font-mono text-mist uppercase tracking-widest">Min spend</p>
                        <p className="font-mono text-sm text-chalk mt-1">{formatPKR(promo.minAmount)}</p>
                      </div>
                      <div className="rounded-xl border border-line bg-slate/50 p-3">
                        <p className="text-[10px] font-mono text-mist uppercase tracking-widest">Used</p>
                        <p className="font-mono text-sm text-chalk mt-1">
                          {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Redemption progress bar */}
                    {usagePercent !== null && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-mono text-mist uppercase tracking-widest">Usage</p>
                          <p className="text-[10px] font-mono text-lime">{usagePercent}%</p>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500',
                              usagePercent >= 90 ? 'bg-amber' : 'bg-lime')}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expiry */}
                    <div className={cn('flex items-center gap-2 text-xs font-mono rounded-xl border px-3 py-2',
                      isUrgent ? 'border-amber/30 bg-amber/5 text-amber' :
                      isWarningSoon ? 'border-amber/20 bg-amber/5 text-mist' :
                      'border-line bg-slate/30 text-mist')}>
                      {isUrgent ? <AlertTriangle size={12} /> : <Clock size={12} />}
                      {days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `${days} day${days !== 1 ? 's' : ''} left`}
                      <span className="ml-auto">{format(parseISO(promo.expiresAt), 'd MMM yyyy')}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-5 flex gap-2">
                    <BtnLink
                      to={promo.arena ? `/arenas/${promo.arena.slug}` : '/arenas'}
                      className="flex-1 text-center text-xs py-2.5">
                      Open Venue
                    </BtnLink>
                    <BtnLink
                      to="/dashboard/owner/slots"
                      variant="outline"
                      className="flex-1 text-center text-xs py-2.5">
                      Check Slots
                    </BtnLink>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {content}
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
