import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors";

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: unknown): boolean {
  // Client errors (4xx) never succeed on retry; offline and 5xx may.
  const isClientError = isApiError(error) && error.status !== null && error.status < 500;
  return !isClientError && failureCount < MAX_RETRIES;
}

/**
 * The single place for query defaults (API-6). A 401 is first retried by the API client after a
 * token refresh; if the refresh is rejected, `onSessionExpired` (wired in `bootstrap()`) ends
 * the session, so queries themselves never handle 401.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
