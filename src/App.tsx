import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Component, type ReactNode } from 'react'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { ThemeProvider } from './context/ThemeContext'
import { useLenis } from './hooks/useLenis'
import { Landing } from './pages/Landing'
import { ArenaListings } from './pages/ArenaListings'
import { ArenaDetail } from './pages/ArenaDetail'
import { BookingFlow } from './pages/BookingFlow'
import { BookingConfirmed } from './pages/BookingConfirmed'
import { PlayerDashboard } from './pages/PlayerDashboard'
import { OwnerDashboard } from './pages/OwnerDashboard'
import { Login } from './pages/Login'
import { Btn } from './components/ui/Btn'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ground px-4">
          <div className="text-center max-w-md">
            <p className="font-display text-2xl text-lime mb-4">Something went wrong</p>
            <p className="font-mono text-sm text-mist mb-6">
              {(this.state.error as Error).message}
            </p>
            <Btn type="button" onClick={() => window.location.reload()} className="px-6 py-3">
              Reload
            </Btn>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/arenas" element={<ArenaListings />} />
        <Route path="/arenas/:slug" element={<ArenaDetail />} />
        <Route path="/booking" element={<BookingFlow />} />
        <Route path="/booking/confirmed" element={<BookingConfirmed />} />
        <Route path="/dashboard/player/*" element={<PlayerDashboard />} />
        <Route path="/dashboard/owner/*" element={<OwnerDashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  )
}

function AppContent() {
  useLenis()
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <AnimatedRoutes />
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
