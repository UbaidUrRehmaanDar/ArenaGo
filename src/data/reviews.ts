import type { Review } from '../types'

export const reviews: Review[] = [
  {
    id: 'rev-1',
    arenaId: 'arena-1',
    playerId: 'player-2',
    playerName: 'Ahmed Khan',
    rating: 4.9,
    comment:
      'Turf was in excellent shape, the floodlights are bright enough for night matches. Parking can get tight on Friday evenings but staff manage it well.',
    date: '2025-04-12',
    sport: 'Football',
  },
  {
    id: 'rev-2',
    arenaId: 'arena-1',
    playerId: 'player-3',
    playerName: 'Usman Ali',
    rating: 4.7,
    comment:
      'Booked for our office league every Thursday. Consistent quality, no surprises. Changing rooms could use better ventilation.',
    date: '2025-03-28',
    sport: 'Football',
  },
  {
    id: 'rev-3',
    arenaId: 'arena-1',
    playerId: 'player-4',
    playerName: 'Bilal Hussain',
    rating: 4.8,
    comment: 'Best 5-a-side turf in DHA. Worth the peak hour price on weekends.',
    date: '2025-02-15',
    sport: 'Football',
  },
  {
    id: 'rev-4',
    arenaId: 'arena-2',
    playerId: 'player-5',
    playerName: 'Sara Malik',
    rating: 4.6,
    comment:
      'Great introduction to padel. Courts are well maintained. Racket rental quality varies — bring your own if you are serious.',
    date: '2025-04-01',
    sport: 'Padel',
  },
  {
    id: 'rev-5',
    arenaId: 'arena-2',
    playerId: 'player-6',
    playerName: 'Faisal Iqbal',
    rating: 4.5,
    comment: 'First padel club in Gulberg. Booking through ArenaGo saved us the WhatsApp back-and-forth.',
    date: '2025-03-10',
    sport: 'Padel',
  },
  {
    id: 'rev-6',
    arenaId: 'arena-3',
    playerId: 'player-7',
    playerName: 'Hamza Siddiqui',
    rating: 4.5,
    comment:
      'Nets are properly maintained. Tape-ball sessions are affordable. Gets crowded after Maghrib on weekdays.',
    date: '2025-04-05',
    sport: 'Cricket',
  },
  {
    id: 'rev-7',
    arenaId: 'arena-3',
    playerId: 'player-8',
    playerName: 'Omar Farooq',
    rating: 4.4,
    comment: 'Solid nets for practice. Location in Model Town is convenient. Spectator area is basic but functional.',
    date: '2025-01-22',
    sport: 'Cricket',
  },
  {
    id: 'rev-8',
    arenaId: 'arena-4',
    playerId: 'player-9',
    playerName: 'Zainab Ahmed',
    rating: 4.4,
    comment:
      'Courts are well lit for evening sessions. Surface grip is good. Great spot in Gulberg for a quick game.',
    date: '2025-03-18',
    sport: 'Basketball',
  },
  {
    id: 'rev-9',
    arenaId: 'arena-5',
    playerId: 'player-10',
    playerName: 'Danish Rauf',
    rating: 4.8,
    comment:
      'Air conditioning makes a huge difference in Lahore summers. Courts are tournament standard. Book early for 7 PM slots.',
    date: '2025-04-20',
    sport: 'Badminton',
  },
  {
    id: 'rev-10',
    arenaId: 'arena-5',
    playerId: 'player-11',
    playerName: 'Ayesha Tariq',
    rating: 4.9,
    comment:
      'Best badminton facility in Johar Town. Wooden floors, proper nets. Morning coaching slots are excellent value.',
    date: '2025-02-28',
    sport: 'Badminton',
  },
  {
    id: 'rev-11',
    arenaId: 'arena-5',
    playerId: 'player-12',
    playerName: 'Imran Qureshi',
    rating: 4.7,
    comment: 'Six courts mean you rarely wait. Peak occupancy is real — the 87% stat on the site is accurate.',
    date: '2025-01-10',
    sport: 'Badminton',
  },
  {
    id: 'rev-12',
    arenaId: 'arena-6',
    playerId: 'player-13',
    playerName: 'Nadia Hassan',
    rating: 5.0,
    comment:
      'Clay court plays beautifully. Staff are professional. DHA Phase 6 location is easy to reach.',
    date: '2025-04-08',
    sport: 'Tennis',
  },
  {
    id: 'rev-13',
    arenaId: 'arena-6',
    playerId: 'player-14',
    playerName: 'Kamran Shah',
    rating: 4.8,
    comment: 'Hard court option is well maintained. Ball machine rental works smoothly. Worth the weekday rate.',
    date: '2025-03-02',
    sport: 'Tennis',
  },
  {
    id: 'rev-14',
    arenaId: 'arena-7',
    playerId: 'player-15',
    playerName: 'Rashid Mehmood',
    rating: 4.3,
    comment:
      'Indoor futsal saved our league during monsoon. Flooring has good bounce. Easy to find in Johar Town.',
    date: '2025-02-14',
    sport: 'Football',
  },
  {
    id: 'rev-15',
    arenaId: 'arena-8',
    playerId: 'player-16',
    playerName: 'Tariq Jamil',
    rating: 4.2,
    comment:
      'Good value for Bahria Town Lahore residents. Nets need resurfacing more often. Academy programs on weekends are well run.',
    date: '2025-01-30',
    sport: 'Cricket',
  },
]

export function getReviewsForArena(arenaId: string): Review[] {
  return reviews.filter((r) => r.arenaId === arenaId)
}

export function getFeaturedReview(): Review {
  return reviews.find((r) => r.rating >= 4.8) ?? reviews[0]
}
