import { useQuery } from "@tanstack/react-query"
import * as server from "../mocks/server"
import { eventKeys } from "./queryKeys"

/** Event page: GET /events/{id}. MOCK; swap for the generated hook + DTO -> `EventDetails` mapper. */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => server.getEvent(eventId),
  })
}
