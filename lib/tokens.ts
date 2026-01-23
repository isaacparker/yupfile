import { randomBytes } from "crypto"

/**
 * Generates a cryptographically secure random token for approval links
 * Returns a URL-safe base64 string
 */
export function generateApprovalToken(): string {
  return randomBytes(32).toString("base64url")
}

/**
 * Generates a short, unique slug for public consent record URLs
 * Uses nanoid-like approach with URL-safe characters
 */
export function generateSlug(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  const bytes = randomBytes(length)
  let result = ""

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }

  return result
}

/**
 * Generates an expiry date for approval tokens
 * Default: 30 days from now
 */
export function generateTokenExpiry(daysFromNow: number = 30): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + daysFromNow)
  return expiry
}
