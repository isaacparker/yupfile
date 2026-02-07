"use client"

import { useEffect, useState, use } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle, XCircle, AlertCircle, ShieldCheck } from "lucide-react"
import { SCOPE_LABELS } from "@/lib/consent-copy"

type PageProps = {
  params: Promise<{ token: string }>
}

type ConsentEvent = {
  id: string
  eventType: string
  scope: string
  consentText: string
  status: string
  approvedAt: string | null
  createdAt: string
}

type ConsentRecord = {
  id: string
  slug: string
  contentUrl: string
  creatorHandle: string
  platform: string
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">Consay</span>
      </div>
      {children}
      <p className="text-xs text-gray-400 mt-8">
        Secure consent management by Consay
      </p>
    </div>
  )
}

export default function ApprovalPage({ params: paramsPromise }: PageProps) {
  const params = use(paramsPromise)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [event, setEvent] = useState<ConsentEvent | null>(null)
  const [record, setRecord] = useState<ConsentRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ action: string; timestamp: string } | null>(null)

  // Fetch consent event details on load
  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/approve/details?token=${params.token}`)

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || "Failed to load approval request")
          setLoading(false)
          return
        }

        const data = await response.json()
        setEvent(data.event)
        setRecord(data.record)
      } catch (err) {
        setError("Failed to load approval request")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [params.token])

  const handleAction = async (action: "approve" | "decline") => {
    setProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          action,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to process your response")
        setProcessing(false)
        return
      }

      setSuccess({
        action: action === "approve" ? "approved" : "declined",
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      setError("Failed to process your response. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  // Loading state with skeletons
  if (loading) {
    return (
      <PageWrapper>
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  // Success state
  if (success) {
    const isApproved = success.action === "approved"
    return (
      <PageWrapper>
        <Card className={`max-w-2xl w-full ${isApproved ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-8 w-8 ${isApproved ? "text-green-600" : "text-gray-600"}`} />
              <div>
                <CardTitle className={isApproved ? "text-green-900" : "text-gray-900"}>
                  {isApproved ? "Approved" : "Declined"}
                </CardTitle>
                <CardDescription className={isApproved ? "text-green-700" : "text-gray-600"}>
                  Your response has been recorded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`mb-4 ${isApproved ? "text-green-800" : "text-gray-700"}`}>
              {isApproved
                ? "Thank you for approving this consent request. The requester has been notified and can now use your content as specified."
                : "You have declined this consent request. The requester has been notified."}
            </p>
            {record && (
              <div className={`mt-4 p-4 bg-white rounded border ${isApproved ? "border-green-200" : "border-gray-200"}`}>
                <p className="text-sm text-gray-600">
                  <strong>Content:</strong>{" "}
                  <a
                    href={record.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {record.contentUrl}
                  </a>
                </p>
                {event && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Scope:</strong>{" "}
                    {SCOPE_LABELS[event.scope as keyof typeof SCOPE_LABELS]}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  // Error state
  if (error && !event) {
    return (
      <PageWrapper>
        <Card className="max-w-2xl w-full border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900">Unable to Load Request</CardTitle>
                <CardDescription className="text-red-700">
                  There was a problem with this approval link
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border border-red-200">
              <p className="text-red-800">{error}</p>
            </div>
            <p className="text-sm text-red-700 mt-4">
              If you believe this is an error, please contact the person who sent you this link.
            </p>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  // Already processed state
  if (event?.status !== "pending") {
    return (
      <PageWrapper>
        <Card className="max-w-2xl w-full border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-blue-900">Already Responded</CardTitle>
                <CardDescription className="text-blue-700">
                  This request has already been processed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="text-blue-800 mb-2">
                This consent request was <strong>{event?.status}</strong>
                {event?.approvedAt && (
                  <span> on {new Date(event.approvedAt).toLocaleDateString()}</span>
                )}
                .
              </p>
              {record && (
                <p className="text-sm text-gray-600">
                  <strong>Content:</strong>{" "}
                  <a
                    href={record.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {record.contentUrl}
                  </a>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    )
  }

  // Main approval UI
  return (
    <PageWrapper>
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Content Usage Request</CardTitle>
          <CardDescription>
            Someone would like permission to use your content. Review the details below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {record && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Your Content</Label>
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
                  <Label className="text-sm font-medium text-gray-500">Platform</Label>
                  <div className="mt-1 capitalize">{record.platform}</div>
                </div>
                {event && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Usage Scope</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {SCOPE_LABELS[event.scope as keyof typeof SCOPE_LABELS]}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {event && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Full Request Message
              </Label>
              <pre className="whitespace-pre-wrap text-sm">{event.consentText}</pre>
            </div>
          )}

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-4">
              By approving, you grant permission for this content to be used as described above.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction("approve")}
                disabled={processing}
                className="flex-1"
                size="lg"
              >
                <CheckCircle className="h-4 w-4" />
                {processing ? "Processing..." : "Approve"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={processing}
                    variant="outline"
                    size="lg"
                  >
                    Decline
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The requester will be notified that you have
                      declined permission to use your content.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleAction("decline")}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Yes, decline
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
