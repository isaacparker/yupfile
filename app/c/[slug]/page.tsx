import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SCOPE_LABELS } from "@/lib/consent-copy"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function PublicConsentRecordPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the consent record by slug (public access - no auth required)
  const { data: record } = await supabase
    .from("consent_records")
    .select(`
      *,
      events:consent_events(*)
    `)
    .eq("slug", slug)
    .single()

  if (!record) {
    notFound()
  }

  // Sort events chronologically (oldest first for display)
  const sortedEvents = [...(record.events || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const latestEvent = sortedEvents[sortedEvents.length - 1]

  const statusColor = (status: string) =>
    ({
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
    }[status] || "bg-gray-100 text-gray-800")

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Consent Record
          </h1>
          <p className="text-gray-600">
            Permanent record of content usage consent
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Status</CardTitle>
              <Badge className={statusColor(latestEvent?.status || "pending")}>
                {latestEvent?.status || "Unknown"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Content</label>
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
                <label className="text-sm font-medium text-gray-500">Creator</label>
                <div className="mt-1">{record.creator_handle}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Platform</label>
                <div className="mt-1 capitalize">{record.platform}</div>
              </div>
            </div>

            {latestEvent && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Current Usage Scope
                </label>
                <div className="mt-1">
                  {SCOPE_LABELS[latestEvent.scope as keyof typeof SCOPE_LABELS] || "Unknown"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent History */}
        <Card>
          <CardHeader>
            <CardTitle>Consent History</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Complete timeline of all consent events (append-only, immutable)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedEvents.map((event, index) => {
                const isLatest = index === sortedEvents.length - 1
                const isInitial = event.event_type === "initial"

                return (
                  <div
                    key={event.id}
                    className="relative border-l-2 border-gray-200 pl-6 pb-6 last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />

                    <div className="space-y-3">
                      {/* Event header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {isInitial ? "Initial Consent Request" : "Scope Expansion Request"}
                        </span>
                        <Badge className={statusColor(event.status)}>
                          {event.status}
                        </Badge>
                        {isLatest && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-sm text-gray-500">
                        Created: {new Date(event.created_at).toLocaleString()}
                        {event.approved_at && (
                          <span className="ml-3 text-green-600">
                            Approved: {new Date(event.approved_at).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Scope */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Usage Scope
                        </label>
                        <div className="mt-1">
                          <Badge variant="outline">
                            {SCOPE_LABELS[event.scope as keyof typeof SCOPE_LABELS]}
                          </Badge>
                        </div>
                      </div>

                      {/* Consent text */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Consent Message (Verbatim)
                        </label>
                        <div className="mt-2 bg-gray-50 p-4 rounded-lg border">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {event.consent_text}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8">
          <p>
            This is a permanent, immutable record of content usage consent.
          </p>
          <p className="mt-1">
            Record created: {new Date(record.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
