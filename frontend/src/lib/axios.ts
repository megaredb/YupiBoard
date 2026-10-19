import axios, { type AxiosError, type AxiosRequestConfig } from "axios"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.yupiboard.localhost"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Attach access token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercept 401 and attempt automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const url = originalRequest.url || ""
    if (url.includes("/api/v1/auth/login") || url.includes("/api/v1/auth/register") || url.includes("/api/v1/auth/refresh")) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return apiClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const storedRefreshToken = localStorage.getItem("refresh_token")
      const refreshPayload = storedRefreshToken ? { refresh_token: storedRefreshToken } : {}

      const { data } = await axios.post(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        refreshPayload,
        { withCredentials: true }
      )

      const newAccessToken = data.access_token
      localStorage.setItem("access_token", newAccessToken)
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token)
      }

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      }

      processQueue(null, newAccessToken)
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      window.dispatchEvent(new Event("auth:session-expired"))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

/**
 * Custom Orval instance wrapper: accepts request config, returns data directly
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return apiClient({
    ...config,
    ...options,
  }).then((res) => res.data)
}
