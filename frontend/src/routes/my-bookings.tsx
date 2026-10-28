import { createFileRoute } from "@tanstack/react-router"
import { EventCollectionPage } from "@/components/pages/EventCollectionPage"
import { requireAuth } from "@/lib/auth-guard"

export const Route = createFileRoute("/my-bookings")({
  beforeLoad: requireAuth,
  component: () => <EventCollectionPage collection="booked" />,
})

