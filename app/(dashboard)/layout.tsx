import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NavLinks } from "@/components/nav-links"
import { UserMenu } from "@/components/user-menu"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"
import { mapWorkspace } from "@/lib/supabase/db"
import { cookies } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch workspaces for this user
  const { data: workspaceRows } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  let workspaces = (workspaceRows || []).map(mapWorkspace)

  // Auto-create a default workspace if the user has none
  if (workspaces.length === 0) {
    const { data: newRow } = await supabase
      .from("workspaces")
      .insert({ name: "My Workspace", user_id: session.user.id })
      .select()
      .single()

    if (newRow) {
      workspaces = [mapWorkspace(newRow)]
    }
  }

  // Get selected workspace from cookie
  const cookieStore = await cookies()
  const selectedWorkspaceId = cookieStore.get("consay_workspace_id")?.value
  const currentWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) || workspaces[0]

  const handleSignOut = async () => {
    "use server"
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Consay
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <NavLinks />
          </div>

          {/* Right: User menu (workspace controls live inside) */}
          <UserMenu
            email={session.user?.email || ""}
            signOutAction={handleSignOut}
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
          />
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  )
}
