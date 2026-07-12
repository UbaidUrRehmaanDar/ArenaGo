import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { HeroSection } from '../components/sections/HeroSection'
import { TrustMarquee } from '../components/sections/TrustMarquee'
import { FeatureShowcase } from '../components/sections/FeatureShowcase'
import { HowItWorks } from '../components/sections/HowItWorks'
import { LiveActivityFeed } from '../components/ui/LiveActivityFeed'
import { ArenaSpotlight } from '../components/sections/ArenaSpotlight'
import { SportCategories } from '../components/sections/SportCategories'
import { Testimonials } from '../components/sections/Testimonials'
import { CtaSection } from '../components/sections/CtaSection'

export default function Landing() {
  return (
    <>
      <Navbar transparent />
      <main>
        <HeroSection />
        <TrustMarquee />
        <FeatureShowcase />
        <div className="max-lg:h-12 lg:hidden" aria-hidden />
        <HowItWorks />
        <LiveActivityFeed />
        <ArenaSpotlight />
        <SportCategories />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
