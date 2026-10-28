import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios"
import type { TokenResponse } from "@/api/model"
import { clearTokens, getAccessToken, getRefreshToken, saveTokens, tokensReady } from "@/lib/tokens"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export const SESSION_EXPIRED_EVENT = "auth:session-expired"

const REQUEST_TIMEOUT_MS = 15_000
const AUTH_URL_PREFIX = "/api/v1/auth/"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
})

apiClient.interceptors.request.use(async (config) => {
  await tokensReady
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

async function requestNewTokens(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    // Bare axios (not apiClient) so this call can never re-enter the interceptor.
    const { data } = await axios.post<TokenResponse>(
      `${API_BASE_URL}${AUTH_URL_PREFIX}refresh`,
      refreshToken ? { refresh_token: refreshToken } : {},
      { withCredentials: true, timeout: REQUEST_TIMEOUT_MS },
    )
    await saveTokens(data.access_token, data.refresh_token)
  } catch (error) {
    // Only an explicit rejection ends the session. Being offline or hitting a 5xx
    // must not log the user out.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    if (status === 401 || status === 403) {
      await clearTokens()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw error
  }
}

// One refresh at a time; concurrent 401s all wait on the same request.
let refreshInFlight: Promise<void> | null = null

function refreshSession(): Promise<void> {
  refreshInFlight ??= requestNewTokens().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) throw error

  const config = error.config as RetriableConfig | undefined
  const isAuthCall = config?.url?.startsWith(AUTH_URL_PREFIX)
  if (error.response?.status !== 401 || !config || config._retry || isAuthCall) {
    throw error
  }

  config._retry = true
  try {
    await refreshSession()
  } catch {
    throw error
  }
  return apiClient(config)
})

/** Orval mutator: accepts a request config, resolves with the response body. */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient({ ...config, ...options }).then((res) => res.data)
}
