import { createFileRoute } from "@tanstack/react-router"
import { PublicProfilePage } from "@/components/pages/PublicProfilePage"

export const Route = createFileRoute("/users/$userId")({
  component: PublicProfilePage,
})
