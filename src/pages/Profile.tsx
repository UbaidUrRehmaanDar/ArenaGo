import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, Camera, Heart, KeyRound, LogOut, Mail, MapPin, Pencil, Phone, RotateCw, X } from 'lucide-react'
import { format, isFuture, parseISO } from 'date-fns'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Btn, BtnLink } from '../components/ui/Btn'
import { CustomDropdown } from '../components/ui/CustomDropdown'
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
  upsertOwnerRecord,
  fetchCities,
} from '../services/supabaseData'
import type { Arena, Booking, NotificationRecord, OwnerRecord, ProfileRecord } from '../types'
import { cn, formatPKR } from '../utils/formatters'

/** Crop the image to a square blob using the pixel area from react-easy-crop */
async function getCroppedBlob(imageSrc: string, croppedArea: Area, rotation: number): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const size = 400
  canvas.width = size
  canvas.height = size
  const rad = (rotation * Math.PI) / 180
  ctx.translate(size / 2, size / 2)
  ctx.rotate(rad)
  ctx.translate(-size / 2, -size / 2)
  const scaleX = size / croppedArea.width
  const scaleY = size / croppedArea.height
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(image, -croppedArea.x, -croppedArea.y, image.naturalWidth, image.naturalHeight)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('toBlob failed')) }, 'image/jpeg', 0.92)
  })
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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

  // Crop modal state
  const [cropImageSrc, setCropImageSrc] = useState('')
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropRotation, setCropRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const onCropComplete = useCallback((_: Area, pixels: Area) => { setCroppedAreaPixels(pixels) }, [])

  // Edit profile panel
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCityId, setEditCityId] = useState('')
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)
  const [editError, setEditError] = useState('')

  // Business (owner-only) edit state
  const [bizName, setBizName] = useState('')
  const [bizEmail, setBizEmail] = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [bizSaving, setBizSaving] = useState(false)
  const [bizSuccess, setBizSuccess] = useState(false)
  const [bizError, setBizError] = useState('')

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
      setBookings(bookingData.bookings)
      setArenas(arenaData)
      setAvatarUrl(profileData?.avatarUrl || currentUser.avatar)
      setEditName(profileData?.fullName || currentUser.name || '')
      setEditPhone(profileData?.phone || '')
      setEditCityId(profileData?.cityId || '')
      fetchCities().then(setCities)
      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user?.id])

  // Sync business fields once the owner record loads
  useEffect(() => {
    if (ownerRecord) {
      setBizName(ownerRecord.businessName || '')
      setBizEmail(ownerRecord.businessEmail || '')
      setBizPhone(ownerRecord.businessPhone || '')
    }
  }, [ownerRecord])

  const handleBizSave = async () => {
    if (!user) return
    if (!bizName.trim()) {
      setBizError('Business name is required.')
      return
    }
    setBizError('')
    setBizSaving(true)
    const result = await upsertOwnerRecord(user.id, {
      businessName: bizName.trim(),
      businessEmail: bizEmail.trim() || undefined,
      businessPhone: bizPhone.trim() || undefined,
    })
    if (result) {
      setOwnerRecord(result)
      setBizSuccess(true)
      setTimeout(() => setBizSuccess(false), 2000)
    } else {
      setBizError('Could not save business details. Please try again.')
    }
    setBizSaving(false)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) return
    const objectUrl = URL.createObjectURL(file)
    setCropImageSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropRotation(0)
    setShowCropper(true)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleApplyCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !user) return
    setShowCropper(false)
    try {
      const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels, cropRotation)
      // Show the cropped result immediately via a local blob URL — no waiting for upload
      const localPreview = URL.createObjectURL(blob)
      setAvatarUrl(localPreview)
      // Upload in the background
      setAvatarUploading(true)
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const remoteUrl = await uploadAvatar(user.id, file)
      // Swap to the remote URL once it's ready (keeps cache-bust param)
      if (remoteUrl) setAvatarUrl(remoteUrl)
    } catch {
      console.error('Crop/upload failed')
    }
    setAvatarUploading(false)
  }

  const handleEditSave = async () => {
    if (!user) return

    setEditSaving(true)
    setEditError('')
    const ok = await updateProfile(user.id, {
      fullName: editName.trim() || undefined,
      phone: editPhone.trim() || undefined,
      cityId: editCityId || null,
    })
    if (ok) {
      const selectedCity = cities.find((c) => c.id === editCityId)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: editName.trim() || prev.fullName,
              phone: editPhone.trim() || prev.phone,
              cityId: editCityId || prev.cityId,
              cityName: selectedCity?.name ?? prev.cityName,
            }
          : prev
      )
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 2000)
    } else {
      setEditError('Failed to save changes. Please try again.')
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
      <PageWrapper className="pt-20 md:pt-24 pb-20 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6 md:space-y-8">

          {/* ── Hero card ─────────────────────────────────────────────── */}
          <section className="rounded-[28px] border border-line bg-gradient-to-b from-turf to-ground overflow-hidden noise-overlay">
            {/* Top strip */}
            <div className="h-28 bg-gradient-to-r from-slate via-lime/10 to-slate relative">
              <div className="absolute inset-0 grid-bg opacity-30" />
              {/* Sign out — top right */}
              <button
                type="button"
                onClick={() => { logout(); navigate('/') }}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-ground/60 backdrop-blur-sm border border-line text-mist hover:text-chalk hover:border-lime/40 transition-colors text-xs font-body"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>

            {/* Avatar — overlaps the strip */}
            <div className="flex flex-col items-center -mt-14 pb-6 px-6">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative group w-28 h-28 rounded-full overflow-hidden border-4 border-ground shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-lime focus:ring-offset-2 focus:ring-offset-ground shrink-0"
                aria-label="Change profile picture"
              >
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                <span className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ground/75 transition-opacity rounded-full',
                  avatarUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}>
                  {avatarUploading
                    ? <span className="text-[10px] font-mono text-lime">Uploading…</span>
                    : <>
                        <Camera size={20} className="text-chalk" />
                        <span className="text-[9px] font-mono text-chalk tracking-wide">CHANGE</span>
                      </>
                  }
                </span>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

              {/* Name + role */}
              <div className="mt-4 text-center">
                <h1 className="font-display text-[clamp(1.8rem,6vw,3rem)] text-chalk leading-tight">
                  {displayName}
                </h1>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/30 text-lime text-xs font-mono uppercase tracking-wider">
                  {roleLabel}
                </span>
              </div>

              {/* Info pills */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate border border-line text-mist text-xs font-body">
                  <Mail size={11} className="shrink-0" />
                  {profile?.email || user.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate border border-line text-mist text-xs font-body">
                    <Phone size={11} className="shrink-0" />
                    {profile.phone}
                  </span>
                )}
                {profile?.cityName && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate border border-line text-mist text-xs font-body">
                    <MapPin size={11} className="shrink-0" />
                    {profile.cityName}
                  </span>
                )}
              </div>

              {/* Quick actions */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <BtnLink to="/arenas" className="px-5 py-2.5 text-sm">
                  Browse Arenas
                </BtnLink>
                <BtnLink to="/booking" variant="outline" className="px-5 py-2.5 text-sm">
                  Quick Book
                </BtnLink>
                {user.role === 'owner' ? (
                  <BtnLink to="/dashboard/owner" variant="outline" className="px-5 py-2.5 text-sm">
                    Owner Dashboard
                  </BtnLink>
                ) : (
                  <BtnLink to="/bookings" variant="outline" className="px-5 py-2.5 text-sm">
                    My Bookings
                  </BtnLink>
                )}
              </div>
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
                  <CustomDropdown
                    options={cities.map((c) => c.name)}
                    value={cities.find((c) => c.id === editCityId)?.name || ''}
                    onChange={(name) =>
                      setEditCityId(cities.find((c) => c.name === name)?.id || '')
                    }
                    placeholder="Select your city"
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
                {editError && (
                  <p className="text-booked text-sm">{editError}</p>
                )}
                <div className="pt-1">
                  <Btn
                    type="button"
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className={cn(
                      'w-full py-3',
                      editSuccess && 'bg-lime/30 text-lime'
                    )}
                  >
                    {editSaving ? 'Saving…' : editSuccess ? 'Saved ✓' : 'Save Changes'}
                  </Btn>
                </div>
                {user.role === 'owner' && (
                  <div className="rounded-xl border border-line bg-slate p-4 mt-2 space-y-4">
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-mist">
                      Business Details
                      {ownerRecord?.status && (
                        <span className="ml-2 normal-case tracking-normal text-mist/60">
                          ({ownerRecord.status})
                        </span>
                      )}
                    </p>
                    <div>
                      <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">Business Name</label>
                      <input
                        type="text"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        className="w-full bg-ground text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                        placeholder="Your arena business"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">Business Email</label>
                      <input
                        type="email"
                        value={bizEmail}
                        onChange={(e) => setBizEmail(e.target.value)}
                        className="w-full bg-ground text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                        placeholder="billing@business.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase tracking-[0.18em] text-mist block mb-2">Business Phone</label>
                      <input
                        type="tel"
                        value={bizPhone}
                        onChange={(e) => setBizPhone(e.target.value)}
                        className="w-full bg-ground text-chalk px-4 py-3 rounded-xl border border-line focus:outline-none focus:border-lime font-body text-sm"
                        placeholder="+92 300 0000000"
                      />
                    </div>
                    {bizError && <p className="text-booked text-sm">{bizError}</p>}
                    <Btn
                      type="button"
                      onClick={handleBizSave}
                      disabled={bizSaving}
                      className={cn('w-full py-3', bizSuccess && 'bg-lime/30 text-lime')}
                    >
                      {bizSaving ? 'Saving…' : bizSuccess ? 'Saved ✓' : 'Save Business Details'}
                    </Btn>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-turf p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-chalk">Notifications</h2>
                <Bell size={18} className="text-lime shrink-0" />
              </div>
              <div className="mt-4">
                <p className="text-mist text-sm mb-4">
                  {unreadNotifications.length > 0
                    ? `You have ${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? 's' : ''}.`
                    : 'All caught up — no unread notifications.'}
                </p>
                <BtnLink to="/notifications" variant="outline" className="w-full text-center py-3 text-sm">
                  View All Notifications →
                </BtnLink>
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
              <Btn
                type="button"
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className={cn(
                  pwSuccess && 'bg-lime/30 text-lime'
                )}
              >
                {pwSaving ? 'Updating…' : pwSuccess ? 'Password updated ✓' : 'Update Password'}
              </Btn>
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

      {/* ── Avatar crop modal ───────────────────────────────────────── */}
      {showCropper && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate border border-line rounded-lg w-full max-w-sm flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-chalk font-display text-lg">Crop Photo</h3>
              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="text-mist hover:text-chalk transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-72 rounded-md overflow-hidden bg-ground">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={cropRotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div>
              <label className="text-mist text-xs block mb-1.5">Zoom</label>
              <input
                type="range" min={1} max={3} step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-lime"
              />
            </div>

            <div>
              <label className="text-mist text-xs block mb-1.5">Rotation</label>
              <input
                type="range" min={0} max={360} step={1}
                value={cropRotation}
                onChange={(e) => setCropRotation(Number(e.target.value))}
                className="w-full accent-lime"
              />
            </div>

            <div className="flex gap-2">
              <Btn
                type="button"
                onClick={() => setCropRotation((r) => (r + 90) % 360)}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <RotateCw size={15} />
                Rotate
              </Btn>
              <Btn type="button" onClick={handleApplyCrop} className="flex-1 text-sm">
                Apply Crop
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}