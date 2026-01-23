"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

type PageProps = {
  params: { token: string }
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

const SCOPE_LABELS = {
  organic: "Organic social media posts only",
  paid_ads: "Paid advertising",
  organic_and_ads: "Both organic posts and paid advertising",
} as const

export default function ApprovalPage({ params }: PageProps) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">
                  {success.action === "approved" ? "✅ Approved!" : "Declined"}
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your response has been recorded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-800 mb-4">
              {success.action === "approved"
                ? "Thank you for approving this consent request. The requester has been notified and can now use your content as specified."
                : "You have declined this consent request. The requester has been notified."}
            </p>
            {record && (
              <div className="mt-4 p-4 bg-white rounded border border-green-200">
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
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900">Unable to Process Request</CardTitle>
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
      </div>
    )
  }

  // Already processed state
  if (event?.status !== "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-blue-900">Already Responded</CardTitle>
                <CardDescription className="text-blue-700">
                  You've already responded to this request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="text-blue-800 mb-2">
                This consent request was <strong>{event.status}</strong>
                {event.approvedAt && (
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
      </div>
    )
  }

  // Main approval UI
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Content Usage Approval Request</CardTitle>
          <CardDescription>
            Someone would like to use your content. Please review and respond below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {record && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Your Content</label>
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
                  <label className="text-sm font-medium text-gray-500">Platform</label>
                  <div className="mt-1 capitalize">{record.platform}</div>
                </div>
                {event && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usage Scope</label>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Full Request Message
              </label>
              <pre className="whitespace-pre-wrap text-sm">{event.consentText}</pre>
            </div>
          )}

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-4">
              By clicking "Approve," you grant permission for this content to be used as described above.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => handleAction("approve")}
                disabled={processing}
                className="flex-1"
                size="lg"
              >
                {processing ? "Processing..." : "✓ Approve"}
              </Button>
              <Button
                onClick={() => handleAction("decline")}
                disabled={processing}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {processing ? "Processing..." : "✗ Decline"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
