import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireSuperuser } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: requireSuperuser,
  component: Outlet,
});
