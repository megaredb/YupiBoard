import { createFileRoute } from "@tanstack/react-router"
import { EventCollectionPage } from "@/features/events"
import { requireAuth } from "@/lib/auth-guard"

export const Route = createFileRoute("/_app/favorites")({
  beforeLoad: requireAuth,
  component: () => <EventCollectionPage collection="favorites" />,
})
