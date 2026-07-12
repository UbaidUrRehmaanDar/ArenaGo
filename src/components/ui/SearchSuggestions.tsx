import { Clock, X } from 'lucide-react'

interface SearchSuggestionsProps {
  recentSearches: string[]
  suggestions: string[]
  onSelect: (query: string) => void
  onClearRecent: () => void
  show: boolean
}

export function SearchSuggestions({ 
  recentSearches, 
  suggestions, 
  onSelect, 
  onClearRecent,
  show 
}: SearchSuggestionsProps) {
  if (!show) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-slate border border-line rounded-sm shadow-xl z-50 overflow-hidden">
      {recentSearches.length > 0 && (
        <div className="p-3 border-b border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-mist">RECENT</span>
            <button
              onClick={onClearRecent}
              className="text-xs text-mist hover:text-chalk flex items-center gap-1 transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map(search => (
              <button
                key={search}
                onClick={() => onSelect(search)}
                className="w-full text-left px-3 py-2 text-sm text-chalk hover:bg-ground/50 rounded-sm transition-colors flex items-center gap-2"
              >
                <Clock size={14} className="text-mist" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="p-3">
          <span className="text-xs font-mono text-mist block mb-2">SUGGESTIONS</span>
          <div className="space-y-1">
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                onClick={() => onSelect(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-chalk hover:bg-ground/50 rounded-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
