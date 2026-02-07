import { createClient } from "@/lib/supabase/server"
import { mapEvent, mapRecord } from "@/lib/supabase/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Find the consent event by approval token
    const { data: eventRow, error: eventError } = await supabase
      .from("consent_events")
      .select("*")
      .eq("approval_token", token)
      .single()

    if (eventError || !eventRow) {
      return NextResponse.json(
        { error: "Invalid approval link. This link may be incorrect." },
        { status: 404 }
      )
    }

    // Fetch the associated record
    const { data: recordRow } = await supabase
      .from("consent_records")
      .select("*")
      .eq("id", eventRow.record_id)
      .single()

    return NextResponse.json({
      event: mapEvent(eventRow),
      record: recordRow ? mapRecord(recordRow) : null,
    })
  } catch (error) {
    console.error("Error fetching approval details:", error)
    return NextResponse.json(
      { error: "Failed to load approval details" },
      { status: 500 }
    )
  }
}
