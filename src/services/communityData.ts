import { supabase } from '../lib/supabase'
import type {
  CommunityPost,
  CommunityComment,
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
  searchQuery?: string,
  currentUserId?: string
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

    // Fetch likes by current user to determine isLikedByCurrentUser
    let userLikes: Set<string> = new Set()
    if (currentUserId) {
      const { data: likesData } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUserId)

      if (likesData) {
        userLikes = new Set(likesData.map(like => like.post_id))
      }
    }

    const posts = data.map(row => mapPostRow(row, userLikes))
    return { posts, total: count || 0 }
  } catch (err) {
    console.error('Error fetching posts:', err)
    return { posts: [], total: 0 }
  }
}

/**
 * Fetches a single post by ID
 */
export async function fetchPostById(postId: string, currentUserId?: string): Promise<CommunityPost | null> {
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

    // Check if current user liked this post
    let userLikes: Set<string> = new Set()
    if (currentUserId) {
      const { data: likesData } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .eq('post_id', postId)

      if (likesData && likesData.length > 0) {
        userLikes.add(postId)
      }
    }

    return mapPostRow(data, userLikes)
  } catch (err) {
    console.error('Error fetching post:', err)
    return null
  }
}

/**
 * Creates a new post
 * Uses auth.uid() to ensure RLS compliance
 */
export async function createPost(params: {
  caption: string
  postType: PostType
  images?: File[]
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Get authenticated user - RLS requires auth.uid() = author_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: postData, error: postError } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id, // Use actual auth.uid()
        caption: params.caption,
        post_type: params.postType,
      })
      .select()
      .single()

    if (postError) {
      console.error('Post creation error:', postError)
      return { success: false, error: postError.message }
    }

    // Upload images if provided
    if (params.images && params.images.length > 0) {
      console.log('Uploading', params.images.length, 'images for post', postData.id)
      for (let i = 0; i < params.images.length; i++) {
        const file = params.images[i]
        console.log('Uploading image', i, file.name, file.type)
        const imageUrl = await uploadPostImage(postData.id, file)
        if (imageUrl) {
          console.log('Image uploaded successfully:', imageUrl)
          const { error: imageInsertError } = await supabase.from('community_post_images').insert({
            post_id: postData.id,
            image_url: imageUrl,
            alt_text: file.name,
            sort_order: i,
          })
          if (imageInsertError) {
            console.error('Failed to insert image record:', imageInsertError)
          }
        } else {
          console.error('Failed to upload image', i)
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
 * Uses auth.uid() to ensure RLS compliance
 */
export async function updatePost(
  postId: string,
  updates: { caption?: string; postType?: PostType }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get authenticated user - RLS requires auth.uid() = author_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Updating post:', postId, 'by user:', user.id)

    const payload: Record<string, any> = {}
    if (updates.caption !== undefined) payload.caption = updates.caption
    if (updates.postType !== undefined) payload.post_type = updates.postType

    const { error } = await supabase
      .from('community_posts')
      .update(payload)
      .eq('id', postId)

    if (error) {
      console.error('Update post RLS error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error updating post:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Deletes a post (hard delete)
 * Uses auth.uid() to ensure RLS compliance
 * Using DELETE instead of UPDATE to avoid WITH CHECK RLS issues
 */
export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get authenticated user - RLS requires auth.uid() = author_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Deleting post:', postId, 'by user:', user.id)

    // First verify ownership
    const { data: postData, error: fetchError } = await supabase
      .from('community_posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (fetchError) {
      console.error('Error fetching post for ownership check:', fetchError)
      return { success: false, error: fetchError.message }
    }

    console.log('Post author_id:', postData.author_id, 'User ID:', user.id, 'Match:', postData.author_id === user.id)

    // Use DELETE instead of UPDATE to avoid WITH CHECK RLS issues
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id) // Add explicit author check

    if (error) {
      console.error('Delete post RLS error:', error)
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
 * Uses auth.uid() to ensure RLS compliance
 */
export async function likePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // First check if user already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means not found
      return { success: false, error: checkError.message }
    }

    // If already liked, return success (idempotent operation)
    if (existingLike) {
      return { success: true }
    }

    // Insert new like - RLS requires auth.uid() = user_id
    const { error } = await supabase
      .from('community_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      })
      .select('id')

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
 * Uses auth.uid() to ensure RLS compliance
 */
export async function unlikePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete the like - RLS requires auth.uid() = user_id
    const { error } = await supabase
      .from('community_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)

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
 * Uses auth.uid() to ensure RLS compliance
 */
export async function createComment(params: {
  postId: string
  content: string
}): Promise<{ success: boolean; commentId?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: params.postId,
        author_id: user.id, // Use actual auth.uid()
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
 * Uses auth.uid() to ensure RLS compliance
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Updating comment:', commentId, 'by user:', user.id)

    const { error } = await supabase
      .from('community_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('author_id', user.id) // Add explicit author check

    if (error) {
      console.error('Update comment RLS error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error updating comment:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Deletes a comment (hard delete)
 * Uses auth.uid() to ensure RLS compliance
 */
export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Deleting comment:', commentId, 'by user:', user.id)

    // Use DELETE instead of UPDATE to avoid WITH CHECK RLS issues
    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', user.id) // Add explicit author check

    if (error) {
      console.error('Delete comment RLS error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error deleting comment:', err)
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
      // Try to create bucket if it doesn't exist
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        const { error: createError } = await supabase.storage.createBucket('community-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        })
        if (createError) {
          console.error('Failed to create bucket:', createError)
          return null
        }
        // Retry upload after creating bucket
        const { error: retryError } = await supabase.storage
          .from('community-images')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (retryError) {
          console.error('Retry upload error:', retryError)
          return null
        }
      } else {
        return null
      }
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

function mapPostRow(row: any, userLikes?: Set<string>): CommunityPost {
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
    isLikedByCurrentUser: userLikes?.has(row.id) || false,
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
