import { createFileRoute } from "@tanstack/react-router"
import { CreateEventPage } from "@/components/pages/CreateEventPage"
import { requireAuth } from "@/lib/auth-guard"

export const Route = createFileRoute("/events/new")({
  beforeLoad: requireAuth,
  component: CreateEventPage,
})

