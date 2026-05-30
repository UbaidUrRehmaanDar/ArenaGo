import { format, parseISO, isWeekend } from 'date-fns'

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, d MMM yyyy')
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function getSlotPrice(
  weekday: number,
  weekend: number,
  peak: number,
  date: string,
  isPeak: boolean
): number {
  if (isPeak) return peak
  if (isWeekend(parseISO(date))) return weekend
  return weekday
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
