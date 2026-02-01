import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import { WorkspaceCreateDialog } from "@/components/workspace-create-dialog"
import { cookies } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch workspaces for current user
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false })

  const workspaceList = workspaces || []

  // Get selected workspace from cookie, fallback to first workspace
  const cookieStore = await cookies()
  const cookieWorkspaceId = cookieStore.get("consay_workspace_id")?.value
  const selectedWorkspaceId = cookieWorkspaceId || workspaceList[0]?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Consay
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Records
              </Link>
              <Link
                href="/new"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                New Request
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <WorkspaceSwitcher
              workspaces={workspaceList}
              currentWorkspaceId={selectedWorkspaceId}
            />
            <WorkspaceCreateDialog />
            <span className="text-sm text-gray-600">{user.email}</span>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/login")
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  )
}
