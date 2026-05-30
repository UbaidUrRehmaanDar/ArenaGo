import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SlotGrid } from '../ui/SlotGrid'
import { getSlotsForArenaDate } from '../../data/slots'
import { arenas } from '../../data/arenas'
import { format } from 'date-fns'
import { ArenaCard } from '../ui/ArenaCard'

gsap.registerPlugin(ScrollTrigger)

const panels = [
  { title: 'DISCOVER', content: 'discover' },
  { title: 'SELECT', content: 'select' },
  { title: 'CONFIRM', content: 'confirm' },
  { title: 'PLAY', content: 'play' },
]

const selectSlots = getSlotsForArenaDate(
  arenas[0].id,
  format(new Date(), 'yyyy-MM-dd')
).slice(8, 14)

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const progress = progressRef.current
    if (!section || !track) return

    const mm = gsap.matchMedia()

    mm.add('(max-width: 1023px)', () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.pin) t.kill(true)
      })
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
          onUpdate: (self) => {
            if (progress) progress.style.width = `${self.progress * 100}%`
          },
        },
      })

      tl.to(track, { x: -totalWidth, ease: 'none' })

      ScrollTrigger.refresh()

      return () => {
        tl.kill()
      }
    })

    return () => mm.revert()
  }, [])

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
              className="w-screen h-full flex-shrink-0 flex items-center justify-center p-8"
            >
              <div className="max-w-lg w-full">
                <h2 className="font-display text-display-xl text-lime mb-8">{panel.title}</h2>
                {panel.content === 'discover' && (
                  <div className="space-y-3">
                    {arenas.slice(0, 2).map((a) => (
                      <div key={a.id} className="scale-75 origin-left">
                        <ArenaCard arena={a} variant="listing" />
                      </div>
                    ))}
                  </div>
                )}
                {panel.content === 'select' && <SlotGrid slots={selectSlots} readOnly />}
                {panel.content === 'confirm' && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-sm flex items-center justify-center font-mono text-sm ${
                            step <= 3 ? 'bg-lime text-ground' : 'bg-slate text-mist'
                          }`}
                        >
                          {step}
                        </div>
                        <div className={`flex-1 h-1 ${step < 3 ? 'bg-lime' : 'bg-line'}`} />
                      </div>
                    ))}
                    <p className="text-mist font-body">Payment details (MVP: skipped)</p>
                  </div>
                )}
                {panel.content === 'play' && (
                  <div className="relative">
                    <p className="font-display text-[clamp(80px,15vw,160px)] text-chalk/10 leading-none">
                      PLAY
                    </p>
                    <div
                      className="absolute inset-0 opacity-10 play-grid-bg"
                    />
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
            <h2 className="font-display text-display-lg text-lime mb-8">{panel.title}</h2>
            {panel.content === 'discover' && (
              <ArenaCard arena={arenas[0]} variant="listing" />
            )}
            {panel.content === 'select' && <SlotGrid slots={selectSlots} readOnly />}
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
