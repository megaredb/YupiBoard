import { redirect } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth"

/** Resolves once the stored session has been checked against the API. */
function waitForSessionCheck(): Promise<void> {
  if (!useAuthStore.getState().isLoading) return Promise.resolve()
  return new Promise((resolve) => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isLoading) {
        unsubscribe()
        resolve()
      }
    })
  })
}

/**
 * Route guard: `beforeLoad: requireAuth`.
 * Read-only consumer of the auth store; it never changes how login works.
 */
export async function requireAuth(): Promise<void> {
  await waitForSessionCheck()
  if (!useAuthStore.getState().user) throw redirect({ to: "/login" })
}
