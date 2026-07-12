import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserProfile } from '../services/supabaseData'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser | null }>
  signup: (email: string, password: string, role: 'player' | 'owner', name: string) => Promise<{success: boolean, error?: string}>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: AuthUser | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error || !data.user) return { success: false }

      const profile = await fetchUserProfile(data.user.id)
      setUser(profile)
      return { success: true, user: profile }
    } catch (err) {
      console.error(err)
      return { success: false }
    }
  }

  const signup = async (email: string, password: string, role: 'player' | 'owner', name: string): Promise<{success: boolean, error?: string}> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role === 'player' ? 'customer' : 'owner',
          }
        }
      })
      if (error) return { success: false, error: error.message }
      if (!data.user) return { success: false, error: 'Unknown error during sign up.' }

      // Try to insert profile into public.profiles table
      // If it already exists (duplicate key), that's okay - just fetch it
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        role: role === 'player' ? 'customer' : 'owner',
        full_name: name,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        phone: null,
      })

      if (profileError) {
        console.error('Profile insert error:', profileError)
        // If it's a duplicate key error, the profile already exists - that's fine
        if (profileError.code !== '23505') {
          return { success: false, error: 'Failed to create profile. Please try again.' }
        }
        console.log('Profile already exists, continuing...')
      }

      // Supabase automatically creates a session during signup
      // Fetch the profile to set user state
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id)
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

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const profile = await fetchUserProfile(authUser.id)
      setUser(profile)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, loading }}>
      {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-ground text-chalk">Loading...</div>}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
