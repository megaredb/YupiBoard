import type { EventListItem, EventRead } from "@/shared/api/generated/model"
import { formatPrice, parseDecimal } from "@/shared/lib/format/format-number"
import { getEventCurrency } from "@/features/events/lib/event-currency"

export type EventPrice = { isFree: true } | { isFree: false; formatted: string }

export function getEventPrice(
  event: Pick<EventRead | EventListItem, "id" | "entry_cost">,
): EventPrice {
  const amount = parseDecimal(event.entry_cost)
  if (amount === 0) return { isFree: true }
  return { isFree: false, formatted: formatPrice(amount, getEventCurrency(event)) }
}
