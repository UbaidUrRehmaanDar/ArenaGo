import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { BtnLink } from '../ui/Btn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { PillNav } from './PillNav'
import { cn } from '../../utils/formatters'
import { ArenaGoLogo } from '../ui/ArenaGoLogo'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  transparent?: boolean
}

const NAV_LINKS = [
  { href: '/arenas',          label: 'Arenas' },
  { href: '/promotions',      label: 'Promotions' },
  { href: '/#how-it-works',   label: 'How It Works' },
  { href: '/dashboard/owner', label: 'For Owners' },
]

export function Navbar({ transparent = false }: NavbarProps) {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const popoverRef = useRef<HTMLDivElement>(null)

  /* ── scroll detection ─────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── close on route change ────────────────────────────────────────── */
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  /* ── body scroll lock ─────────────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* ── animate popover in/out ───────────────────────────────────────── */
  useEffect(() => {
    const el = popoverRef.current
    if (!el) return
    if (mobileOpen) {
      gsap.set(el, { visibility: 'visible' })
      gsap.fromTo(
        el,
        { opacity: 0, y: -12, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out', transformOrigin: 'top right' }
      )
    } else {
      gsap.to(el, {
        opacity: 0,
        y: -8,
        scale: 0.97,
        duration: 0.2,
        ease: 'power3.in',
        transformOrigin: 'top right',
        onComplete: () => gsap.set(el, { visibility: 'hidden' }),
      })
    }
  }, [mobileOpen])

  const isScrolledOrSolid = scrolled || !transparent

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolledOrSolid
            ? 'bg-nav-scrim backdrop-blur-md border-b border-line'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link to="/" className="shrink-0">
            <ArenaGoLogo iconSize="h-10 w-10 sm:h-11 sm:w-11" textSize="text-2xl sm:text-[28px]" />
          </Link>

          {/* ── Desktop links ─────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.filter((l) => l.label !== 'Log In').map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="relative text-[14px] font-body font-semibold text-chalk transition-colors hover:text-lime"
              >
                {link.label}
                {location.pathname === link.href && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* ── Desktop right actions ─────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  to={user.role === 'owner' ? '/dashboard/owner' : '/dashboard/player'}
                  className="text-[14px] text-chalk font-body font-semibold hover:text-lime transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-[14px] text-mist font-body font-semibold hover:text-chalk transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[14px] text-chalk font-body font-semibold hover:text-lime transition-colors"
                >
                  Log In
                </Link>
                <BtnLink to="/signup" className="text-[13px] px-5 py-2">
                  Sign Up
                </BtnLink>
              </>
            )}
            <BtnLink to="/arenas" className="text-[13px] px-5 py-2">
              Book Now
            </BtnLink>
          </div>

          {/* ── Mobile right: theme toggle + pill hamburger ───────────── */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <PillNav
              items={NAV_LINKS}
              activeHref={location.pathname}
              baseColor="rgb(26 31 26)"
              pillColor="rgb(200 255 0)"
              hoveredPillTextColor="rgb(10 10 10)"
              pillTextColor="rgb(245 240 232)"
              onToggle={setMobileOpen}
              forceClose={!mobileOpen}
            />
            {user && (
              <Link
                to={user.role === 'owner' ? '/dashboard/owner' : '/dashboard/player'}
                className="text-lime text-sm font-semibold"
              >
                Dashboard
              </Link>
            )}
          </div>

        </nav>
      </header>

      {/* ── Mobile popover — full-width, anchored below header ────────── */}
      <div
        ref={popoverRef}
        className="fixed left-3 right-3 top-[60px] z-40 rounded-2xl overflow-hidden md:hidden"
        style={{ visibility: 'hidden' }}
      >
        {/* frosted card */}
        <div className="bg-[rgb(18_24_18)] border border-[rgba(200,255,0,0.12)] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden">

          {/* nav links */}
          <ul className="p-2 space-y-0.5">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-body font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-lime/10 text-lime'
                        : 'text-[rgb(245_240_232)] hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* divider + CTA */}
          <div className="px-2 pb-2 pt-1 border-t border-[rgba(200,255,0,0.08)]">
            <BtnLink
              to="/arenas"
              className="w-full text-center text-[14px] py-3 mt-1"
            >
              Book Now
            </BtnLink>
          </div>

        </div>
      </div>

      {/* ── backdrop to close on outside tap ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
