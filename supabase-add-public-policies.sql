-- Run this if you already ran supabase-migration.sql and need to add public access policies.
-- These are needed for the /c/[slug] public record page and /approve/[token] approval page.

-- Public read access for consent records (needed for /c/[slug])
CREATE POLICY "Anyone can view consent records by slug"
  ON consent_records FOR SELECT
  USING (true);

-- Public read access for consent events (needed for /approve/[token] and /c/[slug])
CREATE POLICY "Anyone can view consent events by token"
  ON consent_events FOR SELECT
  USING (true);
