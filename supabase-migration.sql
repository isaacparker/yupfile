-- Supabase Migration for Consay/Yupfile
-- Run this in Supabase SQL Editor

-- Workspaces table
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent Records table
CREATE TABLE consent_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  content_url TEXT NOT NULL,
  creator_handle TEXT NOT NULL,
  platform TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent Events table
CREATE TABLE consent_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  record_id TEXT NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  scope TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  status TEXT NOT NULL,
  approval_token TEXT UNIQUE NOT NULL,
  approval_token_expiry TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Screenshots table
CREATE TABLE screenshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  record_id TEXT NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Workspaces
CREATE POLICY "Users can view their own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces"
  ON workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Consent Records
CREATE POLICY "Users can view records in their workspaces"
  ON consent_records FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create records in their workspaces"
  ON consent_records FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Consent Events
CREATE POLICY "Users can view events for their records"
  ON consent_events FOR SELECT
  USING (
    record_id IN (
      SELECT id FROM consent_records
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create events for their records"
  ON consent_events FOR INSERT
  WITH CHECK (
    record_id IN (
      SELECT id FROM consent_records
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can update events with valid approval token"
  ON consent_events FOR UPDATE
  USING (true);

-- RLS Policies for Screenshots
CREATE POLICY "Users can view screenshots for their records"
  ON screenshots FOR SELECT
  USING (
    record_id IN (
      SELECT id FROM consent_records
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create screenshots for their records"
  ON screenshots FOR INSERT
  WITH CHECK (
    record_id IN (
      SELECT id FROM consent_records
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_consent_records_workspace_id ON consent_records(workspace_id);
CREATE INDEX idx_consent_records_slug ON consent_records(slug);
CREATE INDEX idx_consent_events_record_id ON consent_events(record_id);
CREATE INDEX idx_consent_events_approval_token ON consent_events(approval_token);
CREATE INDEX idx_screenshots_record_id ON screenshots(record_id);
