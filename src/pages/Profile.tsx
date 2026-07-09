import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Bell, CalendarDays, Camera, Heart, KeyRound, MapPin, Pencil } from 'lucide-react'
import { format, isFuture, parseISO } from 'date-fns'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BtnLink } from '../components/ui/Btn'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  fetchArenas,
  fetchFavoritesForUser,
  fetchNotificationsForUser,
  fetchOwnerRecord,
  fetchPlayerBookings,
  fetchProfileRecord,
  uploadAvatar,
  updateProfile,
} from '../services/supabaseData'
import type { Arena, Booking, NotificationRecord, OwnerRecord, ProfileRecord } from '../types'
import { cn, formatPKR } from '../utils/formatters'

export function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [ownerRecord, setOwnerRecord] = useState<OwnerRecord | null>(null)
  const [favorites, setFavorites] = useState<Arena[]>([])
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [arenas, setArenas] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Edit profile panel
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  useEffect(() => {
    if (!user) return

    let mounted = true
    const currentUser = user

    async function load() {
      setLoading(true)
      const [profileData, ownerData, favoritesData, notificationsData, bookingData, arenaData] =
        await Promise.all([
          fetchProfileRecord(currentUser.id),
          currentUser.role === 'owner' ? fetchOwnerRecord(currentUser.id) : Promise.resolve(null),
          fetchFavoritesForUser(currentUser.id),
          fetchNotificationsForUser(currentUser.id),
          fetchPlayerBookings(currentUser.id),
          fetchArenas(),
        ])

      if (!mounted) return

      setProfile(profileData)
      setOwnerRecord(ownerData)
      setFavorites(favoritesData)
      setNotifications(notificationsData)
      setBookings(bookingData)
      setArenas(arenaData)
      setAvatarUrl(profileData?.avatarUrl || currentUser.avatar)
      setEditName(profileData?.fullName || currentUser.name || '')
      setEditPhone(profileData?.phone || '')
      setEditCity(profileData?.cityId || '')
      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    const newUrl = await uploadAvatar(user.id, file)
    if (newUrl) setAvatarUrl(newUrl)
    setAvatarUploading(false)
  }

  const handleEditSave = async () => {
    if (!user) return
    setEditSaving(true)
    const ok = await updateProfile(user.id, {
      fullName: editName.trim() || undefined,
      phone: editPhone.trim() || undefined,
    })
    if (ok) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: editName.trim() || prev.fullName,
              phone: editPhone.trim() || prev.phone,
              cityId: editCity.trim() || prev.cityId,
            }
          : prev
      )
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 2000)
    }
    setEditSaving(false)
  }

  const handlePasswordChange = async () => {
    setPwError('')
    setPwSuccess(false)

    if (!newPassword || !currentPassword) {
      setPwError('Please fill in all fields.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }

    setPwSaving(true)

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || user?.email || '',
      password: currentPassword,
    })

    if (signInError) {
      setPwError('Current password is incorrect.')
      setPwSaving(false)
      return
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setPwError(updateError.message)
    } else {
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    }

    setPwSaving(false)
  }

  const unreadNotifications = notifications.filter((notification) => !notification.isRead)
  const upcomingBookings = bookings.filter(
    (booking) => booking.status === 'confirmed' && isFuture(parseISO(booking.date))
  )
  const recentBookings = [...bookings]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4)

  const bookingArenaMap = useMemo(() => {
    return new Map(arenas.map((arena) => [arena.id, arena]))
  }, [arenas])

  if (!user) return <Navigate to="/login" replace />
  if (loading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center text-mist">
        Loading profile...
      </div>
    )
  }

  const displayName = profile?.fullName || user.name
  const avatar = avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80'
  const roleLabel = user.role === 'owner' ? 'Arena Owner' : 'Player'

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">
          <section className="rounded-[28px] border border-line bg-gradient-to-br from-turf via-slate/70 to-ground p-5 md:p-8 noise-overlay overflow-hidden">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8 items-end">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-mist font-mono">
                    Account Hub
                  </span>
                  <span className="px-3 py-1 rounded-full bg-lime text-on-lime text-xs font-mono uppercase">
                    {roleLabel}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                  {/* Avatar with upload overlay */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-[24px] overflow-hidden border border-line shadow-[0_18px_40px_rgba(0,0,0,0.35)] focus:outline-none focus:ring-2 focus:ring-lime"
                    aria-label="Change profile picture"
                  >
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                    <span className={cn(
                      'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ground/70 transition-opacity',
                      avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}>
                      {avatarUploading
                        ? <span className="text-[10px] font-mono text-lime">Uploading…</span>
                        : <>
                            <Camera size={18} className="text-chalk" />
                            <span className="text-[10px] font-mono text-chalk">Change</span>
                          </>
                      }
                    </span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div>
                    <h1 className="font-display text-[clamp(2.5rem,8vw,5.5rem)] text-chalk leading-[0.92]">
                      {displayName}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm md:text-base text-mist">
                      Personal details, notifications, saved venues, and booking history all in one place.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Email</p>
                  <p className="mt-2 text-chalk text-sm md:text-base break-all">{profile?.email || user.email}</p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Phone</p>
                  <p className="mt-2 text-chalk text-sm md:text-base">
                    {profile?.phone || <span className="text-mist/60 italic">Not set</span>}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">City</p>
                  <p className="mt-2 text-chalk text-sm md:text-base">
                    {profile?.cityId || <span className="text-mist/60 italic">Not set</span>}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-ground/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-mist font-mono">Role</p>
                  <p className="mt-2 text-chalk text-sm md:text-base capitalize">{user.role}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <BtnLink to="/arenas" className="px-5 py-3 text-sm">
                Browse Arenas
              </BtnLink>
              <BtnLink to="/booking" variant="outline" className="px-5 py-3 text-sm">
                Quick Book
              </BtnLink>
              {user.role === 'owner' ? (
                <BtnLink to="/dashboard/owner" variant="outline" className="px-5 py-3 text-sm">
                  Owner Dashboard
                </BtnLink>
              ) : (
                <BtnLink to="/dashboard/player" variant="outline" className="px-5 py-3 text-sm">
                  Player Dashboard
                </BtnLink>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="Upcoming Bookings" value={upcomingBookings.length} />
            <StatCard label="Saved Arenas" value={favorites.length} />
            <StatCard label="Unread Notifications" value={unreadNotifications.length} />
            <StatCard
              label="Estimated Spend"
              value={formatPKR(bookings.reduce((sum, booking) => sum + Number(booking.amountPaid ?? booking.price ?? 0), 0))}
            />
          </section>

          <section className="grid xl:grid-cols-[0.95fr_1.05fr] gap-4 md:gap-5">
            <div className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-chalk">Edit Profile</h2>
                <Pencil size={18} className="text-lime shrink-0" />
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                    placeholder="+92 300 0000000"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    autoComplete="address-level2"
                    className="w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                    placeholder="e.g. Lahore"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">
                    Email <span className="normal-case tracking-normal text-mist/50">(cannot be changed)</span>
                  </label>
                  <div className="rounded-xl border border-line bg-ground/60 px-4 py-3 text-mist text-sm break-all">
                    {profile?.email || user.email}
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className={cn(
                      'w-full py-3 rounded-xl font-mono text-sm transition-colors',
                      editSuccess ? 'bg-lime/30 text-lime' : 'bg-lime text-on-lime hover:bg-lime/80',
                      editSaving && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {editSaving ? 'Saving…' : editSuccess ? 'Saved ✓' : 'Save Changes'}
                  </button>
                </div>
                {user.role === 'owner' && ownerRecord && (
                  <div className="rounded-xl border border-line bg-slate p-4 mt-2">
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-mist">Business</p>
                    <p className="mt-2 text-chalk text-sm">{ownerRecord.businessName}</p>
                    <p className="text-mist text-xs mt-1">{ownerRecord.businessEmail || 'No business email'}</p>
                    <p className="text-mist text-xs">{ownerRecord.businessPhone || 'No business phone'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-chalk">Notifications</h2>
                <Bell size={18} className="text-lime shrink-0" />
              </div>
              <div className="mt-5 space-y-3">
                {notifications.length === 0 && (
                  <div className="rounded-2xl border border-line bg-slate p-4 text-sm text-mist">
                    No notifications yet. New activity from bookings and promotions will appear here.
                  </div>
                )}
                {notifications.slice(0, 5).map((notification) => (
                  <article
                    key={notification.id}
                    className={cn(
                      'rounded-2xl border p-4 transition-colors',
                      notification.isRead ? 'border-line bg-slate' : 'border-lime/30 bg-lime/5'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-chalk font-body">{notification.title}</h3>
                      <span className="text-xs text-mist font-mono uppercase">{notification.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-mist leading-relaxed">{notification.message}</p>
                    <p className="mt-3 text-xs text-mist font-mono">
                      {format(parseISO(notification.createdAt), 'd MMM yyyy · HH:mm')}
                    </p>
                    {notification.link && (
                      <Link to={notification.link} className="inline-flex mt-3 text-sm text-lime hover:text-chalk">
                        Open item
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Change Password */}
          <section className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="font-display text-2xl text-chalk">Change Password</h2>
              <KeyRound size={18} className="text-lime shrink-0" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPwError('') }}
                  className="w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPwError('') }}
                  className="w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPwError('') }}
                  className="w-full bg-slate text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className={cn(
                  'px-6 py-3 rounded-xl font-mono text-sm transition-colors',
                  pwSuccess
                    ? 'bg-lime/30 text-lime'
                    : 'bg-lime text-on-lime hover:bg-lime/80',
                  pwSaving && 'opacity-60 cursor-not-allowed'
                )}
              >
                {pwSaving ? 'Updating…' : pwSuccess ? 'Password updated ✓' : 'Update Password'}
              </button>
              {pwError && (
                <p className="text-booked text-sm font-body">{pwError}</p>
              )}
            </div>
          </section>

          <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-5">            <div className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-chalk">Favourite Arenas</h2>
                <Heart size={18} className="text-lime shrink-0" />
              </div>
              <div className="mt-5 grid gap-3">
                {favorites.length === 0 && (
                  <div className="rounded-2xl border border-line bg-slate p-4 text-sm text-mist">
                    Save venues from the arena pages and they will appear here.
                  </div>
                )}
                {favorites.slice(0, 4).map((arena) => (
                  <Link
                    key={arena.id}
                    to={`/arenas/${arena.slug}`}
                    className="group rounded-2xl border border-line bg-slate overflow-hidden flex gap-4 p-3 hover:border-lime/30 transition-colors"
                  >
                    <img src={arena.images[0]} alt={arena.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-display text-xl text-chalk truncate">{arena.name}</p>
                        <p className="text-sm text-mist mt-1 flex items-center gap-1">
                          <MapPin size={12} />
                          {arena.location.area}, {arena.location.city}
                        </p>
                      </div>
                      <p className="text-lime text-sm whitespace-nowrap">
                        {formatPKR(arena.pricing.weekday)}/hr
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-chalk">Recent Bookings</h2>
                <CalendarDays size={18} className="text-lime shrink-0" />
              </div>
              <div className="mt-5 space-y-3">
                {recentBookings.length === 0 && (
                  <div className="rounded-2xl border border-line bg-slate p-4 text-sm text-mist">
                    No booking history yet.
                  </div>
                )}
                {recentBookings.map((booking) => {
                  const arena = bookingArenaMap.get(booking.arenaId)
                  return (
                    <article key={booking.id} className="rounded-2xl border border-line bg-slate p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-chalk font-body">{arena?.name || 'Unknown arena'}</p>
                          <p className="text-xs text-mist font-mono mt-1">
                            {format(parseISO(booking.date), 'd MMM yyyy')} · {booking.startTime}
                          </p>
                        </div>
                        <span className="text-xs uppercase font-mono px-2 py-1 rounded-full bg-ground text-mist border border-line">
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-mist">Amount</span>
                        <span className="text-lime">
                          {formatPKR(Number(booking.amountPaid ?? booking.price ?? 0))}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </PageWrapper>
      <Footer />
    </>
  )
}
