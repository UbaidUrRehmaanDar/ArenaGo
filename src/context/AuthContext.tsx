import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserProfile } from '../services/supabaseData'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, role: 'player' | 'owner', name: string) => Promise<{success: boolean, error?: string}>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      }
      setLoading(false)
    }

    initSession()

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error || !data.user) return false
      
      const profile = await fetchUserProfile(data.user.id)
      setUser(profile)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const signup = async (email: string, password: string, role: 'player' | 'owner', name: string): Promise<{success: boolean, error?: string}> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) return { success: false, error: error.message }
      if (!data.user) return { success: false, error: 'Unknown error during sign up.' }

      // Insert profile into public.profiles table
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        role: role === 'player' ? 'customer' : 'owner',
        full_name: name,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
      }

      // Auto-login after signup
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('Auto-login failed:', loginError)
        // Still return success since signup worked
        return { success: true }
      }

      if (loginData.user) {
        const profile = await fetchUserProfile(loginData.user.id)
        setUser(profile)
      }

      return { success: true }
    } catch (err: any) {
      console.error(err)
      return { success: false, error: err.message || 'An error occurred.' }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-ground text-chalk">Loading...</div>}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
