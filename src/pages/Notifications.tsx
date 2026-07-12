import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Btn, BtnLink } from '../components/ui/Btn'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { fetchNotificationsForUser } from '../services/supabaseData'
import { supabase } from '../lib/supabase'
import { cn } from '../utils/formatters'
import type { NotificationRecord } from '../types'

const TYPE_LABELS: Record<string, string> = {
  booking_confirmed: 'Booking',
  booking_cancelled: 'Cancelled',
  booking_reminder:  'Reminder',
  review_received:   'Review',
  owner_approved:    'Account',
  promotion:         'Offer',
  system:            'System',
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchNotificationsForUser(user.id).then((data) => {
      setNotifications(data)
      setLoading(false)
    })
  }, [user])

  const unread = notifications.filter((n) => !n.isRead)

  const markAllRead = async () => {
    if (!user || unread.length === 0) return
    setMarkingAll(true)
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setMarkingAll(false)
  }

  const markOneRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <LoadingState message="Loading notifications..." />

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-20 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-6">

          {/* Hero */}
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-mist font-mono">
                  <Bell size={14} />
                  Notifications
                  {unread.length > 0 && (
                    <span className="bg-lime text-on-lime text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                      {unread.length}
                    </span>
                  )}
                </span>
                <h1 className="font-display text-[clamp(2.2rem,7vw,4.5rem)] text-chalk leading-[0.92]">
                  Your Activity Feed
                </h1>
                <p className="text-sm md:text-base text-mist max-w-md">
                  Booking updates, reminders, and promotional alerts — all in one place.
                </p>
              </div>
              {unread.length > 0 && (
                <Btn
                  type="button"
                  variant="outline"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="px-5 py-3 text-sm shrink-0 flex items-center gap-2"
                >
                  <CheckCheck size={15} />
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </Btn>
              )}
            </div>
          </section>

          {/* Notification list */}
          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <BellOff size={32} className="text-mist mx-auto mb-4" />
                <p className="text-chalk font-display text-2xl mb-2">All quiet here</p>
                <p className="text-mist text-sm mb-6">
                  Booking confirmations, reminders, and offers will appear here.
                </p>
                <BtnLink to="/arenas" className="inline-block px-6 py-3">
                  Browse Arenas
                </BtnLink>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <article
                    key={n.id}
                    className={cn(
                      'rounded-2xl border p-4 transition-colors cursor-default',
                      n.isRead
                        ? 'border-line bg-slate'
                        : 'border-lime/30 bg-lime/5'
                    )}
                    onClick={() => !n.isRead && markOneRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* unread dot */}
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-lime shrink-0 mt-1.5" />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-display text-base text-chalk">{n.title}</p>
                            <span className="text-[10px] uppercase font-mono text-mist border border-line px-1.5 py-0.5 rounded-full">
                              {TYPE_LABELS[n.type] ?? n.type}
                            </span>
                          </div>
                          <p className="text-sm text-mist leading-relaxed">{n.message}</p>
                          <p className="mt-2 text-xs text-mist font-mono">
                            {format(parseISO(n.createdAt), 'd MMM yyyy · HH:mm')}
                          </p>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex mt-2 text-sm text-lime hover:text-chalk transition-colors"
                            >
                              Open →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
