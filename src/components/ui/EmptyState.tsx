import { Search, Calendar, MapPin, Trophy } from 'lucide-react'
import { BtnLink } from './Btn'

interface EmptyStateProps {
  type: 'no-results' | 'no-bookings' | 'no-favorites' | 'no-arenas'
  action?: {
    label: string
    to: string
  }
}

const EMPTY_STATES = {
  'no-results': {
    icon: Search,
    title: 'No arenas found',
    description: 'Try adjusting your filters or search for something else',
  },
  'no-bookings': {
    icon: Calendar,
    title: 'No bookings yet',
    description: 'Your first game is waiting. Find an arena and book your slot.',
  },
  'no-favorites': {
    icon: MapPin,
    title: 'No favorites yet',
    description: 'Save arenas you love to quickly find them later.',
  },
  'no-arenas': {
    icon: Trophy,
    title: 'No arenas available',
    description: 'Check back later - new arenas are being added regularly.',
  },
}

export function EmptyState({ type, action }: EmptyStateProps) {
  const config = EMPTY_STATES[type]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate border border-line flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-mist" />
      </div>
      <h3 className="font-display text-2xl text-chalk mb-2">{config.title}</h3>
      <p className="text-mist text-sm max-w-md mb-6">{config.description}</p>
      {action && (
        <BtnLink to={action.to} className="px-6 py-3">
          {action.label}
        </BtnLink>
      )}
    </div>
  )
}
