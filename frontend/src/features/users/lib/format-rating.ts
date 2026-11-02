import { formatDecimal, parseDecimal } from "@/shared/lib/format/format-number"

/** Ratings arrive as decimal strings ("4.20"); `null` when the user has no rating yet. */
export function formatRating(rating: string | null | undefined): string | null {
  if (rating == null) return null
  return formatDecimal(parseDecimal(rating), 1)
}
