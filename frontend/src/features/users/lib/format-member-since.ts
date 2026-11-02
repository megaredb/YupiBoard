import { formatMonthYear } from "@/shared/lib/format/format-date"

/** "Nov 2026" from the account's `created_at`; `null` when unknown. */
export function formatMemberSince(createdAt: string | undefined): string | null {
  return createdAt ? formatMonthYear(createdAt) : null
}
