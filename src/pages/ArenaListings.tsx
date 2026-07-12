import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ArenaCard } from '../components/ui/ArenaCard'
import { Btn } from '../components/ui/Btn'
import { SortDropdown, type SortValue } from '../components/ui/SortDropdown'
import { CustomDropdown } from '../components/ui/CustomDropdown'
import { fetchArenas, fetchCities } from '../services/supabaseData'
import type { Arena, SportType } from '../types'
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

const extraFilters = ['Available Now', 'Peak Hours']
const budgetFilters = ['Under PKR 500', 'Under PKR 1000', 'Under PKR 1500', 'Under PKR 2000']

export default function ArenaListings() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [sort, setSort] = useState<SortValue>('popular')
  const [sport, setSport] = useState<SportType | 'All Sports'>(
    (searchParams.get('sport') as SportType) || 'All Sports'
  )
  const [city, setCity] = useState('All Cities')
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [extra, setExtra] = useState<string | null>(null)
  const [budget, setBudget] = useState<string | null>(null)
  const [hoveredArena, setHoveredArena] = useState<string | null>(null)
  const [allArenas, setAllArenas] = useState<Arena[]>([])
  const searchCircleRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    async function loadAll() {
      const [arenaData, citiesData] = await Promise.all([fetchArenas(), fetchCities()])
      setAllArenas(arenaData)
      setCityOptions(citiesData.map((c) => c.name))
      setLoading(false)
    }
    loadAll()
  }, [])

  const handleSearchEnter = () => {
    const circle = searchCircleRef.current
    if (!circle) return
    circle.style.transition = 'width 4s cubic-bezier(0.25, 1, 0.5, 1), height 4s cubic-bezier(0.25, 1, 0.5, 1)'
    circle.style.width = '200%'
    circle.style.height = '200%'
  }

  const handleSearchLeave = () => {
    const circle = searchCircleRef.current
    if (!circle) return
    circle.style.transition = 'none'
    // Force reflow to ensure transition change takes effect
    void circle.offsetHeight
    circle.style.width = '0'
    circle.style.height = '0'
  }

  const cityFilters = useMemo(() => ['All Cities', ...cityOptions], [cityOptions])

  const trending = useMemo(
    () => [...allArenas].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 3),
    [allArenas]
  )

  const filteredBase = useMemo(() => {
    return allArenas.filter((a) => {
      if (sport !== 'All Sports' && a.sport !== sport) return false
      if (city !== 'All Cities' && a.location.city !== city) return false
      if (extra === 'Peak Hours' && a.occupancyRate < 70) return false
      if (extra === 'Available Now' && a.occupancyRate > 90) return false
      if (budget === 'Under PKR 500' && a.pricing.weekday > 500) return false
      if (budget === 'Under PKR 1000' && a.pricing.weekday > 1000) return false
      if (budget === 'Under PKR 1500' && a.pricing.weekday > 1500) return false
      if (budget === 'Under PKR 2000' && a.pricing.weekday > 2000) return false
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
  }, [allArenas, sport, city, extra, budget, search])

  const filtered = useMemo(() => {
    const list = [...filteredBase]
    if (sort === 'popular') return list.sort((a, b) => b.totalBookings - a.totalBookings)
    if (sort === 'price') return list.sort((a, b) => a.pricing.weekday - b.pricing.weekday)
    return list.sort((a, b) => b.rating - a.rating)
  }, [filteredBase, sort])

  const mapMarkers = allArenas.map((a, i) => ({
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
      <PageWrapper className="pt-20 md:pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <header className="mb-8 md:mb-10">
            <h1 className="font-display text-[clamp(1.8rem,7vw,3rem)] md:text-4xl lg:text-5xl text-chalk">
              FIND YOUR ARENA{' '}
              <span className="text-lime">IN LAHORE</span>
            </h1>
            <form onSubmit={(e) => e.preventDefault()} className="flex mt-4 md:mt-6 max-w-2xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, sport, or area..."
                  className="search-input w-full bg-slate text-chalk px-3 md:px-4 py-2.5 md:py-3 rounded-l-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body text-[13px] md:text-[15px] relative z-10"
                  onMouseEnter={handleSearchEnter}
                  onMouseLeave={handleSearchLeave}
                />
                <span className="search-hover-circle" ref={searchCircleRef} aria-hidden="true" />
              </div>
              <Btn type="submit" shape="attached-right" className="px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm">
                Search
              </Btn>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 md:mt-6">
              <CustomDropdown
                options={sportFilters}
                value={sport}
                onChange={(val) => setSport(val as SportType | 'All Sports')}
                placeholder="Select Sport"
              />
              <CustomDropdown
                options={cityFilters}
                value={city}
                onChange={setCity}
                placeholder="Select City"
              />
              <CustomDropdown
                options={budgetFilters}
                value={budget || ''}
                onChange={(val) => setBudget(val === '' ? null : val)}
                placeholder="Budget"
              />
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {extraFilters.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExtra(extra === e ? null : e)}
                  className={cn('btn-chip flex-shrink-0 text-xs md:text-sm', extra === e ? 'btn-chip-active' : 'btn-chip-inactive')}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 md:mt-6">
              <p className="font-mono text-xs md:text-sm uppercase tracking-wider text-lime">{filtered.length} arenas found</p>
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </header>

          <section className="mb-8 md:mb-12">
            <h2 className="font-display text-xl md:text-2xl text-chalk mb-4 md:mb-6">TRENDING THIS WEEK</h2>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {trending.map((a) => (
                <ArenaCard key={a.id} arena={a} variant="trending" />
              ))}
            </div>
          </section>

          <div className="flex gap-4 md:gap-8">
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[300px] md:h-[380px] rounded-sm skeleton-shimmer" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-6 items-stretch">
                  {filtered.map((arena) => (
                    <div
                      key={arena.id}
                      className="flex"
                      onMouseEnter={() => setHoveredArena(arena.id)}
                      onMouseLeave={() => setHoveredArena(null)}
                    >
                      <ArenaCard arena={arena} className="w-full" />
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
