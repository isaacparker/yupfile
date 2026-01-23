"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLATFORMS, SCOPE_LABELS, generateConsentText } from "@/lib/consent-copy"

type Scope = "organic" | "paid_ads" | "organic_and_ads"

export default function NewConsentRequestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    contentUrl: "",
    creatorHandle: "",
    platform: "",
    scope: "" as Scope | "",
  })

  // Generate preview of consent text
  const consentPreview =
    formData.contentUrl &&
    formData.creatorHandle &&
    formData.platform &&
    formData.scope
      ? generateConsentText({
          contentUrl: formData.contentUrl,
          creatorHandle: formData.creatorHandle,
          platform: formData.platform,
          scope: formData.scope as Scope,
        })
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.contentUrl || !formData.creatorHandle || !formData.platform || !formData.scope) {
      setError("All fields are required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create consent request")
      }

      const data = await response.json()

      // Redirect to success page with the record data
      router.push(
        `/records/${data.record.id}?created=true&token=${encodeURIComponent(data.approvalUrl)}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Consent Request</h1>
        <p className="text-gray-600">
          Create a new consent request for UGC content
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>
              Information about the content you want to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="contentUrl">Content URL *</Label>
              <Input
                id="contentUrl"
                type="url"
                placeholder="https://instagram.com/p/..."
                value={formData.contentUrl}
                onChange={(e) =>
                  setFormData({ ...formData, contentUrl: e.target.value })
                }
                required
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Link to the original post or content
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creatorHandle">Creator Handle *</Label>
                <Input
                  id="creatorHandle"
                  placeholder="@username"
                  value={formData.creatorHandle}
                  onChange={(e) =>
                    setFormData({ ...formData, creatorHandle: e.target.value })
                  }
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                  required
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="scope">Usage Scope *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) =>
                  setFormData({ ...formData, scope: value as Scope })
                }
                required
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                What will this content be used for?
              </p>
            </div>
          </CardContent>
        </Card>

        {consentPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Consent Message Preview</CardTitle>
              <CardDescription>
                This is what the creator will see
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {consentPreview}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Consent Request"}
          </Button>
        </div>
      </form>
    </div>
  )
}
