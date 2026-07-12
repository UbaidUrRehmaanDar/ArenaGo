-- Community Feature Schema for ArenaGo
-- This migration creates tables for posts, images, comments, likes, and reports

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop existing tables for clean migration ───────────────────────────────────
DROP TABLE IF EXISTS community_reports CASCADE;
DROP TABLE IF EXISTS community_likes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_post_images CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE community_posts (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption      TEXT NOT NULL,
  post_type    VARCHAR(20) NOT NULL DEFAULT 'general'
               CHECK (post_type IN ('general', 'announcement', 'tournament')),
  is_deleted   BOOLEAN DEFAULT FALSE,
  like_count   INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE community_post_images (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  alt_text   TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE community_comments (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE community_likes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE community_reports (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending'
              CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, reporter_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_community_posts_author  ON community_posts(author_id);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_type    ON community_posts(post_type);
CREATE INDEX idx_community_post_images_post ON community_post_images(post_id);
CREATE INDEX idx_community_comments_post   ON community_comments(post_id);
CREATE INDEX idx_community_comments_author ON community_comments(author_id);
CREATE INDEX idx_community_likes_post   ON community_likes(post_id);
CREATE INDEX idx_community_likes_user   ON community_likes(user_id);
CREATE INDEX idx_community_reports_post ON community_reports(post_id);
CREATE INDEX idx_community_reports_status ON community_reports(status);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE community_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports      ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Posts are viewable by everyone"
  ON community_posts FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Users can create their own posts"
  ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON community_posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can soft-delete their own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = author_id AND is_deleted = FALSE)
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for community_post_images
CREATE POLICY "Post images are viewable by everyone"
  ON community_post_images FOR SELECT USING (true);

CREATE POLICY "Users can add images to their own posts"
  ON community_post_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE community_posts.id = community_post_images.post_id
        AND community_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from their own posts"
  ON community_post_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE community_posts.id = community_post_images.post_id
        AND community_posts.author_id = auth.uid()
    )
  );

-- RLS Policies for community_comments
CREATE POLICY "Comments are viewable by everyone"
  ON community_comments FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Users can create their own comments"
  ON community_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON community_comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can soft-delete their own comments"
  ON community_comments FOR UPDATE
  USING (auth.uid() = author_id AND is_deleted = FALSE)
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for community_likes
CREATE POLICY "Likes are viewable by everyone"
  ON community_likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts"
  ON community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON community_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_reports
CREATE POLICY "Users can view their own reports"
  ON community_reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can report posts"
  ON community_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can update their own reports"
  ON community_reports FOR UPDATE USING (auth.uid() = reporter_id);

-- ── Functions & Triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_like_count ON community_likes;
CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE) THEN
    UPDATE community_posts SET comment_count = comment_count - 1
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_count ON community_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR UPDATE OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON community_posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON community_comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
