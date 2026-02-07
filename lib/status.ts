export type ConsentStatus = "pending" | "approved" | "declined"

export const STATUS_LABELS: Record<ConsentStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
}

/**
 * Maps a status string to a Badge variant name.
 * Falls back to "secondary" for unknown statuses.
 */
export function statusVariant(status: string): "pending" | "approved" | "declined" | "secondary" {
  if (status === "pending" || status === "approved" || status === "declined") {
    return status
  }
  return "secondary"
}
