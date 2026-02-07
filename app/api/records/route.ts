import { auth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { mapRecord, mapEvent } from "@/lib/supabase/db"
import { generateApprovalToken, generateSlug, generateTokenExpiry } from "@/lib/tokens"
import { generateConsentText } from "@/lib/consent-copy"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get workspace from cookie
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get("consay_workspace_id")?.value

  if (!workspaceId) {
    return NextResponse.json(
      { error: "No workspace selected. Please select or create a workspace first." },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Verify workspace belongs to user (RLS handles this, but explicit check)
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("user_id", session.user.id)
    .single()

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const body = await request.json()
  const { contentUrl, creatorHandle, platform, scope } = body

  // Validate required fields
  if (!contentUrl || !creatorHandle || !platform || !scope) {
    return NextResponse.json(
      { error: "Missing required fields: contentUrl, creatorHandle, platform, scope" },
      { status: 400 }
    )
  }

  // Validate scope
  if (!["organic", "paid_ads", "organic_and_ads"].includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 })
  }

  try {
    // Generate unique slug (with collision check)
    let slug = generateSlug()
    let { data: existing } = await supabase
      .from("consent_records")
      .select("id")
      .eq("slug", slug)
      .single()
    while (existing) {
      slug = generateSlug()
      const result = await supabase
        .from("consent_records")
        .select("id")
        .eq("slug", slug)
        .single()
      existing = result.data
    }

    // Generate consent text
    const consentText = generateConsentText({
      creatorHandle,
      platform,
      contentUrl,
      scope,
    })

    // Generate approval token
    const approvalToken = generateApprovalToken()
    const approvalTokenExpiry = generateTokenExpiry()

    // Create consent record
    const { data: recordRow, error: recordError } = await supabase
      .from("consent_records")
      .insert({
        slug,
        content_url: contentUrl,
        creator_handle: creatorHandle,
        platform,
        workspace_id: workspace.id,
      })
      .select()
      .single()

    if (recordError || !recordRow) {
      throw new Error(recordError?.message || "Failed to create record")
    }

    // Create initial consent event
    const { data: eventRow, error: eventError } = await supabase
      .from("consent_events")
      .insert({
        record_id: recordRow.id,
        event_type: "initial",
        scope,
        consent_text: consentText,
        status: "pending",
        approval_token: approvalToken,
        approval_token_expiry: approvalTokenExpiry.toISOString(),
      })
      .select()
      .single()

    if (eventError) {
      throw new Error(eventError.message)
    }

    const record = mapRecord(recordRow)
    const event = eventRow ? mapEvent(eventRow) : null

    // Generate approval URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const approvalUrl = `${baseUrl}/approve/${approvalToken}`

    return NextResponse.json({
      record: { ...record, events: event ? [event] : [] },
      approvalUrl,
      consentText,
    })
  } catch (error) {
    console.error("Error creating consent record:", error)
    return NextResponse.json(
      { error: "Failed to create consent record" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get workspace from cookie
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get("consay_workspace_id")?.value

  if (!workspaceId) {
    return NextResponse.json([])
  }

  const supabase = await createClient()

  // Fetch records (RLS ensures user only sees their own)
  const { data: recordRows } = await supabase
    .from("consent_records")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (!recordRows || recordRows.length === 0) {
    return NextResponse.json([])
  }

  // Fetch latest event for each record
  const recordIds = recordRows.map((r) => r.id)
  const { data: eventRows } = await supabase
    .from("consent_events")
    .select("*")
    .in("record_id", recordIds)
    .order("created_at", { ascending: false })

  const eventsByRecord = new Map<string, ReturnType<typeof mapEvent>[]>()
  for (const row of eventRows || []) {
    const mapped = mapEvent(row)
    const existing = eventsByRecord.get(mapped.recordId) || []
    existing.push(mapped)
    eventsByRecord.set(mapped.recordId, existing)
  }

  const records = recordRows.map((row) => ({
    ...mapRecord(row),
    events: (eventsByRecord.get(row.id) || []).slice(0, 1),
  }))

  return NextResponse.json(records)
}
