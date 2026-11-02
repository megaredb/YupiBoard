import { createRootRouteWithContext } from "@tanstack/react-router"
import { prefetchCurrentUser } from "@/features/auth"
import { AppLayout } from "@/features/shell"
import type { RouterContext } from "@/shared/config/router-context"

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context }) => prefetchCurrentUser(context.queryClient),
  component: AppLayout,
})
