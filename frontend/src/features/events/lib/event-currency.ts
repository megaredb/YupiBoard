import type { EventListItem, EventRead } from "@/shared/api/generated/model"

// INTERIM: the backend must provide `currency` on EventRead / EventListItem (and accept it in
// EventCreate). Every event is priced in hryvnia until then.
const INTERIM_EVENT_CURRENCY = "UAH"

export function getEventCurrency(_event: Pick<EventRead | EventListItem, "id">): string {
  return INTERIM_EVENT_CURRENCY
}
