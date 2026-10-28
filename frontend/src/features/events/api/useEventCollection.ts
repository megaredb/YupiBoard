import { useQuery } from "@tanstack/react-query"
import * as server from "../mocks/server"
import { EVENTS_PAGE_SIZE } from "../constants"
import { eventKeys } from "./queryKeys"

export function useEventCollection(collection: server.EventCollection, page: number) {
  return useQuery({
    queryKey: [...eventKeys.all, "collection", collection, page],
    queryFn: () => server.listEventCollection(collection, page, EVENTS_PAGE_SIZE),
  })
}
