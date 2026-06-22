import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demoPlayer } from '../../data/users'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../utils/formatters'
import { ArenaGoLogo } from '../ui/ArenaGoLogo'

interface DashboardLayoutProps {
  role: 'player' | 'owner'
  links: { to: string; label: string }[]
}

export function DashboardLayout({ role, links }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row">
      <header className="md:hidden sticky top-0 z-40 bg-turf border-b border-line px-4 h-14 flex items-center justify-between">
        <Link to="/">
          <ArenaGoLogo iconSize="h-9 w-9" textSize="text-xl" />
        </Link>
        <ThemeToggle />
      </header>

      <aside className="hidden md:flex flex-col w-60 bg-turf border-r border-line fixed h-full">
        <div className="p-6 border-b border-line flex items-center justify-between gap-3">
          <Link to="/">
            <ArenaGoLogo iconSize="h-10 w-10" textSize="text-2xl" />
          </Link>
          <ThemeToggle />
        </div>
        <div className="p-6 flex items-center gap-3 border-b border-line">
          <img
            src={user?.avatar ?? demoPlayer.avatar}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-body text-chalk text-sm">{user?.name}</p>
            <p className="text-mist text-xs capitalize">{role}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'block px-4 py-2.5 text-[15px] font-body rounded-sm border-l-2 border-transparent',
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
          className="p-6 text-mist text-[15px] text-left hover:text-chalk"
        >
          Logout
        </button>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-turf border-t border-line flex overflow-x-auto z-50">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex-shrink-0 flex-1 min-w-[60px] py-3 text-center text-[10px] font-body',
              location.pathname === link.to ? 'text-lime' : 'text-mist'
            )}
          >
            {link.label.split(' ')[0]}
          </Link>
        ))}
      </nav>

      <main className="flex-1 md:ml-60 p-4 sm:p-6 md:p-10 pb-24 md:pb-10">
        <Outlet />
      </main>
    </div>
  )
}
