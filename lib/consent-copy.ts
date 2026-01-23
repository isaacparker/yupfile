type Scope = "organic" | "paid_ads" | "organic_and_ads"

export const SCOPE_LABELS = {
  organic: "Organic social media posts only",
  paid_ads: "Paid advertising",
  organic_and_ads: "Both organic posts and paid advertising",
} as const

export const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter/X" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "other", label: "Other" },
] as const

export function generateConsentText(params: {
  creatorHandle: string
  platform: string
  contentUrl: string
  scope: Scope
}): string {
  const { creatorHandle, platform, contentUrl, scope } = params

  const scopeText = {
    organic: "share your content on our organic social media posts",
    paid_ads: "use your content in our paid advertising campaigns",
    organic_and_ads:
      "share your content on our organic social media posts and use it in our paid advertising campaigns",
  }[scope]

  return `Hi ${creatorHandle}! We'd love to ${scopeText}.

The content we're referring to is: ${contentUrl}

This permission would allow us to repost and promote this specific piece of content${
    scope === "paid_ads" || scope === "organic_and_ads"
      ? ", including using it in paid advertisements across social media platforms"
      : ""
  }.

If you're cool with this, just click the approval link below. You can always reach out if you have questions.

Thanks!`
}

export function generateFollowUpConsentText(params: {
  creatorHandle: string
  originalScope: Scope
  newScope: Scope
  contentUrl: string
}): string {
  const { creatorHandle, originalScope, newScope, contentUrl } = params

  const originalScopeText = SCOPE_LABELS[originalScope].toLowerCase()
  const newScopeText = SCOPE_LABELS[newScope].toLowerCase()

  return `Hi ${creatorHandle}! Quick follow-up about your content (${contentUrl}).

You previously approved us to use this for: ${originalScopeText}

We'd now like to expand that to: ${newScopeText}

If you're okay with this expanded usage, just click the approval link below.

Thanks again!`
}
