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

export function isProfileComplete(user: UserRead | null): boolean {
  return Boolean(user?.first_name?.trim() && user?.last_name?.trim())
}

interface AuthState {
  user: UserRead | null
  /** True until the stored session (if any) has been checked against the API. */
  isLoading: boolean
  /** Flash message set when logging out (SRS 3.2.2.4: "You have been logged out"). */
  logoutNotice: boolean
  /** True when the session expired and the user should be redirected to /login (SRS 3.2.2.5). */
  sessionExpired: boolean
  setSession: (response: TokenResponse) => Promise<void>
  setUser: (user: UserRead) => void
  clearLogoutNotice: () => void
  clearSessionExpired: () => void
  logout: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  logoutNotice: false,
  sessionExpired: false,

  setSession: async ({ user, access_token, refresh_token }) => {
    await saveTokens(access_token, refresh_token)
    set({
      user,
      isLoading: false,
      logoutNotice: false,
      sessionExpired: false,
    })
  },

  setUser: (user) => {
    set({ user })
  },

  clearLogoutNotice: () => {
    set({ logoutNotice: false })
  },

  clearSessionExpired: () => {
    set({ sessionExpired: false })
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
    set({ user: null, logoutNotice: true })
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
  useAuthStore.setState({ user: null, sessionExpired: true })
})
