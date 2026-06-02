import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Arena } from '../../types'
import { SportTag } from './SportTag'
import { OccupancyBar } from './OccupancyBar'
import { BtnLink, BtnMorphLabel } from './Btn'
import { formatPKR } from '../../utils/formatters'
import { cn } from '../../utils/formatters'

interface ArenaCardProps {
  arena: Arena
  variant?: 'listing' | 'carousel' | 'trending'
  className?: string
}

function TrendingArenaCard({ arena, className }: { arena: Arena; className?: string }) {
  return (
    <Link
      to={`/arenas/${arena.slug}`}
      className={cn(
        'flex-shrink-0 w-[350px] h-[200px] relative rounded-sm overflow-hidden group',
        'hover:-translate-y-1 transition-transform duration-200 hover:shadow-[0_8px_24px_rgba(200,255,0,0.08)]',
        className
      )}
    >
      <img
        src={arena.images[0]}
        alt={arena.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ground via-ground/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SportTag sport={arena.sport} size="sm" />
          <h3 className="font-display text-xl text-chalk mt-1 leading-tight line-clamp-2">
            {arena.name}
          </h3>
        </div>
        <BtnMorphLabel variant="primary" className="text-sm px-4 py-2 shrink-0 whitespace-nowrap">
          Book Now
        </BtnMorphLabel>
      </div>
    </Link>
  )
}

export function ArenaCard({ arena, variant = 'listing', className }: ArenaCardProps) {
  if (variant === 'trending') {
    return (
      <TrendingArenaCard arena={arena} className={className} />
    )
  }

  if (variant === 'carousel') {
    const occColor = arena.occupancyRate > 70 ? 'text-amber' : 'text-lime'
    return (
      <div
        className={cn(
          'flex flex-col w-full rounded-sm overflow-hidden bg-slate h-full',
          className
        )}
      >
        <div className="relative h-[220px] flex-shrink-0">
          <img src={arena.images[0]} alt={arena.name} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3">
            <SportTag sport={arena.sport} />
          </div>
          <div
            className={cn(
              'absolute top-3 right-3 font-mono text-xs px-2 py-1 bg-ground/70 backdrop-blur-sm',
              occColor
            )}
          >
            {arena.occupancyRate}% full
          </div>
        </div>
        <div className="flex flex-col p-5" style={{ minHeight: '180px' }}>
          <h3
            className="font-display text-[26px] text-chalk leading-tight"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '64px',
            }}
          >
            {arena.name}
          </h3>
          <p className="flex items-center gap-1 text-[13px] text-mist mt-1">
            <MapPin size={12} />
            {arena.location.area}, {arena.location.city}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Star size={14} className="text-lime fill-lime" />
            <span className="font-body text-sm">{arena.rating}</span>
            <span className="text-mist text-[13px]">({arena.reviewCount} reviews)</span>
          </div>
          <p className="text-chalk text-[15px] mt-2">
            From {formatPKR(arena.pricing.weekday)}/hr
          </p>
          <BtnLink to={`/arenas/${arena.slug}`} className="block w-full mt-4 text-center py-2.5 text-sm">
            Book Now
          </BtnLink>
        </div>
      </div>
    )
  }

  return (
    <motion.article
      className={cn(
        'flex flex-col bg-slate rounded-sm overflow-hidden group',
        'hover:-translate-y-1 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(200,255,0,0.08)]',
        className
      )}
    >
      <div className="relative h-[200px] flex-shrink-0">
        <img src={arena.images[0]} alt={arena.name} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3">
          <SportTag sport={arena.sport} />
        </div>
        {arena.isPopular && (
          <span className="absolute top-3 right-3 bg-amber text-ground font-display text-xs px-2 py-1 tracking-wide">
            TRENDING
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3
          className="font-display text-[22px] text-chalk leading-tight"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '56px',
          }}
        >
          {arena.name}
        </h3>
        <p className="flex items-center gap-1 text-[13px] text-mist mt-1">
          <MapPin size={12} />
          {arena.location.area}, {arena.location.city}
        </p>
        <div className="mt-3">
          <OccupancyBar
            percentage={arena.occupancyRate}
            label={`${arena.occupancyRate}% occupied today`}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Star size={14} className="text-lime fill-lime" />
          <span className="text-sm">{arena.rating}</span>
          <span className="text-mist text-[13px]">({arena.reviewCount})</span>
        </div>
        <p className="text-chalk mt-2 text-[15px]">
          From {formatPKR(arena.pricing.weekday)}/hr
        </p>
        <div className="flex-1" />
        <div className="flex gap-2 mt-4">
          <BtnLink
            to={`/arenas/${arena.slug}`}
            variant="outline"
            className="flex-1 text-center py-2 text-sm"
          >
            View Details
          </BtnLink>
          <BtnLink
            to={`/arenas/${arena.slug}`}
            className="flex-1 text-center py-2 text-sm"
          >
            Book Now
          </BtnLink>
        </div>
      </div>
    </motion.article>
  )
}
