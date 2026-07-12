import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PageWrapper } from '../components/layout/PageWrapper'
import { PostCard } from '../components/ui/PostCard'
import { CreatePostModal } from '../components/ui/CreatePostModal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Btn } from '../components/ui/Btn'
import { Search, Plus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [postToEdit, setPostToEdit] = useState<CommunityPost | null>(null)
  const [isEditingPost, setIsEditingPost] = useState(false)

  // Debug logging
  console.log('Community page - current user:', user?.id, 'type:', typeof user?.id)

  const loadPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      const { posts: newPosts, total: totalCount } = await fetchPosts(
        filter,
        pageNum,
        20,
        searchQuery || undefined,
        user?.id
      )

      if (append) {
        setPosts((prev) => [...prev, ...newPosts])
      } else {
        setPosts(newPosts)
      }

      setTotal(totalCount)
      setHasMore(newPosts.length === 20 && posts.length + newPosts.length < totalCount)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery, posts.length])

  useEffect(() => {
    setPage(1)
    loadPosts(1, false)
  }, [filter, searchQuery])

  const handleLike = async (postId: string) => {
    if (!user) return

    const { success } = await likePost(postId, user.id)
    if (success) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likeCount: post.likeCount + 1, isLikedByCurrentUser: true }
            : post
        )
      )
    }
  }

  const handleUnlike = async (postId: string) => {
    if (!user) return

    const { success } = await unlikePost(postId, user.id)
    if (success) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likeCount: post.likeCount - 1, isLikedByCurrentUser: false }
            : post
        )
      )
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage, true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadPosts(1, false)
  }

  const handleCreatePost = async (data: { caption: string; postType: PostType; images: File[] }) => {
    if (!user) return

    setIsCreatingPost(true)
    try {
      const { success } = await createPost({
        authorId: user.id,
        caption: data.caption,
        postType: data.postType,
        images: data.images,
      })

      if (success) {
        setIsCreateModalOpen(false)
        // Reload posts to show the new post
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
    if (!user) return
    setPostToDelete(postId)
    setDeleteModalOpen(true)
  }

  const confirmDeletePost = async () => {
    if (!postToDelete) return

    try {
      console.log('Deleting post:', postToDelete)
      const { success, error } = await deletePost(postToDelete)
      console.log('Delete result:', { success, error })
      
      if (success) {
        // Remove post from state
        setPosts((prev) => prev.filter((post) => post.id !== postToDelete))
        setTotal((prev) => Math.max(0, prev - 1))
        setDeleteModalOpen(false)
        setPostToDelete(null)
      } else {
        console.error('Delete failed:', error)
        alert('Failed to delete post: ' + (error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error deleting post')
    }
  }

  const handleEditPost = (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    if (post) {
      setPostToEdit(post)
      setEditModalOpen(true)
    }
  }

  const handleUpdatePost = async (data: { caption: string; postType: PostType }) => {
    if (!user || !postToEdit) return

    setIsEditingPost(true)
    try {
      console.log('Updating post:', postToEdit.id, 'with data:', data)
      const { success, error } = await updatePost(postToEdit.id, {
        caption: data.caption,
        postType: data.postType,
      })
      console.log('Update result:', { success, error })

      if (success) {
        // Update post in state
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postToEdit.id
              ? { ...post, caption: data.caption, postType: data.postType, updatedAt: new Date().toISOString() }
              : post
          )
        )
        setEditModalOpen(false)
        setPostToEdit(null)
      } else {
        console.error('Update failed:', error)
        alert('Failed to update post: ' + (error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Error updating post')
    } finally {
      setIsEditingPost(false)
    }
  }

  return (
    <>
      <Navbar />
      <PageWrapper className="pt-20 md:pt-24 pb-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-[clamp(2rem,6vw,3rem)] text-chalk mb-2">
                  Community
                </h1>
                <p className="text-mist text-sm">
                  {total} {total === 1 ? 'post' : 'posts'}
                </p>
              </div>
              {user && (
                <Btn
                  className="px-4 py-2 text-sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Create Post
                </Btn>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full bg-slate text-chalk pl-10 pr-4 py-2.5 rounded-sm border border-line focus:outline focus:outline-2 focus:outline-lime font-body text-[15px]"
                />
              </div>
            </form>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm font-body font-medium transition-colors',
                    filter === f.value
                      ? 'bg-lime text-on-lime'
                      : 'bg-slate text-mist hover:text-chalk'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </header>

          {/* Posts Feed */}
          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate rounded-sm h-[400px] skeleton-shimmer" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-turf flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-mist" />
              </div>
              <h2 className="font-display text-xl text-chalk mb-2">No posts yet</h2>
              <p className="text-mist text-sm">
                {searchQuery ? 'Try a different search term' : 'Be the first to share something with the community!'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                    onShare={(postId) => console.log('Share', postId)}
                    onReport={(postId) => console.log('Report', postId)}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-sm border border-line text-chalk hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body text-sm"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </PageWrapper>
      <Footer />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePost={handleCreatePost}
        isLoading={isCreatingPost}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setPostToDelete(null)
        }}
        onConfirm={confirmDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Edit Post Modal */}
      {postToEdit && (
        <CreatePostModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setPostToEdit(null)
          }}
          onCreatePost={handleUpdatePost}
          isLoading={isEditingPost}
          initialCaption={postToEdit.caption}
          initialPostType={postToEdit.postType}
          isEdit
        />
      )}
    </>
  )
}
