import type { ListEventsParams } from "../types"

// Keys for the mock-backed hooks. Orval hooks bring their own (`getXxxQueryKey`);
// when switching a hook, switch its invalidations too.
export const eventKeys = {
  all: ["events"] as const,
  list: (params: ListEventsParams) => [...eventKeys.all, "list", params] as const,
  detail: (eventId: string) => [...eventKeys.all, "detail", eventId] as const,
  places: (query: string) => ["places", query] as const,
}
