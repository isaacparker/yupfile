import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { WorkspaceCreateDialog } from "@/components/workspace-create-dialog"

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consent Records</h1>
        {currentWorkspace && (
          <p className="text-gray-600">
            Workspace: <span className="font-medium">{currentWorkspace.name}</span>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No records yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Create your first consent request to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
