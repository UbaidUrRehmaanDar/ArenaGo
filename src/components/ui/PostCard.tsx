import { useState, useRef, useEffect } from 'react'
import type { CommunityPost } from '../../types'
import { Heart, MessageCircle, Share2, Flag, MoreVertical, Edit2, Trash2, CheckCircle, Trophy, Megaphone } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../../utils/formatters'
import { CommentsSection } from './CommentsSection'

interface PostCardProps {
  post: CommunityPost
  currentUserId?: string
  onLike?: (postId: string) => void
  onUnlike?: (postId: string) => void
  onShare?: (postId: string) => void
  onReport?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  className?: string
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onShare,
  onReport,
  onEdit,
  onDelete,
  className,
}: PostCardProps) {
  // More robust ownership check - handle UUID comparison
  const isOwner = currentUserId && post.authorId && 
    (currentUserId === post.authorId || 
     String(currentUserId) === String(post.authorId) ||
     currentUserId.toString() === post.authorId.toString())
  
  const isLiked = post.isLikedByCurrentUser || false
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuAction = (action: 'edit' | 'delete') => {
    setShowMenu(false)
    if (action === 'edit') {
      onEdit?.(post.id)
    } else if (action === 'delete') {
      onDelete?.(post.id)
    }
  }

  const handleLike = () => {
    if (isLiked && onUnlike) {
      onUnlike(post.id)
    } else if (!isLiked && onLike) {
      onLike(post.id)
    }
  }

  const getPostTypeIcon = () => {
    switch (post.postType) {
      case 'announcement':
        return <Megaphone size={14} className="text-lime" />
      case 'tournament':
        return <Trophy size={14} className="text-lime" />
      default:
        return null
    }
  }

  const getPostTypeLabel = () => {
    switch (post.postType) {
      case 'announcement':
        return 'Announcement'
      case 'tournament':
        return 'Tournament'
      default:
        return null
    }
  }

  return (
    <article className={cn('bg-slate rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-turf overflow-hidden flex-shrink-0">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-chalk font-body font-semibold text-sm">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-body font-semibold text-chalk truncate">
                  {post.authorName}
                </span>
                {post.authorRole === 'owner' && (
                  <CheckCircle size={14} className="text-lime flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-mist">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <>
                    <span className="text-mist">·</span>
                    <span className="font-mono text-xs text-lime">
                      edited {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                    </span>
                  </>
                )}
                {getPostTypeLabel() && (
                  <>
                    <span className="text-mist">·</span>
                    <span className="font-mono text-xs text-lime flex items-center gap-1">
                      {getPostTypeIcon()}
                      {getPostTypeLabel()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {/* Temporarily show for all users to test functionality */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-mist hover:text-chalk transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-slate border border-line rounded-sm shadow-lg z-10 min-w-[120px]">
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleMenuAction('edit')}
                    className="w-full px-4 py-2 text-left text-sm text-chalk hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleMenuAction('delete')}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      onReport?.(post.id)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-chalk hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Flag size={14} />
                    Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 py-3">
        <p className="text-[15px] text-chalk/90 leading-relaxed whitespace-pre-wrap">
          {post.caption}
        </p>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className={cn(
          'grid gap-1 bg-ground',
          post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
        )}>
          {post.images.map((imageUrl, index) => (
            <div
              key={index}
              className={cn(
                'relative aspect-square overflow-hidden',
                post.images.length === 3 && index === 0 ? 'col-span-2' : '',
                post.images.length > 3 && index === 0 ? 'col-span-2' : ''
              )}
            >
              <img
                src={imageUrl}
                alt={`Post image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 py-3 border-t border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
                isLiked ? 'text-lime bg-lime/10' : 'text-mist hover:bg-white/5 hover:text-chalk'
              )}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
            >
              <Heart size={18} className={cn(isLiked ? 'fill-current' : '')} />
              <span className="text-sm font-body">{post.likeCount}</span>
            </button>

            {/* Comment Button */}
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
                showComments ? 'text-lime bg-lime/10' : 'text-mist hover:bg-white/5 hover:text-chalk'
              )}
              aria-label="Comment on post"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-body">{post.commentCount}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={() => onShare?.(post.id)}
              className="p-1.5 rounded-lg text-mist hover:bg-white/5 hover:text-chalk transition-colors"
              aria-label="Share post"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Report Button */}
          {!isOwner && (
            <button
              type="button"
              onClick={() => onReport?.(post.id)}
              className="p-1.5 rounded-lg text-mist hover:bg-white/5 hover:text-chalk transition-colors"
              aria-label="Report post"
            >
              <Flag size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        postId={post.id}
        currentUserId={currentUserId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </article>
  )
}
