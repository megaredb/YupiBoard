import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "@/components/layout/AppLayout"

// Pathless layout: header/footer (desktop) and top bar/tabs (mobile) around every child route.
export const Route = createFileRoute("/_app")({
  component: AppLayout,
})
