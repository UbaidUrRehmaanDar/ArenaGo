import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Btn } from '../components/ui/Btn'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/formatters'
import { AuthSidebar } from '../components/layout/AuthSidebar'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'player' | 'owner'>('player')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isErrorRed, setIsErrorRed] = useState(false)

  const switchRole = (r: 'player' | 'owner') => {
    setRole(r)
    setError('')
  }

  const triggerErrorAnimation = () => {
    setIsErrorRed(true)
    setTimeout(() => setIsErrorRed(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) {
      navigate(role === 'owner' ? '/dashboard/owner/home' : '/dashboard/player/home')
    } else {
      setError('Invalid email or password.')
      triggerErrorAnimation()
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[55%_45%]">
      <AuthSidebar copy="Every great match starts with a booking." />

      <div className="bg-ground flex items-center justify-center p-8 md:p-12 relative">
        <div className="absolute top-4 left-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
            aria-label="Go back to landing"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="absolute top-4 right-4 md:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <p className="text-[11px] text-lime font-mono uppercase tracking-[0.2em]">Welcome back</p>
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
            
            <Btn
              type="submit"
              className="w-full py-3"
              style={isErrorRed ? { backgroundColor: 'rgb(var(--color-booked))', color: '#fff' } : undefined}
            >
              Sign In
            </Btn>
          </form>
          
          <div className="mt-6 flex justify-between items-center text-sm">
            <p className="text-mist hover:text-chalk cursor-pointer font-body">
              Forgot password?
            </p>
            <div className="flex gap-2 text-mist font-body">
              <span>Don't have an account?</span>
              <button
                onClick={() => navigate('/signup')}
                className="text-lime hover:underline"
              >
                Sign up
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
