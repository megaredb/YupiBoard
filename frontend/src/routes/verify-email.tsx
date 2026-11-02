import { createFileRoute } from "@tanstack/react-router"
import { tokenSearchSchema, verifyEmailToken } from "@/features/auth"
import { VerifyEmailPage } from "@/features/auth/pages/verify-email-page"

export const Route = createFileRoute("/verify-email")({
  validateSearch: tokenSearchSchema,
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ deps }) => verifyEmailToken(deps.token),
  // The token is single-use: never re-run the verification for the same URL.
  staleTime: Number.POSITIVE_INFINITY,
  staticData: { layout: "standalone", titleKey: "auth.verifyEmail.pageTitle" },
  component: VerifyEmailPage,
})
