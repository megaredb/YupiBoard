import { create } from "zustand"
import { apiClient } from "@/lib/axios"
import { appStorage } from "@/lib/storage"

export interface User {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  is_active: boolean
  is_verified: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void
  updateUser: (user: Partial<User>) => void
  clearAuth: () => void
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem("access_token"),
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    appStorage.setItem("access_token", accessToken)
    if (refreshToken) {
      appStorage.setItem("refresh_token", refreshToken)
    }
    set({ user, accessToken, isAuthenticated: true, isLoading: false })
  },

  updateUser: (partial) => {
    const current = get().user
    if (!current) return
    set({ user: { ...current, ...partial } })
  },

  clearAuth: () => {
    appStorage.removeItem("access_token")
    appStorage.removeItem("refresh_token")
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
  },

  initAuth: async () => {
    const token = await appStorage.getItem("access_token")
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null })
      return
    }

    try {
      const response = await apiClient.get<User>("/api/v1/users/me")
      set({ user: response.data, isAuthenticated: true, isLoading: false })
    } catch {
      get().clearAuth()
    }
  },
}))

if (typeof window !== "undefined") {
  window.addEventListener("auth:session-expired", () => {
    useAuthStore.getState().clearAuth()
  })
}
