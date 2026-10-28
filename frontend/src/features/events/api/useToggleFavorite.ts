import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as server from "../mocks/server"
import { eventKeys } from "./queryKeys"

/** PUT|DELETE /events/{id}/favorite: heart button. MOCK; call with the desired new state. */
export function useToggleFavorite(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (isFavorite: boolean) => server.setFavorite(eventId, isFavorite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  })
}
