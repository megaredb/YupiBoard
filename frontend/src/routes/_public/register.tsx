import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "@/features/auth/pages/register-page";

export const Route = createFileRoute("/_public/register")({
  staticData: { titleKey: "auth.register.pageTitle" },
  component: RegisterPage,
});
