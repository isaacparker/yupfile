import { cookies } from "next/headers"

const WORKSPACE_COOKIE = "consay_workspace_id"

export async function getSelectedWorkspaceId(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(WORKSPACE_COOKIE)?.value
}

export async function setSelectedWorkspaceId(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  })
}
