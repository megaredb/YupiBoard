import { createFileRoute } from "@tanstack/react-router"
import { CompleteProfilePage } from "@/features/profile/pages/complete-profile-page"

export const Route = createFileRoute("/_authenticated/profile/complete")({
  staticData: { layout: "standalone", titleKey: "profile.complete.title" },
  component: CompleteProfilePage,
})
