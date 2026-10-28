import { keepPreviousData, useQuery } from "@tanstack/react-query"
import * as server from "../mocks/server"
import type { ListEventsParams } from "../types"
import { eventKeys } from "./queryKeys"

/**
 * Catalog: GET /events (filters + pagination).
 *
 * MOCK. To switch: call the generated list hook, map its DTO to `Paginated<EventSummary>`
 * (e.g. via `query.select`), keep this signature and `placeholderData: keepPreviousData`.
 */
export function useEvents(params: ListEventsParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => server.listEvents(params),
    placeholderData: keepPreviousData,
  })
}
