import { supabase } from '../lib/supabase'
import type {
  CommunityPost,
  CommunityComment,
  CommunityLike,
  CommunityReport,
  PostImage,
  CommunityFilter,
  PostType,
} from '../types'

// ── Posts ─────────────────────────────────────────────────────────────────

/**
 * Fetches posts with optional filtering and pagination
 */
export async function fetchPosts(
  filter: CommunityFilter = 'latest',
  page = 1,
  pageSize = 20,
  searchQuery?: string
): Promise<{ posts: CommunityPost[]; total: number }> {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles!community_posts_author_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        ),
        community_post_images (
          id,
          image_url,
          alt_text,
          sort_order
        )
      `, { count: 'exact' })
      .eq('is_deleted', false)

    // Apply filters
    if (filter === 'popular') {
      query = query.order('like_count', { ascending: false })
    } else if (filter === 'latest') {
      query = query.order('created_at', { ascending: false })
    } else if (filter === 'arenas') {
      query = query.eq('post_type', 'announcement').order('created_at', { ascending: false })
    } else if (filter === 'tournaments') {
      query = query.eq('post_type', 'tournament').order('created_at', { ascending: false })
    } else if (filter === 'players') {
      query = query.eq('post_type', 'general').order('created_at', { ascending: false })
    }

    // Apply search
    if (searchQuery) {
      query = query.ilike('caption', `%${searchQuery}%`)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw error
    if (!data) return { posts: [], total: 0 }

    const posts = data.map(mapPostRow)
    return { posts, total: count || 0 }
  } catch (err) {
    console.error('Error fetching posts:', err)
    return { posts: [], total: 0 }
  }
}

/**
 * Fetches a single post by ID
 */
export async function fetchPostById(postId: string): Promise<CommunityPost | null> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles!community_posts_author_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        ),
        community_post_images (
          id,
          image_url,
          alt_text,
          sort_order
        )
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (error || !data) return null
    return mapPostRow(data)
  } catch (err) {
    console.error('Error fetching post:', err)
    return null
  }
}

/**
 * Creates a new post
 */
export async function createPost(params: {
  authorId: string
  caption: string
  postType: PostType
  images?: File[]
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const { data: postData, error: postError } = await supabase
      .from('community_posts')
      .insert({
        author_id: params.authorId,
        caption: params.caption,
        post_type: params.postType,
      })
      .select()
      .single()

    if (postError) {
      return { success: false, error: postError.message }
    }

    // Upload images if provided
    if (params.images && params.images.length > 0) {
      for (let i = 0; i < params.images.length; i++) {
        const file = params.images[i]
        const imageUrl = await uploadPostImage(postData.id, file)
        if (imageUrl) {
          await supabase.from('community_post_images').insert({
            post_id: postData.id,
            image_url: imageUrl,
            alt_text: file.name,
            sort_order: i,
          })
        }
      }
    }

    return { success: true, postId: postData.id }
  } catch (err: any) {
    console.error('Error creating post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Updates an existing post
 */
export async function updatePost(
  postId: string,
  updates: { caption?: string; postType?: PostType }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {}
    if (updates.caption !== undefined) payload.caption = updates.caption
    if (updates.postType !== undefined) payload.post_type = updates.postType

    const { error } = await supabase
      .from('community_posts')
      .update(payload)
      .eq('id', postId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error updating post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Soft deletes a post
 */
export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('community_posts')
      .update({ is_deleted: true })
      .eq('id', postId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

// ── Likes ─────────────────────────────────────────────────────────────────

/**
 * Likes a post
 */
export async function likePost(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('community_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error liking post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Unlikes a post
 */
export async function unlikePost(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('community_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error unliking post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Checks if a user has liked a post
 */
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (error || !data) return false
    return true
  } catch (err) {
    console.error('Error checking like status:', err)
    return false
  }
}

// ── Comments ─────────────────────────────────────────────────────────────

/**
 * Fetches comments for a post
 */
export async function fetchComments(postId: string): Promise<CommunityComment[]> {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        profiles!community_comments_author_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map(mapCommentRow)
  } catch (err) {
    console.error('Error fetching comments:', err)
    return []
  }
}

/**
 * Creates a new comment
 */
export async function createComment(params: {
  postId: string
  authorId: string
  content: string
}): Promise<{ success: boolean; commentId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: params.postId,
        author_id: params.authorId,
        content: params.content,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, commentId: data.id }
  } catch (err: any) {
    console.error('Error creating comment:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Updates an existing comment
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('community_comments')
      .update({ content })
      .eq('id', commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error updating comment:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Soft deletes a comment
 */
export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('community_comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting comment:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

// ── Reports ───────────────────────────────────────────────────────────────

/**
 * Reports a post
 */
export async function reportPost(params: {
  postId: string
  reporterId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('community_reports')
      .insert({
        post_id: params.postId,
        reporter_id: params.reporterId,
        reason: params.reason,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error reporting post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

// ── Image Upload ─────────────────────────────────────────────────────────

/**
 * Uploads an image for a post
 */
export async function uploadPostImage(postId: string, file: File): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `community/${postId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('community-images')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      console.error('Post image upload error:', uploadError)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('community-images')
      .getPublicUrl(path)

    return urlData?.publicUrl || null
  } catch (err) {
    console.error('Error uploading post image:', err)
    return null
  }
}

/**
 * Deletes an image from storage
 */
export async function deletePostImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/community-images/')
    if (pathParts.length < 2) return false

    const path = pathParts[1]

    const { error } = await supabase.storage
      .from('community-images')
      .remove([path])

    if (error) {
      console.error('Error deleting post image:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error deleting post image:', err)
    return false
  }
}

// ── Helper Functions ───────────────────────────────────────────────────────

function mapPostRow(row: any): CommunityPost {
  const profile = row.profiles
  const images = Array.isArray(row.community_post_images)
    ? row.community_post_images
        .sort((a: any, b: any) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((img: any) => img.image_url)
    : []

  return {
    id: row.id,
    authorId: row.author_id,
    authorName: profile?.full_name || 'Unknown',
    authorAvatar: profile?.avatar_url || undefined,
    authorRole: profile?.role === 'customer' ? 'player' : (profile?.role || 'player'),
    caption: row.caption,
    postType: row.post_type,
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: Number(row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    isDeleted: Boolean(row.is_deleted),
  }
}

function mapCommentRow(row: any): CommunityComment {
  const profile = row.profiles

  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: profile?.full_name || 'Unknown',
    authorAvatar: profile?.avatar_url || undefined,
    authorRole: profile?.role === 'customer' ? 'player' : (profile?.role || 'player'),
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: Boolean(row.is_deleted),
  }
}
