import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart2,
  CalendarCheck,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Sliders,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../utils/formatters'
import { ArenaGoLogo } from '../ui/ArenaGoLogo'
import { useHaptic } from '../../hooks/useHaptic'

interface DashboardLayoutProps {
  role: 'player' | 'owner'
  links: { to: string; label: string }[]
}

/** Maps sidebar link labels to compact icons for the mobile bottom nav. */
const LABEL_ICON: Record<string, typeof LayoutDashboard> = {
  Overview:         LayoutDashboard,
  'My Bookings':    CalendarCheck,
  Bookings:         CalendarCheck,
  'Favourite Arenas': Settings,
  Activity:         BarChart2,
  Profile:          User,
  Arenas:           Layers,
  Campaigns:        Megaphone,
  Analytics:        BarChart2,
  'Slot Manager':   Sliders,
}

/** Short mobile labels so the bottom nav stays readable without truncation. */
const MOBILE_LABEL: Record<string, string> = {
  Overview:         'Overview',
  'My Bookings':    'Bookings',
  Bookings:         'Bookings',
  'Favourite Arenas': 'Saved',
  Activity:         'Activity',
  Profile:          'Profile',
  Arenas:           'Arenas',
  Campaigns:        'Campaigns',
  Analytics:        'Analytics',
  'Slot Manager':   'Slots',
}

export function DashboardLayout({ role, links }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { trigger } = useHaptic()

  const handleLogout = () => {
    trigger('medium')
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row">
      {/* ── Mobile header ─────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-turf border-b border-line px-4 h-14 flex items-center justify-between">
        <Link to="/">
          <ArenaGoLogo iconSize="h-9 w-9" textSize="text-xl" />
        </Link>
        <ThemeToggle />
      </header>

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 lg:w-72 bg-turf border-r border-line fixed h-full overflow-y-auto">
        <div className="p-4 lg:p-6 border-b border-line flex items-center justify-between gap-3">
          <Link to="/">
            <ArenaGoLogo iconSize="h-10 w-10" textSize="text-2xl" />
          </Link>
          <ThemeToggle />
        </div>
        <div className="p-4 lg:p-6 flex items-center gap-3 border-b border-line">
          <img
            src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=random`}
            alt=""
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-body text-chalk text-sm truncate">{user?.name}</p>
            <p className="text-mist text-xs capitalize">{role}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'block px-4 py-2.5 text-[15px] font-body rounded-sm border-l-2 border-transparent whitespace-nowrap',
                location.pathname === link.to
                  ? 'border-lime text-chalk bg-slate/50'
                  : 'text-mist hover:text-chalk'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="p-4 lg:p-6 text-mist text-[15px] text-left hover:text-chalk flex items-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-turf border-t border-line z-50">
        <ul className="flex items-center justify-around h-16">
          {links.map((link) => {
            const Icon = LABEL_ICON[link.label] ?? LayoutDashboard
            const shortLabel = MOBILE_LABEL[link.label] ?? link.label
            const isActive = location.pathname === link.to
            return (
              <li key={link.to} className="flex-1 flex justify-center">
                <Link
                  to={link.to}
                  onClick={() => trigger('light')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 w-full h-full py-2',
                    'transition-colors duration-150 active:scale-95',
                    isActive ? 'text-lime' : 'text-mist'
                  )}
                  aria-label={link.label}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className="text-[9px] font-body font-medium leading-none">{shortLabel}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 lg:ml-72 p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-10 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
