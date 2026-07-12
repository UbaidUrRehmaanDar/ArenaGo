export type SportType =
  | 'Football'
  | 'Cricket'
  | 'Badminton'
  | 'Basketball'
  | 'Tennis'
  | 'Padel'
  | 'Futsal'
  | 'Squash'

export type SlotStatus = 'available' | 'booked' | 'pending' | 'blocked'

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed'

export type UserRole = 'player' | 'owner'

export interface Arena {
  id: string
  name: string
  slug: string
  sport: SportType
  location: {
    city: string
    area: string
    address: string
    coordinates: { lat: number; lng: number }
  }
  images: string[]
  pricing: {
    weekday: number
    weekend: number
    peak: number
  }
  rating: number
  reviewCount: number
  totalBookings: number
  occupancyRate: number
  amenities: string[]
  description: string
  highlights: string[]
  operatingHours: { open: string; close: string }
  isPopular: boolean
  isFeatured: boolean
}

export interface Slot {
  id: string
  arenaId: string
  courtId?: string
  date: string
  startTime: string
  endTime: string
  status: SlotStatus | 'unavailable'
  price: number
  isPeak: boolean
}

export interface TimeSlot extends Slot {}

export interface Badge {
  id: string
  name: string
  description: string
  earned: boolean
}

export interface Player {
  id: string
  name: string
  email: string
  avatar: string
  joinedDate: string
  favoriteArenas: string[]
  totalBookings: number
  sport: SportType
  badges: Badge[]
}

export interface Owner {
  id: string
  name: string
  email: string
  arenaIds: string[]
  totalRevenue: number
}

export interface Booking {
  id: string
  playerId: string
  arenaId: string
  slotId?: string
  courtId?: string
  timeSlotId?: string
  sportId?: string
  date: string
  startTime: string
  endTime: string
  sport?: SportType
  amountPaid?: number
  price?: number
  status: BookingStatus
  bookedAt?: string
}

export interface Review {
  id: string
  arenaId: string
  playerId: string
  playerName: string
  playerAvatar?: string
  rating: number
  comment: string
  date: string
  sport: SportType
  arenaName?: string
}

export interface ProfileRecord {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  phone?: string
  role: UserRole
  cityId?: string
  cityName?: string
}

export interface FavoriteRecord {
  customerId: string
  arenaId: string
  createdAt: string
}

export interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

export interface PromotionRecord {
  id: string
  code: string
  title: string
  description: string
  promotionType?: string
  value: number
  arenaId: string
  minAmount: number
  maxUses?: number | null
  usedCount: number
  startsAt: string
  expiresAt: string
  isActive: boolean
}

export interface OwnerRecord {
  id: string
  profileId: string
  businessName: string
  businessPhone?: string | null
  businessEmail?: string | null
  cnic?: string | null
  status: string
}

export interface MonthlyRevenue {
  month: string
  amount: number
}

export interface DailyBookings {
  date: string
  count: number
}

export interface HourlyData {
  hour: number
  occupancy: number
  isPeak: boolean
}

export interface SportBreakdown {
  sport: SportType
  percentage: number
  bookings: number
}

export interface OwnerAnalytics {
  arenaId: string
  revenue: {
    thisMonth: number
    lastMonth: number
    thisWeek: number
    trend: MonthlyRevenue[]
  }
  bookings: {
    total: number
    thisMonth: number
    completionRate: number
    trend: DailyBookings[]
  }
  peakHours: HourlyData[]
  sportBreakdown: SportBreakdown[]
  occupancy: {
    rate: number
    weekdayAvg: number
    weekendAvg: number
  }
}

export interface ActivityItem {
  id: string
  playerName: string
  action: 'booked' | 'reviewed' | 'cancelled'
  arenaName: string
  sport: SportType
  time: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  arenaIds?: string[]
}

// Community types
export type PostType = 'general' | 'announcement' | 'tournament'

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorRole: UserRole
  caption: string
  postType: PostType
  images: string[]
  createdAt: string
  updatedAt: string
  likeCount: number
  commentCount: number
  isDeleted: boolean
  isLikedByCurrentUser?: boolean
}

export interface PostImage {
  id: string
  postId: string
  imageUrl: string
  altText?: string
  sortOrder: number
  createdAt: string
}

export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorRole: UserRole
  content: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export interface CommunityLike {
  id: string
  postId: string
  userId: string
  createdAt: string
}

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface CommunityReport {
  id: string
  postId: string
  reporterId: string
  reason: string
  status: ReportStatus
  createdAt: string
}

export type CommunityFilter = 'latest' | 'popular' | 'players' | 'arenas' | 'tournaments'
