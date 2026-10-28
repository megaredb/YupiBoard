import { createFileRoute } from "@tanstack/react-router"
import { EventCollectionPage } from "@/features/events"
import { requireAuth } from "@/lib/auth-guard"

export const Route = createFileRoute("/my-events")({
  beforeLoad: requireAuth,
  component: () => <EventCollectionPage collection="hosted" />,
})
