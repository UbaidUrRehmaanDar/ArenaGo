-- ═══════════════════════════════════════════════════════════════
-- ArenaGo Backend Fixes Migration
-- Fixes:
--   1. Arena INSERT/UPDATE RLS policy for owners
--   2. blocked_slots table (Slot Manager feature)
--   3. Storage buckets: profile-images, arena-images, community-images
--   4. arena_images INSERT policy for owners
--   5. time_slots RLS for owner updates (block/unblock)
--   6. owners table RLS (allow authenticated reads of own record)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. ARENAS RLS ─────────────────────────────────────────────
-- Drop stale policies if they exist, then recreate cleanly
DROP POLICY IF EXISTS "Owners can insert their own arenas"  ON arenas;
DROP POLICY IF EXISTS "Owners can update their own arenas"  ON arenas;
DROP POLICY IF EXISTS "Anyone can view published arenas"    ON arenas;
DROP POLICY IF EXISTS "Owners can view own unpublished arenas" ON arenas;

-- SELECT: Anyone can read arenas (needed for listings page)
CREATE POLICY "Anyone can view arenas"
  ON arenas FOR SELECT
  USING (true);

-- INSERT: Authenticated users can insert arenas they own
CREATE POLICY "Owners can insert their own arenas"
  ON arenas FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Owners can update their own arenas
CREATE POLICY "Owners can update their own arenas"
  ON arenas FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Owners can delete their own arenas
CREATE POLICY "Owners can delete their own arenas"
  ON arenas FOR DELETE
  USING (auth.uid() = owner_id);

-- ── 2. ARENA_IMAGES RLS ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view arena images"              ON arena_images;
DROP POLICY IF EXISTS "Owners can insert images for their arenas" ON arena_images;
DROP POLICY IF EXISTS "Owners can delete their arena images"      ON arena_images;
DROP POLICY IF EXISTS "Owners can update their arena images"      ON arena_images;

CREATE POLICY "Anyone can view arena images"
  ON arena_images FOR SELECT USING (true);

CREATE POLICY "Owners can insert images for their arenas"
  ON arena_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM arenas
      WHERE arenas.id = arena_images.arena_id
        AND arenas.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their arena images"
  ON arena_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM arenas
      WHERE arenas.id = arena_images.arena_id
        AND arenas.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their arena images"
  ON arena_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM arenas
      WHERE arenas.id = arena_images.arena_id
        AND arenas.owner_id = auth.uid()
    )
  );

-- ── 3. BLOCKED_SLOTS TABLE ────────────────────────────────────
-- Simple table: owner explicitly marks a time_slot_id as blocked
CREATE TABLE IF NOT EXISTS blocked_slots (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  arena_id   UUID NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  slot_id    UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (slot_id)
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their blocked slots" ON blocked_slots;
DROP POLICY IF EXISTS "Owners can view their blocked slots"   ON blocked_slots;

CREATE POLICY "Anyone can view blocked slots"
  ON blocked_slots FOR SELECT USING (true);

CREATE POLICY "Owners can insert blocked slots"
  ON blocked_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM arenas
      WHERE arenas.id = blocked_slots.arena_id
        AND arenas.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their blocked slots"
  ON blocked_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM arenas
      WHERE arenas.id = blocked_slots.arena_id
        AND arenas.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_blocked_slots_arena  ON blocked_slots(arena_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_slot   ON blocked_slots(slot_id);

-- ── 4. TIME_SLOTS RLS ─────────────────────────────────────────
-- Allow owners to update status on their own arena's slots

DROP POLICY IF EXISTS "Owners can update slot status" ON time_slots;
DROP POLICY IF EXISTS "Anyone can view time slots"    ON time_slots;
DROP POLICY IF EXISTS "System can update time slots"  ON time_slots;

CREATE POLICY "Anyone can view time slots"
  ON time_slots FOR SELECT USING (true);

CREATE POLICY "Owners can update slot status for their arenas"
  ON time_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courts
      JOIN arenas ON arenas.id = courts.arena_id
      WHERE courts.id = time_slots.court_id
        AND arenas.owner_id = auth.uid()
    )
  );

-- Allow booking system to update slot status (mark as booked)
CREATE POLICY "Authenticated users can update slot status"
  ON time_slots FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── 5. OWNERS TABLE RLS ───────────────────────────────────────
DROP POLICY IF EXISTS "Owners can view their own record"   ON owners;
DROP POLICY IF EXISTS "Owners can update their own record" ON owners;
DROP POLICY IF EXISTS "Owners can insert their own record" ON owners;

CREATE POLICY "Owners can view their own record"
  ON owners FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Owners can insert their own record"
  ON owners FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Owners can update their own record"
  ON owners FOR UPDATE
  USING (auth.uid() = profile_id);

-- ── 6. STORAGE BUCKETS ────────────────────────────────────────
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('arena-images',   'arena-images',   true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('community-images','community-images',true,5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for profile-images
DROP POLICY IF EXISTS "Public profile images viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar"    ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar"    ON storage.objects;

CREATE POLICY "Public profile images viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS for arena-images
DROP POLICY IF EXISTS "Public arena images viewable"        ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload arena images"      ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their arena images storage" ON storage.objects;

CREATE POLICY "Public arena images viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'arena-images');

CREATE POLICY "Owners can upload arena images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'arena-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Owners can delete their arena images storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'arena-images'
    AND auth.role() = 'authenticated'
  );
