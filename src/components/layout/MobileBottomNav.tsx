import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Users, CalendarCheck, Heart, Bell } from 'lucide-react'
import { cn } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'

const PLAYER_NAV = [
  { href: '/home',          label: 'Home',       icon: Home          },
  { href: '/arenas',        label: 'Explore',    icon: Search        },
  { href: '/community',     label: 'Community',  icon: Users         },
  { href: '/bookings',      label: 'Bookings',   icon: CalendarCheck },
  { href: '/favourites',    label: 'Saved',      icon: Heart         },
  { href: '/notifications', label: 'Alerts',     icon: Bell          },
]

const PUBLIC_NAV = [
  { href: '/community',  label: 'Community', icon: Users       },
  { href: '/promotions', label: 'Offers',  icon: CalendarCheck },
]

export function MobileBottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  // Hide on auth/onboarding and owner dashboard
  const isAuthFlow = ['/login', '/signup', '/complete-profile'].includes(pathname)
  const isOwnerDash = pathname.startsWith('/dashboard/owner')
  if (isAuthFlow || isOwnerDash) return null

  const items = user?.role === 'player' ? PLAYER_NAV : PUBLIC_NAV

  // Only show on relevant routes
  const playerRoutes = ['/home', '/arenas', '/community', '/bookings', '/favourites', '/profile', '/promotions', '/activity', '/notifications']
  const publicRoutes = ['/community', '/promotions', '/about']
  const validRoutes = user ? playerRoutes : publicRoutes
  const shouldShow = validRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!shouldShow) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="absolute inset-0 bg-ground/90 backdrop-blur-xl border-t border-line" />
      <ul className="relative flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <li key={href} className="flex-1 flex justify-center">
              <Link
                to={href}
                aria-label={label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full h-full py-2',
                  'transition-colors duration-150 active:scale-95',
                  active ? 'text-lime' : 'text-mist'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] font-body font-medium leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
