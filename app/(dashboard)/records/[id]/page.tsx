import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { SCOPE_LABELS } from "@/lib/consent-copy"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: { id: string }
  searchParams: { created?: string; token?: string }
}

export default async function ConsentRecordPage({ params, searchParams }: PageProps) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/login")
  }

  // Fetch the consent record
  const record = await prisma.consentRecord.findFirst({
    where: {
      id: params.id,
      workspace: {
        userId: user.id,
      },
    },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
      },
      workspace: true,
    },
  })

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

  const latestEvent = record.events[0]
  const isJustCreated = searchParams.created === "true"
  const approvalUrl = searchParams.token

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  }[latestEvent?.status || "pending"]

  // Generate DM message copy
  const dmMessage = latestEvent
    ? `${latestEvent.consentText}\n\n👉 Approve here: ${approvalUrl || `[approval link]`}`
    : ""

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consent Record</h1>
          <p className="text-gray-600">
            {record.creatorHandle} • {record.platform}
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
                Copy this entire message and send it to {record.creatorHandle} via DM
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
                href={record.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {record.contentUrl}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                {typeof window !== "undefined"
                  ? `${window.location.origin}/c/${record.slug}`
                  : `/c/${record.slug}`}
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
            {record.events.map((event, index) => (
              <div
                key={event.id}
                className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={statusColor}>{event.status}</Badge>
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
