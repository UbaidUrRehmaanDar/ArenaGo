# Community Feature - Setup Instructions

The Community feature has been implemented in the codebase. Follow these steps to complete the setup.

## Database Migration

Run the SQL migration to create the community tables:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL from supabase/migrations/community_schema.sql in your Supabase SQL Editor
```

## Storage Bucket Setup

You need to create a storage bucket for community images:

1. Go to your Supabase project dashboard
2. Navigate to **Storage**
3. Click **"New bucket"**
4. Name it: `community-images`
5. Make it **public**
6. Configure RLS policies (optional, the code handles uploads with the anon key)

## Features Implemented

### Navigation
- ✅ Added "Community" link to desktop navbar
- ✅ Added "Community" link to mobile bottom navigation

### Database Schema
- ✅ `community_posts` - Posts table with author, caption, type, timestamps
- ✅ `community_post_images` - Image attachments for posts
- ✅ `community_comments` - Comments on posts
- ✅ `community_likes` - Like tracking
- ✅ `community_reports` - Post reporting
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Automatic triggers for like/comment counts

### API Layer (`src/services/communityData.ts`)
- ✅ `fetchPosts()` - Get posts with filtering and pagination
- ✅ `fetchPostById()` - Get single post
- ✅ `createPost()` - Create new post with images
- ✅ `updatePost()` - Update existing post
- ✅ `deletePost()` - Soft delete post
- ✅ `likePost()` / `unlikePost()` - Like/unlike posts
- ✅ `hasUserLikedPost()` - Check like status
- ✅ `fetchComments()` - Get comments for a post
- ✅ `createComment()` - Add comment
- ✅ `updateComment()` - Edit own comment
- ✅ `deleteComment()` - Delete own comment
- ✅ `reportPost()` - Report a post
- ✅ `uploadPostImage()` - Upload images to storage
- ✅ `deletePostImage()` - Delete images from storage

### UI Components
- ✅ `PostCard` - Post display with author info, images, actions
- ✅ `CreatePostModal` - Modal for creating posts with image upload
- ✅ `CommentsSection` - Collapsible comments with add/edit/delete

### Community Page (`src/pages/Community.tsx`)
- ✅ Feed with infinite scroll
- ✅ Search functionality
- ✅ Filter chips (Latest, Popular, Players, Arenas, Tournaments)
- ✅ Create post button (for authenticated users)
- ✅ Like/unlike posts
- ✅ Empty state
- ✅ Loading skeleton
- ✅ Post count display

### User Roles
- ✅ Players can create general posts
- ✅ Arena Owners can create announcements and tournaments
- ✅ Verified badge for arena owners
- ✅ Post type indicators (Announcement, Tournament)

### Permissions
- ✅ Users can edit/delete their own posts
- ✅ Users can edit/delete their own comments
- ✅ Users can report posts
- ✅ Everyone can view posts and comments

## File Structure

```
src/
├── components/ui/
│   ├── PostCard.tsx
│   ├── CreatePostModal.tsx
│   └── CommentsSection.tsx
├── pages/
│   └── Community.tsx
├── services/
│   └── communityData.ts
├── types/
│   └── index.ts (added Community types)
└── components/layout/
    ├── Navbar.tsx (updated)
    └── MobileBottomNav.tsx (updated)

supabase/
└── migrations/
    └── community_schema.sql
```

## TypeScript Types Added

- `PostType` - 'general' | 'announcement' | 'tournament'
- `CommunityPost` - Post data structure
- `PostImage` - Image data structure
- `CommunityComment` - Comment data structure
- `CommunityLike` - Like data structure
- `CommunityReport` - Report data structure
- `CommunityFilter` - Filter options

## Next Steps

1. **Run the migration** - Execute the SQL in Supabase
2. **Create storage bucket** - Set up `community-images` bucket
3. **Test the feature** - Navigate to `/community` and test:
   - Creating posts with images
   - Liking posts
   - Adding comments
   - Filtering posts
   - Searching posts

## Notes

- The feature uses the existing design language (colors, typography, spacing)
- All animations and transitions match the existing ArenaGo style
- Image uploads support up to 5 images per post
- Comments are displayed newest first
- Posts support soft delete (marked as deleted but not removed)
- Like and comment counts are automatically updated via database triggers
