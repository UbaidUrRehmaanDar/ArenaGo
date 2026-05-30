import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEMO_CREDENTIALS, demoOwner, demoPlayer } from '../data/users'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = (email: string, password: string): boolean => {
    if (
      email === DEMO_CREDENTIALS.player.email &&
      password === DEMO_CREDENTIALS.player.password
    ) {
      setUser({
        id: demoPlayer.id,
        name: demoPlayer.name,
        email: demoPlayer.email,
        role: 'player',
        avatar: demoPlayer.avatar,
      })
      return true
    }
    if (
      email === DEMO_CREDENTIALS.owner.email &&
      password === DEMO_CREDENTIALS.owner.password
    ) {
      setUser({
        id: demoOwner.id,
        name: demoOwner.name,
        email: demoOwner.email,
        role: 'owner',
        arenaIds: demoOwner.arenaIds,
      })
      return true
    }
    return false
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
