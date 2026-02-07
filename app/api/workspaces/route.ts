import { auth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { mapWorkspace } from "@/lib/supabase/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json((rows || []).map(mapWorkspace))
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("workspaces")
    .insert({ name: name.trim(), user_id: session.user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }

  return NextResponse.json(mapWorkspace(row))
}
