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
  Heart,
  Activity,
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

const LABEL_ICON: Record<string, typeof LayoutDashboard> = {
  Overview:             LayoutDashboard,
  'My Bookings':        CalendarCheck,
  Bookings:             CalendarCheck,
  'Favourite Arenas':   Heart,
  Activity:             Activity,
  Profile:              User,
  Arenas:               Layers,
  Campaigns:            Megaphone,
  Analytics:            BarChart2,
  'Slot Manager':       Sliders,
  Settings:             Settings,
}

const MOBILE_LABEL: Record<string, string> = {
  Overview:             'Home',
  'My Bookings':        'Bookings',
  Bookings:             'Bookings',
  'Favourite Arenas':   'Saved',
  Activity:             'Activity',
  Profile:              'Profile',
  Arenas:               'Arenas',
  Campaigns:            'Promos',
  Analytics:            'Stats',
  'Slot Manager':       'Slots',
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

  const isActive = (to: string) =>
    to === '/dashboard/owner' || to === '/dashboard/player'
      ? location.pathname === to
      : location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row">

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-turf border-b border-line px-4 h-14 flex items-center justify-between">
        <Link to="/">
          <ArenaGoLogo iconSize="h-8 w-8" textSize="text-lg" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mist px-2 py-1 rounded-full border border-line">
            {role}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-turf border-r border-line fixed h-full overflow-y-auto z-30">

        {/* Logo + theme */}
        <div className="px-5 py-5 border-b border-line flex items-center justify-between gap-3">
          <Link to="/">
            <ArenaGoLogo iconSize="h-9 w-9" textSize="text-xl" />
          </Link>
          <ThemeToggle />
        </div>

        {/* User card */}
        <div className="mx-4 mt-4 mb-2 rounded-2xl border border-line bg-slate/60 px-4 py-3 flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=2E3A2E&color=C8FF00`}
              alt=""
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-lime border-2 border-turf" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body font-semibold text-chalk text-sm truncate leading-tight">{user?.name ?? 'User'}</p>
            <span className="font-mono text-[10px] uppercase tracking-widest text-lime">{role}</span>
          </div>
        </div>

        {/* Nav section label */}
        <p className="px-6 pt-4 pb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-mist/60">Navigation</p>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5 pb-4">
          {links.map((link) => {
            const Icon = LABEL_ICON[link.label] ?? LayoutDashboard
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150 group',
                  active
                    ? 'bg-lime text-on-lime'
                    : 'text-mist hover:text-chalk hover:bg-slate/70'
                )}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn('shrink-0 transition-transform duration-150', !active && 'group-hover:scale-110')}
                />
                <span className="truncate">{link.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-on-lime/60" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-mist hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 group"
          >
            <LogOut size={16} strokeWidth={1.8} className="shrink-0 group-hover:scale-110 transition-transform duration-150" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-turf/95 backdrop-blur-sm border-t border-line z-50">
        <ul className="flex items-stretch h-16">
          {links.map((link) => {
            const Icon = LABEL_ICON[link.label] ?? LayoutDashboard
            const shortLabel = MOBILE_LABEL[link.label] ?? link.label
            const active = isActive(link.to)
            return (
              <li key={link.to} className="flex-1 flex">
                <Link
                  to={link.to}
                  onClick={() => trigger('light')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 w-full py-2 transition-colors duration-150 relative',
                    active ? 'text-lime' : 'text-mist active:text-chalk'
                  )}
                  aria-label={link.label}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-lime" />
                  )}
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-[9px] font-mono font-medium leading-none">{shortLabel}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 lg:ml-72 min-h-screen pb-24 md:pb-10 overflow-x-hidden">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
