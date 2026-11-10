import { createFileRoute } from "@tanstack/react-router";
import { inspectResetToken, tokenSearchSchema } from "@/features/auth";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";

export const Route = createFileRoute("/reset-password")({
  validateSearch: tokenSearchSchema,
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ deps }) => inspectResetToken(deps.token),
  staticData: { layout: "standalone", titleKey: "auth.resetPassword.pageTitle" },
  component: ResetPasswordPage,
});
