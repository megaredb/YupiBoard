import { createRootRouteWithContext } from "@tanstack/react-router";
import type { RouterContext } from "@/shared/config/router-context";
import { prefetchCurrentUser } from "@/features/auth";
import { AppLayout } from "@/features/shell";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context }) => prefetchCurrentUser(context.queryClient),
  component: AppLayout,
});
