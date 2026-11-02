import { createFileRoute } from "@tanstack/react-router"
import { tokenSearchSchema } from "@/features/auth"
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page"

export const Route = createFileRoute("/reset-password")({
  validateSearch: tokenSearchSchema,
  staticData: { layout: "standalone", titleKey: "auth.resetPassword.pageTitle" },
  component: ResetPasswordPage,
})
