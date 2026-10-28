import { createFileRoute } from "@tanstack/react-router"
import { CreateEventPage } from "@/features/events"
import { requireAuth } from "@/lib/auth-guard"

// Focused flow: lives outside the `_app` layout, so no header/footer.
export const Route = createFileRoute("/events/new")({
  beforeLoad: requireAuth,
  component: CreateEventPage,
})
