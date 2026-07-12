import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SlotGrid } from '../ui/SlotGrid'
import { ArenaCard } from '../ui/ArenaCard'
import { fetchArenas, fetchSlotsForArenaDate } from '../../services/supabaseData'
import { format } from 'date-fns'
import type { Arena } from '../../types'
import type { Slot } from '../../types'

gsap.registerPlugin(ScrollTrigger)

const panels = [
  { title: 'DISCOVER', content: 'discover' },
  { title: 'SELECT', content: 'select' },
  { title: 'CONFIRM', content: 'confirm' },
  { title: 'PLAY', content: 'play' },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [arenas, setArenas] = useState<Arena[]>([])
  const [selectSlots, setSelectSlots] = useState<Slot[]>([])

  useEffect(() => {
    fetchArenas().then((data) => {
      setArenas(data)
      if (data[0]) {
        fetchSlotsForArenaDate(data[0].id, format(new Date(), 'yyyy-MM-dd'))
          .then((slots) => setSelectSlots(slots.slice(8, 14)))
      }
    })
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const progress = progressRef.current
    if (!section || !track) return

    const mm = gsap.matchMedia()

    mm.add('(max-width: 1023px)', () => {
      ScrollTrigger.getAll().forEach((t) => { if (t.vars.pin) t.kill(true) })
      ScrollTrigger.refresh()
    })

    mm.add('(min-width: 1024px)', () => {
      const totalWidth = track.scrollWidth - window.innerWidth
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${totalWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => { if (progress) progress.style.width = `${self.progress * 100}%` },
        },
      })
      tl.to(track, { x: -totalWidth, ease: 'none' })
      ScrollTrigger.refresh()
      return () => { tl.kill() }
    })

    return () => mm.revert()
  }, [arenas])

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative bg-ground max-lg:overflow-visible lg:overflow-hidden max-lg:mt-8 max-lg:pt-12 max-lg:border-t max-lg:border-line"
    >
      <div className="hidden lg:block h-screen overflow-hidden">
        <div ref={trackRef} className="flex h-full w-max">
          {panels.map((panel) => (
            <div
              key={panel.title}
              className="w-screen h-full flex-shrink-0 flex items-center justify-center px-12 py-8"
            >
              <div className={`w-full flex flex-col h-full justify-center ${panel.content === 'discover' ? 'max-w-3xl' : 'max-w-lg'}`}>
                <h2 className="font-display text-display-xl text-lime mb-8">{panel.title}</h2>
                {panel.content === 'discover' && arenas.length >= 2 && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {arenas.slice(0, 2).map((a) => (
                      <div key={a.id} className="flex flex-col bg-slate rounded-sm overflow-hidden border border-line">
                        <div className="relative h-[140px] flex-shrink-0">
                          <img src={a.images[0]} alt={a.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2">
                            <span className="bg-ground/80 text-lime font-mono text-[10px] px-2 py-0.5 rounded-sm">
                              {a.sport.toUpperCase()}
                            </span>
                          </div>
                          {a.isPopular && (
                            <span className="absolute top-2 right-2 bg-amber text-ground font-display text-[10px] px-2 py-0.5">
                              TRENDING
                            </span>
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <p className="font-display text-[15px] text-chalk leading-tight line-clamp-1">{a.name}</p>
                          <p className="text-mist text-[11px] mt-0.5">{a.location.area}</p>
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <span className="text-chalk text-[12px] font-mono">PKR {a.pricing.weekday.toLocaleString()}/hr</span>
                            <span className="text-lime text-[11px] font-mono">{a.rating}★</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {panel.content === 'select' && selectSlots.length > 0 && (
                  <SlotGrid slots={selectSlots} readOnly />
                )}
                {panel.content === 'confirm' && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm flex items-center justify-center font-mono text-sm bg-lime text-ground">
                          {step}
                        </div>
                        <div className={`flex-1 h-1 ${step < 3 ? 'bg-lime' : 'bg-line'}`} />
                      </div>
                    ))}
                    <p className="text-mist font-body">Payment details (coming soon)</p>
                  </div>
                )}
                {panel.content === 'play' && (
                  <div className="relative">
                    <p className="font-display text-[clamp(80px,15vw,160px)] text-chalk/10 leading-none">PLAY</p>
                    <div className="absolute inset-0 opacity-10 play-grid-bg" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:hidden px-4 py-8 space-y-24">
        {panels.map((panel) => (
          <article key={panel.title} className="relative">
            <h2 className="font-display text-[clamp(2rem,7vw,5rem)] text-lime mb-8">{panel.title}</h2>
            {panel.content === 'discover' && arenas[0] && (
              <ArenaCard arena={arenas[0]} variant="listing" />
            )}
            {panel.content === 'select' && selectSlots.length > 0 && (
              <SlotGrid slots={selectSlots} readOnly />
            )}
            {panel.content === 'confirm' && (
              <div className="space-y-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center font-mono text-sm bg-lime text-ground">
                      {step}
                    </div>
                    <div className={`flex-1 h-1 ${step < 3 ? 'bg-lime' : 'bg-line'}`} />
                  </div>
                ))}
              </div>
            )}
            {panel.content === 'play' && (
              <p className="font-display text-display-xl text-chalk">PLAY</p>
            )}
          </article>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-line z-30 hidden lg:block">
        <div ref={progressRef} className="h-full bg-lime w-0 transition-none" />
      </div>
    </section>
  )
}
