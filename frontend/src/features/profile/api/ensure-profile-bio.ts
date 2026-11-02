import type { QueryClient } from "@tanstack/react-query"
import { getCachedCurrentUser } from "@/features/auth"
import { loadProfileBio } from "@/features/profile/lib/profile-bio-store"

/** Loader of `/profile`: the guard has already loaded the user. */
export async function ensureProfileBio(queryClient: QueryClient): Promise<void> {
  const user = getCachedCurrentUser(queryClient)
  if (user) await loadProfileBio(user.id)
}
