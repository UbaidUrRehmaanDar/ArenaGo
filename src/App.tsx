import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Component, lazy, Suspense, useLayoutEffect, type ReactNode } from 'react'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { ThemeProvider } from './context/ThemeContext'
import { useLenis } from './hooks/useLenis'
import { MobileBottomNav } from './components/layout/MobileBottomNav'
import { Btn } from './components/ui/Btn'

// Lazy-load all pages so each route is a separate chunk
const Landing        = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })))
const Home           = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const About          = lazy(() => import('./pages/About').then(m => ({ default: m.About })))
const ArenaListings  = lazy(() => import('./pages/ArenaListings').then(m => ({ default: m.ArenaListings })))
const ArenaDetail    = lazy(() => import('./pages/ArenaDetail').then(m => ({ default: m.ArenaDetail })))
const ArenaSchedule  = lazy(() => import('./pages/ArenaSchedule').then(m => ({ default: m.ArenaSchedule })))
const BookingFlow    = lazy(() => import('./pages/BookingFlow').then(m => ({ default: m.BookingFlow })))
const BookingConfirmed = lazy(() => import('./pages/BookingConfirmed').then(m => ({ default: m.BookingConfirmed })))
const Profile        = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const Promotions     = lazy(() => import('./pages/Promotions').then(m => ({ default: m.Promotions })))
const PlayerDashboard = lazy(() => import('./pages/PlayerDashboard').then(m => ({ default: m.PlayerDashboard })))
const OwnerDashboard  = lazy(() => import('./pages/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })))
const Login          = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const Signup         = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })))

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
      <Suspense fallback={<div className="min-h-screen bg-ground" />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/arenas" element={<ArenaListings />} />
          <Route path="/arenas/:slug" element={<ArenaDetail />} />
          <Route path="/arenas/:slug/schedule" element={<ArenaSchedule />} />
          <Route path="/booking" element={<BookingFlow />} />
          <Route path="/booking/confirmed" element={<BookingConfirmed />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard/player/*" element={<PlayerDashboard />} />
          <Route path="/dashboard/owner/*" element={<OwnerDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function ScrollToTop() {
  const location = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

function AppContent() {
  useLenis()
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <ScrollToTop />
          <AnimatedRoutes />
          <MobileBottomNav />
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
