import { createFileRoute } from "@tanstack/react-router";
import { checkResetToken, tokenSearchSchema } from "@/features/auth";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";

export const Route = createFileRoute("/reset-password")({
  validateSearch: tokenSearchSchema,
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ deps, abortController }) => checkResetToken(deps.token, abortController.signal),
  staticData: { layout: "standalone", titleKey: "auth.resetPassword.pageTitle" },
  component: ResetPasswordPage,
});
