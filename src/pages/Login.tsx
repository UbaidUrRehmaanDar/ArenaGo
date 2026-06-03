import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CountUp } from '../components/ui/CountUp'
import { Btn } from '../components/ui/Btn'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { DEMO_CREDENTIALS } from '../data/users'
import { cn } from '../utils/formatters'
import arenaGoLogo from '../assets/ArenaGoicon.png'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'player' | 'owner'>('player')
  const [email, setEmail] = useState(DEMO_CREDENTIALS.player.email)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.player.password)
  const [error, setError] = useState('')

  const switchRole = (r: 'player' | 'owner') => {
    setRole(r)
    if (r === 'player') {
      setEmail(DEMO_CREDENTIALS.player.email)
      setPassword(DEMO_CREDENTIALS.player.password)
    } else {
      setEmail(DEMO_CREDENTIALS.owner.email)
      setPassword(DEMO_CREDENTIALS.owner.password)
    }
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = login(email, password)
    if (ok) {
      navigate(role === 'owner' ? '/dashboard/owner/home' : '/dashboard/player/home')
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[55%_45%]">
      <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ground/90 via-ground/70 to-ground/40" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={arenaGoLogo} alt="ArenaGo" className="h-11 w-11 object-contain" />
            <div>
              <p className="font-display text-5xl text-chalk">ARENAGO</p>
            <p className="text-body-lg text-mist mt-4 max-w-md">
              Every great match starts with a booking.
            </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="relative z-10 flex gap-10">
          {[
            { value: 2400, suffix: '+', label: 'Players' },
            { value: 38, suffix: '', label: 'Arenas' },
            { value: 12000, suffix: '+', label: 'Bookings' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl text-lime">
                <CountUp end={s.value} duration={1.5} suffix={s.suffix} />
              </p>
              <p className="text-mist text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-ground flex items-center justify-center p-8 md:p-12 relative">
        <div className="absolute top-4 left-4 md:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="absolute top-4 right-4 md:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <p className="text-[13px] text-mist font-body">Welcome back</p>
          <h1 className="font-display text-display-md text-chalk mt-2">LOG IN TO ARENAGO</h1>

          <div className="flex gap-2 mt-8">
            {(['player', 'owner'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={cn(
                  'px-4 py-2 rounded-full text-[13px] font-body capitalize',
                  role === r ? 'bg-lime text-on-lime' : 'bg-slate text-mist'
                )}
              >
                {r === 'player' ? 'Player' : 'Arena Owner'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-[13px] text-mist block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body"
              />
            </div>
            <div>
              <label className="text-[13px] text-mist block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="your password"
                className="w-full bg-slate text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body"
              />
            </div>
            {error && <p className="text-booked text-sm">{error}</p>}
            <Btn type="submit" className="w-full py-3">
              Sign In
            </Btn>
          </form>
          <p className="text-mist text-[13px] mt-4 hover:text-chalk cursor-pointer">
            Forgot password?
          </p>
          <p className="font-mono text-[11px] text-mist mt-12">
            This is an MVP demo. Use the pre-filled demo accounts.
          </p>
        </div>
      </div>
    </div>
  )
}
