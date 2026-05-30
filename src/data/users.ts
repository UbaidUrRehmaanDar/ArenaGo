import type { Owner, Player } from '../types'

export const demoPlayer: Player = {
  id: 'player-1',
  name: 'Hassan Raza',
  email: 'player@arenago.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  joinedDate: '2024-03-15',
  favoriteArenas: ['arena-1', 'arena-5', 'arena-2'],
  totalBookings: 14,
  sport: 'Football',
  badges: [
    { id: 'early-bird', name: 'EARLY BIRD', description: 'Booked a 6 AM or 7 AM slot', earned: true },
    { id: 'weekend-warrior', name: 'WEEKEND WARRIOR', description: 'Booked on Saturday or Sunday', earned: true },
    { id: 'explorer', name: 'EXPLORER', description: 'Booked arenas in 2+ different areas', earned: true },
    { id: 'regular', name: 'REGULAR', description: '5+ bookings total', earned: true },
    { id: 'night-owl', name: 'NIGHT OWL', description: 'Booked after 9 PM', earned: false },
  ],
}

export const demoOwner: Owner = {
  id: 'owner-1',
  name: 'Adeel Malik',
  email: 'owner@arenago.com',
  arenaIds: ['arena-1', 'arena-5'],
  totalRevenue: 2847500,
}

export const DEMO_CREDENTIALS = {
  player: { email: 'player@arenago.com', password: 'play123' },
  owner: { email: 'owner@arenago.com', password: 'own123' },
}
