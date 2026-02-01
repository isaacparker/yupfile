import { createClient } from "@/lib/supabase/server"
import { generateApprovalToken, generateSlug, generateTokenExpiry } from "@/lib/tokens"
import { generateConsentText } from "@/lib/consent-copy"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get workspace from cookie, or fallback to first workspace
  const cookieStore = await cookies()
  let workspaceId = cookieStore.get("consay_workspace_id")?.value

  // If no cookie, get first workspace for this user
  if (!workspaceId) {
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)

    workspaceId = workspaces?.[0]?.id
  }

  if (!workspaceId) {
    return NextResponse.json(
      { error: "No workspace found. Please create a workspace first." },
      { status: 400 }
    )
  }

  // Verify workspace belongs to user (RLS will handle this, but we check explicitly)
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (workspaceError || !workspace) {
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
    let { data: slugExists } = await supabase
      .from("consent_records")
      .select("id")
      .eq("slug", slug)
      .single()

    while (slugExists) {
      slug = generateSlug()
      const result = await supabase
        .from("consent_records")
        .select("id")
        .eq("slug", slug)
        .single()
      slugExists = result.data
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
    const { data: record, error: recordError } = await supabase
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

    if (recordError || !record) {
      throw recordError || new Error("Failed to create record")
    }

    // Create initial consent event
    const { data: event, error: eventError } = await supabase
      .from("consent_events")
      .insert({
        record_id: record.id,
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
      throw eventError
    }

    // Generate approval URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const approvalUrl = `${baseUrl}/approve/${approvalToken}`

    return NextResponse.json({
      record: { ...record, events: [event] },
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get workspace from cookie
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get("consay_workspace_id")?.value

  if (!workspaceId) {
    return NextResponse.json([])
  }

  // Fetch all records for the workspace (RLS will filter by user)
  const { data: records } = await supabase
    .from("consent_records")
    .select(`
      *,
      events:consent_events(*)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  // Get only the latest event for each record (sort by created_at desc first)
  const recordsWithLatestEvent = (records || []).map(record => ({
    ...record,
    events: record.events
      ?.sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 1) || []
  }))

  return NextResponse.json(recordsWithLatestEvent)
}
