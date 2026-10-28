import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as server from "../mocks/server"
import type { CreateEventInput } from "../types"
import { eventKeys } from "./queryKeys"

/**
 * POST /events (sent to moderation). MOCK.
 * To switch: map `CreateEventInput` to the request body (cover image is a separate upload
 * or multipart field, depending on the backend), keep the `{ id }` result.
 */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEventInput) => server.createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  })
}
