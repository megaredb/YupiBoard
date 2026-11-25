import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/features/auth/pages/terms-page";

export const Route = createFileRoute("/terms")({
  staticData: {
    allowsIncompleteProfile: true,
    layout: "default",
    titleKey: "auth.terms.pageTitle",
  },
  component: TermsPage,
});
