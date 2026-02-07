import { createClient } from "@/lib/supabase/server"
import { mapRecord, mapEvent } from "@/lib/supabase/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SCOPE_LABELS } from "@/lib/consent-copy"
import { statusVariant } from "@/lib/status"
import { ShieldCheck } from "lucide-react"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function PublicConsentRecordPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise
  const supabase = await createClient()

  // Fetch the consent record by slug (public access via RLS)
  const { data: recordRow } = await supabase
    .from("consent_records")
    .select("*")
    .eq("slug", params.slug)
    .single()

  if (!recordRow) {
    notFound()
  }

  const record = mapRecord(recordRow)

  // Fetch events in chronological order
  const { data: eventRows } = await supabase
    .from("consent_events")
    .select("*")
    .eq("record_id", record.id)
    .order("created_at", { ascending: true })

  const events = (eventRows || []).map(mapEvent)
  const latestEvent = events[events.length - 1]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Consay</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Consent Record
          </h1>
          <p className="text-gray-600">
            Verified record of content usage consent
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Status</CardTitle>
              <Badge variant={statusVariant(latestEvent?.status || "pending")}>
                {latestEvent?.status || "Unknown"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Content</Label>
              <div className="mt-1">
                <a
                  href={record.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {record.contentUrl}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Creator</Label>
                <div className="mt-1">{record.creatorHandle}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Platform</Label>
                <div className="mt-1 capitalize">{record.platform}</div>
              </div>
            </div>

            {latestEvent && (
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Current Usage Scope
                </Label>
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
              {events.map((event, index) => {
                const isLatest = index === events.length - 1
                const isInitial = event.eventType === "initial"

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
                        <Badge variant={statusVariant(event.status)}>
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
                        Created: {new Date(event.createdAt).toLocaleString()}
                        {event.approvedAt && (
                          <span className="ml-3 text-green-600">
                            Approved: {new Date(event.approvedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Scope */}
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase">
                          Usage Scope
                        </Label>
                        <div className="mt-1">
                          <Badge variant="outline">
                            {SCOPE_LABELS[event.scope as keyof typeof SCOPE_LABELS]}
                          </Badge>
                        </div>
                      </div>

                      {/* Consent text */}
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase">
                          Consent Message (Verbatim)
                        </Label>
                        <div className="mt-2 bg-gray-50 p-4 rounded-lg border">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {event.consentText}
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

        {/* Footer with branding */}
        <Separator />
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified by Consay</span>
          </div>
          <p>
            This is a permanent, immutable record of content usage consent.
          </p>
          <p>
            Record created: {new Date(record.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
