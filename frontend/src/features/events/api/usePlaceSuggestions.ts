import { keepPreviousData, useQuery } from "@tanstack/react-query"
import * as server from "../mocks/server"
import { eventKeys } from "./queryKeys"

/** Address autocomplete in "Create event". MOCK; the real source may be a geocoding provider. */
export function usePlaceSuggestions(query: string, enabled = true) {
  return useQuery({
    queryKey: eventKeys.places(query),
    queryFn: () => server.suggestPlaces(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
