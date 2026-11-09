import { createFileRoute } from "@tanstack/react-router";
import { requireUser, SignedInOutlet } from "@/features/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: requireUser,
  component: SignedInOutlet,
});
