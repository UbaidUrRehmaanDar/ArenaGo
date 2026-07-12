import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Target, Heart, Globe, Mail, Github, Linkedin, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Aurora from '../components/ui/Aurora'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { BtnLink } from '../components/ui/Btn'
import ubaidImg from '../assets/ubaid.jpeg'
import rehanImg from '../assets/rehan.jpg'

import { type Variants } from 'framer-motion'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

const CREATORS = [
  {
    name: 'Ubaid Ur Rehman Dar',
    title: 'Co-Founder & Developer',
    handle: '@ubaiddar',
    bio: 'Full-stack engineer obsessed with product. Built ArenaGo from scratch because booking a turf should take 30 seconds, not 30 minutes.',
    avatarUrl: ubaidImg,
    email: 'ubaidurrehmaan2004@gmail.com',
    linkedin: 'https://www.linkedin.com/in/ubaid-ur-rehman-dar-74a56429a/',
    github: 'https://github.com/UbaidUrRehmaanDar',
    tag: 'Engineer',
  },
  {
    name: 'Rehan Abrar Jatt',
    title: 'Co-Founder & Designer',
    handle: '@rehanjatt',
    bio: 'Design & strategy. Believes Pakistani sports culture deserves a platform that looks and feels as serious as the game itself.',
    avatarUrl: rehanImg,
    email: 'rehanabrar99@gmail.com',
    linkedin: 'https://www.linkedin.com/in/rehan-abrar',
    github: 'https://github.com/Rehan-Abrar',
    tag: 'Design',
  },
]

const VALUES = [
  {
    icon: Zap,
    title: 'Move Fast',
    body: "We ship in days not months. The game doesn't wait for you and neither do we.",
  },
  {
    icon: Target,
    title: 'Built for Pakistan',
    body: 'Not a copy-paste from Silicon Valley. Every feature is designed for how we actually play here.',
  },
  {
    icon: Heart,
    title: 'Community First',
    body: 'Players and arena owners are both our customers. We win only when they both win.',
  },
  {
    icon: Globe,
    title: 'Start Local, Go National',
    body: 'Lahore today. Karachi, Islamabad, Peshawar next. Every city deserves a platform like this.',
  },
]

// ── Creator Card ────────────────────────────────────────────────────────────

function CreatorCard({ creator, index }: { creator: typeof CREATORS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <motion.div
        custom={index}
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="group relative"
      >
        {/* lime glow behind card */}
        <div className="absolute -inset-px rounded-2xl bg-lime/0 group-hover:bg-lime/5 transition-colors duration-500 pointer-events-none" />

        <div className="relative rounded-2xl border border-line bg-turf overflow-hidden hover:border-lime/30 transition-colors duration-300">

          {/* top accent strip */}
          <div className="h-1 w-full bg-gradient-to-r from-lime/60 via-lime to-lime/40" />

          {/* photo section */}
          <div className="relative overflow-hidden bg-slate" style={{ height: 300 }}>
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* gradient overlay — bottom fade into card */}
            <div className="absolute inset-0 bg-gradient-to-t from-turf via-turf/30 to-transparent" />

            {/* tag chip */}
            <span className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-ground/80 backdrop-blur-sm border border-lime/30 text-lime">
              {creator.tag}
            </span>
          </div>

          {/* content */}
          <div className="px-5 pt-4 pb-5 space-y-4">
            {/* name block */}
            <div>
              <p className="font-mono text-[11px] text-mist uppercase tracking-[0.18em] mb-1">{creator.handle}</p>
              <h3 className="font-display text-2xl text-chalk leading-tight">{creator.name}</h3>
              <p className="text-sm text-lime font-medium mt-0.5">{creator.title}</p>
            </div>

            {/* bio */}
            <p className="text-sm text-mist leading-relaxed font-body">{creator.bio}</p>

            {/* divider */}
            <div className="h-px bg-line" />

            {/* action row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <a
                  href={creator.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate border border-line text-mist hover:text-lime hover:border-lime/30 transition-colors duration-150"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={14} />
                </a>
                <a
                  href={creator.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate border border-line text-mist hover:text-lime hover:border-lime/30 transition-colors duration-150"
                  aria-label="GitHub"
                >
                  <Github size={14} />
                </a>
                <a
                  href={`mailto:${creator.email}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate border border-line text-mist hover:text-lime hover:border-lime/30 transition-colors duration-150"
                  aria-label="Email"
                >
                  <Mail size={14} />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime/10 border border-lime/20 text-lime text-xs font-medium hover:bg-lime/20 transition-colors duration-150"
              >
                Contact
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact modal */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-40 bg-ground/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setExpanded(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xs bg-turf border border-line rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
              >
                {/* header strip */}
                <div className="h-1 w-full bg-gradient-to-r from-lime/60 via-lime to-lime/40" />

                <div className="p-5">
                  {/* avatar + name */}
                  <div className="flex items-center gap-4 mb-5">
                    <img src={creator.avatarUrl} alt={creator.name} className="w-14 h-14 rounded-xl object-cover object-top border border-line" />
                    <div>
                      <h3 className="font-display text-xl text-chalk leading-tight">{creator.name}</h3>
                      <p className="text-lime text-xs font-medium mt-0.5">{creator.title}</p>
                    </div>
                  </div>

                  <p className="text-[10px] font-mono text-mist uppercase tracking-[0.18em] mb-3">Get in touch</p>

                  <div className="space-y-2">
                    <a href={`mailto:${creator.email}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate border border-line hover:border-lime/30 transition-colors group"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-lime/10 text-lime group-hover:bg-lime/20 transition-colors shrink-0">
                        <Mail size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-mist font-mono">Email</p>
                        <p className="text-chalk text-xs truncate font-body">{creator.email}</p>
                      </div>
                    </a>
                    <a href={creator.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate border border-line hover:border-lime/30 transition-colors group"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-lime/10 text-lime group-hover:bg-lime/20 transition-colors shrink-0">
                        <Linkedin size={14} />
                      </span>
                      <div>
                        <p className="text-[10px] text-mist font-mono">LinkedIn</p>
                        <p className="text-chalk text-xs font-body">Connect</p>
                      </div>
                    </a>
                    <a href={creator.github} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate border border-line hover:border-lime/30 transition-colors group"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-lime/10 text-lime group-hover:bg-lime/20 transition-colors shrink-0">
                        <Github size={14} />
                      </span>
                      <div>
                        <p className="text-[10px] text-mist font-mono">GitHub</p>
                        <p className="text-chalk text-xs font-body">View code</p>
                      </div>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="mt-4 w-full py-2.5 rounded-xl border border-line text-mist text-sm hover:text-chalk hover:border-chalk/20 transition-colors duration-150"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default function About() {
  return (
    <div className="relative min-h-screen bg-ground">

      {/* ── Aurora fills the entire page behind everything ───────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora
          colorStops={['#c8ff00', '#0a2a0a', '#0a0a0a']}
          amplitude={1.0}
          blend={0.5}
          speed={0.5}
        />
      </div>
      {/* overlay so text stays readable */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-ground/75" />

      <Navbar />

      {/* all content sits above the aurora */}
      <div className="relative z-10">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20 md:pt-0">

          {/* mobile back button */}
          <a
            href="/"
            className="absolute top-24 left-4 md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-slate/80 border border-line text-chalk z-20"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </a>

          <motion.p
            custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="font-mono text-lime text-[12px] uppercase tracking-[0.25em] mb-5"
          >
            Our Story
          </motion.p>

          <motion.h1
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="font-display text-[clamp(2.5rem,10vw,7rem)] text-chalk leading-[0.92] max-w-4xl"
          >
            WE BUILT THIS<br />
            <span className="text-lime">FOR THE GAME</span>
          </motion.h1>

          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="font-body text-mist text-[16px] md:text-lg mt-8 max-w-xl leading-relaxed"
          >
            ArenaGo started because two guys got tired of calling five numbers
            just to book a turf on a Friday night. There had to be a better way.
          </motion.p>

          <motion.div
            custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="flex flex-col items-center gap-2 mt-20"
          >
            <span className="font-mono text-[10px] text-mist/40 uppercase tracking-widest">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-mist/30 to-transparent" />
          </motion.div>
        </section>

        {/* ── Vision ─────────────────────────────────────────────────── */}
        <section className="py-16 md:py-28 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
            >
              <p className="font-mono text-lime text-[12px] uppercase tracking-[0.2em] mb-4">Vision</p>
              <h2 className="font-display text-[clamp(1.8rem,5vw,3.5rem)] text-chalk leading-tight">
                PAKISTAN'S SPORTS<br />INFRASTRUCTURE,<br />ONLINE
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
              className="space-y-5 text-mist font-body text-[15px] leading-relaxed pt-2"
            >
              <p>
                Pakistan has millions of players and thousands of venues — but
                zero connective tissue. Arena owners use WhatsApp groups.
                Players rely on word of mouth. Slots go empty. Money is left
                on the table. Matches never happen.
              </p>
              <p>
                We're building the layer that connects them. A real-time
                booking platform that works for both sides — giving players
                instant access and giving owners the tools to run their
                venues like a proper business.
              </p>
              <p className="text-chalk font-medium">
                Starting in Lahore. Scaling to every city in Pakistan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Values ─────────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="mb-8 md:mb-12"
            >
              <p className="font-mono text-lime text-[12px] uppercase tracking-[0.2em] mb-3">What We Stand For</p>
              <h2 className="font-display text-display-md text-chalk">OUR VALUES</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {VALUES.map(({ icon: Icon, title, body }, i) => (
                <motion.div
                  key={title}
                  custom={i} variants={fadeUp} initial="hidden" whileInView="show"
                  viewport={{ once: true }}
                  className="bg-ground/60 backdrop-blur-sm border border-line rounded-sm p-6 hover:border-lime/30 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-sm bg-lime/10 flex items-center justify-center mb-4">
                    <Icon size={16} className="text-lime" />
                  </div>
                  <h3 className="font-display text-xl text-chalk mb-2">{title}</h3>
                  <p className="text-mist text-[14px] leading-relaxed font-body">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Creators ───────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="mb-10 md:mb-14"
            >
              <p className="font-mono text-lime text-[12px] uppercase tracking-[0.2em] mb-3">The People</p>
              <h2 className="font-display text-display-md text-chalk">WHO BUILT THIS</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-2xl mx-auto">
              {CREATORS.map((creator, i) => (
                <CreatorCard key={creator.name} creator={creator} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-32 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            <h2 className="font-display text-display-md text-chalk mb-4">
              READY TO <span className="text-lime">PLAY?</span>
            </h2>
            <p className="text-mist font-body text-[15px] mb-8 leading-relaxed">
              Stop texting in circles. Book your slot in under a minute.
            </p>
            <BtnLink to="/arenas" className="px-8 py-3 text-[15px]">
              Find an Arena
            </BtnLink>
          </motion.div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
