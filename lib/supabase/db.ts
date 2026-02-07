/**
 * Typed helpers for Supabase database queries.
 *
 * Supabase tables use snake_case columns. These types and helpers
 * keep the rest of the app working with the same shapes it used
 * under Prisma (camelCase).
 */

// ── Row types (as stored in Supabase, snake_case) ─────────────
export type WorkspaceRow = {
  id: string
  name: string
  user_id: string
  created_at: string
}

export type ConsentRecordRow = {
  id: string
  slug: string
  content_url: string
  creator_handle: string
  platform: string
  workspace_id: string
  created_at: string
}

export type ConsentEventRow = {
  id: string
  record_id: string
  event_type: string
  scope: string
  consent_text: string
  status: string
  approval_token: string
  approval_token_expiry: string | null
  approved_at: string | null
  created_at: string
}

// ── App types (camelCase, matching old Prisma models) ─────────
export type Workspace = {
  id: string
  name: string
  userId: string
  createdAt: string
}

export type ConsentRecord = {
  id: string
  slug: string
  contentUrl: string
  creatorHandle: string
  platform: string
  workspaceId: string
  createdAt: string
}

export type ConsentEvent = {
  id: string
  recordId: string
  eventType: string
  scope: string
  consentText: string
  status: string
  approvalToken: string
  approvalTokenExpiry: string | null
  approvedAt: string | null
  createdAt: string
}

// ── Mappers ───────────────────────────────────────────────────
export function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    createdAt: row.created_at,
  }
}

export function mapRecord(row: ConsentRecordRow): ConsentRecord {
  return {
    id: row.id,
    slug: row.slug,
    contentUrl: row.content_url,
    creatorHandle: row.creator_handle,
    platform: row.platform,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
  }
}

export function mapEvent(row: ConsentEventRow): ConsentEvent {
  return {
    id: row.id,
    recordId: row.record_id,
    eventType: row.event_type,
    scope: row.scope,
    consentText: row.consent_text,
    status: row.status,
    approvalToken: row.approval_token,
    approvalTokenExpiry: row.approval_token_expiry,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  }
}
