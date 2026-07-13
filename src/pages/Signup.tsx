import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react'
import { Btn, BtnLink } from '../components/ui/Btn'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { upsertOwnerRecord } from '../services/supabaseData'
import { cn } from '../utils/formatters'
import { AuthSidebar } from '../components/layout/AuthSidebar'

/** CNIC format: 00000-0000000-0 */
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
}

function isCnicValid(cnic: string): boolean {
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic)
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'player' | 'owner'>('player')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cnic, setCnic] = useState('')
  const [error, setError] = useState('')
  const [isErrorRed, setIsErrorRed] = useState(false)

  const switchRole = (r: 'player' | 'owner') => { setRole(r); setError('') }

  const triggerErrorAnimation = () => {
    setIsErrorRed(true)
    setTimeout(() => setIsErrorRed(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      triggerErrorAnimation(); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      triggerErrorAnimation(); return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      triggerErrorAnimation(); return
    }
    if (role === 'owner') {
      if (!cnic) {
        setError('CNIC is required for arena owners.')
        triggerErrorAnimation(); return
      }
      if (!isCnicValid(cnic)) {
        setError('Enter a valid CNIC in format 00000-0000000-0.')
        triggerErrorAnimation(); return
      }
    }

    const { success, error: signupError } = await signup(email, password, role, name)
    if (!success) {
      setError(signupError || 'Unknown error occurred.')
      triggerErrorAnimation(); return
    }

    // For owners: create an owner record with CNIC immediately after signup
    if (role === 'owner') {
      const { data: { user } } = await (await import('../lib/supabase')).supabase.auth.getUser()
      if (user) {
        await upsertOwnerRecord(user.id, {
          businessName: name,
          cnic: cnic.replace(/\D/g, ''), // store digits only
        })
      }
    }

    navigate('/complete-profile')
  }

  const inputCls = 'w-full bg-slate text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body'

  return (
    <div className="min-h-screen grid md:grid-cols-[55%_45%]">
      <AuthSidebar copy="Join the community and start playing today." />

      <div className="bg-ground flex items-center justify-center p-8 md:p-12 relative">
        <div className="absolute top-4 left-4">
          <button type="button" onClick={() => navigate('/')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
            aria-label="Go back">
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="absolute top-4 right-4 md:hidden">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <p className="text-[11px] text-lime font-mono uppercase tracking-[0.2em]">Create an account</p>
          <h1 className="font-display text-display-md text-chalk mt-2">SIGN UP FOR ARENAGO</h1>

          {/* Role toggle */}
          <div className="flex gap-2 mt-8">
            {(['player', 'owner'] as const).map((r) => (
              <button key={r} type="button" onClick={() => switchRole(r)}
                className={cn('px-4 py-2 rounded-full text-[13px] font-body capitalize transition-colors',
                  role === r ? 'bg-lime text-on-lime' : 'bg-slate text-mist hover:text-chalk')}>
                {r === 'player' ? 'Player' : 'Arena Owner'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-[13px] text-mist block mb-2">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" autoComplete="name" className={inputCls} />
            </div>
            <div>
              <label className="text-[13px] text-mist block mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className="text-[13px] text-mist block mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters" autoComplete="new-password" className={inputCls} />
            </div>

            {/* CNIC — only for owners */}
            {role === 'owner' && (
              <div>
                <label className="text-[13px] text-mist block mb-2 flex items-center gap-2">
                  <CreditCard size={13} className="text-lime" />
                  CNIC
                  <span className="font-mono text-[10px] text-mist/60 ml-1">required for verification</span>
                </label>
                <input
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(formatCnic(e.target.value))}
                  placeholder="00000-0000000-0"
                  maxLength={15}
                  autoComplete="off"
                  className={cn(inputCls, 'font-mono tracking-wider',
                    cnic && !isCnicValid(cnic) && 'border-amber/50 focus:outline-amber')}
                />
                {cnic && !isCnicValid(cnic) && (
                  <p className="mt-1.5 text-[11px] text-amber font-mono flex items-center gap-1">
                    <AlertCircle size={11} />Format: 00000-0000000-0
                  </p>
                )}
                <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-lime/5 border border-lime/15">
                  <AlertCircle size={13} className="text-lime mt-0.5 shrink-0" />
                  <p className="text-[11px] text-mist leading-relaxed">
                    Your CNIC is used for arena owner verification only. It is stored securely and never shared publicly.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-booked/10 border border-booked/20">
                <AlertCircle size={14} className="text-booked shrink-0" />
                <p className="text-booked text-sm">{error}</p>
              </div>
            )}

            <Btn type="submit" className="w-full py-3"
              style={isErrorRed ? { backgroundColor: 'rgb(var(--color-booked))', color: '#fff' } : undefined}>
              {role === 'owner' ? 'Sign Up as Owner' : 'Sign Up'}
            </Btn>
          </form>

          <div className="mt-6 flex justify-between items-center text-sm">
            <span className="text-mist">Already have an account?</span>
            <BtnLink to="/login" variant="outline" className="text-[14px] py-1 px-3">Log in</BtnLink>
          </div>
        </div>
      </div>
    </div>
  )
}
