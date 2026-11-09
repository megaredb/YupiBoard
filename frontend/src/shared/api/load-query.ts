import {
  CancelledError,
  type QueryClient,
  type QueryExecuteOptions,
  type QueryKey,
} from "@tanstack/react-query";

/**
 * Route-loader fetch (RT-8): cached data is reused as is. When the page stops observing the query
 * while it is still loading (quick filter changes, StrictMode remounts), TanStack Query cancels
 * the request; that is not a route error, since the page's own query fetches again. Real failures
 * still reach the route's error boundary.
 */
export async function loadQuery<TQueryFnData, TError, TQueryKey extends QueryKey>(
  queryClient: QueryClient,
  options: QueryExecuteOptions<TQueryFnData, TError, TQueryFnData, TQueryFnData, TQueryKey>,
): Promise<TQueryFnData | undefined> {
  try {
    return await queryClient.query({ ...options, staleTime: "static" });
  } catch (error) {
    if (error instanceof CancelledError) return undefined;
    throw error;
  }
}
