import type { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { isNativePlatform } from "@/shared/platform/is-native";
import { RouteError, RouteNotFound, RoutePending } from "@/features/shell";

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    // Hover preloading means nothing on touch devices and only costs data on native.
    defaultPreload: isNativePlatform() ? false : "intent",
    // TanStack Query owns caching, so the router always asks it.
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
