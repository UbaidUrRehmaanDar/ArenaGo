import { cn } from '../../utils/formatters'

const LOADING_MESSAGES = [
  'Finding the best courts...',
  'Checking availability...',
  'Loading arenas near you...',
  'Almost there...',
  'Gathering options...',
]

export function ArenaCardSkeleton({ className }: { className?: string }) {
  const [messageIndex, setMessageIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('flex flex-col bg-slate rounded-sm overflow-hidden', className)}>
      <div className="relative h-[200px] flex-shrink-0 skeleton-shimmer">
        <div className="absolute top-3 left-3 w-16 h-6 bg-slate/50 rounded-sm" />
      </div>
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div className="h-6 bg-slate/50 rounded-sm skeleton-shimmer" />
        <div className="h-4 w-3/4 bg-slate/50 rounded-sm skeleton-shimmer" />
        <div className="h-3 w-1/2 bg-slate/50 rounded-sm skeleton-shimmer" />
        <div className="h-8 bg-slate/50 rounded-sm skeleton-shimmer" />
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-10 bg-slate/50 rounded-sm skeleton-shimmer" />
          <div className="flex-1 h-10 bg-slate/50 rounded-sm skeleton-shimmer" />
        </div>
        <p className="text-mist text-xs font-mono mt-2 text-center">
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  )
}

import React from 'react'
