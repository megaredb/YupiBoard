import { createFileRoute } from "@tanstack/react-router"
import { requireUser, SignedInOutlet } from "@/features/auth"

/** The only auth guard: every route below requires a signed-in user (RT-2). */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: requireUser,
  component: SignedInOutlet,
})
