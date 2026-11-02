import type { QueryClient } from "@tanstack/react-query"

/** Passed to every route's `beforeLoad` / `loader` (API-6). */
export interface RouterContext {
  queryClient: QueryClient
}
