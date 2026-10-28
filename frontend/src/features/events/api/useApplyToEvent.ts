import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as server from "../mocks/server"
import { eventKeys } from "./queryKeys"

/** POST /events/{id}/applications: "Apply" button. MOCK; resolves with the new application status. */
export function useApplyToEvent(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => server.applyToEvent(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  })
}
