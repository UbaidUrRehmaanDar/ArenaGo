import { useState } from 'react'
import { MessageCircle, Send, Edit2, Trash2, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fetchComments, createComment, updateComment, deleteComment } from '../../services/communityData'
import type { CommunityComment } from '../../types'

interface CommentsSectionProps {
  postId: string
  currentUserId?: string
  isOpen: boolean
  onClose: () => void
}

export function CommentsSection({ postId, currentUserId, isOpen, onClose }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await fetchComments(postId)
      setComments(data)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load comments when section opens
  if (isOpen && comments.length === 0 && !loading) {
    loadComments()
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setSubmitting(true)
    try {
      const { success } = await createComment({
        postId,
        authorId: currentUserId,
        content: newComment.trim(),
      })

      if (success) {
        setNewComment('')
        // Reload comments to show the new one
        loadComments()
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const { success } = await updateComment(commentId, editContent.trim())
      if (success) {
        setEditingId(null)
        setEditContent('')
        loadComments()
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { success } = await deleteComment(commentId)
      if (success) {
        loadComments()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const startEdit = (comment: CommunityComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  if (!isOpen) return null

  return (
    <div className="border-t border-line p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-chalk flex items-center gap-2">
          <MessageCircle size={18} />
          Comments ({comments.length})
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-mist hover:text-chalk transition-colors"
          aria-label="Close comments"
        >
          <X size={18} />
        </button>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-ground text-chalk px-4 py-2.5 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body text-[15px]"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2.5 rounded-sm bg-lime text-on-lime hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-ground rounded-sm skeleton-shimmer" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-mist text-sm py-4">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.map((comment) => {
            const isOwner = currentUserId === comment.authorId
            const isEditing = editingId === comment.id

            return (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-turf overflow-hidden flex-shrink-0">
                  {comment.authorAvatar ? (
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-chalk font-body font-semibold text-xs">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-body font-semibold text-chalk text-sm">
                      {comment.authorName}
                    </span>
                    <span className="font-mono text-xs text-mist">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-ground text-chalk px-3 py-2 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-2 rounded-sm bg-lime text-on-lime text-sm font-body"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-2 rounded-sm border border-line text-chalk text-sm font-body hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-chalk/90 leading-relaxed">{comment.content}</p>
                      {isOwner && (
                        <div className="flex gap-3 mt-2">
                          <button
                            type="button"
                            onClick={() => startEdit(comment)}
                            className="text-xs font-mono text-mist hover:text-lime transition-colors flex items-center gap-1"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs font-mono text-mist hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </>
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
