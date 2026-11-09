import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { z } from "zod";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string | null;
}

/** Implemented by the auth feature; the client only reads and replaces tokens through it. */
export interface TokenStore {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  save: (tokens: SessionTokens) => Promise<void>;
  clear: () => Promise<void>;
}

type SessionExpiredListener = () => void;

const REQUEST_TIMEOUT_MS = 15_000;
const AUTH_URL_PREFIX = "/api/v1/auth/";
const REFRESH_URL = `${AUTH_URL_PREFIX}refresh`;

const refreshResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().nullish(),
});

export const apiClient: AxiosInstance = axios.create({
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

let tokenStore: TokenStore | null = null;
let interceptorIds: { request: number; response: number } | null = null;
let refreshInFlight: Promise<void> | null = null;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/** Fires when the server explicitly rejects the refresh token (401/403), never on network errors. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function isAuthRejection(error: unknown): boolean {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 401 || status === 403;
}

async function requestNewTokens(): Promise<void> {
  const refreshToken = tokenStore?.getRefreshToken() ?? null;
  // Bare axios (not apiClient) so this call can never re-enter the interceptors.
  const { data } = await axios.post<unknown>(
    REFRESH_URL,
    refreshToken ? { refresh_token: refreshToken } : {},
    { baseURL: apiClient.defaults.baseURL, withCredentials: true, timeout: REQUEST_TIMEOUT_MS },
  );
  const tokens = refreshResponseSchema.parse(data);
  await tokenStore?.save({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
  });
}

// One refresh at a time; concurrent 401s all wait on the same request.
function refreshOnce(): Promise<void> {
  refreshInFlight ??= requestNewTokens().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Restores a session from the refresh token (HttpOnly cookie on web, stored token on native).
 * Resolves `false` for guests and on any failure, without emitting a session-expired event.
 */
export async function restoreSessionFromRefreshToken(): Promise<boolean> {
  try {
    await refreshOnce();
    return true;
  } catch {
    return false;
  }
}

function attachAccessToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = tokenStore?.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function getRetriableConfig(error: unknown): RetriableConfig | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return null;
  // Axios types `error.config` loosely; `_retry` is our own marker on that same object.
  const config = error.config as RetriableConfig | undefined;
  if (!config || config._retry || config.url?.startsWith(AUTH_URL_PREFIX)) return null;
  return config;
}

async function retryAfterRefresh(error: unknown): Promise<unknown> {
  const config = getRetriableConfig(error);
  if (!config) throw error;

  config._retry = true;
  try {
    await refreshOnce();
  } catch (refreshError) {
    // Only an explicit rejection ends the session; offline or 5xx must not log the user out.
    if (isAuthRejection(refreshError)) {
      await tokenStore?.clear();
      sessionExpiredListeners.forEach((listener) => listener());
    }
    throw error;
  }
  return apiClient(config);
}

/** Called from `bootstrap()`; calling it again replaces the interceptors instead of stacking them. */
export function configureApiClient(options: { baseURL: string; tokenStore: TokenStore }): void {
  apiClient.defaults.baseURL = options.baseURL;
  tokenStore = options.tokenStore;
  if (interceptorIds) {
    apiClient.interceptors.request.eject(interceptorIds.request);
    apiClient.interceptors.response.eject(interceptorIds.response);
  }
  interceptorIds = {
    request: apiClient.interceptors.request.use(attachAccessToken),
    response: apiClient.interceptors.response.use(undefined, retryAfterRefresh),
  };
}
