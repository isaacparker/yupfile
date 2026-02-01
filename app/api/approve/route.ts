import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { token, action } = body

  if (!token || !action) {
    return NextResponse.json(
      { error: "Missing token or action" },
      { status: 400 }
    )
  }

  if (!["approve", "decline"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'decline'" },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()

    // Find the consent event by approval token
    const { data: event, error: fetchError } = await supabase
      .from("consent_events")
      .select(`
        *,
        record:consent_records(*)
      `)
      .eq("approval_token", token)
      .single()

    if (fetchError || !event) {
      return NextResponse.json(
        { error: "Invalid approval link. This link may be incorrect or has already been used." },
        { status: 404 }
      )
    }

    // Check if already approved or declined
    if (event.status !== "pending") {
      return NextResponse.json(
        {
          error: `This request has already been ${event.status}.`,
          status: event.status,
          approvedAt: event.approved_at,
        },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (event.approval_token_expiry && new Date() > new Date(event.approval_token_expiry)) {
      return NextResponse.json(
        { error: "This approval link has expired. Please contact the requester for a new link." },
        { status: 400 }
      )
    }

    // Update the event status
    const { data: updatedEvent, error: updateError } = await supabase
      .from("consent_events")
      .update({
        status: action === "approve" ? "approved" : "declined",
        approved_at: action === "approve" ? new Date().toISOString() : null,
      })
      .eq("id", event.id)
      .select(`
        *,
        record:consent_records(*)
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      status: updatedEvent.status,
      record: updatedEvent.record,
    })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    )
  }
}
