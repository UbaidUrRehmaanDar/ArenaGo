import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ArenaCard } from '../components/ui/ArenaCard'
import { Btn } from '../components/ui/Btn'
import { arenas } from '../data/arenas'
import type { SportType } from '../types'
import { cn } from '../utils/formatters'

const sportFilters: (SportType | 'All Sports')[] = [
  'All Sports',
  'Football',
  'Cricket',
  'Badminton',
  'Basketball',
  'Tennis',
  'Padel',
]

const cityFilters = ['All Cities', 'Lahore']

const extraFilters = ['Available Now', 'Peak Hours', 'Under PKR 1500']

export function ArenaListings() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState<SportType | 'All Sports'>(
    (searchParams.get('sport') as SportType) || 'All Sports'
  )
  const [city, setCity] = useState('All Cities')
  const [extra, setExtra] = useState<string | null>(null)
  const [hoveredArena, setHoveredArena] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const trending = useMemo(
    () => [...arenas].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 3),
    []
  )

  const filtered = useMemo(() => {
    return arenas.filter((a) => {
      if (sport !== 'All Sports' && a.sport !== sport) return false
      if (city !== 'All Cities' && a.location.city !== city) return false
      if (extra === 'Under PKR 1500' && a.pricing.weekday > 1500) return false
      if (extra === 'Peak Hours' && a.occupancyRate < 70) return false
      if (extra === 'Available Now' && a.occupancyRate > 90) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          a.sport.toLowerCase().includes(q) ||
          a.location.area.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [sport, city, extra, search])

  const mapMarkers = arenas.map((a, i) => ({
    id: a.id,
    abbr: a.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 3),
    top: 15 + ((i * 37) % 70),
    left: 10 + ((i * 53) % 75),
  }))

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <header className="mb-10">
            <h1 className="font-display text-display-lg text-chalk">
              FIND YOUR ARENA{' '}
              <span className="text-lime">IN LAHORE</span>
            </h1>
            <div className="flex mt-6 max-w-2xl">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, sport, or area..."
                className="flex-1 bg-slate text-chalk px-4 py-3 rounded-l-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body text-[15px]"
              />
              <Btn type="button" shape="attached-right" className="px-6 py-3">
                Search
              </Btn>
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {sportFilters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSport(s)}
                  className={cn('btn-chip flex-shrink-0', sport === s ? 'btn-chip-active' : 'btn-chip-inactive')}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {cityFilters.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={cn('btn-chip flex-shrink-0', city === c ? 'btn-chip-active' : 'btn-chip-inactive')}
                >
                  {c}
                </button>
              ))}
              {extraFilters.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExtra(extra === e ? null : e)}
                  className={cn('btn-chip flex-shrink-0', extra === e ? 'btn-chip-active' : 'btn-chip-inactive')}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center mt-6">
              <p className="text-[13px] text-mist">{filtered.length} arenas found</p>
              <select className="bg-slate text-chalk text-[13px] px-3 py-2 rounded-sm border border-line focus:outline-lime">
                <option>Sort: Most Popular</option>
                <option>Sort: Price Low to High</option>
                <option>Sort: Rating</option>
              </select>
            </div>
          </header>

          <section className="mb-12 max-lg:mb-16">
            <h2 className="font-display text-2xl text-chalk mb-6">TRENDING THIS WEEK</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {trending.map((a) => (
                <ArenaCard key={a.id} arena={a} variant="trending" />
              ))}
            </div>
          </section>

          <div className="flex gap-8">
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[380px] rounded-sm skeleton-shimmer" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                  {filtered.map((arena) => (
                    <div
                      key={arena.id}
                      onMouseEnter={() => setHoveredArena(arena.id)}
                      onMouseLeave={() => setHoveredArena(null)}
                    >
                      <ArenaCard arena={arena} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="hidden xl:block w-[30%] flex-shrink-0">
              <div className="sticky top-24 h-[calc(100vh-120px)] bg-slate rounded-sm border border-line overflow-hidden">
                <div className="relative w-full h-full bg-[rgb(var(--color-map-bg))]">
                  <svg className="absolute inset-0 w-full h-full opacity-20 text-line">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line
                        key={`h-${i}`}
                        x1="0"
                        y1={`${i * 12.5}%`}
                        x2="100%"
                        y2={`${i * 12.5}%`}
                        stroke="currentColor"
                      />
                    ))}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line
                        key={`v-${i}`}
                        x1={`${i * 12.5}%`}
                        y1="0"
                        x2={`${i * 12.5}%`}
                        y2="100%"
                        stroke="currentColor"
                      />
                    ))}
                  </svg>
                  {mapMarkers.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'absolute w-3 h-3 rounded-full bg-lime transition-transform',
                        hoveredArena === m.id && 'scale-150 animate-pulse-dot'
                      )}
                      style={{ top: `${m.top}%`, left: `${m.left}%` }}
                      title={m.abbr}
                    />
                  ))}
                  <p className="absolute bottom-4 left-4 font-mono text-[10px] text-mist">
                    Map preview
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
