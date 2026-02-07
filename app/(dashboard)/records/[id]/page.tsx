import { auth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { mapRecord, mapEvent } from "@/lib/supabase/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { CopyButton } from "@/components/copy-button"
import { SCOPE_LABELS } from "@/lib/consent-copy"
import { statusVariant } from "@/lib/status"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; token?: string }>
}

export default async function ConsentRecordPage({ params: paramsPromise, searchParams: searchParamsPromise }: PageProps) {
  const params = await paramsPromise
  const searchParams = await searchParamsPromise
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch the consent record (RLS ensures user can only see their own)
  const { data: recordRow } = await supabase
    .from("consent_records")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!recordRow) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Record Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This consent record doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const record = mapRecord(recordRow)

  // Fetch events for this record
  const { data: eventRows } = await supabase
    .from("consent_events")
    .select("*")
    .eq("record_id", record.id)
    .order("created_at", { ascending: false })

  const events = (eventRows || []).map(mapEvent)
  const latestEvent = events[0]
  const isJustCreated = searchParams.created === "true"
  const approvalUrl = searchParams.token

  // Generate DM message copy
  const dmMessage = latestEvent
    ? `${latestEvent.consentText}\n\n👉 Approve here: ${approvalUrl || `[approval link]`}`
    : ""

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Records</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{record.creatorHandle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consent Record</h1>
          <p className="text-gray-600">
            {record.creatorHandle} &middot; {record.platform}
          </p>
        </div>
        <Badge variant={statusVariant(latestEvent?.status || "pending")}>
          {latestEvent?.status || "Unknown"}
        </Badge>
      </div>

      {isJustCreated && approvalUrl && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">
            Consent Request Created
          </AlertTitle>
          <AlertDescription className="space-y-4">
            <p className="text-green-800">
              Your consent request has been created. Send the approval link to the creator.
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
                Copy this entire message and send it to {record.creatorHandle} via DM
              </p>
            </div>
          </AlertDescription>
        </Alert>
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
                text={`${baseUrl}/c/${record.slug}`}
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
            {events.map((event, index) => (
              <div
                key={event.id}
                className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                  {index === 0 && (
                    <Badge variant="outline" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1">
                    {event.eventType === "initial" ? "Initial Request" : "Expanded Scope"}
                  </div>
                  <div className="text-gray-600 mb-2">
                    Scope: {SCOPE_LABELS[event.scope as keyof typeof SCOPE_LABELS]}
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-xs">
                    <pre className="whitespace-pre-wrap">{event.consentText}</pre>
                  </div>
                  {event.approvedAt && (
                    <div className="text-xs text-green-600 mt-2">
                      Approved: {new Date(event.approvedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" asChild>
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
