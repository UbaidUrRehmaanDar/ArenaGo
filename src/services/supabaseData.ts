import { supabase } from '../lib/supabase'
import type { Arena, AuthUser, Booking, Review, TimeSlot } from '../types'
import { demoOwner, demoPlayer } from '../data/users'

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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) return null

    let arenaIds: string[] = []
    if (profile.role === 'owner') {
      const { data: arenas } = await supabase
        .from('arenas')
        .select('id')
        .eq('owner_id', userId) // Assuming owner_id is profile.id, adjust if it uses owners table
      if (arenas) {
        arenaIds = arenas.map((a: any) => a.id)
      }
    }

    return {
      id: profile.id,
      name: profile.full_name || 'User',
      email: profile.email,
      role: profile.role as 'player' | 'owner' | 'admin',
      avatar: profile.avatar_url || undefined,
      arenaIds: profile.role === 'owner' ? arenaIds : undefined,
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
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
        cities (name)
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
      .select('*, cities (name)')
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
      .select('*, cities (name)')
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
  const images = []
  if (row.cover_image) images.push(row.cover_image)
  if (row.gallery && Array.isArray(row.gallery)) images.push(...row.gallery)
  if (images.length === 0) images.push(...mockImages)

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
    pricing: mockPricing,
    rating: 4.5, // Mocked until reviews are fetched/aggregated
    reviewCount: 0,
    totalBookings: 0,
    occupancyRate: 75,
    amenities: mockAmenities,
    description: row.description || '',
    highlights: mockHighlights,
    operatingHours: mockOperatingHours,
    isPopular: true, // Mocked for UI
    isFeatured: true, // Mocked for UI
  }
}

// Bookings
export async function fetchPlayerBookings(playerId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', playerId)

    if (error || !data) return []
    return data.map(mapBookingRow)
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchArenaBookings(arenaId: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('arena_id', arenaId)

    if (error || !data) return []
    return data.map(mapBookingRow)
  } catch (err) {
    console.error(err)
    return []
  }
}

function mapBookingRow(row: any): Booking {
  return {
    id: row.id,
    arenaId: row.arena_id,
    playerId: row.customer_id,
    courtId: row.court_id,
    sportId: row.sport_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as any,
    price: row.amount,
  }
}

// Reviews
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
    const { data, error } = await supabase
      .from('time_slots')
      .select('*, courts!inner(arena_id)')
      .eq('courts.arena_id', arenaId)
      .eq('date', dateStr)

    if (error || !data) return []

    return data.map((row: any) => ({
      id: row.id,
      arenaId: arenaId,
      startTime: row.start_time.substring(0, 5), // e.g. "18:00:00" -> "18:00"
      price: row.price,
      status: row.status as 'available' | 'booked' | 'unavailable',
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}
