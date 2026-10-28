import { createFileRoute } from "@tanstack/react-router"
import { EventCatalogPage } from "@/components/pages/EventCatalogPage"
import { catalogSearchSchema } from "@/lib/events"

export const Route = createFileRoute("/")({
  validateSearch: catalogSearchSchema,
  component: EventCatalogPage,
})
