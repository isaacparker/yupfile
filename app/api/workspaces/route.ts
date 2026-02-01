import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false })

  return NextResponse.json(workspaces || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      name: name.trim(),
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create workspace:", error)
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }

  return NextResponse.json(workspace)
}
