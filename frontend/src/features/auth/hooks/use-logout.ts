import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { logoutApiV1AuthLogoutPost } from "@/shared/api/generated/endpoints/auth/auth"
import { showToast } from "@/shared/lib/toast/toast-store"
import { endSession } from "@/features/auth/api/session-lifecycle"
import { sessionTokenStore } from "@/features/auth/lib/session-storage"

async function revokeRefreshToken(): Promise<void> {
  const refreshToken = sessionTokenStore.getRefreshToken()
  try {
    // Revokes the refresh token server-side and clears the HttpOnly cookie.
    await logoutApiV1AuthLogoutPost(refreshToken ? { refresh_token: refreshToken } : {})
  } catch {
    // Server unreachable: the local session still ends.
  }
}

export function useLogout(): { logout: () => void; isPending: boolean } {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async () => {
      await revokeRefreshToken()
      await endSession(queryClient)
    },
    onSuccess: () => {
      showToast(t("auth.session.loggedOut"))
      return navigate({ to: "/events" })
    },
  })
  return { logout: () => mutation.mutate(), isPending: mutation.isPending }
}
