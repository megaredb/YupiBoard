import { createFileRoute } from "@tanstack/react-router"
import { ComponentPreviewPage } from "@/features/design-system/pages/ComponentPreviewPage"

export const Route = createFileRoute("/component-preview")({
  component: ComponentPreviewPage,
})
