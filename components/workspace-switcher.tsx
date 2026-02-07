"use client"

import { useRouter } from "next/navigation"
import { setWorkspace } from "@/app/actions/workspace"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Workspace } from "@/lib/supabase/db"

type WorkspaceSwitcherProps = {
  workspaces: Workspace[]
  currentWorkspaceId?: string
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter()

  const handleWorkspaceChange = async (workspaceId: string) => {
    await setWorkspace(workspaceId)
    router.refresh()
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No workspaces yet
      </div>
    )
  }

  const selectedWorkspace =
    currentWorkspaceId || workspaces[0]?.id || ""

  return (
    <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            {workspace.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
