import { createFileRoute } from "@tanstack/react-router";
import { authRedirectSearchSchema, redirectSignedInUser } from "@/features/auth";

/** Guest-only pages; signed-in users are sent on (RT-2). */
export const Route = createFileRoute("/_public")({
  validateSearch: authRedirectSearchSchema,
  beforeLoad: redirectSignedInUser,
  staticData: { layout: "standalone" },
});
