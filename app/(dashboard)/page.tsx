import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { WorkspaceCreateDialog } from "@/components/workspace-create-dialog"
import Link from "next/link"
import { SCOPE_LABELS } from "@/lib/consent-copy"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login")
  }

  // Fetch user with workspaces
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      workspaces: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const workspaces = user?.workspaces || []

  // Get selected workspace from cookie
  const cookieStore = await cookies()
  const selectedWorkspaceId = cookieStore.get("consay_workspace_id")?.value

  // Find the current workspace
  const currentWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) || workspaces[0]

  // If no workspaces exist, show empty state
  if (workspaces.length === 0) {
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
  const records = currentWorkspace
    ? await prisma.consentRecord.findMany({
        where: {
          workspaceId: currentWorkspace.id,
        },
        include: {
          events: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

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
                            {record.creatorHandle}
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
