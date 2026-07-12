import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Loader2, LogIn } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { PostCard } from '../components/ui/PostCard'
import { CreatePostModal } from '../components/ui/CreatePostModal'
import { Btn, BtnLink } from '../components/ui/Btn'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../components/ui/Toast'
import { fetchPosts, likePost, unlikePost, createPost, deletePost, updatePost } from '../services/communityData'
import type { CommunityPost, CommunityFilter, PostType } from '../types'
import { cn } from '../utils/formatters'

const FILTERS: { value: CommunityFilter; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'players', label: 'Players' },
  { value: 'arenas', label: 'Arenas' },
  { value: 'tournaments', label: 'Tournaments' },
]

export default function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CommunityFilter>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [postToEdit, setPostToEdit] = useState<CommunityPost | null>(null)
  const [isEditingPost, setIsEditingPost] = useState(false)

  useEffect(() => {
    loadPosts(1, false)
  }, [filter, searchQuery])

  const loadPosts = async (pageNum: number, append: boolean = false) => {
    setLoading(true)
    try {
      const { posts: newPosts, total: newTotal } = await fetchPosts(
        filter,
        pageNum,
        20,
        searchQuery || undefined,
        user?.id
      )

      if (append) {
        setPosts(prev => [...prev, ...newPosts])
      } else {
        setPosts(newPosts)
      }

      setTotal(newTotal)
      setHasMore(pageNum * 20 < newTotal)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage, true)
  }

  const handleCreatePost = async (data: { caption: string; postType: PostType; images: File[] }) => {
    if (!user) return

    setIsCreatingPost(true)
    try {
      const { success } = await createPost({
        caption: data.caption,
        postType: data.postType,
        images: data.images,
      })

      if (success) {
        setIsCreateModalOpen(false)
        setPage(1)
        loadPosts(1, false)
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { success, error } = await deletePost(postId)
      
      if (success) {
        setPosts(prev => prev.filter(post => post.id !== postId))
      } else {
        console.error('Delete failed:', error)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleCommentAdded = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
    ))
  }

  const handleCommentDeleted = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, commentCount: Math.max(0, post.commentCount - 1) } : post
    ))
  }

  const handleEditPost = (post: CommunityPost) => {
    setPostToEdit(post)
    setIsCreateModalOpen(true)
  }

  const handleUpdatePost = async (data: { caption: string; postType: PostType; images: File[] }) => {
    if (!postToEdit) return

    setIsEditingPost(true)
    try {
      const { success } = await updatePost(postToEdit.id, {
        caption: data.caption,
        postType: data.postType,
      })

      if (success) {
        setIsCreateModalOpen(false)
        setPostToEdit(null)
        setPage(1)
        loadPosts(1, false)
      }
    } catch (error) {
      console.error('Error updating post:', error)
    } finally {
      setIsEditingPost(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!user) {
      showToast({ type: 'info', message: 'Log in to like posts' })
      return
    }

    const { success } = await likePost(postId)
    if (success) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: post.likeCount + 1, isLikedByCurrentUser: true } : post
        )
      )
    }
  }

  const handleUnlike = async (postId: string) => {
    if (!user) {
      showToast({ type: 'info', message: 'Log in to like posts' })
      return
    }

    const { success } = await unlikePost(postId)
    if (success) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: post.likeCount - 1, isLikedByCurrentUser: false } : post
        )
      )
    }
  }

  const handleFilterChange = (newFilter: CommunityFilter) => {
    setFilter(newFilter)
    setPage(1)
  }

  return (
    <>
      <Navbar transparent={false} />
      <div className="max-w-2xl mx-auto px-4 pb-16 pt-24">

        {/* ── Header ─────────────────────────────────────────── */}
        <div data-community-header className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-chalk tracking-wide leading-none mb-1">
              Community
            </h1>
            <p className="text-sm font-mono text-mist">
              {total} {total === 1 ? 'post' : 'posts'}
            </p>
          </div>
          {user ? (
            <Btn
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 shrink-0"
            >
              <Plus size={17} />
              <span>New Post</span>
            </Btn>
          ) : (
            <BtnLink to="/login" className="flex items-center gap-2 shrink-0">
              <LogIn size={17} />
              <span>Log In to Post</span>
            </BtnLink>
          )}
        </div>

        {/* ── Guest notice ──────────────────────────────────── */}
        {!user && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-lime/20 bg-lime/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
              <p className="text-sm font-body text-chalk">
                You're browsing as a guest.{' '}
                <span className="text-mist">Log in to like, comment, and post.</span>
              </p>
            </div>
            <Link
              to="/login"
              className="shrink-0 text-xs font-mono font-semibold uppercase tracking-widest text-on-lime bg-lime hover:brightness-110 px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              Log in
            </Link>
          </div>
        )}

        {/* ── Search ─────────────────────────────────────────── */}
        <div data-community-search className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-mist pointer-events-none"
            size={17}
          />
          <input
            type="text"
            placeholder="Search posts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate border border-line rounded-xl text-sm text-chalk placeholder:text-mist/50 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/30 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-mist hover:text-chalk hover:bg-slate transition-colors duration-150"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* ── Filters ────────────────────────────────────────── */}
        <div
          data-community-filters
          className="flex gap-2 mb-7 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200',
                filter === f.value
                  ? 'bg-lime text-on-lime border-transparent shadow-[0_0_12px_rgba(200,255,0,0.25)]'
                  : 'bg-transparent text-mist border-line hover:text-chalk hover:border-chalk/20 hover:bg-slate'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Posts ──────────────────────────────────────────── */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-lime" size={28} />
            <p className="text-sm text-mist font-mono">Loading posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <div
            data-community-empty
            className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-line rounded-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-lime/10 flex items-center justify-center">
              <Plus size={24} className="text-lime" />
            </div>
            <div className="text-center">
              <p className="text-chalk font-semibold mb-1">No posts yet</p>
              <p className="text-sm text-mist">
                {searchQuery ? 'Try a different search term' : 'Be the first to share something'}
              </p>
            </div>
            {user && !searchQuery && (
              <Btn onClick={() => setIsCreateModalOpen(true)}>
                Create the first post
              </Btn>
            )}
          </div>
        ) : (
          <div data-community-posts className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
                onCommentAdded={() => handleCommentAdded(post.id)}
                onCommentDeleted={() => handleCommentDeleted(post.id)}
              />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className={cn(
                  'w-full py-3 rounded-xl text-sm font-medium border transition-all duration-200',
                  loading
                    ? 'text-mist border-line cursor-not-allowed'
                    : 'text-lime border-lime/20 hover:bg-lime/10 hover:border-lime/30'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Loading…
                  </span>
                ) : (
                  'Load more posts'
                )}
              </button>
            )}
          </div>
        )}

        {/* ── Create / Edit Post Modal ────────────────────────── */}
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setPostToEdit(null)
          }}
          onCreatePost={postToEdit ? handleUpdatePost : handleCreatePost}
          isLoading={isCreatingPost || isEditingPost}
          initialCaption={postToEdit?.caption}
          initialPostType={postToEdit?.postType}
          isEdit={!!postToEdit}
        />
      </div>
    </>
  )
}
