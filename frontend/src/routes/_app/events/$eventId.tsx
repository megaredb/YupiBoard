import { createFileRoute } from "@tanstack/react-router"
import { EventDetailsPage } from "@/features/events"

export const Route = createFileRoute("/_app/events/$eventId")({
  staticData: { hideMobileChrome: true },
  component: EventDetailsPage,
})
