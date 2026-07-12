import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import {
  MapPin,
  Tag,
  Compass,
  CalendarCheck,
  Heart,
  BarChart3,
  Megaphone,
  User,
  LogIn,
  UserPlus,
  Bell,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { BtnLink } from '../ui/Btn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { PillNav } from './PillNav'
import { cn } from '../../utils/formatters'
import { ArenaGoLogo } from '../ui/ArenaGoLogo'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  matchExact?: boolean
}

const PUBLIC_NAV_LINKS: NavItem[] = [
  { href: '/arenas',        label: 'Arenas',      icon: MapPin  },
  { href: '/promotions',    label: 'Promotions',  icon: Tag     },
  { href: '/#how-it-works', label: 'How It Works', icon: Compass },
]

const PLAYER_NAV_LINKS: NavItem[] = [
  { href: '/arenas',      label: 'Arenas',     icon: MapPin        },
  { href: '/community',   label: 'Community',  icon: Users         },
  { href: '/bookings',    label: 'Bookings',   icon: CalendarCheck },
  { href: '/favourites',  label: 'Favourites', icon: Heart         },
  { href: '/promotions',  label: 'Offers',     icon: Tag           },
]

const OWNER_NAV_LINKS: NavItem[] = [
  { href: '/arenas',                   label: 'Arenas',    icon: MapPin        },
  { href: '/dashboard/owner/bookings',  label: 'Bookings',  icon: CalendarCheck },
  { href: '/dashboard/owner/analytics', label: 'Analytics', icon: BarChart3     },
  { href: '/dashboard/owner/campaigns', label: 'Campaigns', icon: Megaphone     },
]

export function Navbar({ transparent = false }: NavbarProps) {
  const { user } = useAuth()
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

  const getNavLinks = (): NavItem[] => {
    if (!user) return PUBLIC_NAV_LINKS
    if (user.role === 'owner') return OWNER_NAV_LINKS
    return PLAYER_NAV_LINKS
  }

  const navLinks = getNavLinks()

  const isActive = (href: string) => {
    if (href.startsWith('/#')) {
      return location.pathname === '/' && location.hash === href.slice(1)
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

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
          <Link to={user ? (user.role === 'owner' ? '/dashboard/owner' : '/home') : '/'} className="shrink-0">
            <ArenaGoLogo iconSize="h-10 w-10 sm:h-11 sm:w-11" textSize="text-2xl sm:text-[28px]" />
          </Link>

          {/* ── Desktop links ─────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative inline-flex items-center gap-2 px-3 py-2 rounded-xl',
                    'text-[14px] font-body font-semibold transition-colors duration-200',
                    active
                      ? 'text-lime bg-lime/10'
                      : 'text-chalk hover:text-lime hover:bg-white/5'
                  )}
                >
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.4 : 1.8}
                    className="transition-transform duration-200 group-hover:scale-110"
                    aria-hidden
                  />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* ── Desktop right actions ─────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                {user.role === 'player' && (
                  <Link
                    to="/notifications"
                    className={cn(
                      'inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300',
                      location.pathname.startsWith('/notifications')
                        ? 'text-lime bg-lime/10'
                        : 'text-chalk hover:text-lime hover:bg-white/5',
                      'hover:rounded-full'
                    )}
                    aria-label="Notifications"
                    aria-current={location.pathname.startsWith('/notifications') ? 'page' : undefined}
                  >
                    <Bell size={18} strokeWidth={1.8} aria-hidden />
                  </Link>
                )}
                <Link
                  to="/profile"
                  className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300',
                    location.pathname === '/profile'
                      ? 'text-lime bg-lime/10'
                      : 'text-chalk hover:text-lime hover:bg-white/5',
                    'hover:rounded-full'
                  )}
                  aria-label="Profile"
                  aria-current={location.pathname === '/profile' ? 'page' : undefined}
                >
                  <User size={18} strokeWidth={1.8} aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-chalk hover:text-lime hover:bg-white/5 transition-colors duration-200"
                >
                  <LogIn size={17} strokeWidth={1.8} aria-hidden />
                  <span className="text-[14px] font-body font-semibold">Log In</span>
                </Link>
                <BtnLink to="/signup" className="text-[13px] px-5 py-2">
                  <UserPlus size={16} strokeWidth={2} aria-hidden className="-ml-0.5" />
                  <span>Sign Up</span>
                </BtnLink>
              </>
            )}
          </div>

          {/* ── Mobile right: theme toggle + pill hamburger ───────────── */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <PillNav
              items={navLinks}
              activeHref={location.pathname}
              baseColor="rgb(26 31 26)"
              pillColor="rgb(200 255 0)"
              hoveredPillTextColor="rgb(10 10 10)"
              pillTextColor="rgb(245 240 232)"
              onToggle={setMobileOpen}
              forceClose={!mobileOpen}
            />
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
            {navLinks.map((link) => {
              const active = isActive(link.href)
              const Icon = link.icon
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-body font-medium transition-colors duration-150',
                      active
                        ? 'bg-lime/10 text-lime'
                        : 'text-[rgb(245_240_232)] hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon size={19} strokeWidth={active ? 2.4 : 1.8} className="shrink-0" aria-hidden />
                    <span className="flex-1">{link.label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* divider + auth actions */}
          <div className="px-2 pb-2 pt-1 border-t border-[rgba(200,255,0,0.08)]">
            {user ? (
              <div className="space-y-1">
                {user.role === 'player' && (
                  <Link
                    to="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-body font-medium transition-colors duration-150',
                      location.pathname.startsWith('/notifications') ? 'bg-lime/10 text-lime' : 'text-[rgb(245_240_232)] hover:bg-white/5 hover:text-white'
                    )}
                    aria-label="Notifications"
                  >
                    <Bell size={19} strokeWidth={1.8} className="shrink-0" aria-hidden />
                    <span className="flex-1">Notifications</span>
                    {location.pathname.startsWith('/notifications') && <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />}
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-body font-medium transition-colors duration-150',
                    location.pathname === '/profile'
                      ? 'bg-lime/10 text-lime'
                      : 'text-[rgb(245_240_232)] hover:bg-white/5 hover:text-white'
                  )}
                  aria-label="Profile"
                >
                  <User size={19} strokeWidth={1.8} className="shrink-0" aria-hidden />
                  <span className="flex-1">Profile</span>
                  {location.pathname === '/profile' && <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />}
                </Link>
                <Link
                  to="/arenas"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-center text-[14px] py-3 mt-1 bg-lime text-on-lime rounded-sm font-semibold"
                >
                  <MapPin size={16} strokeWidth={2} aria-hidden />
                  Book Arena
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-center text-[14px] py-3 text-chalk hover:text-lime transition-colors"
                >
                  <LogIn size={16} strokeWidth={1.8} aria-hidden />
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-center text-[14px] py-3 mt-1 bg-lime text-on-lime rounded-sm font-semibold"
                >
                  <UserPlus size={16} strokeWidth={2} aria-hidden />
                  Sign Up
                </Link>
              </>
            )}
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

interface NavbarProps {
  transparent?: boolean
}