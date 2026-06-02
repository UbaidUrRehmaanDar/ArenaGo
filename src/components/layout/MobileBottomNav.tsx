import { Link, useLocation } from 'react-router-dom'
import { Home, Search, CalendarCheck, User } from 'lucide-react'
import { cn } from '../../utils/formatters'

const NAV_ITEMS = [
  { href: '/home',             label: 'Home',    icon: Home          },
  { href: '/arenas',           label: 'Arenas',  icon: Search        },
  { href: '/booking',          label: 'Book',    icon: CalendarCheck },
  { href: '/dashboard/player', label: 'Profile', icon: User          },
]

export function MobileBottomNav() {
  const { pathname } = useLocation()

  const shouldShowNav =
    pathname === '/home' ||
    pathname.startsWith('/arenas') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/dashboard/player')
  if (!shouldShowNav) return null

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="absolute inset-0 bg-ground/90 backdrop-blur-xl border-t border-line" />

      <ul className="relative flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
                <span className="text-[10px] font-body font-medium leading-none">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
