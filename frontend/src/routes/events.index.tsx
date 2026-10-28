import { createFileRoute } from "@tanstack/react-router"
import { EventCatalogPage } from "@/components/pages/EventCatalogPage"
import { catalogSearchSchema } from "@/lib/events"

export const Route = createFileRoute("/events/")({
  validateSearch: catalogSearchSchema,
  component: EventCatalogPage,
})
