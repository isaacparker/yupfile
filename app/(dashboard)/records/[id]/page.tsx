import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { SCOPE_LABELS } from "@/lib/consent-copy"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; token?: string }>
}

export default async function ConsentRecordPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { created, token } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch the consent record with events
  const { data: record } = await supabase
    .from("consent_records")
    .select(`
      *,
      events:consent_events(*),
      workspace:workspaces(*)
    `)
    .eq("id", id)
    .single()

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Record Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This consent record doesn't exist or you don't have access to it.
            </p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort events by created_at desc
  const sortedEvents = [...(record.events || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const latestEvent = sortedEvents[0]
  const isJustCreated = created === "true"
  const approvalUrl = token

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  }[latestEvent?.status || "pending"]

  // Generate DM message copy
  const dmMessage = latestEvent
    ? `${latestEvent.consent_text}\n\n👉 Approve here: ${approvalUrl || `[approval link]`}`
    : ""

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consent Record</h1>
          <p className="text-gray-600">
            {record.creator_handle} • {record.platform}
          </p>
        </div>
        <Badge className={statusColor}>
          {latestEvent?.status || "Unknown"}
        </Badge>
      </div>

      {isJustCreated && approvalUrl && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">
              ✅ Consent Request Created!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-800">
              Your consent request has been created successfully. Now send the approval link to the creator.
            </p>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-green-900">
                  Approval Link
                </Label>
                <CopyButton text={approvalUrl} label="Copy Link" />
              </div>
              <div className="bg-white p-3 rounded border border-green-200 text-sm break-all">
                {approvalUrl}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-green-900">
                  Full Message (for DM)
                </Label>
                <CopyButton text={dmMessage} label="Copy Message" />
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <pre className="whitespace-pre-wrap text-sm">{dmMessage}</pre>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Copy this entire message and send it to {record.creator_handle} via DM
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">Content URL</Label>
            <div className="mt-1">
              <a
                href={record.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {record.content_url}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Creator</Label>
              <div className="mt-1">{record.creator_handle}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Platform</Label>
              <div className="mt-1 capitalize">{record.platform}</div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Current Scope</Label>
            <div className="mt-1">
              {SCOPE_LABELS[latestEvent?.scope as keyof typeof SCOPE_LABELS] || "Unknown"}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Public Record URL</Label>
            <div className="mt-1 flex items-center gap-2">
              <Link
                href={`/c/${record.slug}`}
                target="_blank"
                className="text-blue-600 hover:underline break-all"
              >
                {`/c/${record.slug}`}
              </Link>
              <CopyButton
                text={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/c/${record.slug}`}
                label="Copy"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <div
                key={event.id}
                className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={statusColor}>{event.status}</Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                  {index === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1">
                    {event.event_type === "initial" ? "Initial Request" : "Expanded Scope"}
                  </div>
                  <div className="text-gray-600 mb-2">
                    Scope: {SCOPE_LABELS[event.scope as keyof typeof SCOPE_LABELS]}
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-xs">
                    <pre className="whitespace-pre-wrap">{event.consent_text}</pre>
                  </div>
                  {event.approved_at && (
                    <div className="text-xs text-green-600 mt-2">
                      Approved: {new Date(event.approved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
