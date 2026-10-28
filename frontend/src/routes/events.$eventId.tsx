import { createFileRoute } from "@tanstack/react-router"
import { EventDetailsPage } from "@/components/pages/EventDetailsPage"

export const Route = createFileRoute("/events/$eventId")({
  staticData: { hideMobileChrome: true },
  component: EventDetailsPage,
})

