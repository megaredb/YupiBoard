import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type { TokenResponse, UserRead } from "@/shared/api/generated/model"
import { startSession } from "@/features/auth/api/session-lifecycle"
import { isProfileComplete } from "@/features/auth/lib/is-profile-complete"
import { toSafeRedirect } from "@/features/auth/lib/safe-redirect"

/** Shared by e-mail login, registration and Google: start the session, then leave the auth page. */
export function useSignInMutation<TVariables>(
  signIn: (variables: TVariables) => Promise<TokenResponse>,
  redirectTo: string | undefined,
): UseMutationResult<UserRead, unknown, TVariables> {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (variables: TVariables) => startSession(queryClient, await signIn(variables)),
    onSuccess: (user) => {
      if (!isProfileComplete(user)) return navigate({ to: "/profile/complete" })
      const target = toSafeRedirect(redirectTo)
      return target ? navigate({ href: target }) : navigate({ to: "/events" })
    },
  })
}
