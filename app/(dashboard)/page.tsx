import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { mapRecord, mapEvent } from "@/lib/supabase/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SCOPE_LABELS } from "@/lib/consent-copy"
import { statusVariant } from "@/lib/status"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Get workspaces — layout auto-creates one if needed, so we always have at least one
  const { data: workspaceRows } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  // Get selected workspace from cookie
  const cookieStore = await cookies()
  const selectedWorkspaceId = cookieStore.get("consay_workspace_id")?.value

  const workspaces = workspaceRows || []
  const currentWorkspace =
    workspaces.find((w) => w.id === selectedWorkspaceId) || workspaces[0]

  // Fetch consent records for current workspace with their latest event
  let records: Array<ReturnType<typeof mapRecord> & { events: ReturnType<typeof mapEvent>[] }> = []

  if (currentWorkspace) {
    const { data: recordRows } = await supabase
      .from("consent_records")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })

    if (recordRows && recordRows.length > 0) {
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

      records = recordRows.map((row) => ({
        ...mapRecord(row),
        events: (eventsByRecord.get(row.id) || []).slice(0, 1),
      }))
    }
  }

  const showWorkspaceName = workspaces.length > 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consent Records</h1>
          {showWorkspaceName && currentWorkspace && (
            <p className="text-sm text-muted-foreground">
              {currentWorkspace.name}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/new">New Request</Link>
        </Button>
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
            <Button asChild>
              <Link href="/new">Create Consent Request</Link>
            </Button>
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
                            {record.creatorHandle}
                          </h3>
                          <Badge variant="outline" className="capitalize">
                            {record.platform}
                          </Badge>
                          <Badge variant={statusVariant(latestEvent?.status || "pending")}>
                            {latestEvent?.status || "pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Scope: {SCOPE_LABELS[latestEvent?.scope as keyof typeof SCOPE_LABELS] || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {record.contentUrl}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString()}
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
