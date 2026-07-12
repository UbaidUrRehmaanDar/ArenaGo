import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Btn, BtnLink } from '../components/ui/Btn'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { AuthSidebar } from '../components/layout/AuthSidebar'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isErrorRed, setIsErrorRed] = useState(false)

  const triggerErrorAnimation = () => {
    setIsErrorRed(true)
    setTimeout(() => setIsErrorRed(false), 2000)
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in all fields.')
      triggerErrorAnimation()
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      triggerErrorAnimation()
      return
    }

    const result = await login(email, password)
    if (result.success && result.user) {
      // Navigate based on returned user data (no race condition)
      if (result.user.role === 'owner') {
        navigate('/dashboard/owner')
      } else {
        navigate('/home')
      }
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
            <div className="flex gap-2 text-mist font-body">
              <span>Don't have an account?</span>
              <BtnLink to="/signup" variant="outline" className="text-[14px] py-1 px-3">
                Sign up
              </BtnLink>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
