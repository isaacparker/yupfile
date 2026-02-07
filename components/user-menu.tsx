"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Building2, Plus, Check, Settings, ChevronDown } from "lucide-react"
import { setWorkspace } from "@/app/actions/workspace"
import type { Workspace } from "@/lib/supabase/db"

function getInitials(email: string): string {
  const local = email.split("@")[0] || ""
  // Try to split on dots or underscores for two initials
  const parts = local.split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

type UserMenuProps = {
  email: string
  signOutAction: () => Promise<void>
  workspaces: Workspace[]
  currentWorkspace?: Workspace
}

export function UserMenu({
  email,
  signOutAction,
  workspaces,
  currentWorkspace,
}: UserMenuProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const hasMultipleWorkspaces = workspaces.length > 1

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await setWorkspace(workspaceId)
    router.refresh()
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) throw new Error("Failed to create workspace")

      setName("")
      setCreateOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating workspace:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2 h-auto py-1.5">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {getInitials(email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline max-w-[150px] truncate text-sm">
              {email}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Account info */}
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{email}</p>
            {currentWorkspace && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentWorkspace.name}
              </p>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Workspace section — switch only shows if 2+ */}
          {hasMultipleWorkspaces && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className="h-4 w-4 mr-2" />
                Switch Workspace
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                  >
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === currentWorkspace?.id && (
                      <Check className="h-4 w-4 ml-2 text-green-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Future: settings link */}
          <DropdownMenuItem disabled>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign out */}
          <DropdownMenuItem asChild>
            <form action={signOutAction} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create workspace dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateWorkspace}>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Add a new workspace to organize consent records by brand or
                client.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Brand, Client Name"
                className="mt-2"
                disabled={isCreating}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !name.trim()}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
