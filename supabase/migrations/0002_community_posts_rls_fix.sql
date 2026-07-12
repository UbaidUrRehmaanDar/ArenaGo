-- Ensure RLS policies for community_posts UPDATE/DELETE exist.
-- Safe to re-run; drops and recreates the policies idempotently.

DROP POLICY IF EXISTS "Authors can update their own posts" ON community_posts;
CREATE POLICY "Authors can update their own posts"
  ON community_posts FOR UPDATE
  USING (
    auth.uid() = author_id
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'owner')
      )
    )
  )
  WITH CHECK (
    auth.uid() = author_id
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'owner')
      )
    )
  );

DROP POLICY IF EXISTS "Authors can delete their own posts" ON community_posts;
CREATE POLICY "Authors can delete their own posts"
  ON community_posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'owner')
      )
    )
  );
