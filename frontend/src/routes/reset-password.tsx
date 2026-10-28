import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ResetPasswordPage } from "@/components/pages/ResetPasswordPage"

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordPage,
})
