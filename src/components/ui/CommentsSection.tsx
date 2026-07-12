import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Send, Trash2, Edit2, X, Loader2 } from 'lucide-react'
import type { CommunityComment } from '../../types'
import { cn } from '../../utils/formatters'

interface CommentsSectionProps {
  postId: string
  currentUserId?: string
  isOpen: boolean
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
}

export function CommentsSection({
  postId,
  currentUserId,
  isOpen,
  onCommentAdded,
  onCommentDeleted,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && postId) {
      loadComments()
    }
  }, [isOpen, postId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const { fetchComments } = await import('../../services/communityData')
      const data = await fetchComments(postId)
      setComments(data)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const { createComment } = await import('../../services/communityData')
      const { success } = await createComment({ postId, content: newComment.trim() })

      if (success) {
        setNewComment('')
        await loadComments()
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const { updateComment } = await import('../../services/communityData')
      const { success } = await updateComment(commentId, editContent.trim())

      if (success) {
        setEditingId(null)
        setEditContent('')
        await loadComments()
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId)
    try {
      const { deleteComment } = await import('../../services/communityData')
      const { success } = await deleteComment(commentId)

      if (success) {
        await loadComments()
        onCommentDeleted?.()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="mt-3 pt-4 border-t border-line">
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={15} className="text-lime" />
        <h4 className="text-sm font-semibold text-chalk">
          Comments
          <span className="ml-1.5 text-xs font-mono text-mist">({comments.length})</span>
        </h4>
      </div>

      {/* Add Comment */}
      {currentUserId ? (
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 px-4 py-2.5 bg-slate border border-line rounded-xl text-sm text-chalk placeholder:text-mist/50 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/30 transition-all duration-200"
            disabled={submitting}
            maxLength={300}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-all duration-200',
              submitting || !newComment.trim()
                ? 'bg-slate text-mist cursor-not-allowed'
                : 'bg-lime text-on-lime hover:brightness-110 active:scale-95'
            )}
            aria-label="Post comment"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 mb-5 rounded-xl border border-line bg-slate/60 px-4 py-3">
          <p className="text-sm font-body text-mist">Log in to join the conversation.</p>
          <Link
            to="/login"
            className="shrink-0 text-sm font-semibold text-lime hover:underline"
          >
            Log in
          </Link>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-mist text-sm">
          <Loader2 size={16} className="animate-spin text-lime" />
          Loading…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-8 text-sm text-mist">
          No comments yet — be the first!
        </p>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isOwner = currentUserId === comment.authorId
            const isEditing = editingId === comment.id
            const isDeleting = deletingId === comment.id

            return (
              <div
                key={comment.id}
                className={cn(
                  'flex gap-3 transition-opacity duration-200',
                  isDeleting && 'opacity-40 pointer-events-none'
                )}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-lime/10 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-line mt-0.5">
                  {comment.authorAvatar ? (
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lime font-semibold text-xs">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-chalk leading-none">
                      {comment.authorName}
                    </span>
                    <span className="text-[11px] font-mono text-mist">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {/* Edit mode */}
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate border border-lime/30 rounded-lg text-sm text-chalk focus:outline-none focus:ring-2 focus:ring-lime/40 transition-all duration-200"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditComment(comment.id)
                          if (e.key === 'Escape') {
                            setEditingId(null)
                            setEditContent('')
                          }
                        }}
                      />
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-2 bg-lime text-on-lime rounded-lg text-xs font-semibold hover:brightness-110 active:scale-95 transition-all duration-150"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditContent('')
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-slate border border-line rounded-lg text-mist hover:text-chalk hover:border-chalk/30 transition-all duration-150"
                        aria-label="Cancel edit"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    /* Comment text */
                    <p className="text-sm text-chalk/90 leading-relaxed">{comment.content}</p>
                  )}

                  {/* Owner actions */}
                  {isOwner && !isEditing && (
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => {
                          setEditingId(comment.id)
                          setEditContent(comment.content)
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-mist hover:text-lime hover:bg-lime/10 border border-transparent hover:border-lime/20 transition-all duration-150 group"
                      >
                        <Edit2 size={11} className="group-hover:scale-110 transition-transform duration-150" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-mist hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 group"
                      >
                        {isDeleting ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Trash2 size={11} className="group-hover:scale-110 transition-transform duration-150" />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
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
