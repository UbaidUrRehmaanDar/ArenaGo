import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BtnLink } from '../ui/Btn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../utils/formatters'

interface NavbarProps {
  transparent?: boolean
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const links = [
    { to: '/arenas', label: 'Arenas' },
    { to: '/#how-it-works', label: 'How It Works' },
    { to: '/dashboard/owner', label: 'For Owners' },
  ]

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || !transparent || mobileOpen
          ? 'bg-nav-scrim backdrop-blur-md border-b border-line'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link to="/" className="font-display text-2xl sm:text-[28px] text-lime tracking-wide shrink-0">
          ARENAGO
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'relative text-[14px] text-mist font-body hover:text-chalk transition-colors',
                location.pathname === link.to && 'text-chalk'
              )}
            >
              {link.label}
              {location.pathname === link.to && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime rounded-full" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden sm:block text-[14px] text-mist font-body hover:text-chalk"
          >
            Log In
          </Link>
          <BtnLink to="/arenas" className="text-[13px] sm:text-[14px] px-4 sm:px-5 py-2 hidden sm:inline-flex">
            Book Now
          </BtnLink>
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-sm border border-line bg-slate/60 text-chalk"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-nav-scrim backdrop-blur-md px-4 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'block rounded-sm px-3 py-3 text-[15px] font-body transition-colors',
                location.pathname === link.to
                  ? 'bg-slate text-chalk'
                  : 'text-mist hover:text-chalk hover:bg-slate/50'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="block rounded-sm px-3 py-3 text-[15px] font-body text-mist hover:text-chalk hover:bg-slate/50"
          >
            Log In
          </Link>
          <BtnLink to="/arenas" className="w-full mt-2 py-3 text-[14px]">
            Book Now
          </BtnLink>
        </div>
      )}
    </header>
  )
}
