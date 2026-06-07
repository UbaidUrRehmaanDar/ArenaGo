import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Target, Heart, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import Aurora from '../components/ui/Aurora'
import ProfileCard from '../components/ui/ProfileCard'
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
    title: 'Co-Founder',
    handle: 'ubaiddar',
    status: 'Building ArenaGo',
    avatarUrl: ubaidImg,
    email: 'ubaidurrehmaan2004@gmail.com',
    linkedin: 'https://www.linkedin.com/in/ubaid-ur-rehman-dar-74a56429a/',
    github: 'https://github.com/UbaidUrRehmaanDar',
  },
  {
    name: 'Rehan Abrar Jatt',
    title: 'Co-Founder',
    handle: 'rehanjatt',
    status: 'Building ArenaGo',
    avatarUrl: rehanImg,
    email: 'rehanabrar99@gmail.com',
    linkedin: 'https://www.linkedin.com/in/rehan-abrar',
    github: 'https://github.com/Rehan-Abrar',
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

export function About() {
  const navigate = useNavigate()

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
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">

          {/* mobile back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-20 left-4 md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-slate/80 border border-line text-chalk"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>

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
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
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
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="mb-12"
            >
              <p className="font-mono text-lime text-[12px] uppercase tracking-[0.2em] mb-3">What We Stand For</p>
              <h2 className="font-display text-display-md text-chalk">OUR VALUES</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="mb-14"
            >
              <p className="font-mono text-lime text-[12px] uppercase tracking-[0.2em] mb-3">The People</p>
              <h2 className="font-display text-display-md text-chalk">WHO BUILT THIS</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-2xl">
              {CREATORS.map(({ name, title, handle, status, avatarUrl, email, linkedin, github }, i) => (
                <motion.div
                  key={name}
                  custom={i} variants={fadeUp} initial="hidden" whileInView="show"
                  viewport={{ once: true }}
                  className="flex flex-col gap-4"
                >
                  <ProfileCard
                    name={name}
                    title={title}
                    handle={handle}
                    status={status}
                    avatarUrl={avatarUrl}
                    miniAvatarUrl={avatarUrl}
                    contactText="Contact"
                    showUserInfo={true}
                    enableTilt={true}
                    enableMobileTilt={false}
                    behindGlowEnabled={true}
                    behindGlowColor="rgba(200, 255, 0, 0.67)"
                    behindGlowSize="50%"
                    innerGradient="linear-gradient(145deg, #c8ff0015 0%, #1a1f1a8c 100%)"
                    email={email}
                    linkedin={linkedin}
                    github={github}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section className="py-32 px-6 text-center">
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
