import { supabase } from '../lib/supabase'
import type {
  Arena,
  AuthUser,
  Booking,
  NotificationRecord,
  OwnerRecord,
  ProfileRecord,
  PromotionRecord,
  Review,
  TimeSlot,
} from '../types'

// ── Image / Avatar uploads ────────────────────────────────────────────────────

/**
 * Updates full_name (and optionally phone) in the profiles table.
 */
export async function updateProfile(
  userId: string,
  updates: { fullName?: string; phone?: string }
): Promise<boolean> {
  try {
    const payload: Record<string, string> = {}
    if (updates.fullName !== undefined) payload.full_name = updates.fullName
    if (updates.phone !== undefined) payload.phone = updates.phone

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    return !error
  } catch (err) {
    console.error('updateProfile error:', err)
    return false
  }
}

/**
 * Fetches aggregate platform stats: total players, arenas, and bookings.
 */
export async function fetchPlatformStats(): Promise<{ players: number; arenas: number; bookings: number }> {
  try {
    const [profilesRes, arenasRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('arenas').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ])
    return {
      players: profilesRes.count ?? 0,
      arenas: arenasRes.count ?? 0,
      bookings: bookingsRes.count ?? 0,
    }
  } catch (err) {
    console.error('fetchPlatformStats error:', err)
    return { players: 0, arenas: 0, bookings: 0 }
  }
}

/**
 * Fetches recent booking activity for the live feed.
 * Returns last N bookings joined with profile and arena names.
 */
export async function fetchRecentActivity(limit = 20): Promise<import('../types').ActivityItem[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, created_at, status, profiles(full_name), arenas(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as any[]).map((row, i) => {
      const createdAt = new Date(row.created_at)
      const diffMs = Date.now() - createdAt.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      const timeLabel =
        diffMin < 1 ? 'just now' :
        diffMin < 60 ? `${diffMin} min ago` :
        `${Math.floor(diffMin / 60)} hr ago`

      const action: 'booked' | 'cancelled' =
        row.status === 'cancelled' ? 'cancelled' : 'booked'

      return {
        id: row.id ?? `act-${i}`,
        playerName: row.profiles?.full_name ?? 'Someone',
        action,
        arenaName: row.arenas?.name ?? 'an arena',
        sport: 'Football' as import('../types').SportType,
        time: timeLabel,
      }
    })
  } catch (err) {
    console.error('fetchRecentActivity error:', err)
    return []
  }
}

/**
 * Fetches total revenue for a set of arenas (owner dashboard).
 */
export async function fetchOwnerRevenue(arenaIds: string[]): Promise<number> {
  if (!arenaIds.length) return 0
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('amount')
      .in('arena_id', arenaIds)
      .neq('status', 'cancelled')
    if (error || !data) return 0
    return (data as any[]).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  } catch (err) {
    console.error('fetchOwnerRevenue error:', err)
    return 0
  }
}

/**
 * Fetches real peak-hours data for a given arena from bookings.
 * Returns an array of { hour, occupancy, isPeak } for hours 6–23.
 */
export async function fetchArenaHourlyData(arenaId: string): Promise<import('../types').HourlyData[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_time')
      .eq('arena_id', arenaId)
      .neq('status', 'cancelled')

    if (error || !data) return []

    const counts: Record<number, number> = {}
    for (const row of data as any[]) {
      const hour = parseInt((row.start_time ?? '00:00').slice(0, 2), 10)
      counts[hour] = (counts[hour] ?? 0) + 1
    }

    const max = Math.max(1, ...Object.values(counts))
    return Array.from({ length: 18 }, (_, i) => {
      const hour = i + 6
      const isPeak = (hour >= 6 && hour < 10) || (hour >= 17 && hour < 22)
      const occupancy = Math.round(((counts[hour] ?? 0) / max) * 100)
      return { hour, occupancy, isPeak }
    })
  } catch (err) {
    console.error('fetchArenaHourlyData error:', err)
    return []
  }
}

/**
 * Fetches all cities from the cities table.
 * Returns an array of { id, name } objects.
 */
export async function fetchCities(): Promise<{ id: string; name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name')
      .order('name', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('fetchCities error:', err)
    return []
  }
}

/**
 * Uploads a profile picture for the given user and updates the profiles row.
 * Returns the new public URL or null on failure.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg'
    // Always use a fixed path per user so upsert works cleanly
    const path = `avatars/${userId}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return null
    }

    console.log('Avatar uploaded to:', uploadData?.path)

    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(path)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      console.error('Could not get public URL for avatar')
      return null
    }

    // Append cache-bust so browsers don't serve stale images
    const finalUrl = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: finalUrl })
      .eq('id', userId)

    if (dbError) {
      console.error('Failed to save avatar_url to profiles:', dbError)
      // Still return the URL — caller can try saving it themselves
    }

    return finalUrl
  } catch (err) {
    console.error('uploadAvatar error:', err)
    return null
  }
}

/**
 * Uploads an image for an arena and inserts / upserts it as the primary image
 * in the arena_images table. Returns the new public URL or null on failure.
 */
export async function uploadArenaImage(
  arenaId: string,
  file: File
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `arenas/${arenaId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('arena-images')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      console.error('Arena image upload error:', uploadError)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('arena-images')
      .getPublicUrl(path)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) return null

    // Insert as a new primary image row (sort_order 0, is_primary true)
    await supabase.from('arena_images').insert({
      arena_id: arenaId,
      url: publicUrl,
      alt_text: 'Arena photo',
      sort_order: 0,
      is_primary: true,
    })

    return publicUrl
  } catch (err) {
    console.error('uploadArenaImage error:', err)
    return null
  }
}
// Fallbacks for UI mapping if data is missing
const mockPricing = { weekday: 1500, weekend: 2000, peak: 2500 }
const mockAmenities = ['Parking', 'Floodlights', 'Water Cooler', 'Seating Area']
const mockHighlights = ['Good Quality', 'Popular']
const mockOperatingHours = { open: '06:00', close: '23:00' }
const mockImages = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
]

// Auth fetchers
export async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  try {
    let profile = await fetchProfileRecord(userId)
    if (!profile) {
      // Auto-create profile row if missing (safety fallback)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === userId) {
        const role = user.user_metadata?.role === 'owner' ? 'owner' : 'player'
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.email,
            full_name: name,
            role: role === 'player' ? 'customer' : 'owner',
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          })
          .select()
          .single()

        if (!error && newProfile) {
          profile = {
            id: newProfile.id,
            email: newProfile.email,
            fullName: newProfile.full_name,
            role: (newProfile.role === 'customer' ? 'player' : newProfile.role) as 'player' | 'owner',
            avatarUrl: newProfile.avatar_url || undefined,
          }
        }
      }
    }

    if (!profile) return null

    let arenaIds: string[] = []
    if (profile.role === 'owner') {
      const { data: arenas } = await supabase
        .from('arenas')
        .select('id')
        .eq('owner_id', userId)
      if (arenas) {
        arenaIds = arenas.map((a: any) => a.id)
      }
    }

    return {
      id: profile.id,
      name: profile.fullName || 'User',
      email: profile.email,
      role: profile.role,
      avatar: profile.avatarUrl || undefined,
      arenaIds: profile.role === 'owner' ? arenaIds : undefined,
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function fetchProfileRecord(userId: string): Promise<ProfileRecord | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, cities(name)')
      .eq('id', userId)
      .single()

    if (error || !profile) return null

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name || 'User',
      avatarUrl: profile.avatar_url || undefined,
      phone: profile.phone || undefined,
      role: profile.role === 'customer' ? 'player' : (profile.role as 'player' | 'owner'),
      cityId: profile.city_id || undefined,
      cityName: profile.cities?.name || undefined,
    }
  } catch (error) {
    console.error('Error fetching profile record:', error)
    return null
  }
}

// Data fetchers for Arenas
export async function fetchArenas(): Promise<Arena[]> {
  try {
    const { data, error } = await supabase
      .from('arenas')
      .select(`
        *,
        cities (name),
        arena_images (url, alt_text, sort_order, is_primary)
      `)

    if (error) {
      console.error('Error fetching arenas:', error)
      return []
    }

    return (data || []).map((row: any) => mapArenaRow(row))
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchArenaBySlug(slug: string): Promise<Arena | undefined> {
  try {
    const { data, error } = await supabase
      .from('arenas')
      .select(`
        *,
        cities (name),
        arena_images (url, alt_text, sort_order, is_primary)
      `)
      .eq('slug', slug)
      .single()

    if (error || !data) return undefined
    return mapArenaRow(data)
  } catch (err) {
    console.error(err)
    return undefined
  }
}

export async function fetchArenaById(id: string): Promise<Arena | undefined> {
  try {
    const { data, error } = await supabase
      .from('arenas')
      .select(`
        *,
        cities (name),
        arena_images (url, alt_text, sort_order, is_primary)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return undefined
    return mapArenaRow(data)
  } catch (err) {
    console.error(err)
    return undefined
  }
}

// Helper to map DB row to expected Arena type
function mapArenaRow(row: any): Arena {
  const images = Array.isArray(row.arena_images)
    ? [...row.arena_images]
        .sort((a: any, b: any) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((image: any) => image.url)
        .filter(Boolean)
    : []

  if (images.length === 0) images.push(...mockImages)

  const weekdayPrice = Number(row.weekday_price ?? mockPricing.weekday)
  const weekendPrice = Number(row.weekend_price ?? mockPricing.weekend)
  const peakPrice = Number(row.peak_price ?? mockPricing.peak)
  const openTime = row.open_time ? String(row.open_time).slice(0, 5) : mockOperatingHours.open
  const closeTime = row.close_time ? String(row.close_time).slice(0, 5) : mockOperatingHours.close
  const bookingCount = Number(row.total_bookings ?? 0)
  const rating = Number(row.average_rating ?? 0)
  const reviewCount = Number(row.review_count ?? 0)

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sport: 'Football', // Fallback as arenas table doesn't have sport directly
    location: {
      city: row.cities?.name || 'Unknown',
      area: row.area || row.address || 'Unknown Area',
      address: row.address || 'Unknown Address',
      coordinates: { lat: Number(row.latitude) || 0, lng: Number(row.longitude) || 0 },
    },
    images,
    pricing: {
      weekday: weekdayPrice,
      weekend: weekendPrice,
      peak: peakPrice,
    },
    rating: rating || 0,
    reviewCount,
    totalBookings: bookingCount,
    occupancyRate: bookingCount > 0 ? Math.min(95, Math.max(20, Math.round(bookingCount / 2))) : 68,
    amenities: mockAmenities,
    description: row.description || '',
    highlights: mockHighlights,
    operatingHours: {
      open: openTime,
      close: closeTime,
    },
    isPopular: Boolean(row.is_popular),
    isFeatured: Boolean(row.is_featured),
  }
}

// Bookings
export async function fetchPlayerBookings(playerId: string, page = 1, pageSize = 20): Promise<{ bookings: Booking[]; total: number }> {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('customer_id', playerId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching player bookings:', error)
      return { bookings: [], total: 0 }
    }
    if (!data) return { bookings: [], total: 0 }
    return {
      bookings: data.map(mapBookingRow),
      total: count || 0
    }
  } catch (err) {
    console.error('Unexpected error fetching player bookings:', err)
    return { bookings: [], total: 0 }
  }
}

export async function fetchArenaBookings(arenaId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('arena_id', arenaId)

    if (error) {
      console.error('Error fetching arena bookings:', error)
      return []
    }
    if (!data) return []
    return data.map(mapBookingRow)
  } catch (err) {
    console.error('Unexpected error fetching arena bookings:', err)
    return []
  }
}

function mapBookingRow(row: any): Booking {
  return {
    id: row.id,
    arenaId: row.arena_id,
    playerId: row.customer_id,
    slotId: row.slot_id ?? undefined,
    courtId: row.court_id ?? undefined,
    timeSlotId: row.time_slot_id ?? undefined,
    sportId: row.sport_id ?? undefined,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as any,
    price: row.amount,
    amountPaid: row.amount,
    bookedAt: row.created_at ?? undefined,
  }
}

// Reviews
export async function fetchTopReviews(limit = 10, minRating = 4.5): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url), arenas(name)')
      .eq('is_visible', true)
      .gte('rating', minRating)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((r: any) => ({
      id: r.id,
      arenaId: r.arena_id,
      playerId: r.customer_id,
      rating: r.rating,
      comment: r.comment,
      date: r.created_at,
      playerName: r.profiles?.full_name || 'Anonymous',
      playerAvatar: r.profiles?.avatar_url || undefined,
      sport: 'Football' as import('../types').SportType,
      arenaName: r.arenas?.name || undefined,
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchReviewsForArena(arenaId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('arena_id', arenaId)
      .eq('is_visible', true)

    if (error || !data) return []
    return data.map((r: any) => ({
      id: r.id,
      arenaId: r.arena_id,
      playerId: r.customer_id,
      rating: r.rating,
      comment: r.comment,
      date: r.created_at,
      playerName: r.profiles?.full_name || 'Anonymous',
      playerAvatar: r.profiles?.avatar_url || undefined,
      sport: 'Football',
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchAverageRating(arenaId: string): Promise<{ rating: number, count: number }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('arena_id', arenaId)
      .eq('is_visible', true)

    if (error || !data || data.length === 0) return { rating: 0, count: 0 }
    
    const sum = data.reduce((acc: number, r: any) => acc + r.rating, 0)
    return { rating: Math.round((sum / data.length) * 10) / 10, count: data.length }
  } catch (err) {
    console.error(err)
    return { rating: 0, count: 0 }
  }
}

export async function fetchSlotsForArenaDate(arenaId: string, dateStr: string): Promise<TimeSlot[]> {
  try {
    // Fetch slots and existing confirmed bookings for this arena+date in parallel
    const [slotsResult, bookingsResult] = await Promise.all([
      supabase
        .from('time_slots')
        .select('*, courts!inner(arena_id, sport_id)')
        .eq('courts.arena_id', arenaId)
        .eq('date', dateStr),
      supabase
        .from('bookings')
        .select('time_slot_id')
        .eq('arena_id', arenaId)
        .eq('date', dateStr)
        .eq('status', 'confirmed'),
    ])

    if (slotsResult.error || !slotsResult.data) return []

    // Build a set of slot IDs that are already booked in the bookings table
    // This is the ground truth — the time_slots.status update can lag or be blocked by RLS
    const bookedSlotIds = new Set(
      (bookingsResult.data ?? []).map((b: any) => b.time_slot_id).filter(Boolean)
    )

    return slotsResult.data.map((row: any) => {
      // A slot is booked if the bookings table says so OR the time_slots row itself says so
      const isBooked = bookedSlotIds.has(row.id) || row.status === 'booked'

      return {
        id: row.id,
        arenaId: arenaId,
        courtId: row.court_id,
        sportId: row.courts?.sport_id ?? undefined,
        date: row.date,
        startTime: row.start_time.substring(0, 5),
        endTime: row.end_time.substring(0, 5),
        price: row.price,
        status: (isBooked ? 'booked' : row.status) as 'available' | 'booked' | 'unavailable',
        isPeak: Boolean(row.is_peak),
      }
    })
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function createSupabaseBooking(params: {
  playerId: string
  arenaId: string
  slotId: string
  courtId: string
  sportId?: string
  date: string
  startTime: string
  endTime: string
  price: number
}): Promise<{ success: boolean; bookingId?: string; reference?: string; error?: string }> {
  try {
    // Generate a unique reference before inserting so the NOT NULL constraint is satisfied
    const year = new Date().getFullYear()
    const reference = `ARG-${year}-${String(Math.floor(Math.random() * 900000) + 100000)}`

    const { data: bookingData, error: insertError } = await supabase
      .from('bookings')
      .insert({
        customer_id: params.playerId,
        arena_id: params.arenaId,
        court_id: params.courtId,
        sport_id: params.sportId ?? null,
        time_slot_id: params.slotId,
        date: params.date,
        start_time: params.startTime + ':00',
        end_time: params.endTime + ':00',
        amount: params.price,
        status: 'confirmed',
        reference,
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    const { error: updateError } = await supabase
      .from('time_slots')
      .update({ status: 'booked' })
      .eq('id', params.slotId)

    if (updateError) {
      console.error('Failed to update slot status:', updateError)
    }

    return { success: true, bookingId: bookingData?.id, reference }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function cancelSupabaseBooking(bookingId: string, slotId?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
    
    if (error) return false

    if (slotId) {
      await supabase
        .from('time_slots')
        .update({ status: 'available' })
        .eq('id', slotId)
    }

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export async function fetchFavoritesForUser(userId: string): Promise<Arena[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('arena_id, created_at')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return []
    }
    if (!data) return []

    const arenaIds = [...new Set((data as any[]).map((item) => item.arena_id))]
    const arenas = await Promise.all(arenaIds.map((id) => fetchArenaById(id)))
    return arenas.filter((arena): arena is Arena => Boolean(arena))
  } catch (err) {
    console.error('Unexpected error fetching favorites:', err)
    return []
  }
}

export async function isFavorited(userId: string, arenaId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('arena_id')
      .eq('customer_id', userId)
      .eq('arena_id', arenaId)
      .maybeSingle()
    if (error) console.error('isFavorited error:', error.message)
    return Boolean(data)
  } catch (err) {
    console.error('isFavorited exception:', err)
    return false
  }
}

export async function addFavorite(userId: string, arenaId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .insert({ customer_id: userId, arena_id: arenaId })
    if (error) {
      console.error('addFavorite error:', error.message, error.code, error.details)
      return false
    }
    return true
  } catch (err) {
    console.error('addFavorite exception:', err)
    return false
  }
}

export async function removeFavorite(userId: string, arenaId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('customer_id', userId)
      .eq('arena_id', arenaId)
    if (error) {
      console.error('removeFavorite error:', error.message, error.code, error.details)
      return false
    }
    return true
  } catch (err) {
    console.error('removeFavorite exception:', err)
    return false
  }
}

export async function fetchNotificationsForUser(userId: string): Promise<NotificationRecord[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      link: row.link,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchOwnerRecord(profileId: string): Promise<OwnerRecord | null> {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('profile_id', profileId)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      profileId: data.profile_id,
      businessName: data.business_name,
      businessPhone: data.business_phone,
      businessEmail: data.business_email,
      cnic: data.cnic,
      status: data.status,
    }
  } catch (err) {
    console.error(err)
    return null
  }
}

type PromotionWithArena = PromotionRecord & { arena?: Arena }

export async function fetchActivePromotions(): Promise<PromotionWithArena[]> {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('expires_at', { ascending: true })

    if (error || !data) return []

    const rows = data as any[]
    const arenas = await Promise.all(rows.map((row) => fetchArenaById(row.arena_id)))

    return rows.map((row, index) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      promotionType: row.promotion_type,
      value: Number(row.value ?? 0),
      arenaId: row.arena_id,
      minAmount: Number(row.min_amount ?? 0),
      maxUses: row.max_uses,
      usedCount: Number(row.used_count ?? 0),
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
      isActive: Boolean(row.is_active),
      arena: arenas[index] ?? undefined,
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

// Slot availability management
export async function fetchBlockedSlots(arenaId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('blocked_slots')
      .select('slot_key')
      .eq('arena_id', arenaId)

    if (error) {
      console.error('Error fetching blocked slots:', error)
      return []
    }
    if (!data) return []
    return data.map((row: any) => row.slot_key)
  } catch (err) {
    console.error('Unexpected error fetching blocked slots:', err)
    return []
  }
}

export async function setBlockedSlot(arenaId: string, slotKey: string, blocked: boolean): Promise<boolean> {
  try {
    if (blocked) {
      const { error } = await supabase
        .from('blocked_slots')
        .insert({ arena_id: arenaId, slot_key: slotKey })
      if (error) {
        console.error('Error blocking slot:', error)
        return false
      }
    } else {
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('arena_id', arenaId)
        .eq('slot_key', slotKey)
      if (error) {
        console.error('Error unblocking slot:', error)
        return false
      }
    }
    return true
  } catch (err) {
    console.error('Unexpected error setting blocked slot:', err)
    return false
  }
}

// Analytics functions
export async function fetchOwnerAnalytics(arenaIds: string[]) {
  try {
    if (arenaIds.length === 0) {
      return {
        totalBookings: 0,
        totalRevenue: 0,
        averageOccupancy: 0,
        popularSports: [],
        monthlyRevenue: [],
      }
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .in('arena_id', arenaIds)
      .eq('status', 'completed')

    if (error) {
      console.error('Error fetching analytics:', error)
      return {
        totalBookings: 0,
        totalRevenue: 0,
        averageOccupancy: 0,
        popularSports: [],
        monthlyRevenue: [],
      }
    }

    if (!bookings) {
      return {
        totalBookings: 0,
        totalRevenue: 0,
        averageOccupancy: 0,
        popularSports: [],
        monthlyRevenue: [],
      }
    }

    const totalBookings = bookings.length
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)

    // Calculate popular sports
    const sportCounts: Record<string, number> = {}
    bookings.forEach((b) => {
      const sport = b.sport_id || 'Unknown'
      sportCounts[sport] = (sportCounts[sport] || 0) + 1
    })
    const popularSports = Object.entries(sportCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sport, count]) => ({ sport, count }))

    // Calculate monthly revenue
    const monthlyRevenue: Record<string, number> = {}
    bookings.forEach((b) => {
      const month = b.date?.substring(0, 7) || new Date().toISOString().substring(0, 7)
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (b.total_price || 0)
    })
    const monthlyRevenueArray = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalBookings,
      totalRevenue,
      averageOccupancy: totalBookings > 0 ? 0.65 : 0, // Simplified calculation
      popularSports,
      monthlyRevenue: monthlyRevenueArray,
    }
  } catch (err) {
    console.error('Unexpected error fetching analytics:', err)
    return {
      totalBookings: 0,
      totalRevenue: 0,
      averageOccupancy: 0,
      popularSports: [],
      monthlyRevenue: [],
    }
  }
}
