"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const WORKSPACE_COOKIE = "consay_workspace_id"

export async function setWorkspace(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  })
  revalidatePath("/")
}
