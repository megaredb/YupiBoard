import { createFileRoute } from "@tanstack/react-router"
import { catalogSearchSchema, EventCatalogPage } from "@/features/events"

export const Route = createFileRoute("/_app/events/")({
  validateSearch: catalogSearchSchema,
  component: EventCatalogPage,
})
