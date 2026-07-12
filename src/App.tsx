import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Component, lazy, Suspense, useLayoutEffect, type ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { ThemeProvider } from './context/ThemeContext'
import { useLenis } from './hooks/useLenis'
import { MobileBottomNav } from './components/layout/MobileBottomNav'
import { Btn } from './components/ui/Btn'
import { ToastContainer } from './components/ui/Toast'
import { LoadingScreen } from './components/ui/LoadingScreen'

// Lazy-load all pages so each route is a separate chunk
const Landing          = lazy(() => import('./pages/Landing'))
const Home             = lazy(() => import('./pages/Home'))
const About            = lazy(() => import('./pages/About'))
const Community        = lazy(() => import('./pages/Community'))
const Notifications    = lazy(() => import('./pages/Notifications'))
const ArenaListings    = lazy(() => import('./pages/ArenaListings'))
const ArenaDetail      = lazy(() => import('./pages/ArenaDetail'))
const ArenaSchedule    = lazy(() => import('./pages/ArenaSchedule'))
const BookingFlow      = lazy(() => import('./pages/BookingFlow'))
const BookingConfirmed = lazy(() => import('./pages/BookingConfirmed'))
const Profile          = lazy(() => import('./pages/Profile'))
const Promotions       = lazy(() => import('./pages/Promotions'))
const PlayerBookings   = lazy(() => import('./pages/PlayerBookings'))
const Favourites       = lazy(() => import('./pages/Favourites'))
const Activity         = lazy(() => import('./pages/Activity'))
const OwnerDashboard   = lazy(() => import('./pages/OwnerDashboard'))
const Login            = lazy(() => import('./pages/Login'))
const Signup           = lazy(() => import('./pages/Signup'))
const CompleteProfile  = lazy(() => import('./pages/CompleteProfile'))

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

/** Redirects authenticated users away from public-only pages (login, landing, signup). */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to={user.role === 'owner' ? '/dashboard/owner' : '/home'} replace />
  }
  return children
}

/** Redirects unauthenticated users to login, preserving where they were headed. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <PublicOnlyRoute>
              <Landing />
            </PublicOnlyRoute>
          } />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/community" element={<Community />} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/arenas" element={<ArenaListings />} />
          <Route path="/arenas/:slug" element={<ArenaDetail />} />
          <Route path="/arenas/:slug/schedule" element={<ArenaSchedule />} />
          <Route path="/booking" element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
          <Route path="/booking/confirmed" element={<ProtectedRoute><BookingConfirmed /></ProtectedRoute>} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><PlayerBookings /></ProtectedRoute>} />
          <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/dashboard/owner/*" element={<OwnerDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
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
          <LoadingScreen />
          <ScrollToTop />
          <AnimatedRoutes />
          <MobileBottomNav />
          <ToastContainer />
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
