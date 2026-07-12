import { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import type { CommunityPost } from '../../types'
import { cn } from '../../utils/formatters'
import { CommentsSection } from './CommentsSection'

interface PostCardProps {
  post: CommunityPost
  currentUserId?: string
  onLike?: (postId: string) => void
  onUnlike?: (postId: string) => void
  onDelete?: (postId: string) => void
  onEdit?: (post: CommunityPost) => void
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
  className?: string
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onDelete,
  onEdit,
  onCommentAdded,
  onCommentDeleted,
  className,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // More robust ownership check - handle UUID comparison
  const isOwner = currentUserId && post.authorId &&
    (currentUserId === post.authorId ||
      String(currentUserId) === String(post.authorId) ||
      currentUserId.toString() === post.authorId.toString())

  const isLiked = post.isLikedByCurrentUser || false
  const [showComments, setShowComments] = useState(false)

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  // Close menu on Escape
  useEffect(() => {
    if (!showMenu) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showMenu])

  const postTypeBadge =
    post.postType === 'announcement'
      ? { label: 'Announcement', className: 'bg-amber/15 text-amber border border-amber/20' }
      : post.postType === 'tournament'
      ? { label: 'Tournament', className: 'bg-lime/10 text-lime border border-lime/20' }
      : null

  return (
    <article
      data-post-card
      className={cn(
        'bg-turf rounded-2xl border border-line transition-shadow duration-200 hover:border-line/80 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-lime/10 flex items-center justify-center overflow-hidden ring-2 ring-line shrink-0">
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lime font-semibold text-sm">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-body font-semibold text-chalk leading-none">{post.authorName}</h3>
              {post.authorRole === 'owner' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-lime/10 text-lime rounded-full font-mono font-medium border border-lime/20">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-mist mt-0.5 font-mono">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Hamburger / more options */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200',
                showMenu
                  ? 'bg-lime/15 border-lime/30 text-lime'
                  : 'bg-transparent border-transparent text-mist hover:bg-slate hover:border-line hover:text-chalk'
              )}
              aria-label="Post options"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <MoreVertical size={17} />
            </button>

            {/* Dropdown */}
            <div
              role="menu"
              className={cn(
                'absolute right-0 top-full mt-2 min-w-[156px] z-20',
                'bg-slate border border-line rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
                'origin-top-right transition-all duration-150',
                showMenu
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
              )}
            >
              {/* Edit */}
              <button
                role="menuitem"
                onClick={() => {
                  onEdit?.(post)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-chalk hover:text-lime hover:bg-lime/10 transition-colors duration-150 group rounded-t-xl"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-lime/10 text-lime group-hover:bg-lime/20 transition-colors duration-150">
                  <Edit2 size={13} />
                </span>
                Edit Post
              </button>

              {/* Divider */}
              <div className="h-px bg-line mx-3" />

              {/* Delete */}
              <button
                role="menuitem"
                onClick={() => {
                  onDelete?.(post.id)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 group rounded-b-xl"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors duration-150">
                  <Trash2 size={13} />
                </span>
                Delete Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Post Type Badge */}
      {postTypeBadge && (
        <div className="px-5 mb-3">
          <span className={cn('text-[11px] px-2.5 py-1 rounded-full font-mono font-medium tracking-wide', postTypeBadge.className)}>
            {postTypeBadge.label}
          </span>
        </div>
      )}

      {/* Caption */}
      <p className="font-body text-chalk px-5 mb-4 leading-relaxed">{post.caption}</p>

      {/* Images */}
      {post.images.length > 0 && (
        <div
          className={cn(
            'grid gap-1 mb-4 px-5',
            post.images.length === 1 && 'grid-cols-1',
            post.images.length === 2 && 'grid-cols-2',
            post.images.length >= 3 && 'grid-cols-2'
          )}
        >
          {post.images.map((image, index) => (
            <div
              key={index}
              className={cn(
                'rounded-xl overflow-hidden bg-slate',
                // Multi-image grids need a fixed cell height so the grid stays tidy.
                // Single images: let the image's natural aspect ratio breathe — no forced box.
                post.images.length > 1 && 'aspect-square',
                post.images.length === 3 && index === 0 && 'col-span-2'
              )}
            >
              <img
                src={image}
                alt={`Post image ${index + 1}`}
                className={cn(
                  'w-full hover:scale-105 transition-transform duration-300',
                  // Multi: fill the fixed cell; single: natural height, full width
                  post.images.length > 1 ? 'h-full object-cover' : 'h-auto'
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-line">
        {/* Like */}
        <button
          onClick={() => (isLiked ? onUnlike?.(post.id) : onLike?.(post.id))}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group select-none',
            isLiked
              ? 'text-lime bg-lime/10'
              : 'text-mist hover:text-chalk hover:bg-slate'
          )}
        >
          <Heart
            size={17}
            fill={isLiked ? 'currentColor' : 'none'}
            className={cn(
              'transition-transform duration-200',
              isLiked ? 'scale-110' : 'group-hover:scale-110'
            )}
          />
          <span className="text-sm font-medium font-mono">{post.likeCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group select-none',
            showComments
              ? 'text-lime bg-lime/10'
              : 'text-mist hover:text-chalk hover:bg-slate'
          )}
        >
          <MessageCircle
            size={17}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          <span className="text-sm font-medium font-mono">{post.commentCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="px-5 pb-1">
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          isOpen={showComments}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
        />
      </div>
    </article>
  )
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}
