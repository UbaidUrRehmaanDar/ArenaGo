import type { OwnerAnalytics } from '../types'

export const ownerAnalytics: OwnerAnalytics[] = [
  {
    arenaId: 'arena-1',
    revenue: {
      thisMonth: 485000,
      lastMonth: 412000,
      thisWeek: 124000,
      trend: [
        { month: 'Dec', amount: 320000 },
        { month: 'Jan', amount: 365000 },
        { month: 'Feb', amount: 398000 },
        { month: 'Mar', amount: 412000 },
        { month: 'Apr', amount: 445000 },
        { month: 'May', amount: 485000 },
      ],
    },
    bookings: {
      total: 1847,
      thisMonth: 142,
      completionRate: 94,
      trend: [
        { date: 'Mon', count: 18 },
        { date: 'Tue', count: 15 },
        { date: 'Wed', count: 20 },
        { date: 'Thu', count: 22 },
        { date: 'Fri', count: 35 },
        { date: 'Sat', count: 42 },
        { date: 'Sun', count: 38 },
      ],
    },
    peakHours: Array.from({ length: 18 }, (_, i) => {
      const hour = i + 6
      const peak = (hour >= 6 && hour < 10) || (hour >= 17 && hour < 22)
      const base = peak ? 65 + Math.sin(hour) * 25 : 20 + Math.cos(hour) * 15
      return { hour, occupancy: Math.min(98, Math.round(base)), isPeak: peak }
    }),
    sportBreakdown: [
      { sport: 'Football', percentage: 78, bookings: 1441 },
      { sport: 'Futsal', percentage: 22, bookings: 406 },
    ],
    occupancy: { rate: 87, weekdayAvg: 72, weekendAvg: 94 },
  },
  {
    arenaId: 'arena-5',
    revenue: {
      thisMonth: 312000,
      lastMonth: 298000,
      thisWeek: 89000,
      trend: [
        { month: 'Dec', amount: 245000 },
        { month: 'Jan', amount: 268000 },
        { month: 'Feb', amount: 285000 },
        { month: 'Mar', amount: 298000 },
        { month: 'Apr', amount: 305000 },
        { month: 'May', amount: 312000 },
      ],
    },
    bookings: {
      total: 2891,
      thisMonth: 198,
      completionRate: 96,
      trend: [
        { date: 'Mon', count: 28 },
        { date: 'Tue', count: 25 },
        { date: 'Wed', count: 30 },
        { date: 'Thu', count: 32 },
        { date: 'Fri', count: 38 },
        { date: 'Sat', count: 45 },
        { date: 'Sun', count: 40 },
      ],
    },
    peakHours: Array.from({ length: 18 }, (_, i) => {
      const hour = i + 6
      const peak = (hour >= 6 && hour < 10) || (hour >= 17 && hour < 22)
      const base = peak ? 70 + Math.sin(hour * 0.8) * 28 : 25 + Math.cos(hour) * 12
      return { hour, occupancy: Math.min(99, Math.round(base)), isPeak: peak }
    }),
    sportBreakdown: [{ sport: 'Badminton', percentage: 100, bookings: 2891 }],
    occupancy: { rate: 91, weekdayAvg: 85, weekendAvg: 97 },
  },
]

export function getAnalyticsForOwner(arenaIds: string[]): OwnerAnalytics[] {
  return ownerAnalytics.filter((a) => arenaIds.includes(a.arenaId))
}

export const heatmapData: number[][] = [
  [0.2, 0.3, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 0.85, 0.9],
  [0.15, 0.25, 0.45, 0.35, 0.25, 0.15, 0.1, 0.08, 0.08, 0.12, 0.18, 0.28, 0.38, 0.48, 0.65, 0.8, 0.88],
  [0.18, 0.28, 0.48, 0.38, 0.28, 0.18, 0.12, 0.1, 0.1, 0.14, 0.2, 0.32, 0.42, 0.52, 0.68, 0.82, 0.92],
  [0.22, 0.32, 0.52, 0.42, 0.32, 0.22, 0.14, 0.12, 0.12, 0.16, 0.22, 0.35, 0.45, 0.55, 0.72, 0.88, 0.95],
  [0.25, 0.35, 0.55, 0.45, 0.35, 0.25, 0.16, 0.14, 0.14, 0.18, 0.25, 0.38, 0.48, 0.58, 0.75, 0.9, 0.98],
  [0.35, 0.45, 0.65, 0.55, 0.45, 0.35, 0.2, 0.15, 0.15, 0.22, 0.35, 0.5, 0.65, 0.75, 0.88, 0.95, 1.0],
  [0.4, 0.5, 0.7, 0.6, 0.5, 0.4, 0.25, 0.18, 0.18, 0.28, 0.42, 0.58, 0.72, 0.82, 0.92, 0.98, 1.0],
]

export const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const HEATMAP_HOURS = Array.from({ length: 17 }, (_, i) => i + 6)
