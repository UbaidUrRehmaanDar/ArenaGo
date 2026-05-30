import type { Review } from '../../types'
import { SportTag } from './SportTag'
import { getArenaById } from '../../data/arenas'
import { format, parseISO } from 'date-fns'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const arena = getArenaById(review.arenaId)
  return (
    <div className="bg-slate p-5 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-body text-chalk">{review.playerName}</span>
          <SportTag sport={review.sport} size="sm" />
        </div>
        <span className="font-mono text-lime text-sm">{review.rating}</span>
      </div>
      <p className="text-[15px] text-chalk/90 leading-relaxed">{review.comment}</p>
      <p className="font-mono text-xs text-mist mt-3">
        {arena?.name} · {format(parseISO(review.date), 'd MMM yyyy')}
      </p>
    </div>
  )
}
