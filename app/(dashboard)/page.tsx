import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { WorkspaceCreateDialog } from "@/components/workspace-create-dialog"
import Link from "next/link"
import { SCOPE_LABELS } from "@/lib/consent-copy"

export default async function HomePage() {
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

  // Get selected workspace from cookie
  const cookieStore = await cookies()
  const selectedWorkspaceId = cookieStore.get("consay_workspace_id")?.value

  // Find the current workspace
  const currentWorkspace = workspaceList.find((w) => w.id === selectedWorkspaceId) || workspaceList[0]

  // If no workspaces exist, show empty state
  if (workspaceList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Consay</h1>
          <p className="text-gray-600">
            Create your first workspace to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No workspaces yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Workspaces help you organize consent records by brand or client.
            </p>
            <WorkspaceCreateDialog />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch consent records for current workspace
  let records: Array<{
    id: string
    slug: string
    content_url: string
    creator_handle: string
    platform: string
    workspace_id: string
    created_at: string
    events: Array<{
      id: string
      status: string
      scope: string
    }>
  }> = []

  if (currentWorkspace) {
    const { data: recordsData } = await supabase
      .from("consent_records")
      .select(`
        *,
        events:consent_events(id, status, scope)
      `)
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })

    records = (recordsData || []).map(r => ({
      ...r,
      events: r.events
        ?.sort((a: { id: string; status: string; scope: string; created_at?: string }, b: { id: string; status: string; scope: string; created_at?: string }) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
        .slice(0, 1) || []
    }))
  }

  const statusColor = (status: string) =>
    ({
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
    }[status] || "bg-gray-100 text-gray-800")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consent Records</h1>
          {currentWorkspace && (
            <p className="text-gray-600">
              Workspace: <span className="font-medium">{currentWorkspace.name}</span>
            </p>
          )}
        </div>
        <Link href="/new">
          <Button>New Request</Button>
        </Link>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No records yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Create your first consent request to get started.
            </p>
            <Link href="/new">
              <Button>Create Consent Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const latestEvent = record.events[0]
            return (
              <Link key={record.id} href={`/records/${record.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {record.creator_handle}
                          </h3>
                          <Badge variant="outline" className="capitalize">
                            {record.platform}
                          </Badge>
                          <Badge className={statusColor(latestEvent?.status || "pending")}>
                            {latestEvent?.status || "pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Scope: {SCOPE_LABELS[latestEvent?.scope as keyof typeof SCOPE_LABELS] || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {record.content_url}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
