import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, Camera, RotateCw, X } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Btn } from '../components/ui/Btn'
import { CustomDropdown } from '../components/ui/CustomDropdown'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadAvatar, fetchCities } from '../services/supabaseData'

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

  // Scale the image so the cropped area maps to the canvas size
  const scaleX = size / croppedArea.width
  const scaleY = size / croppedArea.height
  ctx.scale(scaleX, scaleY)
  ctx.drawImage(
    image,
    -croppedArea.x,
    -croppedArea.y,
    image.naturalWidth,
    image.naturalHeight
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/jpeg', 0.92)
  })
}

/** Validate phone — must start with 0 or +92 */
function isPhoneValid(phone: string): boolean {
  return /^(\+92[0-9]{10}|0[0-9]{10})$/.test(phone)
}

/**
 * Returns true only when the current value is definitively wrong —
 * i.e. it can no longer become a valid number no matter what the user types next.
 *
 * Rules:
 *  - Empty → not invalid (field is optional)
 *  - Starts with 0 → only invalid once length > 11 or a non-digit is entered after the 0
 *  - Starts with + → only invalid if it can't become +92XXXXXXXXXX
 *  - Starts with anything else → immediately invalid
 */
function isPhoneInvalid(phone: string): boolean {
  if (!phone) return false

  // Path: 0XXXXXXXXXX (must be exactly 11 digits)
  if (phone.startsWith('0')) {
    // Still typing — could still be valid
    if (phone.length <= 11) return !/^0[0-9]*$/.test(phone)
    // Too long
    return true
  }

  // Path: +92XXXXXXXXXX (must be exactly 13 chars)
  if (phone.startsWith('+')) {
    if (phone.length <= 13) return !/^\+[9]?[2]?[0-9]*$/.test(phone)
    return true
  }

  // Starts with anything other than 0 or + → immediately wrong
  return true
}

export default function CompleteProfile() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  // cityId stores the UUID; cityName is what shows in the dropdown
  const [cityId, setCityId] = useState('')
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Source image for the cropper (object URL)
  const [imageSrc, setImageSrc] = useState<string>('')
  // Final preview after crop
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  // The blob we'll upload
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  // react-easy-crop state
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load cities from Supabase on mount
  useEffect(() => {
    fetchCities().then(setCities)
  }, [])

  /* ── File selection ─────────────────────────────────────────────────── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image size must be less than 5MB.'); return }

    setError('')
    const objectUrl = URL.createObjectURL(file)
    setImageSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setShowCropper(true)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  /* ── Apply crop ─────────────────────────────────────────────────────── */
  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation)
      const previewUrl = URL.createObjectURL(blob)
      setCroppedBlob(blob)
      setAvatarPreview(previewUrl)
      setShowCropper(false)
    } catch {
      setError('Failed to process image. Please try again.')
    }
  }

  const handleCancelCrop = () => {
    setShowCropper(false)
    setImageSrc('')
  }

  /* ── Submit ─────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }

    if (phone && !isPhoneValid(phone)) {
      setError('Please enter a valid phone number (e.g., +92 300 1234567 or 0300 1234567)')
      return
    }

    setLoading(true)
    setError('')

    try {
      let avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`

      if (croppedBlob) {
        setAvatarUploading(true)
        const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
        const uploadedUrl = await uploadAvatar(user.id, file)
        if (uploadedUrl) avatarUrl = uploadedUrl
        setAvatarUploading(false)
      }

      const profileData: Record<string, unknown> = {
        phone: phone || null,
        avatar_url: avatarUrl,
        ...(cityId ? { city_id: cityId } : {}),
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)

      if (updateError) {
        const insertData = {
          id: user.id,
          email: user.email,
          role: user.role === 'owner' ? 'owner' : 'customer',
          full_name: user.name || 'User',
          ...profileData,
        }
        const { error: insertError } = await supabase.from('profiles').insert(insertData)
        if (insertError) {
          if (insertError.code === '23505') {
            const { error: retryError } = await supabase.from('profiles').update(profileData).eq('id', user.id)
            if (retryError) { setError(retryError.message); setLoading(false); return }
          } else {
            setError(insertError.message); setLoading(false); return
          }
        }
      }

      await refreshUser()
      navigate(user.role === 'owner' ? '/dashboard/owner' : '/home')
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
      setAvatarUploading(false)
    }
  }

  const handleSkip = () => {
    navigate(user?.role === 'owner' ? '/dashboard/owner' : '/home')
  }

  const phoneInvalid = isPhoneInvalid(phone)

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-turf border-b border-line px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(user?.role === 'owner' ? '/dashboard/owner' : '/home')}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-slate border border-line text-chalk hover:text-lime transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-xl text-chalk">Complete Profile</h1>
        <div className="w-9" />
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto p-6">
        <p className="text-[11px] text-lime font-mono uppercase tracking-[0.2em]">Almost there</p>
        <h2 className="font-display text-display-sm text-chalk mt-2">COMPLETE YOUR PROFILE</h2>
        <p className="text-mist text-sm mt-3">Add your details to personalize your experience.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Avatar Upload */}
          <div>
            <label className="text-[13px] text-mist block mb-2 flex items-center gap-2">
              <Camera size={14} />
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden bg-slate border border-line flex-shrink-0 cursor-pointer hover:border-lime transition-colors"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Current avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-mist">
                    <Camera size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <Btn type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="text-sm">
                  {avatarPreview ? 'Change Image' : 'Upload Image'}
                </Btn>
                <p className="text-xs text-mist mt-1">Max 5MB. JPG, PNG, GIF.</p>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-[13px] text-mist block mb-2 flex items-center gap-2">
              <Phone size={14} />
              Phone Number <span className="text-xs text-mist/60">(Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567 or 0300 1234567"
              className={`w-full bg-slate text-chalk px-4 py-3 rounded-sm border focus:outline focus:outline-2 font-body transition-colors ${
                phoneInvalid
                  ? 'border-booked text-booked focus:outline-booked placeholder:text-booked/50'
                  : 'border-line focus:outline-lime'
              }`}
            />
            {phoneInvalid && (
              <p className="text-booked text-xs mt-1.5">
                Must start with <span className="font-mono">0</span> or <span className="font-mono">+92</span>
              </p>
            )}
          </div>

          {/* City Selection */}
          <div>
            <label className="text-[13px] text-mist block mb-2 flex items-center gap-2">
              <MapPin size={14} />
              City <span className="text-xs text-mist/60">(Optional)</span>
            </label>
            <CustomDropdown
              options={cities.map((c) => c.name)}
              value={cities.find((c) => c.id === cityId)?.name ?? ''}
              onChange={(name) => {
                const found = cities.find((c) => c.name === name)
                setCityId(found?.id ?? '')
              }}
              placeholder={cities.length === 0 ? 'Loading cities…' : 'Select your city'}
            />
          </div>

          {error && <p className="text-booked text-sm">{error}</p>}

          <Btn type="submit" disabled={loading || avatarUploading || phoneInvalid} className="w-full py-3">
            {loading || avatarUploading ? 'Saving...' : 'Complete Profile'}
          </Btn>

          <Btn type="button" onClick={handleSkip} variant="outline" className="w-full text-sm">
            Skip for now
          </Btn>
        </form>
      </main>

      {/* react-easy-crop Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate border border-line rounded-lg w-full max-w-sm flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-chalk font-display text-lg">Crop Photo</h3>
              <button type="button" onClick={handleCancelCrop} className="text-mist hover:text-chalk transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Cropper area — fixed height */}
            <div className="relative w-full h-72 rounded-md overflow-hidden bg-ground">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom */}
            <div>
              <label className="text-mist text-xs block mb-1.5">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-lime"
              />
            </div>

            {/* Rotation */}
            <div>
              <label className="text-mist text-xs block mb-1.5">Rotation</label>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-lime"
              />
            </div>

            <div className="flex gap-2">
              <Btn
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <RotateCw size={15} />
                Rotate
              </Btn>
              <Btn
                type="button"
                onClick={handleApplyCrop}
                className="flex-1 text-sm"
              >
                Apply Crop
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
