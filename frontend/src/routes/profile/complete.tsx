import { createFileRoute } from "@tanstack/react-router"
import { CompleteProfilePage } from "@/components/pages/CompleteProfilePage"

export const Route = createFileRoute("/profile/complete")({
  component: CompleteProfilePage,
})
