import { createRootRouteWithContext } from "@tanstack/react-router";
import type { RouterContext } from "@/shared/config/router-context";
import { prefetchCurrentUser, requireCompleteProfile } from "@/features/auth";
import { AppLayout } from "@/features/shell";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, matches }) => {
    await prefetchCurrentUser(context.queryClient);
    requireCompleteProfile({ context, matches });
  },
  component: AppLayout,
});
