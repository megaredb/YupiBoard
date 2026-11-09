import { createFileRoute } from "@tanstack/react-router";
import { authRedirectSearchSchema, redirectSignedInUser } from "@/features/auth";

export const Route = createFileRoute("/_public")({
  validateSearch: authRedirectSearchSchema,
  beforeLoad: redirectSignedInUser,
  staticData: { layout: "standalone" },
});
