import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone } from 'lucide-react'
import { Btn } from '../components/ui/Btn'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AuthSidebar } from '../components/layout/AuthSidebar'

export function CompleteProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    if (!phone || !location) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_number: phone,
          location: location,
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Navigate to home/dashboard based on role
      if (user.role === 'owner') {
        navigate('/dashboard/owner')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (!user) {
      navigate('/login')
      return
    }

    // Navigate to home/dashboard based on role
    if (user.role === 'owner') {
      navigate('/dashboard/owner')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[55%_45%]">
      <AuthSidebar copy="Complete your profile to get started." />

      <div className="bg-ground flex items-center justify-center p-8 md:p-12 relative">
        <div className="absolute top-4 left-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
            aria-label="Go back to home"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="absolute top-4 right-4 md:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <p className="text-[11px] text-lime font-mono uppercase tracking-[0.2em]">Almost there</p>
          <h1 className="font-display text-display-md text-chalk mt-2">COMPLETE YOUR PROFILE</h1>
          <p className="text-mist text-sm mt-3">
            Add your phone number and location to help us personalize your experience.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-[13px] text-mist block mb-2 flex items-center gap-2">
                <Phone size={14} />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full bg-slate text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body"
              />
            </div>
            <div>
              <label className="text-[13px] text-mist block mb-2 flex items-center gap-2">
                <MapPin size={14} />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lahore, Pakistan"
                className="w-full bg-slate text-chalk px-4 py-3 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body"
              />
            </div>
            {error && <p className="text-booked text-sm">{error}</p>}

            <Btn
              type="submit"
              disabled={loading}
              className="w-full py-3"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Btn>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-mist text-sm hover:text-chalk transition-colors py-2"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
