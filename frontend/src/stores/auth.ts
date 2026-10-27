import { create } from "zustand"
import { logoutApiV1AuthLogoutPost } from "@/api/endpoints/auth/auth"
import { getCurrentUserProfileApiV1UsersMeGet } from "@/api/endpoints/users/users"
import type { TokenResponse, UserRead } from "@/api/model"
import { SESSION_EXPIRED_EVENT } from "@/lib/axios"
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  tokensReady,
} from "@/lib/tokens"

interface AuthState {
  user: UserRead | null
  /** True until the stored session (if any) has been checked against the API. */
  isLoading: boolean
  setSession: (response: TokenResponse) => Promise<void>
  logout: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setSession: async ({ user, access_token, refresh_token }) => {
    await saveTokens(access_token, refresh_token)
    set({ user, isLoading: false })
  },

  logout: async () => {
    const refreshToken = getRefreshToken()
    try {
      // Revokes the refresh token server-side and clears the HttpOnly cookie.
      await logoutApiV1AuthLogoutPost(refreshToken ? { refresh_token: refreshToken } : {})
    } catch {
      // Server unreachable: still end the local session.
    }
    await clearTokens()
    set({ user: null })
  },

  init: async () => {
    await tokensReady
    if (!getAccessToken()) {
      set({ isLoading: false })
      return
    }
    try {
      set({ user: await getCurrentUserProfileApiV1UsersMeGet(), isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))

window.addEventListener(SESSION_EXPIRED_EVENT, () => {
  useAuthStore.setState({ user: null })
})
